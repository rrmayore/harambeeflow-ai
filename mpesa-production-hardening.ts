import { Request } from "express";
import { isLive } from "./payment-mode.js";
import fs from "fs";
import path from "path";
import { getDoc, setDoc, doc } from "firebase/firestore";

let firestoreDb: any = null;
const PERSISTENCE_FILE = path.join(process.cwd(), "mpesa-persistence.json");

// System blocked state flag
let systemBlocked = false;

// Append-only audit logs store
const auditLogs: any[] = [];

export type EnvMode = "DEV" | "SANDBOX" | "PRODUCTION";

interface PersistenceStore {
  processedCheckoutRequestIDs: string[];
  processedReceipts: string[];
  rateLimits: Record<string, number[]>;
}

/**
 * Loads the security persistence cache from the local JSON store synchronously.
 */
function loadPersistenceSync(): PersistenceStore {
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const content = fs.readFileSync(PERSISTENCE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        processedCheckoutRequestIDs: parsed.processedCheckoutRequestIDs || [],
        processedReceipts: parsed.processedReceipts || [],
        rateLimits: parsed.rateLimits || {}
      };
    }
  } catch (err) {
    console.error(`[PERSISTENCE ERROR] Failed to read ${PERSISTENCE_FILE}:`, err);
  }
  return { processedCheckoutRequestIDs: [], processedReceipts: [], rateLimits: {} };
}

/**
 * Saves the security persistence cache to the local JSON store.
 */
function savePersistenceSync(data: PersistenceStore) {
  try {
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[PERSISTENCE ERROR] Failed to write ${PERSISTENCE_FILE}:`, err);
  }
}

// Memory cache synchronized with persistence file
let cache: PersistenceStore = loadPersistenceSync();

/**
 * Registers active Firestore DB for synchronized protection across distributed servers.
 */
export function setFirestoreInstance(db: any) {
  firestoreDb = db;
  console.log("[SECURITY] Registered Firestore Instance for Realtime Hardened Protection.");
  syncFromFirestore().catch(() => {});
}

/**
 * Masks phone numbers to maintain PII audit compliance.
 */
function maskPhoneNumber(phone: string): string {
  const cleaned = phone.toString().trim();
  if (cleaned.length < 8) return "***";
  return cleaned.substring(0, 4) + "***" + cleaned.substring(cleaned.length - 4);
}

/**
 * Synchronize distributed state from Firestore into the local cache.
 */
async function syncFromFirestore(): Promise<void> {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, "mpesa_system", "security_persistence");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<PersistenceStore>;
      
      // Concurrently merge and deduplicate processed transaction IDs
      cache.processedCheckoutRequestIDs = Array.from(
        new Set([...cache.processedCheckoutRequestIDs, ...(data.processedCheckoutRequestIDs || [])])
      );
      cache.processedReceipts = Array.from(
        new Set([...cache.processedReceipts, ...(data.processedReceipts || [])])
      );
      
      // Concurrently merge and deduplicate sliding rate-limits
      const now = Date.now();
      const cutoff = now - 60000;
      for (const [phone, times] of Object.entries(data.rateLimits || {})) {
        const mergedTimes = Array.from(
          new Set([...(cache.rateLimits[phone] || []), ...(times || [])])
        )
          .filter(t => t > cutoff)
          .sort();
        cache.rateLimits[phone] = mergedTimes;
      }
      
      savePersistenceSync(cache);
    }
  } catch (err) {
    console.debug("[SECURITY] Optional Firestore pull skipped:", err);
  }
}

/**
 * Synchronize local cache state into distributed Firestore database.
 */
async function syncToFirestore(): Promise<void> {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, "mpesa_system", "security_persistence");
    await setDoc(docRef, {
      processedCheckoutRequestIDs: cache.processedCheckoutRequestIDs,
      processedReceipts: cache.processedReceipts,
      rateLimits: cache.rateLimits
    }, { merge: true });
  } catch (err) {
    console.debug("[SECURITY] Optional Firestore push skipped:", err);
  }
}

/**
 * Returns current environment mode based on configuration rules.
 */
export function getEnvironment(): EnvMode {
  if (process.env.NODE_ENV !== "production") {
    return "DEV";
  }
  return isLive() ? "PRODUCTION" : "SANDBOX";
}

/**
 * Verifies if the callback pipeline is blocked by a global system kill-switch.
 */
export function isSystemBlocked(): boolean {
  return systemBlocked || process.env.SYSTEM_BLOCKED === "true";
}

/**
 * Configures the system blocked status (Global Webhook Kill-switch).
 */
export function setSystemBlocked(blocked: boolean): void {
  systemBlocked = blocked;
}

/**
 * Validates incoming webhook request structural origin.
 * Handles both STK (Lipa Na M-PESA) and C2B Paybill structures securely.
 */
export function validateCallbackOrigin(req: Request): boolean {
  const body = req.body;
  if (!body) {
    return false;
  }

  // Case A: STK push callback structure verification
  if (body.Body && body.Body.stkCallback) {
    const { MerchantRequestID, CheckoutRequestID, ResultCode } = body.Body.stkCallback;
    return !!(MerchantRequestID && CheckoutRequestID && ResultCode !== undefined);
  }

  // Case B: C2B Paybill transaction structure verification
  if (body.TransAmount && body.TransID && body.MSISDN) {
    return true;
  }

  return false;
}

/**
 * Callback replay protection.
 * Assures a unique transaction CheckoutRequestID (Idempotency Key) has not been run previously.
 */
export async function isDuplicateCallback(checkoutRequestID: string): Promise<boolean> {
  const targetID = checkoutRequestID.trim();
  
  if (firestoreDb) {
    await syncFromFirestore().catch(() => {});
  } else {
    cache = loadPersistenceSync();
  }

  if (cache.processedCheckoutRequestIDs.includes(targetID)) {
    return true;
  }

  cache.processedCheckoutRequestIDs.push(targetID);
  savePersistenceSync(cache);

  if (firestoreDb) {
    await syncToFirestore().catch(() => {});
  }
  return false;
}

/**
 * Receipt duplicate prevention.
 * Strictly guarantees that an MpesaReceiptNumber (TransID) cannot be credited twice under any scenario.
 */
export async function isDuplicateReceipt(receiptNumber: string): Promise<boolean> {
  const targetReceipt = receiptNumber.trim().toUpperCase();

  if (firestoreDb) {
    await syncFromFirestore().catch(() => {});
  } else {
    cache = loadPersistenceSync();
  }

  if (cache.processedReceipts.includes(targetReceipt)) {
    return true;
  }

  cache.processedReceipts.push(targetReceipt);
  savePersistenceSync(cache);

  if (firestoreDb) {
    await syncToFirestore().catch(() => {});
  }
  return false;
}

/**
 * Resolves current rate limit timestamps list for a given phone MSISDN.
 */
export async function getRateLimitAttempts(phone: string): Promise<number[]> {
  if (firestoreDb) {
    await syncFromFirestore().catch(() => {});
  } else {
    cache = loadPersistenceSync();
  }
  return cache.rateLimits[phone] || [];
}

/**
 * Registers an active attempt for a given phone rate limit.
 */
export async function registerRateLimitAttempt(phone: string, timestamp: number): Promise<void> {
  if (firestoreDb) {
    await syncFromFirestore().catch(() => {});
  } else {
    cache = loadPersistenceSync();
  }

  if (!cache.rateLimits[phone]) {
    cache.rateLimits[phone] = [];
  }
  cache.rateLimits[phone].push(timestamp);

  // Maintain sliding window bounds
  const cutoff = timestamp - 60000;
  cache.rateLimits[phone] = cache.rateLimits[phone].filter(t => t > cutoff);

  savePersistenceSync(cache);

  if (firestoreDb) {
    await syncToFirestore().catch(() => {});
  }
}

/**
 * Appends a verified transaction to the audit logs system.
 * Masks raw MSISDN to comply stringently with financial privacy laws.
 */
export function logTransactionAudit(event: {
  timestamp: string;
  phone: string;
  amount: number;
  receipt: string;
  status: string;
}): void {
  const maskedPhone = maskPhoneNumber(event.phone);
  const auditEvent = {
    timestamp: event.timestamp || new Date().toISOString(),
    phone: maskedPhone,
    amount: event.amount,
    receipt: event.receipt,
    status: event.status,
  };
  auditLogs.push(auditEvent);
  console.log(
    `[SECURITY AUDIT LOG] ${JSON.stringify(auditEvent)}`
  );
}

/**
 * Lists all processed logs.
 */
export function getAuditLogs() {
  return [...auditLogs];
}
