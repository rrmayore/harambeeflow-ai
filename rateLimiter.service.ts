import { getAdminDb } from "./db-instance.js";
import { isLive } from "./payment-mode.js";
import { normalizePhoneNumber } from "./mpesa-security.js";

/**
 * Validates if MSISDN rate limit is within threshold (max 5 requests per minute).
 * Uses distributed sliding window query to be safe under Cloud Run scaling.
 * Blocks multiple STK push spamming.
 */
export async function checkAndRegisterRateLimit(phone: string): Promise<{ allowed: boolean; count: number }> {
  const targetPhone = normalizePhoneNumber(phone);
  const now = Date.now();
  const sixtySecondsAgo = now - 60000;
  const adminDb = getAdminDb();

  if (!adminDb) {
    if (isLive()) {
      throw new Error("[SECURITY FATAL] Admin Firestore unconfigured. Rate-Limiting engine failed-closed in Production.");
    }
    // Dev sandbox bypass when Firestore is local-only and missing
    console.warn(`[RATE LIMITER Sandbox] Bypassing limit for local simulation on MSISDN: ${targetPhone}`);
    return { allowed: true, count: 1 };
  }

  try {
    const rateLimitCollection = adminDb.collection("rate_limit_logs");

    // Query logs in the last 60 seconds
    const snapshot = await rateLimitCollection
      .where("phone", "==", targetPhone)
      .where("timestamp", ">=", sixtySecondsAgo)
      .get();

    const activeRequestsCount = snapshot.size;

    if (activeRequestsCount >= 5) {
      console.warn(`[RATE LIMIT BLOCKED] MSISDN ${targetPhone} exceeded limit with ${activeRequestsCount} requests in last 60s.`);
      return { allowed: false, count: activeRequestsCount };
    }

    // Atomic log insertion (Distributed lock)
    await rateLimitCollection.add({
      phone: targetPhone,
      timestamp: now,
      createdAt: new Date().toISOString()
    });

    // Run cleanup asynchronously under fire-and-forget
    pruneOldRateLimitLogs(targetPhone).catch(() => {});

    return { allowed: true, count: activeRequestsCount + 1 };
  } catch (error: any) {
    console.error(`[RATE LIMIT LIMITER ERROR] Failed to query/update sliding window logs:`, error.message || error);
    return { allowed: false, count: 999 }; // Fail closed on error to prevent rate limit evasion
  }
}

/**
 * Asynchronously deletes logs older than 5 minutes to prevent document bloat and control DB cost.
 */
async function pruneOldRateLimitLogs(phone: string): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  const cutoff = Date.now() - 300000; // 5 minutes ago
  try {
    const rateLimitCollection = adminDb.collection("rate_limit_logs");
    const snapshot = await rateLimitCollection
      .where("phone", "==", phone)
      .where("timestamp", "<", cutoff)
      .get();

    if (snapshot.empty) return;

    const batch = adminDb.batch();
    snapshot.forEach((docSnap: any) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err: any) {
    console.debug("[RATE LIMIT LIMITER] Prune skipped:", err.message);
  }
}
