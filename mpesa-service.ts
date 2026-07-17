import dotenv from "dotenv";
import { getPaymentMode, isSandbox, isLive } from "./payment-mode.js";
import { shouldAllowSTKPush } from "./payment-engine.js";

// Load environment variables
dotenv.config();

// ==========================================
// 1. TYPESCRIPT INTERFACES DEFINITIONS
// ==========================================

export interface MpesaOAuthResponse {
  access_token: string;
  expires_in: string;
}

export interface STKPushRequestParams {
  phoneNumber: string;       // Format: 2547XXXXXXXX or 2541XXXXXXXX
  amount: number;            // Must be numeric and greater than 0
  accountReference: string;  // Maximum alphanumeric characters (up to 12 recommended)
  transactionDesc?: string;  // Optional transaction description (defaults to "HarambeeFlow Contribution")
}

export interface DarajaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface STKPushServiceResult {
  success: boolean;
  checkoutRequestID?: string;
  message: string;
  responseCode?: string;
  rawResponse?: any;
}

export interface DarajaSTKQueryRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  CheckoutRequestID: string;
}

export interface DarajaSTKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export interface STKStatusResult {
  success: boolean;
  resultCode?: string;          // "0" if successful payment, others indicate failures/cancellations
  resultDescription?: string;   // Explanatory message for the payment state
  responseCode?: string;        // Gateway response code ("0" if query API call succeeded)
  responseDescription?: string; // Gateway response description
  rawResponse?: any;            // Full JSON payload for tracing
  message: string;              // Human readable application summary message
}

// ==========================================
// 2. CONFIGURATION & CONSTANTS
// ==========================================

export const MPESA_MODE = getPaymentMode();

// Safaricom Daraja Base URL Dynamic Routing
export const DARAJA_BASE_URL = isLive() && process.env.LIVE_Mpesa_CONFIRM === "true"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const getConfig = () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
  const shortCode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const baseCallback = process.env.MPESA_CALLBACK_URL || "/api/mpesa/callback";
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // Construct callback URL safely
  let absoluteCallbackUrl = baseCallback;
  if (baseCallback.startsWith("/")) {
    absoluteCallbackUrl = `${appUrl.replace(/\/$/, "")}${baseCallback}`;
  }

  return {
    consumerKey,
    consumerSecret,
    shortCode,
    passkey,
    callbackUrl: absoluteCallbackUrl
  };
};

/**
 * Normalizes phone numbers safely.
 */
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

/**
 * Masks raw phone numbers for log compliance with financial data privacy.
 */
function maskPhoneNumber(phone: string): string {
  const cleaned = phone.toString().trim();
  if (cleaned.length < 8) return "***";
  return cleaned.substring(0, 4) + "***" + cleaned.substring(cleaned.length - 4);
}

// ==========================================
// 3. REUSABLE EXPORTED SERVICE FUNCTIONS
// ==========================================

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

export function generatePassword(shortCode: string, passkey: string, timestamp: string): string {
  const rawString = `${shortCode}${passkey}${timestamp}`;
  return Buffer.from(rawString).toString("base64");
}

/**
 * Obtains an active OAuth token using Consumer Credentials.
 * Guaranteed safety gate check before outbound requests.
 */
export async function getAccessToken(): Promise<string> {
  const decision = shouldAllowSTKPush();
  if (!decision.allowed) {
    const errorMsg = `Access Token retrieval BLOCKED by Safety Gate: ${decision.reason || "Live mode not confirmed"}`;
    console.error(`[SECURITY] [MPESA ENGINE] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const config = getConfig();
  
  if (!config.consumerKey || !config.consumerSecret) {
    const errorMsg = "M-PESA dynamic credentials configuration error. MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is not defined.";
    console.error(`[SECURITY] [MPESA ENGINE] [ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
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
      const errorText = await response.text();
      throw new Error(`Auth request failed with HTTP ${response.status}: ${errorText}`);
    }

    const body = (await response.json()) as MpesaOAuthResponse;
    if (!body || !body.access_token) {
      throw new Error("Missing access_token property in OAuth response body.");
    }

    return body.access_token;
  } catch (error: any) {
    console.error("[SECURITY] [MPESA ENGINE] OAuth retrieval failure:", error.message || error);
    throw error;
  }
}

/**
 * Initiates an M-PESA STK Push (Lipa Na M-PESA Online) request on the client's phone handset.
 */
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string = "HarambeeFlow Contribution"
): Promise<STKPushServiceResult> {
  const config = getConfig();

  try {
    // 1. Normalize phone formatting BEFORE checking validation rules
    const cleanedNumber = normalizePhoneNumber(phoneNumber);
    const maskedPhone = maskPhoneNumber(cleanedNumber);

    // Strict regex validation post-normalization
    if (!/^254[71]\d{8}$/.test(cleanedNumber)) {
      return {
        success: false,
        message: `Invalid Kenyan Mobile format: ${maskedPhone}. Number must conform strictly to 2547XXXXXXXX or 2541XXXXXXXX.`
      };
    }

    // Amount checks
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: "Invalid transaction amount. Value must be a positive number greater than 0."
      };
    }

    // --- DUAL MODE M-PESA ROUTING & VALIDATION GUARDS ---
    const decision = shouldAllowSTKPush();
    if (!decision.allowed) {
      return {
        success: false,
        message: decision.reason || "LIVE mode transaction is blocked by safety gate."
      };
    }

    // --- AUTOMATIC SIMULATION MODE FALLBACK OR EXPLICIT SANDBOX MODE ---
    if (isSandbox() || !config.consumerKey || !config.consumerSecret) {
      console.log(`[SANDBOX MODE] [MPESA ENGINE] STK Push simulated toward ${maskedPhone} for KES ${amount}`);
      const timestamp = generateTimestamp();
      const checkoutRequestID = `SIM-${timestamp}`;

      // Auto-generate high-fidelity sandbox callback after 5 seconds to the local endpoint
      setTimeout(async () => {
        try {
          const randomDigits = Math.floor(100000 + Math.random() * 900000);
          const mpesaReceipt = `SIMTX${randomDigits}`;
          const callbackPayload = {
            Body: {
              stkCallback: {
                MerchantRequestID: `SIM-MR-${timestamp}`,
                CheckoutRequestID: checkoutRequestID,
                ResultCode: 0,
                ResultDesc: "The service request is processed successfully.",
                CallbackMetadata: {
                  Item: [
                    { Name: "Amount", Value: Math.round(amount) },
                    { Name: "MpesaReceiptNumber", Value: mpesaReceipt },
                    { Name: "PhoneNumber", Value: Number(cleanedNumber) }
                  ]
                }
              }
            }
          };

          const localUrl = "http://127.0.0.1:3000/api/mpesa/callback?token=SANDBOX_SIMULATION_BYPASS_TOKEN";
          const res = await fetch(localUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Mpesa-Signature": "SANDBOX_SIMULATION_BYPASS_SIGNATURE"
            },
            body: JSON.stringify(callbackPayload)
          });

          if (res.ok) {
            console.log(`[SANDBOX MODE] [MPESA ENGINE] Callback triggered successfully with transaction code ${mpesaReceipt}`);
          } else {
            console.error(`[SANDBOX MODE] [MPESA ENGINE] Callback trigger failed:`, await res.text());
          }
        } catch (err: any) {
          console.error("[SANDBOX MODE CALLBACK ERROR] Failed to send simulated callback:", err.message || err);
        }
      }, 5000);

      return {
        success: true,
        checkoutRequestID: checkoutRequestID,
        message: "STK Push simulated successfully in sandbox mode",
        responseCode: "0"
      };
    }

    // 2. Prepare security credentials and authentication mechanisms (Production path)
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(config.shortCode, config.passkey, timestamp);

    // Limit account reference to 12 chars per Safaricom spec restrictions
    const formattedRef = accountReference.replace(/[^a-zA-Z0-9]/g, "").substring(0, 12).trim() || "HarambeeFlow";

    // 3. Compile Lipa Na M-PESA specifications payload
    const requestPayload = {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: cleanedNumber,
      PartyB: config.shortCode,
      PhoneNumber: cleanedNumber,
      CallbackURL: config.callbackUrl,
      AccountReference: formattedRef,
      TransactionDesc: transactionDesc.substring(0, 20) || "Harambee"
    };

    console.log(`[SECURITY] [MPESA ENGINE] Initiating live STK push payment toward ${maskedPhone} for KES ${amount}...`);

    const pushUrl = `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`;
    const response = await fetch(pushUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });

    const resJson = (await response.json()) as DarajaSTKPushResponse;

    if (!response.ok) {
      console.error(`[SECURITY] [MPESA ENGINE] Gateway HTTP ${response.status} returned from Daraja STK Push API:`, resJson);
      return {
        success: false,
        message: resJson.ResponseDescription || "Safaricom gateway returned error status code.",
        rawResponse: resJson
      };
    }

    if (resJson.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestID: resJson.CheckoutRequestID,
        message: resJson.CustomerMessage || resJson.ResponseDescription,
        responseCode: resJson.ResponseCode,
        rawResponse: resJson
      };
    } else {
      return {
        success: false,
        message: resJson.ResponseDescription || "Transaction initiation rejected with errors.",
        responseCode: resJson.ResponseCode,
        rawResponse: resJson
      };
    }
  } catch (error: any) {
    console.error("[SECURITY] [MPESA ENGINE] initiateSTKPush exception:", error.message || error);
    return {
      success: false,
      message: error.message || "An exception error occurred while establishing the payment push sequence."
    };
  }
}

/**
 * Queries Safaricom Daraja for the final settlement state of a previously initiated STK request.
 */
export async function querySTKStatus(checkoutRequestID: string): Promise<STKStatusResult> {
  const config = getConfig();

  if (!checkoutRequestID) {
    return {
      success: false,
      message: "Required parameter CheckoutRequestID is missing from query execution request."
    };
  }

  try {
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(config.shortCode, config.passkey, timestamp);

    const requestPayload: DarajaSTKQueryRequest = {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    };

    const statusUrl = `${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`;
    console.log(`[SECURITY] [MPESA ENGINE] Querying status state for CheckoutRequestID: ${checkoutRequestID}...`);

    const response = await fetch(statusUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });

    const resJson = (await response.json()) as DarajaSTKQueryResponse;

    if (!response.ok) {
      console.error(`[SECURITY] [MPESA ENGINE] querySTKStatus HTTP ${response.status} returned from Daraja Query API:`, resJson);
      return {
        success: false,
        message: resJson.ResponseDescription || "M-PESA gatekeeper declined request format.",
        rawResponse: resJson
      };
    }

    if (resJson.ResponseCode === "0") {
      const pinSuccess = resJson.ResultCode === "0";
      return {
        success: pinSuccess,
        resultCode: resJson.ResultCode,
        resultDescription: resJson.ResultDesc,
        responseCode: resJson.ResponseCode,
        responseDescription: resJson.ResponseDescription,
        rawResponse: resJson,
        message: pinSuccess ? "Transaction completed successfully." : `Transaction cancelled or non-successful. Status description: ${resJson.ResultDesc}`
      };
    } else {
      return {
        success: false,
        responseCode: resJson.ResponseCode,
        responseDescription: resJson.ResponseDescription,
        rawResponse: resJson,
        message: resJson.ResponseDescription || "Status queries could not be evaluated at this moment."
      };
    }
  } catch (error: any) {
    console.error("[SECURITY] [MPESA ENGINE] querySTKStatus exception occurred:", error.message || error);
    return {
      success: false,
      message: error.message || "Failed to execute Daraja status query lookup sequence."
    };
  }
}
