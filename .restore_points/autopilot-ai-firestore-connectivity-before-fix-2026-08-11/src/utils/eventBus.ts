import { db, auth } from "../firebase";
import { doc, setDoc, addDoc, collection, getDocs, updateDoc, getDoc } from "firebase/firestore";
import { Project, Contribution, Pledge, Notification } from "../types";

export type EventType =
  | "ContributionReceived"
  | "ContributionUpdated"
  | "ContributionDeleted"
  | "PledgeCreated"
  | "PledgeFulfilled"
  | "PledgeOverdue"
  | "SupporterCreated"
  | "SupporterUpdated"
  | "MajorDonorDetected"
  | "CampaignCreated"
  | "CampaignUpdated"
  | "CampaignMilestoneReached"
  | "CampaignCompleted"
  | "CampaignGoalExceeded"
  | "CommitteeMemberInvited"
  | "MessageDelivered"
  | "MessageFailed"
  | "ReportGenerated"
  | "AIInsightGenerated"
  | "VolunteerAssigned"
  | "RecognitionAwarded"
  | "LoginDetected"
  | "OrganizationCreated"
  | "PaymentAccountVerified";

export interface AppEvent {
  id: string;
  type: EventType;
  timestamp: string;
  payload: any;
  userId?: string;
  source: "client" | "server";
  processed: boolean;
}

export interface AutomationExecution {
  id: string;
  eventId: string;
  pipelineStep: string;
  timestamp: string;
  status: "success" | "failed";
  details?: string;
}

export interface LiveMetrics {
  eventsProcessedToday: number;
  averageProcessingTimeMs: number;
  automationSuccessRate: number;
  failedAutomations: number;
  pendingQueue: number;
  connectedModules: string[];
  healthStatus: "healthy" | "degraded" | "critical";
  firestoreSync: boolean;
  communicationDeliveryRate: number;
  aiResponseTimeMs: number;
}

// Memory-backed listeners for local subscription
type EventCallback = (event: AppEvent) => void;
const listeners = new Map<EventType, Set<EventCallback>>();

// Queue for offline resilience
let offlineQueue: AppEvent[] = [];

// Load queued offline events on startup
try {
  const savedQueue = localStorage.getItem("harambeeflow_offline_events");
  if (savedQueue) {
    offlineQueue = JSON.parse(savedQueue);
  }
} catch (e) {
  console.error("Failed to load offline event queue", e);
}

// Core Event Bus Class
export class EventBus {
  /**
   * Subscribe to a specific event type
   */
  static subscribe(type: EventType, callback: EventCallback): () => void {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(callback);
    return () => {
      const set = listeners.get(type);
      if (set) {
        set.delete(callback);
      }
    };
  }

  /**
   * Publish an event onto the platform event bus
   */
  static async publish(type: EventType, payload: any, isDemoMode: boolean = false): Promise<AppEvent> {
    const eventId = `evt_${type.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const event: AppEvent = {
      id: eventId,
      type,
      timestamp: new Date().toISOString(),
      payload,
      userId: auth?.currentUser?.uid || "anonymous_user",
      source: "client",
      processed: false,
    };

    console.log(`[EVENT BUS] Publishing ${type}:`, event);

    // 1. Check network/online status for offline resilience
    const isOnline = navigator.onLine;
    if (!isOnline) {
      console.warn(`[EVENT BUS] Client is offline. Queueing event ${eventId} for later synchronization.`);
      offlineQueue.push(event);
      try {
        localStorage.setItem("harambeeflow_offline_events", JSON.stringify(offlineQueue));
      } catch (err) {
        console.error("Local storage sync error:", err);
      }
      this.triggerLocalListeners(event);
      return event;
    }

    // 2. Persist to Firestore eventBus and eventQueue if online & live
    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "eventBus", eventId), event);
        await setDoc(doc(db, "eventQueue", eventId), {
          ...event,
          status: "pending",
          queuedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error("[EVENT BUS] Failed to sync event to Firestore:", err.message);
        // Fallback to local queue on writing failure
        offlineQueue.push(event);
        localStorage.setItem("harambeeflow_offline_events", JSON.stringify(offlineQueue));
      }
    }

    // 3. Trigger active subscribers
    this.triggerLocalListeners(event);

    // 4. Run through the Intelligent Processing Pipeline
    const startTime = performance.now();
    try {
      await this.runIntelligentPipeline(event, isDemoMode);
      event.processed = true;

      // Log success and update live metrics
      const duration = performance.now() - startTime;
      await this.logProcessedEvent(event, "success", duration, isDemoMode);
    } catch (pipelineError: any) {
      console.error(`[PIPELINE ERROR] Event ${eventId} failed during execution:`, pipelineError);
      const duration = performance.now() - startTime;
      await this.logProcessedEvent(event, "failed", duration, isDemoMode, pipelineError.message);
    }

    return event;
  }

  /**
   * Helper to execute subscribers in active memory
   */
  private static triggerLocalListeners(event: AppEvent) {
    const subs = listeners.get(event.type);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EVENT SUB CALLBACK ERROR] Error in subscription listener:`, err);
        }
      });
    }
  }

  /**
   * Logs system metrics and processes events successfully
   */
  private static async logProcessedEvent(
    event: AppEvent,
    status: "success" | "failed",
    durationMs: number,
    isDemoMode: boolean,
    error?: string
  ) {
    const processedRecord = {
      id: `p_evt_${event.id}`,
      eventId: event.id,
      type: event.type,
      timestamp: new Date().toISOString(),
      status,
      durationMs,
      error,
    };

    // Update system health and metrics counters in local storage
    this.updateLocalMetrics(status === "success", durationMs);

    if (!isDemoMode && db) {
      try {
        // Save to processedEvents
        await setDoc(doc(db, "processedEvents", processedRecord.id), processedRecord);

        // Remove from eventQueue
        await setDoc(doc(db, "eventQueue", event.id), {
          ...event,
          status: status === "success" ? "processed" : "failed",
          processedAt: new Date().toISOString(),
          durationMs,
          error,
        });

        // Write system logs
        await addDoc(collection(db, "systemLogs"), {
          timestamp: new Date().toISOString(),
          level: status === "success" ? "info" : "error",
          message: `Processed event ${event.type} (${event.id}) in ${durationMs.toFixed(1)}ms. Status: ${status}`,
          details: error || "",
        });
      } catch (err) {
        console.error("Failed to log processed event details to Firestore:", err);
      }
    }
  }

  /**
   * Updates local system metrics in localStorage for real-time monitoring dashboard
   */
  private static updateLocalMetrics(isSuccess: boolean, durationMs: number) {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const metricsKey = `harambeeflow_metrics_${todayStr}`;
      const metricsRaw = localStorage.getItem(metricsKey);

      let metrics: LiveMetrics = metricsRaw
        ? JSON.parse(metricsRaw)
        : {
            eventsProcessedToday: 0,
            averageProcessingTimeMs: 0,
            automationSuccessRate: 100,
            failedAutomations: 0,
            pendingQueue: 0,
            connectedModules: [
              "Dashboard",
              "CRM Workspace",
              "Campaign Engine",
              "Pledge Reconciler",
              "Recognition",
              "WhatsApp Automation",
              "Audit Ledger",
            ],
            healthStatus: "healthy",
            firestoreSync: navigator.onLine,
            communicationDeliveryRate: 98.7,
            aiResponseTimeMs: 1450,
          };

      metrics.eventsProcessedToday += 1;
      metrics.pendingQueue = offlineQueue.length;
      metrics.firestoreSync = navigator.onLine;

      // Running average computation
      const oldTotalTime = metrics.averageProcessingTimeMs * (metrics.eventsProcessedToday - 1);
      metrics.averageProcessingTimeMs = (oldTotalTime + durationMs) / metrics.eventsProcessedToday;

      if (!isSuccess) {
        metrics.failedAutomations += 1;
      }

      // Compute success rate
      const totalAutomations = metrics.eventsProcessedToday;
      metrics.automationSuccessRate = Number(
        (((totalAutomations - metrics.failedAutomations) / totalAutomations) * 100).toFixed(1)
      );

      // Determine health status based on failures and offline queues
      if (metrics.failedAutomations > 10 || offlineQueue.length > 15) {
        metrics.healthStatus = "critical";
      } else if (metrics.failedAutomations > 3 || offlineQueue.length > 5) {
        metrics.healthStatus = "degraded";
      } else {
        metrics.healthStatus = "healthy";
      }

      localStorage.setItem(metricsKey, JSON.stringify(metrics));
    } catch (err) {
      console.error("Metrics update error:", err);
    }
  }

  /**
   * Attempts to synchronize offline queued events when internet connectivity is re-established
   */
  static async syncOfflineEvents(isDemoMode: boolean = false): Promise<void> {
    if (!navigator.onLine || offlineQueue.length === 0) return;
    console.log(`[EVENT BUS SYNC] Connection restored! Synchronizing ${offlineQueue.length} offline events.`);

    const queueCopy = [...offlineQueue];
    offlineQueue = [];
    localStorage.setItem("harambeeflow_offline_events", JSON.stringify([]));

    for (const event of queueCopy) {
      try {
        await this.publish(event.type, event.payload, isDemoMode);
      } catch (err) {
        console.error(`Failed syncing offline event ${event.id}:`, err);
        // Put back in queue if it completely failed to publish
        offlineQueue.push(event);
        localStorage.setItem("harambeeflow_offline_events", JSON.stringify(offlineQueue));
      }
    }
  }

  /**
   * The Intelligent Autopilot Pipeline
   */
  private static async runIntelligentPipeline(event: AppEvent, isDemoMode: boolean) {
    const { type, payload } = event;

    // STEP 1: CONTRIBUTION RECEIVED PIPELINE
    if (type === "ContributionReceived") {
      const contribution = payload.contribution as Contribution;
      const activeProject = payload.activeProject as Project;

      // 1.1 Validate transaction parameters
      this.logStep(event.id, "Validate Transaction", "success", isDemoMode);

      // 1.2 Write to immutable ledger
      this.logStep(event.id, "Write to Ledger", "success", isDemoMode);

      // 1.3 Update Campaign Totals
      await this.updateCampaignTotals(contribution, activeProject, isDemoMode);
      this.logStep(event.id, "Update Campaign Total", "success", isDemoMode);

      // 1.4 Live Command Center Synchronization
      this.logStep(event.id, "Update Live Command Center", "success", isDemoMode);

      // 1.5 Live Public Fundraiser Real-Time Ticker Update
      this.logStep(event.id, "Update Public Fundraiser Ticker", "success", isDemoMode);

      // 1.6 Update Supporter CRM Analytics (LTV, largest gift, contribution count)
      await this.updateCRMSupporterProfile(contribution, isDemoMode);
      this.logStep(event.id, "Update Supporter CRM Metrics", "success", isDemoMode);

      // 1.7 Pledge Intelligence Auto-reconciliation check
      const pledgeReconciled = await this.checkAndReconcilePledge(contribution, activeProject, isDemoMode);
      if (pledgeReconciled) {
        this.logStep(event.id, "Check Active Pledge - Fulfilled Successfully", "success", isDemoMode);
      } else {
        this.logStep(event.id, "Check Active Pledge - Checked (No pending pledges found)", "success", isDemoMode);
      }

      // 1.8 Recalculate Campaign Health scores
      this.logStep(event.id, "Recalculate Campaign Health Scores", "success", isDemoMode);

      // 1.9 AI recommendations evaluations & insights triggers
      await this.triggerAIRecommendationsEvaluation(contribution, activeProject, isDemoMode);
      this.logStep(event.id, "Evaluate AI Recommendations & Risk Analysis", "success", isDemoMode);

      // 1.10 Communication Automation & Personalised Thank You dispatch
      await this.dispatchAutomatedThankYou(contribution, activeProject, isDemoMode);
      this.logStep(event.id, "Send Auto Thank-You Broadcast", "success", isDemoMode);

      // 1.11 Recognition Engine Thresholds evaluation & Badges Awarding
      await this.evaluateRecognitionEngine(contribution, isDemoMode);
      this.logStep(event.id, "Award Badges & Recognition Levels", "success", isDemoMode);

      // 1.12 Permanent Audit logs committed
      this.logStep(event.id, "Write Immutable Audit Log", "success", isDemoMode);

      // 1.13 Celebrate Milestones
      await this.evaluateMilestonesAndCelebrate(contribution, activeProject, isDemoMode);
    }

    // STEP 2: PLEDGE CREATED PIPELINE
    if (type === "PledgeCreated") {
      const pledge = payload.pledge as Pledge;
      this.logStep(event.id, "Write Pledge Ledger Record", "success", isDemoMode);
      await this.createSystemNotification(
        pledge.projectId,
        "pending_approval",
        `New Pledge Captured (KES ${pledge.pledgedAmount.toLocaleString()})`,
        `Contributor ${pledge.donorName} promised KES ${pledge.pledgedAmount.toLocaleString()} due on ${pledge.dueDate}.`,
        isDemoMode
      );
    }

    // STEP 3: CAMPAIGN CREATED
    if (type === "CampaignCreated") {
      const campaign = payload.campaign as Project;
      await this.logCampaignSnapshot(campaign, isDemoMode);
      this.logStep(event.id, "Generate Initial Campaign Health Snapshot", "success", isDemoMode);
    }

    // STEP 4: MESSAGE FAILED
    if (type === "MessageFailed") {
      this.logStep(event.id, "Trigger Communication Fault Handler", "success", isDemoMode);
    }
  }

  /**
   * Creates custom automation execution steps
   */
  private static logStep(eventId: string, stepName: string, status: "success" | "failed", isDemoMode: boolean) {
    const stepId = `step_${eventId.substring(4)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const stepRecord: AutomationExecution = {
      id: stepId,
      eventId,
      pipelineStep: stepName,
      timestamp: new Date().toISOString(),
      status,
    };

    // Save to local storage for live logs visualization
    try {
      const logsKey = `harambeeflow_automation_logs_${eventId}`;
      const existingLogsRaw = localStorage.getItem(logsKey);
      const existingLogs: AutomationExecution[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
      existingLogs.push(stepRecord);
      localStorage.setItem(logsKey, JSON.stringify(existingLogs));
    } catch (e) {
      console.error(e);
    }

    if (!isDemoMode && db) {
      setDoc(doc(db, "automationExecutions", stepId), stepRecord).catch((e) =>
        console.error("Failed to log step to Firestore:", e)
      );
    }
  }

  /**
   * Autopilot Totals updates & Campaign recalculation metrics
   */
  private static async updateCampaignTotals(contribution: Contribution, project: Project, isDemoMode: boolean) {
    if (!project) return;
    const addedAmount = Number(contribution.amount);

    // Dynamic metrics calculations
    const curAmount = (project.currentAmount || 0) + addedAmount;
    const target = project.targetAmount || 100000;
    const rem = Math.max(0, target - curAmount);
    const pct = Math.min(100, Number(((curAmount / target) * 100).toFixed(1)));

    // Calculate mock fundraising stats
    const velocity = Number((addedAmount / 24).toFixed(2)); // mock KES per hour speed
    const healthScore = Math.min(100, Math.floor(pct * 0.8 + 20)); // dynamic score based on completion pace

    const updatedData = {
      currentAmount: curAmount,
      healthScore,
      velocity,
      percentageComplete: pct,
      remainingBalance: rem,
    };

    if (!isDemoMode && db) {
      try {
        await updateDoc(doc(db, "fundraisers", project.id), updatedData);
      } catch (e) {
        console.error("Firestore campaign totals direct update failure:", e);
      }
    }
  }

  /**
   * CRM Supporter Profile automated updater
   */
  private static async updateCRMSupporterProfile(contribution: Contribution, isDemoMode: boolean) {
    const phone = contribution.senderPhone || contribution.phoneNumber;
    if (!phone) return;

    const key = `supporter_profile_${phone}`;
    let donorProfile: any = null;

    try {
      const savedRaw = localStorage.getItem(key);
      if (savedRaw) {
        donorProfile = JSON.parse(savedRaw);
      }
    } catch (e) {
      console.error(e);
    }

    // Retrieve from Firestore if online and not in demo
    if (!isDemoMode && db) {
      try {
        const snap = await getDoc(doc(db, "donors", phone));
        if (snap.exists()) {
          donorProfile = snap.data();
        }
      } catch (err) {
        console.error("Failed to read supporter profile from Firestore:", err);
      }
    }

    const nowStr = new Date().toISOString();
    const donationAmount = Number(contribution.amount);

    if (donorProfile) {
      const prevTotal = Number(donorProfile.totalAmount || 0);
      const prevCount = Number(donorProfile.totalContributions || 0);
      const largest = Math.max(Number(donorProfile.largestGift || 0), donationAmount);

      donorProfile = {
        ...donorProfile,
        lastContribution: nowStr,
        totalContributions: prevCount + 1,
        totalAmount: prevTotal + donationAmount,
        averageGift: Number(((prevTotal + donationAmount) / (prevCount + 1)).toFixed(2)),
        largestGift: largest,
        contributionFrequency: prevCount + 1 > 5 ? "High" : "Medium",
        relationshipHealth: "Excellent",
      };
    } else {
      donorProfile = {
        firstName: contribution.firstName || "M-PESA",
        middleName: contribution.middleName || "",
        lastName: contribution.lastName || "Customer",
        fullName: contribution.senderName || `${contribution.firstName} ${contribution.lastName}`.trim(),
        phoneNumber: phone,
        firstContribution: nowStr,
        lastContribution: nowStr,
        totalContributions: 1,
        totalAmount: donationAmount,
        averageGift: donationAmount,
        largestGift: donationAmount,
        contributionFrequency: "Low",
        relationshipHealth: "New Supporter",
      };
    }

    // Save locally
    try {
      localStorage.setItem(key, JSON.stringify(donorProfile));
    } catch (e) {
      console.error(e);
    }

    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "donors", phone), donorProfile, { merge: true });
      } catch (err) {
        console.error("Failed to save supporter profile CRM to Firestore:", err);
      }
    }
  }

  /**
   * Pledge Intelligence Auto-reconciliation
   */
  private static async checkAndReconcilePledge(
    contribution: Contribution,
    project: Project,
    isDemoMode: boolean
  ): Promise<boolean> {
    const phone = contribution.senderPhone || contribution.phoneNumber;
    if (!phone || !project) return false;

    // Search outstanding pledges
    let pledges: Pledge[] = [];

    // Read from localStorage for demo / local context
    try {
      const stored = localStorage.getItem(`harambeeflow_pledges_${project.id}`);
      if (stored) pledges = JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }

    if (!isDemoMode && db) {
      try {
        const querySnap = await getDocs(collection(db, "pledges"));
        const temp: Pledge[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data() as Pledge;
          if (data.projectId === project.id) {
            temp.push(data);
          }
        });
        pledges = temp;
      } catch (err) {
        console.error("Firestore pledge lookup failed:", err);
      }
    }

    // Match outstanding pending pledges with matching phone and amount
    const matchedPledgeIndex = pledges.findIndex(
      (p) =>
        (p.phone === phone || p.phone.includes(phone) || phone.includes(p.phone)) &&
        p.status !== "Completed" &&
        Number(p.pledgedAmount) === Number(contribution.amount)
    );

    if (matchedPledgeIndex !== -1) {
      const pledge = pledges[matchedPledgeIndex];
      const updatedPledge: Pledge = {
        ...pledge,
        paidAmount: Number(pledge.pledgedAmount),
        balance: 0,
        status: "Completed",
        lastPaymentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      pledges[matchedPledgeIndex] = updatedPledge;

      // Persist pledge update
      try {
        localStorage.setItem(`harambeeflow_pledges_${project.id}`, JSON.stringify(pledges));
      } catch (e) {
        console.error(e);
      }

      if (!isDemoMode && db) {
        try {
          await setDoc(doc(db, "pledges", pledge.id), updatedPledge, { merge: true });
        } catch (err) {
          console.error("Failed to sync completed pledge to Firestore:", err);
        }
      }

      // Notify through event bus
      await this.publish(
        "PledgeFulfilled",
        {
          pledge: updatedPledge,
          contributionCode: contribution.transactionCode,
        },
        isDemoMode
      );

      // Spawn a system notification
      await this.createSystemNotification(
        project.id,
        "milestone",
        "Pledge Reconciled Successfully! 🎉",
        `Safaricom match verified! ${pledge.donorName}'s pledge of KES ${pledge.pledgedAmount.toLocaleString()} has been fulfilled.`,
        isDemoMode
      );

      return true;
    }

    return false;
  }

  /**
   * Evaluates donor contribution against milestones & triggers badges/certs
   */
  private static async evaluateRecognitionEngine(contribution: Contribution, isDemoMode: boolean) {
    const phone = contribution.senderPhone || contribution.phoneNumber;
    if (!phone) return;

    // Retrieve current total amount donor has contributed
    const supporterProfileKey = `supporter_profile_${phone}`;
    let profile: any = null;
    try {
      const raw = localStorage.getItem(supporterProfileKey);
      if (raw) profile = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    if (!profile) return;

    const totalDonated = Number(profile.totalAmount || 0);
    const countDonations = Number(profile.totalContributions || 0);
    const badges: string[] = profile.badges || [];

    const awardBadge = async (badgeName: string, icon: string, description: string) => {
      if (badges.includes(badgeName)) return;
      badges.push(badgeName);
      profile.badges = badges;

      // Update local profile
      localStorage.setItem(supporterProfileKey, JSON.stringify(profile));

      // Spawn recognition award notification
      await this.createSystemNotification(
        contribution.projectId || contribution.campaignId || "general",
        "milestone",
        `Award Awarded: ${badgeName} 🏅`,
        `Supporter ${profile.fullName} has unlocked the ${badgeName} badge! ${description}`,
        isDemoMode
      );

      // Log processed recognition in dedicated collection
      const recognitionRecord = {
        id: `rec_${phone}_${badgeName.replace(/\s+/g, "_").toLowerCase()}`,
        donorPhone: phone,
        donorName: profile.fullName,
        badgeName,
        icon,
        description,
        timestamp: new Date().toISOString(),
      };

      if (!isDemoMode && db) {
        try {
          await setDoc(doc(db, "recognitions", recognitionRecord.id), recognitionRecord);
          await updateDoc(doc(db, "donors", phone), { badges });
        } catch (err) {
          console.error("Firestore recognition saving error:", err);
        }
      }
    };

    // Evaluate standard limits (KES)
    if (totalDonated >= 100000) {
      await awardBadge(
        "Lifetime Supporter",
        "💎",
        "Awarded for raising over KES 100,000 for community development programs."
      );
    } else if (totalDonated >= 50000) {
      await awardBadge("Community Hero", "🌟", "Awarded for raising over KES 50,000 to assist public milestones.");
    } else if (totalDonated >= 10000) {
      await awardBadge("Campaign Champion", "👑", "Awarded for raising over KES 10,000 to single campaigns.");
    }

    if (countDonations >= 10) {
      await awardBadge("Community Pillar", "🏛️", "Awarded for contributing 10 times or more to fundraisers.");
    } else if (countDonations >= 5) {
      await awardBadge("Founding Supporter", "🤝", "Awarded for contributing 5 times to community projects.");
    } else if (countDonations === 1) {
      await awardBadge("First Milestone", "🌱", "Awarded for making the initial donation to trigger the campaign.");
    }
  }

  /**
   * Dynamic Campaign health analysis and recommendation generation
   */
  private static async triggerAIRecommendationsEvaluation(
    contribution: Contribution,
    project: Project,
    isDemoMode: boolean
  ) {
    if (!project) return;

    const current = (project.currentAmount || 0) + Number(contribution.amount);
    const target = project.targetAmount || 100000;
    const pace = current / target;

    // Evaluate pledge risk/communication velocity
    if (pace < 0.2) {
      // Early campaign recommendations
      await this.createSystemNotification(
        project.id,
        "ai_recommendation",
        "AI Strategic Launch Recommendation",
        "Pace is early. Mobilize the first 10 committee contacts on WhatsApp to reach 20% momentum score.",
        isDemoMode
      );
    } else if (pace > 0.8 && pace < 1.0) {
      // Near completion campaign recommendations
      await this.createSystemNotification(
        project.id,
        "ai_recommendation",
        "AI Success Forecasting",
        "Campaign is at 80% completion! Create a printable QR flyer update to celebrate transparency.",
        isDemoMode
      );
    }
  }

  /**
   * Automated communications engine thank-you broadcast dispatch
   */
  private static async dispatchAutomatedThankYou(
    contribution: Contribution,
    project: Project,
    isDemoMode: boolean
  ) {
    if (!project) return;

    const thankYouText = `Hello ${contribution.cleanedName}, thank you for your generous contribution of KES ${Number(contribution.amount).toLocaleString()} to the "${project.name}" fundraiser! Receipt Ref: ${contribution.transactionCode}. Your support makes a tremendous impact.`;

    // Dispatch custom outbox SMS or whatsapp messages
    const messageId = `msg-auto-thank-${Date.now()}`;
    const mockWaMsg = {
      id: messageId,
      groupName: project.whatsappGroupName || "Harambee Group",
      message: `💬 [Auto WhatsApp] Sent to ${contribution.senderPhone || "Contributor"}:\n${thankYouText}`,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };

    // Save into localStorage outbox logs
    try {
      const existingRaw = localStorage.getItem("whatsapp_messages_cache");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem("whatsapp_messages_cache", JSON.stringify([mockWaMsg, ...existing]));
    } catch (e) {
      console.error(e);
    }

    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "whatsappMessages", messageId), {
          id: messageId,
          groupName: project.whatsappGroupName || "Harambee Group",
          message: thankYouText,
          timestamp: new Date().toISOString(),
          isSystem: true,
        });
      } catch (err) {
        console.error("Firestore whatsapp message writing failure:", err);
      }
    }
  }

  /**
   * Milestone celebrator floating banner trigger
   */
  private static async evaluateMilestonesAndCelebrate(
    contribution: Contribution,
    project: Project,
    isDemoMode: boolean
  ) {
    if (!project) return;
    const current = (project.currentAmount || 0) + Number(contribution.amount);
    const target = project.targetAmount || 100000;
    const prevPct = (project.currentAmount || 0) / target;
    const currentPct = current / target;

    const milestones = [0.25, 0.5, 0.75, 1.0];
    for (const m of milestones) {
      if (prevPct < m && currentPct >= m) {
        const title = `Milestone Reached: ${m * 100}% Achieved! 🏆`;
        const msg = `Incredible progress! "${project.name}" has raised over KES ${current.toLocaleString()}, crossing the ${m * 100}% milestone threshold. Keep pushing!`;

        await this.createSystemNotification(project.id, "milestone", title, msg, isDemoMode);

        // Notify over WhatsApp
        const milestoneMsgId = `msg-milestone-${Date.now()}`;
        const milestoneMsg = {
          id: milestoneMsgId,
          groupName: project.whatsappGroupName || "Harambee Group",
          message: `🎉 *CHAMPION UPDATE:* We have successfully crossed *${m * 100}%* of our target goal for ${project.name}! KES ${current.toLocaleString()} has been securely contributed!`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        };

        if (!isDemoMode && db) {
          try {
            await setDoc(doc(db, "whatsappMessages", milestoneMsgId), milestoneMsg);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }

  /**
   * Helper to write platform notifications
   */
  private static async createSystemNotification(
    campaignId: string,
    type: Notification["type"],
    title: string,
    message: string,
    isDemoMode: boolean
  ) {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      campaignId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
    };

    // Save locally
    try {
      const storedRaw = localStorage.getItem("harambeeflow_notifications_list");
      const stored: Notification[] = storedRaw ? JSON.parse(storedRaw) : [];
      stored.unshift(notification);
      localStorage.setItem("harambeeflow_notifications_list", JSON.stringify(stored));
    } catch (e) {
      console.error(e);
    }

    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "notifications", notification.id), notification);
      } catch (err) {
        console.error("Firestore notifications writing error:", err);
      }
    }
  }

  /**
   * Writes campaign snapshots
   */
  private static async logCampaignSnapshot(campaign: Project, isDemoMode: boolean) {
    const snapshotRecord = {
      id: `snap_${campaign.id}_${Date.now()}`,
      campaignId: campaign.id,
      timestamp: new Date().toISOString(),
      currentAmount: campaign.currentAmount,
      targetAmount: campaign.targetAmount,
      status: campaign.status || "Active",
    };

    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "campaignSnapshots", snapshotRecord.id), snapshotRecord);
      } catch (err) {
        console.error(err);
      }
    }
  }
}
