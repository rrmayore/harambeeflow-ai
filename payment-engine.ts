import { getPaymentMode } from "./payment-mode";

/**
 * Centered payment decision gate for HarambeeFlow AI.
 * Validates current payment mode, live safety gate, and checks availability of primary credentials.
 */
export function shouldAllowSTKPush(): { allowed: boolean; reason?: string } {
  const mode = getPaymentMode();

  if (mode === "sandbox") {
    console.log("[PAYMENT ENGINE] decision = ALLOWED (sandbox mode)");
    return { allowed: true };
  }

  // Live validation checks
  if (mode === "live") {
    if (process.env.LIVE_Mpesa_CONFIRM !== "true") {
      console.log("[PAYMENT ENGINE] decision = BLOCKED (live mode not confirmed)");
      return {
        allowed: false,
        reason: "Live mode not confirmed. Enable LIVE_Mpesa_CONFIRM=true"
      };
    }

    const hasCredentials = !!(
      process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY
    );

    if (!hasCredentials) {
      console.log("[PAYMENT ENGINE] decision = BLOCKED (missing credentials)");
      return {
        allowed: false,
        reason: "Missing production M-PESA credentials"
      };
    }

    console.log("[PAYMENT ENGINE] decision = ALLOWED (live mode confirmed and validated)");
    return { allowed: true };
  }

  console.log("[PAYMENT ENGINE] decision = BLOCKED (invalid mode configuration)");
  return { allowed: false, reason: "Invalid payment mode configuration" };
}
