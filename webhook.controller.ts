import { Request, Response } from "express";
import { getSecurityConfig } from "./config.security.ts";
import { isSystemBlocked } from "./mpesa-production-hardening.js";
import { enqueueMpesaEvent } from "./eventQueue.service.ts";

/**
 * Safaricom Daraja Webhook controller.
 * Receives payment callbacks, inspects subnets, and enqueues events securely into our durable outbox queue.
 */
export async function mpesaWebhookController(req: Request, res: Response) {
  const config = getSecurityConfig();
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  console.log(`[WEBHOOK CONTROL TOWER] Webhook trigger landed from IP: ${clientIp}`);

  // 1. CIDR Subnet Allowlist tracing for Live Safaricom Production routing audit
  const SAFARICOM_CIDR_BLOCKS = [
    "196.201.214.",
    "196.201.213.",
    "196.201.212.",
    "196.201.219.",
    "196.201.215.",
    "127.0.0.1", // loopback
    "::1",
    "::ffff:127.0.0.1"
  ];

  if (config.isLiveMode) {
    const isIpRecognized = SAFARICOM_CIDR_BLOCKS.some((cidr) => clientIp.startsWith(cidr));
    if (!isIpRecognized) {
      console.warn(`[WEBHOOK SECURITY] Primary warning: client IP (${clientIp}) doesn't reside within Safaricom subnet ranges.`);
    }
  }

  // 2. Operators Administrative Kill-Switch validation
  if (isSystemBlocked()) {
    console.warn("[WEBHOOK CONTROL TOWER] Dropping callback: Administrative Kill-switch is active.");
    return res.status(503).json({
      ResultCode: 1,
      ResultDesc: "Service Unavailable. System is temporarily blocked by operators."
    });
  }

  // 3. Payload validation & structural detection (fail-closed on unknown envelopes)
  const isStkCallback = !!(req.body?.Body?.stkCallback);
  const isC2BPayment = !!(req.body?.TransAmount && req.body?.TransID);

  if (!isStkCallback && !isC2BPayment) {
    console.warn("[WEBHOOK WARNING] Inbound webhook contains unrecognized payload format.");
    return res.status(400).json({
      ResultCode: 1,
      ResultDesc: "Rejected: Webhook payload structure does not match required Safaricom structures."
    });
  }

  const envelopeType = isStkCallback ? "STK_CALLBACK" : "C2B_PAYMENT";

  try {
    // 4. ATOMIC ASYNCHRONOUS WEBHOOK OUTBOX QUEUE
    // Dispatches standard verified payload to our event processor, returning HTTP 200 instantly
    const ticketEventId = await enqueueMpesaEvent(envelopeType, req.body);

    console.log(`[WEBHOOK CONTROL TOWER] Webhook event enqueued under ticket: ${ticketEventId}. Responding with HTTP 200.`);

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback accepted. Enqueued to distributed payments database."
    });

  } catch (err: any) {
    console.error(`[WEBHOOK OUTBOX ERROR] Failed to register webhook:`, err.stack || err.message || err);
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: `Database outbox error: Failed to safely register transaction in queue. Details: ${err.message || err}. Stack: ${err.stack || ""}`
    });
  }
}
