import { getAdminDb } from "./db-instance.js";
import { isLive } from "./payment-mode.js";
import { FieldValue } from "firebase-admin/firestore";

export interface LedgerEntry {
  receiptId: string;         // TransID (MpesaReceiptNumber)
  projectId: string;         // Fundraiser ID
  amount: number;            // Numeric volume KES
  phone: string;             // Sender phone MSISDN
  senderName: string;        // Cleaned name
  timestamp: string;         // ISO date format
  status: "completed" | "reversed";
  category?: string;
  notes?: string;
}

/**
 * Atomic Double-Entry Financial Ledger Engine.
 * Follows Stripe standard ledger architecture.
 * Registers dual records:
 * 1. DEBIT: MPESA_ESCROW_ACCOUNT (-Amount)
 * 2. CREDIT: fundraisers/{projectId} (+Amount)
 * Updates cached fundraiser balance via atomic FieldValue increment inside same transactional scope.
 */
export async function commitFinancialLedgerEntry(entry: LedgerEntry): Promise<{ success: boolean; error?: string }> {
  const adminDb = getAdminDb();
  const receiptKey = entry.receiptId.trim().toUpperCase();

  if (!adminDb) {
    if (isLive()) {
      throw new Error("[SECURITY FATAL] Admin Firestore unconfigured. Ledger engine failed-closed in Production.");
    }
    console.warn(`[LEDGER Sandbox] Operating with transient side-effects in Mock context.`);
    return { success: true };
  }

  // Dual entry ledger keys to enforce strict single-insert append-only constraints
  const creditDocRef = adminDb.collection("financial_ledger").doc(`${receiptKey}_CREDIT`);
  const debitDocRef = adminDb.collection("financial_ledger").doc(`${receiptKey}_DEBIT`);
  const fundraiserDocRef = adminDb.collection("fundraisers").doc(entry.projectId);

  try {
    const result = await adminDb.runTransaction(async (transaction: any) => {
      // 1. Double spend checking at ledger level
      const creditSnap = await transaction.get(creditDocRef);
      const debitSnap = await transaction.get(debitDocRef);
      if (creditSnap.exists || debitSnap.exists) {
        return {
          success: false,
          error: `Double spend blocked: Receipt ${receiptKey} is already locked and committed in the financial ledger.`
        };
      }

      // 2. Validate target fundraiser campaign exists before crediting money
      const fundraiserSnap = await transaction.get(fundraiserDocRef);
      if (!fundraiserSnap.exists) {
        return {
          success: false,
          error: `Financial transaction rejected: fundraiser ID ${entry.projectId} does not exist.`
        };
      }

      const timestampISO = new Date().toISOString();

      // 3. Write CREDIT Entry (Crediting the Target Campaign)
      transaction.set(creditDocRef, {
        type: "CREDIT",
        account: `fundraisers/${entry.projectId}`,
        receiptId: receiptKey,
        projectId: entry.projectId,
        amount: entry.amount,
        phone: entry.phone,
        senderName: entry.senderName,
        timestamp: entry.timestamp,
        status: entry.status,
        category: entry.category || "Well-wisher",
        notes: entry.notes || "",
        createdAt: timestampISO,
        auditable: true
      });

      // 4. Write CORRESPONDING DEBIT Entry (Debiting Escrow / Safaricom Clearing Bank)
      transaction.set(debitDocRef, {
        type: "DEBIT",
        account: "MPESA_ESCROW_CLEARING_ACCOUNT",
        receiptId: receiptKey,
        projectId: entry.projectId,
        amount: -1 * entry.amount, // debit volume
        phone: entry.phone,
        senderName: entry.senderName,
        timestamp: entry.timestamp,
        status: entry.status,
        category: entry.category || "Well-wisher",
        notes: `Corresponding debit to Escrow for ledger transaction ${receiptKey}`,
        createdAt: timestampISO,
        auditable: true
      });

      // 5. Update cached aggregate balance safely via FieldValue.increment
      transaction.update(fundraiserDocRef, {
        currentAmount: FieldValue.increment(entry.amount),
        updatedAt: timestampISO
      });

      console.log(`[LEDGER DOUBLE ENTRY SUCCESS] Committed dual balance entries for transaction receipt: ${receiptKey}`);
      return { success: true };
    });

    return result;
  } catch (error: any) {
    console.error(`[LEDGER FATAL ERROR] Double-entry execution failure for ${receiptKey}:`, error.message || error);
    return {
      success: false,
      error: error.message || "Failed to commit atomic ledger entries."
    };
  }
}
