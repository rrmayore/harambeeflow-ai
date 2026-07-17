import dotenv from "dotenv";
import { getPaymentMode, isLive } from "./payment-mode.js";
import { shouldAllowSTKPush } from "./payment-engine.js";
import { getSecurityConfig } from "./config.security.ts";

dotenv.config();

export interface MpesaOAuthResponse {
  access_token: string;
  expires_in: string;
}

export interface STKPushRequestParams {
  phoneNumber: string;       // Format: 2547XXXXXXXX or 2541XXXXXXXX
  amount: number;            // Positives only KES
  accountReference: string;  // Maximum alphanumeric characters (up to 12 recommended)
  transactionDesc?: string;  // Alphanumeric, up to 20 chars
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export interface STKPushResult {
  success: boolean;
  checkoutRequestID?: string;
  message: string;
  responseCode?: string;
  rawResponse?: any;
}

export const MPESA_MODE = getPaymentMode();

// Strict dynamic url resolution: never fallback silently if production is target
export const DARAJA_BASE_URL = isLive() && process.env.LIVE_Mpesa_CONFIRM === "true"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

/**
 * Normalizes phone number into Safaricom format (2547XXXXXXXX or 2541XXXXXXXX).
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
 * Retrieve bearer active access token from credential pair safely.
 */
export async function getAccessToken(): Promise<string> {
  let config;
  try {
    config = getSecurityConfig();
  } catch (err: any) {
    console.error(`[M-PESA OAUTH SECURE GATE] Active abort: ${err.message}`);
    throw new Error("Payment gateway misconfigured");
  }

  // If in pure sandbox simulation with empty credentials (dev sandboxes only)
  if (!config.isLiveMode && (!config.consumerKey || !config.consumerSecret)) {
    return "MOCK_OAUTH2_SANDBOX_ACCESS_TOKEN";
  }

  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error("[SECURITY FATAL] Missing Consumer Key/Secret credential pair.");
  }

  const tokenUrl = `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
  const base64AuthHeader = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");

  try {
    const response = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${base64AuthHeader}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Daraja Authentication failed (HTTP ${response.status}): ${errText}`);
    }

    const payload = (await response.json()) as MpesaOAuthResponse;
    if (!payload || !payload.access_token) {
      throw new Error("Daraja response did not issue an access_token payload.");
    }

    return payload.access_token;
  } catch (err: any) {
    console.error(`[M-PESA CREDENTIALS ERROR] OAuth generate failure:`, err.message || err);
    throw err;
  }
}

/**
 * Initiates an M-PESA Lipa Na M-PESA STK Push.
 * Implements strict security validations, phone normalizations, and sandbox triggers.
 */
export async function initiateSTKPush(params: STKPushRequestParams): Promise<STKPushResult> {
  let config;
  try {
    config = getSecurityConfig();
  } catch (err: any) {
    console.error(`[M-PESA SERVICE OUTBOX ENGINE] Aborted execution: ${err.message}`);
    return {
      success: false,
      message: "Payment gateway misconfigured."
    };
  }

  const phone = normalizePhoneNumber(params.phoneNumber);
  
  // Format check regex
  if (!/^254[71]\d{8}$/.test(phone)) {
    return {
      success: false,
      message: "Blocked by input validation: Invalid phone number pattern (Must start with 2547/2541)."
    };
  }

  if (isNaN(params.amount) || params.amount <= 0) {
    return {
      success: false,
      message: "Blocked by input validation: Amount must be positive numeric KES integer."
    };
  }

  const decision = shouldAllowSTKPush();
  if (!decision.allowed) {
    return {
      success: false,
      message: decision.reason || "LIPA NA M-PESA service blocked by dynamic Safety Gate configuration."
    };
  }

  // Pure Local Simulation Mode: ALLOWED ONLY if NOT live
  if (!config.isLiveMode && (!config.consumerKey || !config.consumerSecret)) {
    const timestamp = generateTimestamp();
    const mockCheckoutID = `SIM-${timestamp}`;
    
    console.log(`[SIMULATION MOCK] Initiating high-fidelity simulated loop callback for: ${mockCheckoutID}`);
    triggerLocalSandboxCallbackMock(phone, params.amount, mockCheckoutID);

    return {
      success: true,
      checkoutRequestID: mockCheckoutID,
      message: "STK Push successfully initiated in Mock Simulation mode.",
      responseCode: "0"
    };
  }

  // Live execution mode: Prohibits any mock fallback or auto-simulation loops
  try {
    const token = await getAccessToken();
    const timestamp = generateTimestamp();
    
    const passwordRaw = `${config.shortCode}${config.passkey}${timestamp}`;
    const password = Buffer.from(passwordRaw).toString("base64");

    const formattedRef = params.accountReference.replace(/[^a-zA-Z0-9]/g, "").substring(0, 12).trim() || "HarambeeFlow";
    
    const requestPayload = {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: config.shortCode,
      PhoneNumber: phone,
      CallbackURL: config.callbackUrl,
      AccountReference: formattedRef,
      TransactionDesc: (params.transactionDesc || "Harambee").substring(0, 20)
    };

    console.log(`[DARAJA GATEWAY OUTBOX] Dispatching STK Push to ${phone.substring(0,6)}****...`);

    const response = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });

    const resJson = (await response.json()) as any;

    if (!response.ok) {
      return {
        success: false,
        message: resJson.ResponseDescription || resJson.errorMessage || "M-Pesa gateway issued HTTP Error.",
        rawResponse: resJson
      };
    }

    if (resJson.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestID: resJson.CheckoutRequestID,
        message: resJson.CustomerMessage || resJson.ResponseDescription,
        responseCode: "0",
        rawResponse: resJson
      };
    } else {
      return {
        success: false,
        message: resJson.ResponseDescription || "M-Pesa STK Push rejected at Safaricom API level.",
        responseCode: resJson.ResponseCode,
        rawResponse: resJson
      };
    }

  } catch (err: any) {
    console.error(`[M-PESA SERVICE OUTBOX EXCEPTION]`, err.message || err);
    return {
      success: false,
      message: "M-Pesa execution exception: Gateway unreachable or misconfigured."
    };
  }
}

export function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/**
 * Fires local simulated callback webhook strictly for localhost sandbox/dev testing.
 */
function triggerLocalSandboxCallbackMock(phone: string, amount: number, checkoutRequestID: string) {
  setTimeout(async () => {
    try {
      const receiptCode = "SIMTX" + Math.floor(100000 + Math.random() * 900000);
      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: `SIM-MR-${Date.now()}`,
            CheckoutRequestID: checkoutRequestID,
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: Number(amount) },
                { Name: "MpesaReceiptNumber", Value: receiptCode },
                { Name: "PhoneNumber", Value: Number(phone) }
              ]
            }
          }
        }
      };

      // In sandbox mode can bypass verification signature
      const localUrl = `http://127.0.0.1:3000/api/mpesa/callback?token=SANDBOX_SIMULATION_BYPASS_TOKEN`;
      const res = await fetch(localUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Mpesa-Signature": "SANDBOX_SIMULATION_BYPASS_SIGNATURE"
        },
        body: JSON.stringify(callbackPayload)
      });

      if (res.ok) {
        console.log(`[SIMULATION CALLBACK TRIGGER] Dispatched mock callback ${receiptCode} to server hook.`);
      }
    } catch (err: any) {
      console.warn(`[SIMULATION CALLBACK WARNING] Sandbox callback skipped:`, err.message);
    }
  }, 4000);
}
