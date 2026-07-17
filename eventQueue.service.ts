import { getAdminDb } from "./db-instance.js";
import { isLive } from "./payment-mode.js";
import { executeBackgroundEventWorker } from "./worker.processor.ts";

export interface MpesaWebhookEvent {
  id: string;
  type: "STK_CALLBACK" | "C2B_PAYMENT";
  payload: any;
  status: "queued" | "processing" | "completed" | "failed" | "dlq";
  createdAt: string;
  processedAt?: string;
  retryCount: number;
  error?: string;
}

// Memory-caches fallback only for Sandbox/Local unconfigured DEV runs
const cachePendingPayments = new Map<string, any>();
const devEventQueue: MpesaWebhookEvent[] = [];

// Delegate variables for AI naming and success notifications
interface Delegates {
  onSuccess: (contribution: any, whatsappMsg: any) => Promise<void>;
  aiClean: (name: string, description: string) => Promise<{ cleanedName: string; category: string; explanation: string }>;
}

let eventQueueDelegates: Delegates | null = null;

export function registerEventQueueDelegates(handlers: Delegates): void {
  eventQueueDelegates = handlers;
}

export function getEventQueueDelegates(): Delegates | null {
  return eventQueueDelegates;
}

/**
 * Registers pending transaction context in DB to support dynamic state verification.
 */
export async function setPendingPayment(checkoutRequestID: string, data: any): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    cachePendingPayments.set(checkoutRequestID, data);
    return;
  }
  try {
    const docRef = adminDb.collection("mpesa_pending_payments").doc(checkoutRequestID);
    await docRef.set({
      ...data,
      createdAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[EVENT QUEUE] Failed to record pending payment:", err.message);
  }
}

/**
 * Fetches pending transaction context.
 */
export async function getPendingPayment(checkoutRequestID: string): Promise<any | null> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return cachePendingPayments.get(checkoutRequestID) || null;
  }
  try {
    const docRef = adminDb.collection("mpesa_pending_payments").doc(checkoutRequestID);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data();
    }
  } catch (err: any) {
    console.error("[EVENT QUEUE] Failed to retrieve pending payment:", err.message);
  }
  return null;
}

/**
 * Enqueues an inbound validated callback event.
 * Instantly updates outbox and detaches execution thread so the webhook responder
 * can reply HTTP 200 immediately back to Daraja.
 */
export async function enqueueMpesaEvent(type: "STK_CALLBACK" | "C2B_PAYMENT", payload: any): Promise<string> {
  const adminDb = getAdminDb();
  const eventId = `evt_${type.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const eventRecord: MpesaWebhookEvent = {
    id: eventId,
    type,
    payload,
    status: "queued",
    retryCount: 0,
    createdAt: new Date().toISOString()
  };

  if (!adminDb) {
    if (isLive()) {
      throw new Error("[SECURITY FATAL] Admin DB unconfigured. Event queue failed-closed in Production.");
    }
    devEventQueue.push(eventRecord);
    // Mimic fire-and-forget worker execution
    setTimeout(() => executeBackgroundEventWorker(eventId).catch(() => {}), 10);
    return eventId;
  }

  try {
    const eventRef = adminDb.collection("mpesa_events").doc(eventId);
    await eventRef.set(eventRecord);

    // Fire and forget background processor trigger
    setTimeout(() => executeBackgroundEventWorker(eventId).catch(() => {}), 10);

    return eventId;
  } catch (error: any) {
    console.error("[EVENT QUEUE ERROR] Failed to write event:", error.message || error);
    throw error;
  }
}

/**
 * Hard-marks the event delivery state inside the DB.
 */
export async function markEventStatusInDb(
  eventId: string, 
  status: "completed" | "failed" | "dlq", 
  errorMsg?: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    const found = devEventQueue.find(e => e.id === eventId);
    if (found) {
      found.status = status;
      if (errorMsg) found.error = errorMsg;
      found.processedAt = new Date().toISOString();
    }
    return;
  }

  try {
    const eventRef = adminDb.collection("mpesa_events").doc(eventId);
    await eventRef.update({
      status,
      processedAt: new Date().toISOString(),
      ...(errorMsg ? { error: errorMsg } : {})
    });
  } catch (err: any) {
    console.error(`[EVENT QUEUE] Failed to update state for event ${eventId}:`, err.message);
  }
}
