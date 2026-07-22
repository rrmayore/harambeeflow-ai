import dotenv from "dotenv";
import { getPaymentMode, isLive } from "./payment-mode.js";

dotenv.config();

export interface SecurityConfig {
  mode: "sandbox" | "live";
  isLiveMode: boolean;
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passkey: string;
  callbackUrl: string;
  webhookSecret: string;
  appUrl: string;
}

// Immutable, cached config loaded at boot-up
let cachedConfig: SecurityConfig | null = null;

/**
 * Loads and validates configuration.
 * Under "live" production rules, any missing major key triggers a HARD FAIL-CLOSED crash.
 */
export function getSecurityConfig(): SecurityConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const mode = getPaymentMode();
  const isLiveMode = isLive();

  const consumerKey = (process.env.MPESA_CONSUMER_KEY || "").trim();
  const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || "").trim();
  const shortCode = (process.env.MPESA_SHORTCODE || "").trim();
  const passkey = (process.env.MPESA_PASSKEY || "").trim();
  const baseCallback = (process.env.MPESA_CALLBACK_URL || "/api/mpesa/callback").trim();
  let appUrl = (process.env.APP_URL || "http://localhost:3000").trim().replace(/\/$/, "");

  // Safaricom Daraja API requires CallbackURL to start with https://, even in Sandbox mode.
  // Since Cloud Run executes under HTTPS but may expose the app via HTTP internally or APP_URL might have http://,
  // we securely rewrite the protocol to https:// for any non-local deployments.
  if (appUrl.startsWith("http://") && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
    appUrl = appUrl.replace("http://", "https://");
  }

  console.log(`[CONFIG SECURITY] Resolved secure APP_URL: ${appUrl}`);

  // HMAC webhook audit verification token
  const webhookSecret = (process.env.MPESA_WEBHOOK_SECRET || "DARAJA_FINTECH_SECURE_VERIFICATION_TOKEN_2026").trim();

  // STACK FAIL-CLOSED CHECKS: Ensure no sandbox bypasses exist in LIVE mode
  if (isLiveMode) {
    if (process.env.LIVE_Mpesa_CONFIRM !== "true") {
      throw new Error(
        "[SECURITY FATAL] Live execution mode configured, but LIVE_Mpesa_CONFIRM safety switch is not 'true'. Fail-closed."
      );
    }
    if (!consumerKey || !consumerSecret) {
      throw new Error(
        "[SECURITY FATAL] Production Consumer Key or Secret is unconfigured. Fail-closed to protect fintech assets."
      );
    }
    if (!shortCode || !passkey) {
      throw new Error(
        "[SECURITY FATAL] Production Paybill Shortcode or Passkey is missing. Fail-closed."
      );
    }
    if (webhookSecret === "DARAJA_FINTECH_SECURE_VERIFICATION_TOKEN_2026") {
      throw new Error(
        "[SECURITY FATAL] System is operating in Production with a default Webhook Signature Secret. Rejecting insecure config."
      );
    }
  }

  // Resolve absolute callback URL
  let callbackUrl = baseCallback;
  if (baseCallback.startsWith("/")) {
    callbackUrl = `${appUrl}${baseCallback}`;
  }

  // Fallbacks strictly for local sandbox simulation
  const finalShortcode = shortCode || "174379";
  const finalPasskey = passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

  cachedConfig = {
    mode,
    isLiveMode,
    consumerKey,
    consumerSecret,
    shortCode: finalShortcode,
    passkey: finalPasskey,
    callbackUrl,
    webhookSecret,
    appUrl
  };

  console.log(`[CONFIG SECURITY] Loaded hardened configuration for flow: ${mode.toUpperCase()}`);
  return cachedConfig;
}

/**
 * Validates whether the environment parameters support safe financial operations.
 */
export function assertProductionSafety(): void {
  try {
    getSecurityConfig();
  } catch (error: any) {
    console.error(`[SECURITY ENGINE BLOCK] ${error.message}`);
    process.exit(1); // Stop execution instantly
  }
}
