import dotenv from "dotenv";

dotenv.config();

/**
 * Interface representing the STK Push parameter requirements
 */
export interface STKPushParams {
  phoneNumber: string; // Must be in the format 2547XXXXXXXX or 2541XXXXXXXX
  amount: number;      // Transaction value (must be integer > 0)
  accountReference: string; // E.g., Campaign/Harambee Goal Name
  callbackUrl?: string; // Optional override for Callback URL
}

/**
 * Response structure from the M-PESA OAuth Generate endpoint
 */
interface OAuthResponse {
  access_token: string;
  expires_in: string;
}

/**
 * Response structure returned from the Daraja processrequest endpoint
 */
interface DarajaSTKResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Custom response representation returned by the service
 */
export interface STKPushResult {
  success: boolean;
  checkoutRequestID?: string;
  message: string;
  responseCode?: string;
}

/**
 * Service class for communicating with Safaricom Daraja API
 */
export class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private shortCode: string;
  private passkey: string;
  private callbackUrl: string;
  private baseUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || "";
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
    this.shortCode = process.env.MPESA_SHORTCODE || "174379";
    this.passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    
    // Fallback to localhost target if none specified
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const baseCallback = process.env.MPESA_CALLBACK_URL || "/api/mpesa/callback";
    
    // Construct absolute URL if path is relative
    if (baseCallback.startsWith("/")) {
      this.callbackUrl = `${appUrl.trim().replace(/\/$/, "")}${baseCallback}`;
    } else {
      this.callbackUrl = baseCallback;
    }

    // Default to Sandbox base URL. If configured, you can switch.
    this.baseUrl = "https://sandbox.safaricom.co.ke";
  }

  /**
   * Generates OAuth dynamic access token from M-PESA gateway
   */
  public async getAccessToken(): Promise<string> {
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error("M-PESA Consumer Key or Secret environment variables are not configured.");
    }

    const authHeader = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");
    const oauthUrl = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    try {
      console.log("🔑 Requesting new M-PESA Access Token...");
      const response = await fetch(oauthUrl, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Daraja Token HTTP ${response.status}: ${errText}`);
      }

      const body = (await response.json()) as OAuthResponse;
      if (!body.access_token) {
        throw new Error("Access token missing in Daraja OAuth response.");
      }

      console.log("✅ Successfully retrieved M-PESA Access Token.");
      return body.access_token;
    } catch (error: any) {
      console.error("❌ Failed to obtain M-PESA OAuth Token:", error);
      throw error;
    }
  }

  /**
   * Helper to format current timestamp to Daraja required spec (YYYYMMDDHHmmss)
   */
  private getTimestamp(): string {
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
   * Initiates Lipa Na M-PESA Online (STK Push) transaction on user's handset
   */
  public async initiateSTKPush(params: STKPushParams): Promise<STKPushResult> {
    try {
      // 1. Prepare Authentication Headers
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();

      // 2. Generate security password string
      const rawPassword = `${this.shortCode}${this.passkey}${timestamp}`;
      const password = Buffer.from(rawPassword).toString("base64");

      // Ensure phone number starts with 254 and doesn't have internal spaces or plus signs
      let cleanedPhone = params.phoneNumber.replace(/[\s\+]/g, "");
      if (cleanedPhone.startsWith("0")) {
        cleanedPhone = "254" + cleanedPhone.slice(1);
      } else if (cleanedPhone.startsWith("7") || cleanedPhone.startsWith("1")) {
        cleanedPhone = "254" + cleanedPhone;
      }

      // Final format check to ensure 254XXXXXXXX
      if (!/^254(7|1)\d{8}$/.test(cleanedPhone)) {
        return {
          success: false,
          message: `Invalid Kenyan Mobile Identity format: ${params.phoneNumber}. Please provide numeric starting with 254 (e.g. 2547XXXXXXXX)`
        };
      }

      const targetUrl = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
      const finalCallback = params.callbackUrl || this.callbackUrl;

      const requestPayload = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(params.amount),
        PartyA: cleanedPhone,
        PartyB: this.shortCode,
        PhoneNumber: cleanedPhone,
        CallbackURL: finalCallback,
        AccountReference: params.accountReference.substring(0, 12).trim() || "HarambeeFlow",
        TransactionDesc: "HarambeeFlow Contribution"
      };

      console.log("💸 Triggering Safaricom Daraja STK Push processing...", JSON.stringify(requestPayload, null, 2));

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      const resBody = (await response.json()) as DarajaSTKResponse;
      console.log("📥 Daraja Gateway responded:", JSON.stringify(resBody, null, 2));

      if (resBody.ResponseCode === "0") {
        return {
          success: true,
          checkoutRequestID: resBody.CheckoutRequestID,
          message: resBody.CustomerMessage || resBody.ResponseDescription,
          responseCode: resBody.ResponseCode
        };
      } else {
        return {
          success: false,
          message: resBody.ResponseDescription || "Safaricom Gateway rejected this transaction flow setup.",
          responseCode: resBody.ResponseCode
        };
      }
    } catch (error: any) {
      console.error("❌ STK push initiation execution failure:", error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred while initiating your payment push request."
      };
    }
  }
}
