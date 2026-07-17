import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getSecurityConfig } from "./config.security.ts";
import { acquireIdempotencyLock } from "./idempotency.service.ts";

/**
 * timingSafeEqual helper to prevent character-by-character timing comparisons.
 */
function constantTimeCompare(inputA: string, inputB: string): boolean {
  try {
    const bufferA = Buffer.from(inputA, "utf8");
    const bufferB = Buffer.from(inputB, "utf8");
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

/**
 * Strict Cryptographically Secure Webhook authentication middleware.
 * Verifies HMAC signatures, timestamp validity, and nonce-replay protection.
 */
export async function mpesaWebhookAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const config = getSecurityConfig();
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";

  // Fetch Webhook authentication headers
  const signature = (req.headers["x-mpesa-signature"] as string) || "";
  const timestampStr = (req.headers["x-mpesa-timestamp"] as string) || "";
  const nonce = (req.headers["x-mpesa-nonce"] as string) || "";
  const queryToken = (req.query.token as string) || (req.headers["x-webhook-token"] as string) || "";

  // 1. SILENT SIMULATION BYPASS: ONLY permitted under development/sandbox modes
  if (!config.isLiveMode && (queryToken === "SANDBOX_SIMULATION_BYPASS_TOKEN" || signature === "SANDBOX_SIMULATION_BYPASS_SIGNATURE")) {
    console.log("[WEBHOOK AUTH] Approved via local development Sandbox Simulation Key Bypass.");
    return next();
  }

  // 2. TIMING-SAFE CRYPTOGRAPHIC VALIDATION (HMAC SHA-256)
  let isVerified = false;

  if (signature) {
    try {
      const payloadString = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", config.webhookSecret)
        .update(payloadString)
        .digest("hex");

      isVerified = constantTimeCompare(signature, expectedSignature);
    } catch (err) {
      console.error("[WEBHOOK CRYPTO ERROR] HMAC computation failed:", err);
    }
  }

  // Callback fallback key query comparison (timing-safe)
  if (!isVerified && queryToken) {
    isVerified = constantTimeCompare(queryToken, config.webhookSecret);
  }

  // FAIL-CLOSED: Instantly discard any unauthorized payload
  if (!isVerified) {
    console.warn(`[WEBHOOK AUTH REFUSED] Cryptographic verification failed. Blocked client IP: ${clientIp}`);
    return res.status(401).json({
      ResultCode: 1,
      ResultDesc: "Unauthenticated callback access denied: Webhook signature is stale or invalid."
    });
  }

  // 3. SECURE TIMESTAMP DEVIATION CONTROL (Max 5 minutes tolerance to limit replay attack windows)
  if (config.isLiveMode && timestampStr) {
    const timestampUnix = parseInt(timestampStr, 10);
    if (!isNaN(timestampUnix)) {
      const currentUnix = Math.floor(Date.now() / 1000);
      const age = Math.abs(currentUnix - timestampUnix);
      if (age > 300) {
        console.warn(`[WEBHOOK AUTH SECURITY] Stale request. Webhook timestamp skew: ${age}s exceeds 300s limit.`);
        return res.status(401).json({
          ResultCode: 1,
          ResultDesc: "Unauthorized callback: Request age is expired or stale."
        });
      }
    }
  }

  // 4. NONCE & SIGNATURE REPLAY PROTECTION
  // Automatically registers a temporary lock key in DB idempotency layer to prevent transaction playback
  if (config.isLiveMode && (nonce || signature)) {
    const replayKey = `NONCE-${nonce || signature.substring(0, 32)}`;
    const isLockSuccessful = await acquireIdempotencyLock(replayKey, {
      type: "WEBHOOK_REPLAY_REGISTRATION",
      loggedAt: new Date().toISOString()
    });

    if (!isLockSuccessful) {
      console.warn(`[WEBHOOK REPLAY ATTACK BLOCKED] Replayed nonce or signature observed: ${replayKey}`);
      return res.status(409).json({
        ResultCode: 1,
        ResultDesc: "Replay transaction pattern observed: Request payload is already processed."
      });
    }
  }

  return next();
}
