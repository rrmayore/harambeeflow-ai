import { Request, Response, NextFunction } from "express";
import { isSandbox } from "./payment-mode.js";
import { checkAndRegisterRateLimit } from "./rateLimiter.service.js";

/**
 * Normalizes phone number into Safaricom spec format (2547XXXXXXXX or 2541XXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

/**
 * Masks phone numbers to protect user privacy (PII Compliance)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.toString().trim();
  if (cleaned.length < 8) return "***";
  return cleaned.substring(0, 4) + "***" + cleaned.substring(cleaned.length - 4);
}

/**
 * Log specified security event to system audit records.
 * Format: [SECURITY] + event type + timestamp + masked phone
 */
export function logSecurityEvent(eventType: string, phone: string) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${eventType} ${timestamp} ${maskPhoneNumber(phone)}`);
}

/**
 * Validates request payload structure.
 * Requires positive amount and valid Kenyan Safaricom phone format.
 * Normalizes phone number BEFORE validating it.
 */
export function validateSTKRequest(req: Request, res: Response, next: NextFunction) {
  const { phone, phoneNumber, amount } = req.body;
  const rawPhone = (phone || phoneNumber || "").toString().trim();

  if (!rawPhone) {
    return res.status(400).json({
      success: false,
      message: "Request blocked by security policy",
      reason: "Phone number is required."
    });
  }

  // 1. Normalization BEFORE validation
  const targetPhone = normalizePhoneNumber(rawPhone);
  const targetAmount = Number(amount);

  // Synchronize normalized fields in request body so downstream processes use clean format
  if (req.body.phone) req.body.phone = targetPhone;
  if (req.body.phoneNumber) req.body.phoneNumber = targetPhone;

  // 2. Format validation check (regex) post-normalization
  const phoneRegex = /^254[71]\d{8}$/;
  if (!phoneRegex.test(targetPhone)) {
    logSecurityEvent("INVALID_PHONE_FORMAT", targetPhone);
    console.log("[MPESA SECURITY] request blocked");
    return res.status(400).json({
      success: false,
      message: "Request blocked by security policy",
      reason: "Invalid phone number format. Must start with 2547 or 2541 and be exactly 12 digits."
    });
  }

  // 3. Amount numeric conversion and positive amount validation
  if (isNaN(targetAmount) || targetAmount <= 0) {
    logSecurityEvent("INVALID_AMOUNT", targetPhone);
    console.log("[MPESA SECURITY] request blocked");
    return res.status(400).json({
      success: false,
      message: "Request blocked by security policy",
      reason: "Amount must be a positive number greater than 0."
    });
  }

  // 4. Enforce strict max limit (default 100,000 KES)
  const maxLimit = Number(process.env.MPESA_MAX_LIMIT) || 100000;
  if (targetAmount > maxLimit) {
    logSecurityEvent("AMOUNT_LIMIT_EXCEEDED", targetPhone);
    console.log("[MPESA SECURITY] request blocked");
    return res.status(400).json({
      success: false,
      message: "Request blocked by security policy",
      reason: `Amount exceeds the maximum safe transaction limit of KES ${maxLimit}.`
    });
  }

  next();
}

/**
 * Rate limits requests per MSISDN using safe persistent distributed storage state.
 * Allows 5 attempts per minute. Bypassed in Sandbox mode for testing convenience.
 */
export async function rateLimitSTKPush(req: Request, res: Response, next: NextFunction) {
  const { phone, phoneNumber } = req.body;
  const rawPhone = (phone || phoneNumber || "").toString().trim();
  
  if (isSandbox()) {
    console.log("[MPESA SECURITY] request approved (sandbox mode rate limit bypass)");
    return next();
  }

  const targetPhone = normalizePhoneNumber(rawPhone);

  try {
    const checkResult = await checkAndRegisterRateLimit(targetPhone);
    if (!checkResult.allowed) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", targetPhone);
      console.log("[MPESA SECURITY] request blocked by rate limiting rules");
      return res.status(429).json({
        success: false,
        message: "Request blocked by security policy",
        reason: "Rate limit exceeded. Maximum 5 requests per minute per phone number."
      });
    }

    console.log(`[MPESA SECURITY] request approved (distributed Firestore checked, active requests in window: ${checkResult.count})`);
    next();
  } catch (err) {
    console.error("[SECURITY] Rate limiting evaluation error:", err);
    // Fail closed under strict security
    return res.status(500).json({
      success: false,
      message: "Security check failure",
      reason: "Rate limit checks could not be completed at this time."
    });
  }
}
