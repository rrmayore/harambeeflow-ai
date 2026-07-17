import { getAdminDb } from "./db-instance.js";
import { isLive } from "./payment-mode.js";

/**
 * Validates and locks an idempotency key strictly in a transaction using the Admin SDK.
 * Follows Stripe standard: document ID = transactionKey.
 * Returns true if key is valid (unique and locked successfully), false if duplicate.
 */
export async function acquireIdempotencyLock(key: string, metadata: any = {}): Promise<boolean> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    if (isLive()) {
      throw new Error("[SECURITY FATAL] Admin Firestore unconfigured. Idempotency engine failed-closed in Production.");
    }
    // Sandbox mode with no database configured: Return true to allow mock loops to process
    console.warn(`[IDEMPOTENCY Sandbox] Bypassing lock for local simulator key: ${key}`);
    return true;
  }

  const cleanKey = key.trim().toUpperCase();
  const docRef = adminDb.collection("idempotency_keys").doc(cleanKey);

  try {
    const success = await adminDb.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (docSnap.exists) {
        console.warn(`[IDEMPOTENCY VERIFICATION] Replay attack blocked at DB layer for key: ${cleanKey}`);
        return false; // Key already exists (locked or completed). Reject!
      }

      // Lock key with atomic create
      transaction.set(docRef, {
        status: "processing",
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          lockedAt: new Date().toISOString()
        }
      });
      return true;
    });

    return success;
  } catch (error: any) {
    console.error(`[IDEMPOTENCY ERROR] Failed to evaluate lock for ${cleanKey}:`, error.message || error);
    return false; // Strict Fail-closed
  }
}

/**
 * Re-evaluate or query if a key was successfully completed.
 */
export async function releaseOrSuccessIdempotency(key: string, success: boolean): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return;
  }

  const cleanKey = key.trim().toUpperCase();
  const docRef = adminDb.collection("idempotency_keys").doc(cleanKey);

  try {
    await adminDb.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (docSnap.exists) {
        if (success) {
          transaction.update(docRef, {
            status: "completed",
            completedAt: new Date().toISOString()
          });
        } else {
          // Failure: we completely remove the lock document so the payment event can retry
          transaction.delete(docRef);
        }
      }
    });
  } catch (error: any) {
    console.error(`[IDEMPOTENCY ERROR] Failed to release/success key ${cleanKey}:`, error.message || error);
  }
}
