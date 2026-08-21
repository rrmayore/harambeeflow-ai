import { getAdminDb } from "./db-instance.js";
import { commitFinancialLedgerEntry } from "./ledger.service.ts";
import { acquireIdempotencyLock, releaseOrSuccessIdempotency } from "./idempotency.service.ts";
import { getPendingPayment, getEventQueueDelegates, markEventStatusInDb } from "./eventQueue.service.ts";

const MAX_RETRIES = 3;

/**
 * Executes the processing of an enqueued callback event with distributed lock safeguards
 * and exponential retry mechanisms.
 */
export async function executeBackgroundEventWorker(eventId: string): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn(`[WORKER] Skipping async worker processing for Event ${eventId} - Sandbox mode.`);
    return;
  }

  console.log(`[WORKER CAPTAIN] Claiming processing task for Event ID: ${eventId}`);
  const eventRef = adminDb.collection("mpesa_events").doc(eventId);
  let event: any = null;

  try {
    // 1. ATOMIC EVENT ACQUISITION (Multi-instance safe)
    await adminDb.runTransaction(async (transaction: any) => {
      const snap = await transaction.get(eventRef);
      if (!snap.exists) return;

      const data = snap.data();
      // Can only process events in 'queued' or 'failed' (retryable) statuses
      if (data.status === "queued" || data.status === "failed") {
        transaction.update(eventRef, {
          status: "processing",
          claimedAt: new Date().toISOString()
        });
        event = { ...data, status: "processing" };
      }
    });
  } catch (err: any) {
    console.error(`[WORKER DISTRIBUTED LOCK] Could not claim event ${eventId}:`, err);
    return;
  }

  if (!event) {
    console.debug(`[WORKER] Event ${eventId} already claimed, completed, or quarantined. Skipping.`);
    return;
  }

  let amount = 0;
  let receiptCode = "";
  let senderName = "M-PESA Customer";
  let phone = "";
  let accountRef = "GENERAL";
  let isTransactionSuccessful = false;
  let statusDesc = "";
  let transactionKey = "";

  try {
    const p = event.payload;

    let firstName = "";
    let middleName = "";
    let lastName = "";

    if (event.type === "STK_CALLBACK") {
      const stk = p?.Body?.stkCallback;
      if (!stk) throw new Error("Webhook structure does not contain a valid Safaricom stkCallback envelope.");

      transactionKey = stk.CheckoutRequestID;
      isTransactionSuccessful = stk.ResultCode === 0;
      statusDesc = stk.ResultDesc || "";

      // 1. SUBSCRIPTION CALLBACK DISCRIMINATOR
      // Check if this CheckoutRequestID belongs to a pending PLATFORM SUBSCRIPTION
      if (adminDb && transactionKey) {
        try {
          const subQuery = await adminDb.collection("subscription_pending_payments")
            .where("checkoutRequestId", "==", transactionKey)
            .get();
          
          if (!subQuery.empty) {
            const subPendingDoc = subQuery.docs[0];
            const subPendingData = subPendingDoc.data();
            console.log(`[WORKER] Intercepted PLATFORM SUBSCRIPTION callback for payment ${subPendingDoc.id} (User: ${subPendingData?.userId}, Plan: ${subPendingData?.planId})`);
            await processSubscriptionCallback(eventId, event, subPendingDoc, subPendingData, stk);
            return; // STRICT DETACH: NEVER fall through to campaign donation processing
          }
        } catch (subErr: any) {
          console.error(`[WORKER] Error checking subscription_pending_payments for ${transactionKey}:`, subErr);
        }
      }

      if (isTransactionSuccessful) {
        const meta = stk.CallbackMetadata?.Item || [];
        const amtItem = meta.find((i: any) => i.Name === "Amount");
        const codeItem = meta.find((i: any) => i.Name === "MpesaReceiptNumber");
        const numItem = meta.find((i: any) => i.Name === "PhoneNumber");
        const userItem = meta.find((i: any) => i.Name === "User");

        amount = amtItem ? Number(amtItem.Value) : 0;
        receiptCode = codeItem ? String(codeItem.Value).toUpperCase() : "";
        phone = numItem ? String(numItem.Value) : "";
        senderName = userItem ? String(userItem.Value) : "";

        // Resolve context statelessly using database pending payments reference
        const pendingRef = await getPendingPayment(transactionKey);
        if (pendingRef) {
          accountRef = pendingRef.projectId;
          firstName = pendingRef.firstName || "";
          middleName = pendingRef.middleName || "";
          lastName = pendingRef.lastName || "";
          if (!senderName) senderName = pendingRef.senderName || `${firstName} ${middleName} ${lastName}`.trim() || `M-PESA (${pendingRef.senderPhone})`;
          if (!phone) phone = pendingRef.senderPhone;
        }
      }
    } else {
      // C2B payment
      amount = p.TransAmount ? Number(p.TransAmount) : 0;
      receiptCode = (p.TransID || "").toString().toUpperCase();
      firstName = p.FirstName || "";
      middleName = p.MiddleName || "";
      lastName = p.LastName || "";
      senderName = `${firstName} ${middleName} ${lastName}`.trim() || "M-PESA Customer";
      phone = p.MSISDN || "";
      accountRef = p.BillRefNumber || "GENERAL";
      isTransactionSuccessful = true;
      statusDesc = "Success";
      transactionKey = `C2B-${receiptCode}`;
    }

    if (!firstName && !lastName && senderName) {
      const parts = senderName.trim().split(/\s+/);
      firstName = parts[0] || "M-PESA";
      middleName = parts.length > 2 ? parts[1] : "";
      lastName = parts.length > 2 ? parts.slice(2).join(" ") : (parts[1] || "Customer");
    }

    if (!isTransactionSuccessful) {
      console.log(`[WORKER] Event ${eventId} reports cancellation/failed transaction state: ${statusDesc}. Terminating.`);
      await markEventStatusInDb(eventId, "completed");
      return;
    }

    if (amount <= 0 || !receiptCode) {
      throw new Error(`Critical transaction parameters missing in payload: amount KES ${amount}, receipt: ${receiptCode}`);
    }

    // Resolve/Verify fundraiser ID from accountRef (BillRefNumber) or check if it's already a valid fundraiser ID
    let resolvedProjectId = accountRef;
    let whatsappGroupName = "Harambee Community Group";
    if (adminDb) {
      try {
        const directSnap = await adminDb.collection("fundraisers").doc(accountRef).get();
        if (directSnap.exists) {
          const directData = directSnap.data();
          if (directData && (directData.whatsappGroupName || directData.fundraiserName)) {
            whatsappGroupName = directData.whatsappGroupName || `${directData.fundraiserName} Group`;
          }
        } else {
          // It's not a direct fundraiser ID document. Let's query by accountReference
          const querySnap = await adminDb.collection("fundraisers")
            .where("accountReference", "==", accountRef.trim().toUpperCase())
            .get();
          
          if (!querySnap.empty) {
            resolvedProjectId = querySnap.docs[0].id;
            const directData = querySnap.docs[0].data();
            if (directData && (directData.whatsappGroupName || directData.fundraiserName)) {
              whatsappGroupName = directData.whatsappGroupName || `${directData.fundraiserName} Group`;
            }
            console.log(`[WORKER] Resolved accountReference "${accountRef}" to fundraiser ID "${resolvedProjectId}"`);
          } else {
            // Check case-insensitive / fallback scan of all documents
            const allFundraisers = await adminDb.collection("fundraisers").get();
            let found = false;
            allFundraisers.forEach((doc: any) => {
              const data = doc.data();
              if (
                data.accountReference && 
                data.accountReference.trim().toUpperCase() === accountRef.trim().toUpperCase()
              ) {
                resolvedProjectId = doc.id;
                if (data.whatsappGroupName || data.fundraiserName) {
                  whatsappGroupName = data.whatsappGroupName || `${data.fundraiserName} Group`;
                }
                found = true;
              }
            });
            
            if (!found && !allFundraisers.empty) {
              // Final safety fallback: use the first fundraiser's ID
              resolvedProjectId = allFundraisers.docs[0].id;
              const directData = allFundraisers.docs[0].data();
              if (directData && (directData.whatsappGroupName || directData.fundraiserName)) {
                whatsappGroupName = directData.whatsappGroupName || `${directData.fundraiserName} Group`;
              }
              console.warn(`[WORKER] accountReference "${accountRef}" could not be matched. Falling back to first fundraiser ID: "${resolvedProjectId}"`);
            }
          }
        }
      } catch (dbErr: any) {
        console.error(`[WORKER] Error resolving fundraiser project ID for "${accountRef}":`, dbErr);
      }
    }

    // 2. ATOMIC GLOBAL IDEMPOTENCY KEY CHECK (Stripe model)
    const isLockSuccessful = await acquireIdempotencyLock(transactionKey, {
      type: event.type,
      eventId,
      timestamp: Date.now()
    });

    if (!isLockSuccessful) {
      throw new Error(`Global payment duplicate blocked. Key ${transactionKey} is undergoing parallel execution.`);
    }

    // 3. AI NAME-CLEANSING LOGIC
    let cleanedName = senderName;
    let aiCategory = "Well-wisher";
    let aiNotes = "Processed by Stripe v2 back-office worker.";

    const delegates = getEventQueueDelegates();
    if (delegates && delegates.aiClean) {
      try {
        const aiClean = await delegates.aiClean(senderName, `M-PESA receipt ${receiptCode}, value KES ${amount}`);
        cleanedName = aiClean.cleanedName || senderName;
        aiCategory = aiClean.category || "Well-wisher";
        aiNotes = aiClean.explanation || aiNotes;
      } catch (aiErr) {
        console.error(`[WORKER] AI Name cleanse failed. Reverting to base human names:`, aiErr);
      }
    }

    // 4. COMMIT TO DOUBLE-ENTRY LEDGER SYSTEM
    const ledgerResult = await commitFinancialLedgerEntry({
      receiptId: receiptCode,
      projectId: resolvedProjectId,
      amount,
      phone,
      senderName: cleanedName,
      timestamp: new Date().toISOString(),
      status: "completed",
      category: aiCategory,
      notes: aiNotes
    });

    if (!ledgerResult.success) {
      await releaseOrSuccessIdempotency(transactionKey, false); // release lock so the event can attempt retry
      throw new Error(`Double-entry ledger commit rejected: ${ledgerResult.error}`);
    }

    // Confirm final permanent lock successfully saved
    await releaseOrSuccessIdempotency(transactionKey, true);

    // 5. ATOMIC SYSTEM UPDATE DISPATCH (Social whatsapp & contributions table)
    const contributionId = `cnt-${Date.now()}`;
    const contributionDoc = {
      id: contributionId,
      projectId: resolvedProjectId,
      amount,
      senderName,
      senderPhone: phone,
      transactionCode: receiptCode,
      timestamp: new Date().toISOString(),
      category: aiCategory,
      rawMessage: `Daraja Webhook Callback Match: KES ${amount} (Ref: ${receiptCode})`,
      cleanedName,
      status: "completed",
      wasProcessedByV2: true,
      notes: aiNotes,
      whatsappPosted: false,

      firstName: firstName || "",
      middleName: middleName || "",
      lastName: lastName || "",
      phoneNumber: phone || "",
      receiptNumber: receiptCode || "",
      billReference: accountRef || "",
      transactionTime: new Date().toISOString(),
      campaignId: resolvedProjectId,
      donorId: phone || ""
    };

    // Assert verification check
    const requiredKeys = [
      "senderName", "cleanedName", "firstName", "middleName", "lastName",
      "phoneNumber", "receiptNumber", "billReference", "amount", "transactionTime", "campaignId", "donorId"
    ];
    for (const key of requiredKeys) {
      if ((contributionDoc as any)[key] === undefined) {
        throw new Error(`Critical Field Missing in worker processor contributionDoc: ${key} is required.`);
      }
    }

    // Securely update or create the global donor profile
    if (adminDb && phone) {
      try {
        const donorRef = adminDb.collection("donors").doc(phone);
        const donorSnap = await donorRef.get();
        const nowStr = new Date().toISOString();
        if (donorSnap.exists) {
          const donorData = donorSnap.data();
          const updatedContributions = (donorData.totalContributions || 0) + 1;
          const updatedAmount = (donorData.totalAmount || 0) + amount;
          await donorRef.update({
            lastContribution: nowStr,
            totalContributions: updatedContributions,
            totalAmount: updatedAmount
          });
          console.log(`[WORKER] Updated returning donor stats for ${phone}`);
        } else {
          const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, " ").trim() || "M-PESA Customer";
          await donorRef.set({
            firstName: firstName || "M-PESA",
            middleName: middleName || "",
            lastName: lastName || "Customer",
            fullName,
            phoneNumber: phone,
            firstContribution: nowStr,
            lastContribution: nowStr,
            totalContributions: 1,
            totalAmount: amount
          });
          console.log(`[WORKER] Created new donor profile for ${phone}`);
        }
      } catch (err: any) {
        console.error("[WORKER] Error updating donor profile in Firestore:", err.message);
      }
    }

    const waNote = `✅ *${cleanedName}* has contributed KES ${amount.toLocaleString()} via M-PESA. Raised amount updated securely via atomic double-entry ledger. (Ref: ${receiptCode})`;
    const whatsappMsgRecord = {
      id: `wm-${Date.now()}`,
      groupName: whatsappGroupName,
      message: waNote,
      timestamp: new Date().toISOString(),
      isSystem: true
    };

    if (delegates && delegates.onSuccess) {
      await delegates.onSuccess(contributionDoc, whatsappMsgRecord).catch(err => {
        console.error("[WORKER DELEGATE ERROR] Successful campaign callbacks skip-halted:", err);
      });
    }

    // 6. FINALIZE WORKER ENVELOPE
    await markEventStatusInDb(eventId, "completed");
    console.log(`[BACKGROUND EVENT WORKER DONE] Event ${eventId} processed successfully. Ledger balances updated.`);

  } catch (error: any) {
    const currentRetries = event.retryCount || 0;
    const nextRetryCount = currentRetries + 1;

    console.error(`[BACKGROUND EVENT WORKER ERROR] Attempt ${nextRetryCount}/${MAX_RETRIES} failed for Event ${eventId}:`, error.message || error);

    if (nextRetryCount >= MAX_RETRIES) {
      // 7. EXPULSION TO THE DEAD-LETTER QUEUE (DLQ)
      console.error(`[DEAD-LETTER QUEUE QUARANTINE] Event ${eventId} exhausted retry limits. Transferring to DLQ.`);
      await markEventStatusInDb(eventId, "dlq", error.message || "Exhausted retry ceiling limits.");
      await registerDlqQuarantine(eventId, event, error.message || "Unknown final execution error.");
    } else {
      // Trigger Exponential Backoff Retry Scheduling
      const backoffDelay = Math.pow(2, nextRetryCount) * 1000; // 2s, 4s, etc.
      console.log(`[RETRY SCHEDULER] Queueing Event ${eventId} for retry #${nextRetryCount} in ${backoffDelay}ms`);

      await adminDb.runTransaction(async (transaction: any) => {
        transaction.update(eventRef, {
          status: "failed", // Marks as retryable 'failed' state
          retryCount: nextRetryCount,
          error: error.message || "Processing error.",
          nextAttemptAt: Date.now() + backoffDelay
        });
      });

      // Synchronously schedule execution after the backoff delay
      setTimeout(() => executeBackgroundEventWorker(eventId).catch(() => {}), backoffDelay);
    }
  }
}

/**
 * Writes quarantined event packets to our dedicated dead_letter_queue collections for operators audit review.
 */
async function registerDlqQuarantine(eventId: string, origEvent: any, finalReason: string): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    await adminDb.collection("dead_letter_queue").doc(eventId).set({
      originalEventId: eventId,
      type: origEvent.type || "UNKNOWN",
      createdAt: origEvent.createdAt || new Date().toISOString(),
      quarantinedAt: new Date().toISOString(),
      payload: origEvent.payload || {},
      retryCount: origEvent.retryCount || MAX_RETRIES,
      errorMessage: finalReason,
      auditReviewed: false
    });
    console.log(`[DLQ LOG SUCCESS] Quarantined event ${eventId} safely stored.`);
  } catch (dlqErr: any) {
    console.error(`[DLQ DOUBLE FAULT] Failed to write event ${eventId} to dead-letter-collection:`, dlqErr.message);
  }
}

/**
 * High-Security Platform Subscription Callback Processor
 * Verifies M-PESA callbacks for platform subscriptions and activates subscriber accounts atomically.
 */
async function processSubscriptionCallback(
  eventId: string,
  event: any,
  subPendingDoc: any,
  subPendingData: any,
  stk: any
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("[SUBSCRIPTION WORKER] Admin DB unavailable");
  }

  const isTransactionSuccessful = stk.ResultCode === 0;
  const statusDesc = stk.ResultDesc || "";
  const paymentId = subPendingDoc.id;
  const checkoutRequestId = stk.CheckoutRequestID;
  const now = new Date();
  const nowStr = now.toISOString();

  // 1. Transaction Failed / User Cancelled on Phone
  if (!isTransactionSuccessful) {
    console.log(`[SUBSCRIPTION WORKER] Subscription payment ${paymentId} failed/cancelled: ${statusDesc} (ResultCode: ${stk.ResultCode})`);
    try {
      await adminDb.collection("subscription_pending_payments").doc(paymentId).update({
        status: "failed",
        resultCode: stk.ResultCode,
        failureReason: statusDesc || "M-PESA transaction rejected or cancelled on user mobile device",
        updatedAt: nowStr
      });
    } catch (err: any) {
      console.error(`[SUBSCRIPTION WORKER] Failed to update failed status for ${paymentId}:`, err);
    }
    await markEventStatusInDb(eventId, "completed");
    return;
  }

  // 2. Extract Metadata Items
  const meta = stk.CallbackMetadata?.Item || [];
  const amtItem = meta.find((i: any) => i.Name === "Amount");
  const codeItem = meta.find((i: any) => i.Name === "MpesaReceiptNumber");
  const numItem = meta.find((i: any) => i.Name === "PhoneNumber");

  const amountReceived = amtItem ? Number(amtItem.Value) : 0;
  const receiptCode = codeItem ? String(codeItem.Value).toUpperCase().trim() : "";
  const phone = numItem ? String(numItem.Value).trim() : subPendingData.phoneNumber;

  if (!receiptCode || amountReceived <= 0) {
    console.error(`[SUBSCRIPTION WORKER ERROR] Missing receipt (${receiptCode}) or non-positive amount (${amountReceived}) for ${paymentId}`);
    try {
      await adminDb.collection("subscription_pending_payments").doc(paymentId).update({
        status: "malformed_callback_failed",
        failureReason: "Callback payload missing valid receipt code or positive amount",
        updatedAt: nowStr
      });
    } catch (err) {}
    await markEventStatusInDb(eventId, "completed");
    return;
  }

  // 3. Strict Server Amount Verification (EXACT MATCH REQUIRED)
  if (amountReceived !== Number(subPendingData.amount)) {
    console.error(`[SUBSCRIPTION SECURITY ALERT] Amount mismatch for ${paymentId}: Expected KES ${subPendingData.amount}, but received KES ${amountReceived}`);
    try {
      await adminDb.collection("subscription_pending_payments").doc(paymentId).update({
        status: "amount_mismatch_failed",
        receivedAmount: amountReceived,
        failureReason: `Amount mismatch: Expected KES ${subPendingData.amount}, but received KES ${amountReceived}`,
        updatedAt: nowStr
      });
    } catch (err) {}
    await markEventStatusInDb(eventId, "completed");
    return;
  }

  // 4. Idempotency Check: Avoid double-activation or re-extending periods
  if (subPendingData.status === "completed") {
    console.log(`[SUBSCRIPTION WORKER IDEMPOTENT] Payment ${paymentId} is already completed. Acknowledging duplicate callback.`);
    await markEventStatusInDb(eventId, "completed");
    return;
  }

  // 5. Global Idempotency Lock on Receipt
  const receiptLockKey = `SUB_RCPT_${receiptCode}`;
  const isLockSuccessful = await acquireIdempotencyLock(receiptLockKey, {
    type: "SUBSCRIPTION_CALLBACK",
    eventId,
    receiptCode,
    paymentId,
    timestamp: Date.now()
  });

  if (!isLockSuccessful) {
    console.warn(`[SUBSCRIPTION WORKER] Duplicate or concurrent processing for receipt ${receiptCode}. Skipping.`);
    await markEventStatusInDb(eventId, "completed");
    return;
  }

  // 6. Duplicate Receipt Check across Subscription Transactions
  try {
    const existingTxSnap = await adminDb.collection("subscription_transactions")
      .where("mpesaReceiptNumber", "==", receiptCode)
      .get();
    
    if (!existingTxSnap.empty) {
      console.warn(`[SUBSCRIPTION WORKER] Duplicate receipt ${receiptCode} already recorded in subscription_transactions.`);
      await releaseOrSuccessIdempotency(receiptLockKey, true);
      await markEventStatusInDb(eventId, "completed");
      return;
    }
  } catch (err: any) {
    console.error(`[SUBSCRIPTION WORKER] Error verifying duplicate receipt ${receiptCode}:`, err);
  }

  // 7. Calculate Subscription Period Dates
  // Monthly = 30 days (30 * 24 * 60 * 60 * 1000 ms)
  // Annual = 365 days (365 * 24 * 60 * 60 * 1000 ms)
  const isAnnual = subPendingData.billingCycle === "annual";
  const durationMs = isAnnual ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const currentPeriodStart = nowStr;
  const currentPeriodEnd = new Date(now.getTime() + durationMs).toISOString();
  const uid = subPendingData.userId;

  // 8. Atomic / Multi-Document Activation
  const transactionId = `sub_tx_${Date.now()}_${receiptCode.toLowerCase()}`;

  try {
    // Preserve initial subscription creation date if already existing
    let existingCreatedAt: string | null = null;
    const subDocRef = adminDb.collection("subscriptions").doc(uid);
    const subDocSnap = await subDocRef.get();
    if (subDocSnap.exists) {
      const existingData = subDocSnap.data();
      existingCreatedAt = existingData?.createdAt || null;
    }

    const subscriptionDoc = {
      id: uid,
      userId: uid,
      planId: subPendingData.planId,
      status: "active",
      billingCycle: subPendingData.billingCycle,
      amount: subPendingData.amount,
      currency: "KES",
      currentPeriodStart,
      currentPeriodEnd,
      autoRenew: false,
      mpesaReceiptNumber: receiptCode,
      phoneNumber: subPendingData.phoneNumber || phone,
      createdAt: existingCreatedAt || nowStr,
      updatedAt: nowStr
    };

    const transactionDoc = {
      id: transactionId,
      subscriptionId: uid,
      userId: uid,
      amount: subPendingData.amount,
      currency: "KES",
      mpesaReceiptNumber: receiptCode,
      checkoutRequestId: checkoutRequestId || subPendingData.checkoutRequestId || "",
      merchantRequestId: stk.MerchantRequestID || subPendingData.merchantRequestId || "",
      status: "completed",
      timestamp: nowStr,
      planId: subPendingData.planId,
      billingCycle: subPendingData.billingCycle
    };

    // Perform database writes
    await subDocRef.set(subscriptionDoc);
    await adminDb.collection("subscription_transactions").doc(transactionId).set(transactionDoc);
    await adminDb.collection("subscription_pending_payments").doc(paymentId).update({
      status: "completed",
      mpesaReceiptNumber: receiptCode,
      merchantRequestId: stk.MerchantRequestID || subPendingData.merchantRequestId || "",
      updatedAt: nowStr
    });

    console.log(`🎉 [SUBSCRIPTION ACTIVATED] User ${uid} activated on ${subPendingData.planId} (${subPendingData.billingCycle}) until ${currentPeriodEnd}. M-PESA Receipt: ${receiptCode}`);

    await releaseOrSuccessIdempotency(receiptLockKey, true);
    await markEventStatusInDb(eventId, "completed");

  } catch (err: any) {
    console.error(`[SUBSCRIPTION WORKER ERROR] Failed during atomic activation for ${uid}:`, err);
    await releaseOrSuccessIdempotency(receiptLockKey, false);
    throw err;
  }
}
