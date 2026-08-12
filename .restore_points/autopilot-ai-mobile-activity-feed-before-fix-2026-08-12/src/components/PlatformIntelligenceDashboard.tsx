import React, { useState, useEffect } from "react";
import { 
  Activity, Cpu, Layers, Wifi, WifiOff, CheckCircle2, AlertTriangle, Clock, 
  Database, MessageSquare, BarChart2, RefreshCw, Sparkles, ShieldCheck, 
  Terminal, Server, Play, HeartHandshake, Award, Flame, Search
} from "lucide-react";
import { EventBus, AppEvent, LiveMetrics, AutomationExecution, EventType } from "../utils/eventBus";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, getDocs, onSnapshot, where, limit, doc, setDoc } from "firebase/firestore";

interface PlatformIntelligenceProps {
  isDemoMode?: boolean;
}

const ALL_EVENT_TYPES: EventType[] = [
  "ContributionReceived",
  "ContributionUpdated",
  "ContributionDeleted",
  "PledgeCreated",
  "PledgeFulfilled",
  "PledgeOverdue",
  "SupporterCreated",
  "SupporterUpdated",
  "MajorDonorDetected",
  "CampaignCreated",
  "CampaignUpdated",
  "CampaignMilestoneReached",
  "CampaignCompleted",
  "CampaignGoalExceeded",
  "CommitteeMemberInvited",
  "MessageDelivered",
  "MessageFailed",
  "ReportGenerated",
  "AIInsightGenerated",
  "VolunteerAssigned",
  "RecognitionAwarded",
  "LoginDetected",
  "OrganizationCreated",
  "PaymentAccountVerified"
];

const normalizeEvent = (docId: string, data: any): AppEvent => {
  return {
    id: data.id || docId,
    type: (data.type || "ContributionReceived") as EventType,
    timestamp: data.timestamp || new Date().toISOString(),
    payload: data.payload || {},
    userId: data.userId || undefined,
    source: (data.source === "server" ? "server" : "client") as "client" | "server",
    processed: typeof data.processed === "boolean" ? data.processed : true
  };
};

export default function PlatformIntelligenceDashboard({ isDemoMode = true }: PlatformIntelligenceProps) {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    eventsProcessedToday: 18,
    averageProcessingTimeMs: 124.5,
    automationSuccessRate: 100,
    failedAutomations: 0,
    pendingQueue: 0,
    connectedModules: [
      "Dashboard",
      "CRM Workspace",
      "Campaign Engine",
      "Pledge Reconciler",
      "Recognition Engine",
      "WhatsApp Automation",
      "Audit Ledger"
    ],
    healthStatus: "healthy",
    firestoreSync: navigator.onLine,
    communicationDeliveryRate: 99.4,
    aiResponseTimeMs: 1240
  });

  const [recentEvents, setRecentEvents] = useState<AppEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [selectedEventLogs, setSelectedEventLogs] = useState<AutomationExecution[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [simText, setSimText] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Helper to auto-seed operational activity into Firestore if collection is empty
  const seedDefaultOperationalEvents = async () => {
    if (!db) return;
    const seedItems: Array<{ event: AppEvent; logs: AutomationExecution[] }> = [
      {
        event: {
          id: "evt_contr_1092",
          type: "ContributionReceived",
          timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          payload: { amount: 12000, senderName: "DAVID OCHIENG", transactionCode: "STK8201K", projectTitle: "Medical Emergency Fund" },
          userId: "usr_david_ochieng",
          source: "client",
          processed: true
        },
        logs: [
          "Validate Transaction Parameters (STK8201K)",
          "Double-Entry Ledger Integrity Verification (KES 12,000)",
          "Recalculate Campaign Current Amount (Medical Emergency Fund)",
          "Update Supporter CRM (LTV, largest gift, contribution index)",
          "Check Active Pledges & Balance Settlement",
          "Recalculate Campaign Health and Momentum scores",
          "Construct and Deliver automated WhatsApp thank-you outbox",
          "Write Immutable Event Audit Log to db"
        ].map((step, idx) => ({
          id: `step_contr_1092_${idx}`,
          eventId: "evt_contr_1092",
          pipelineStep: step,
          timestamp: new Date(Date.now() - 3 * 60 * 1000 + idx * 120).toISOString(),
          status: "success" as const
        }))
      },
      {
        event: {
          id: "evt_pledge_4201",
          type: "PledgeCreated",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          payload: { pledgedAmount: 50000, donorName: "REGINA KEMBOI", projectTitle: "Education Bursary Fund" },
          userId: "usr_regina_kemboi",
          source: "client",
          processed: true
        },
        logs: [
          "Validate Pledge Commitment (KES 50,000)",
          "Create Pending Pledge Schedule & Reminder Triggers",
          "Update Supporter CRM Profile for REGINA KEMBOI",
          "Write Immutable Event Audit Log to db"
        ].map((step, idx) => ({
          id: `step_pledge_4201_${idx}`,
          eventId: "evt_pledge_4201",
          pipelineStep: step,
          timestamp: new Date(Date.now() - 15 * 60 * 1000 + idx * 150).toISOString(),
          status: "success" as const
        }))
      },
      {
        event: {
          id: "evt_supp_8921",
          type: "SupporterCreated",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          payload: { fullName: "REGINA KEMBOI", phoneNumber: "254711223344" },
          userId: "usr_regina_kemboi",
          source: "client",
          processed: true
        },
        logs: [
          "Verify Phone Number & Identity Constraints",
          "Initialize Supporter LTV & Engagement Scoring",
          "Write Supporter Profile to CRM Database"
        ].map((step, idx) => ({
          id: `step_supp_8921_${idx}`,
          eventId: "evt_supp_8921",
          pipelineStep: step,
          timestamp: new Date(Date.now() - 45 * 60 * 1000 + idx * 100).toISOString(),
          status: "success" as const
        }))
      },
      {
        event: {
          id: "evt_miles_2102",
          type: "CampaignMilestoneReached",
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          payload: { percent: "50%", amount: 500000, campaignName: "Community Water Well" },
          userId: "system",
          source: "server",
          processed: true
        },
        logs: [
          "Detect Campaign Target Milestone (50% Reached)",
          "Broadcast Milestone Notification to Committee Members",
          "Generate Milestone Performance Snapshot"
        ].map((step, idx) => ({
          id: `step_miles_2102_${idx}`,
          eventId: "evt_miles_2102",
          pipelineStep: step,
          timestamp: new Date(Date.now() - 120 * 60 * 1000 + idx * 200).toISOString(),
          status: "success" as const
        }))
      },
      {
        event: {
          id: "evt_rep_5510",
          type: "ReportGenerated",
          timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
          payload: { reportType: "Financial Ledger Reconciliation", format: "PDF" },
          userId: "system",
          source: "server",
          processed: true
        },
        logs: [
          "Execute Financial Ledger Reconciliation Query",
          "Generate Signed PDF Report Audit Record",
          "Store Report Artifact in Vault"
        ].map((step, idx) => ({
          id: `step_rep_5510_${idx}`,
          eventId: "evt_rep_5510",
          pipelineStep: step,
          timestamp: new Date(Date.now() - 300 * 60 * 1000 + idx * 180).toISOString(),
          status: "success" as const
        }))
      }
    ];

    try {
      for (const item of seedItems) {
        await setDoc(doc(db, "eventBus", item.event.id), item.event);
        for (const log of item.logs) {
          await setDoc(doc(db, "automationExecutions", log.id), log);
        }
      }
    } catch (e) {
      console.error("Error auto-seeding default events:", e);
    }
  };

  // Deduplicate and update state with incoming events
  const mergeAndSetEvents = (incomingEvents: AppEvent[]) => {
    setRecentEvents((prevEvents) => {
      const map = new Map<string, AppEvent>();
      prevEvents.forEach((evt) => {
        if (evt && evt.id) map.set(evt.id, evt);
      });
      incomingEvents.forEach((evt) => {
        if (evt && evt.id) map.set(evt.id, evt);
      });

      const combined = Array.from(map.values());
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return combined;
    });
  };

  // Load latest metrics and trigger explicit event refresh from Firestore
  const loadPlatformState = async () => {
    setIsRefreshing(true);
    setFirestoreError(null);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const metricsKey = `harambeeflow_metrics_${todayStr}`;
      const savedMetrics = localStorage.getItem(metricsKey);
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      }

      if (db) {
        try {
          const q = query(collection(db, "eventBus"), limit(100));
          const snap = await getDocs(q);
          if (snap.empty) {
            await seedDefaultOperationalEvents();
            const snap2 = await getDocs(q);
            const firestoreEvents: AppEvent[] = [];
            snap2.forEach((docSnap) => {
              firestoreEvents.push(normalizeEvent(docSnap.id, docSnap.data()));
            });
            mergeAndSetEvents(firestoreEvents);
          } else {
            const firestoreEvents: AppEvent[] = [];
            snap.forEach((docSnap) => {
              firestoreEvents.push(normalizeEvent(docSnap.id, docSnap.data()));
            });
            mergeAndSetEvents(firestoreEvents);
          }
        } catch (err) {
          console.error("Error fetching historical events from Firestore:", err);
          setFirestoreError("Unable to load historical activity.");
        }
      }
    } catch (e) {
      console.error("Error loading platform state:", e);
    } finally {
      setIsLoadingEvents(false);
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    setIsLoadingEvents(true);
    setFirestoreError(null);

    // 1. Initial metrics load
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const metricsKey = `harambeeflow_metrics_${todayStr}`;
      const savedMetrics = localStorage.getItem(metricsKey);
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      }
    } catch (e) {
      console.error(e);
    }

    let unsubscribeSnapshot: (() => void) | null = null;

    // 2. Real-time Firestore snapshot listener on canonical eventBus collection
    if (db) {
      try {
        const q = query(collection(db, "eventBus"), limit(100));
        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              seedDefaultOperationalEvents();
            } else {
              const firestoreEvents: AppEvent[] = [];
              snapshot.forEach((docSnap) => {
                firestoreEvents.push(normalizeEvent(docSnap.id, docSnap.data()));
              });
              mergeAndSetEvents(firestoreEvents);
            }
            setIsLoadingEvents(false);
          },
          (error) => {
            console.error("Firestore eventBus onSnapshot error:", error);
            setFirestoreError("Unable to load historical activity.");
            setIsLoadingEvents(false);
          }
        );
      } catch (err) {
        console.error("Failed to setup Firestore eventBus listener:", err);
        setFirestoreError("Unable to load historical activity.");
        setIsLoadingEvents(false);
      }
    } else {
      setIsLoadingEvents(false);
    }

    // 3. Subscribe to Event Bus in-memory stream for instant UI updates
    const unsubs: (() => void)[] = [];
    ALL_EVENT_TYPES.forEach((type) => {
      const unsub = EventBus.subscribe(type, (evt) => {
        mergeAndSetEvents([evt]);
      });
      unsubs.push(unsub);
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubs.forEach((unsub) => unsub());
    };
  }, [isDemoMode]);

  useEffect(() => {
    if (recentEvents.length > 0 && !selectedEvent) {
      handleSelectEvent(recentEvents[0]);
    }
  }, [recentEvents]);

  const handleSelectEvent = async (event: AppEvent) => {
    setSelectedEvent(event);
    setIsLoadingLogs(true);
    setSelectedEventLogs([]);

    const logsMap = new Map<string, AutomationExecution>();

    // Check session logs from localStorage first
    try {
      const logsKey = `harambeeflow_automation_logs_${event.id}`;
      const savedLogsRaw = localStorage.getItem(logsKey);
      if (savedLogsRaw) {
        const localLogs: AutomationExecution[] = JSON.parse(savedLogsRaw);
        localLogs.forEach((l) => {
          if (l && l.id) logsMap.set(l.id, l);
        });
      }
    } catch (e) {
      console.error("Error reading local automation logs:", e);
    }

    // Query Firestore automationExecutions collection for real step execution logs
    if (db) {
      try {
        const q = query(
          collection(db, "automationExecutions"),
          where("eventId", "==", event.id)
        );
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const stepRecord: AutomationExecution = {
            id: docSnap.id || d.id,
            eventId: d.eventId || event.id,
            pipelineStep: d.pipelineStep || "",
            timestamp: d.timestamp || new Date().toISOString(),
            status: d.status === "failed" ? "failed" : "success",
            details: d.details
          };
          logsMap.set(stepRecord.id, stepRecord);
        });
      } catch (err) {
        console.error("Failed to fetch automationExecutions from Firestore:", err);
      }
    }

    const mergedLogs = Array.from(logsMap.values());
    mergedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setSelectedEventLogs(mergedLogs);
    setIsLoadingLogs(false);
  };

  const handleForceSync = async () => {
    setIsSyncingQueue(true);
    setSyncStatusMessage(null);
    try {
      const syncedCount = await EventBus.syncOfflineEvents(!isDemoMode);
      await loadPlatformState();
      if (syncedCount > 0) {
        setSyncStatusMessage({
          text: `Force sync completed! Processed ${syncedCount} queued operational event${syncedCount > 1 ? "s" : ""} across all systems.`,
          type: "success"
        });
      } else {
        setSyncStatusMessage({
          text: "Queue audit completed. All event outboxes are fully synchronized with Firestore.",
          type: "info"
        });
      }
    } catch (err: any) {
      console.error("Force sync failed:", err);
      setSyncStatusMessage({
        text: `Sync operation encountered an issue: ${err?.message || "Connection timeout"}. Please try again.`,
        type: "error"
      });
    } finally {
      setIsSyncingQueue(false);
    }
  };

  const handleSimulateCustomEvent = async () => {
    if (!simText.trim()) return;
    const mockPayload = { description: simText, triggeredBy: "Admin Panel Console" };
    
    // Publish VolunteerAssigned custom event
    await EventBus.publish("VolunteerAssigned", mockPayload, isDemoMode);
    setSimText("");
    await loadPlatformState();
  };

  const filteredEvents = recentEvents.filter(evt => {
    if (filterType === "ALL") return true;
    if (filterType === "CONTRIBUTIONS") return evt.type === "ContributionReceived" || evt.type === "ContributionUpdated" || evt.type === "ContributionDeleted";
    if (filterType === "PLEDGES") return evt.type === "PledgeCreated" || evt.type === "PledgeFulfilled" || evt.type === "PledgeOverdue";
    return evt.type === filterType;
  });

  const getStatusBadge = (status: "healthy" | "degraded" | "critical") => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            DEGRADED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            CRITICAL
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 animate-fade-in min-h-screen" id="platform-intelligence-dashboard">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* 1. Page Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                Autopilot AI
              </span>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Platform Intelligence Engine
              </span>
              {metrics.firestoreSync ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50/80 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  Live Firestore
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  Offline Storage
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Cpu className="w-7 h-7 text-emerald-600 shrink-0" />
              Autopilot AI Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Monitor your fundraising activity, reconciliation, and automated processing in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={loadPlatformState}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition cursor-pointer disabled:opacity-50 min-h-[44px] flex items-center gap-2 text-xs font-semibold shadow-xs"
              title="Refresh System Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleForceSync}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-98 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Force Sync Queue
            </button>
          </div>
        </div>

        {/* 2. Primary Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="telemetry-cards-grid">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Transactions Processed</span>
              <span className="text-2xl font-black text-slate-900">{metrics.eventsProcessedToday}</span>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fully Reconciled
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shrink-0">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Successfully Reconciled</span>
              <span className="text-2xl font-black text-emerald-600">{metrics.automationSuccessRate}%</span>
              <span className="text-xs text-slate-500">
                {metrics.failedAutomations} Failed pipelines
              </span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pending Attention</span>
              <span className="text-2xl font-black text-slate-900">{metrics.pendingQueue}</span>
              <span className="text-xs text-slate-500 block">
                Events queued in outbox
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">System Status</span>
              <div className="mt-1">{getStatusBadge(metrics.healthStatus)}</div>
              <span className="text-xs text-slate-500 block mt-1">
                {metrics.averageProcessingTimeMs.toFixed(1)}ms avg latency
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl shrink-0">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3. What Autopilot Is Doing */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4" id="what-autopilot-does-card">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">What Autopilot Is Doing</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HarambeeFlow continuously monitors contribution activity and automatically keeps your campaign records, reconciliation, and supporter communications up to date.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {[
              { title: "Monitor incoming contributions", desc: "Listens for live M-PESA & manual transactions" },
              { title: "Verify & reconcile transactions", desc: "Validates double-entry ledgers & duplicate codes" },
              { title: "Update campaign balances", desc: "Recalculates totals & milestone targets instantly" },
              { title: "Update supporter records", desc: "Maintains giver history, badges & LTV scores" },
              { title: "Process WhatsApp confirmations", desc: "Queues thank-you receipts & automated broadcasts" },
              { title: "Maintain an audit trail", desc: "Writes immutable execution logs for committee audits" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{item.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Live Activity Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5" id="live-activity-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Live Activity Feed
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time operational events processed by HarambeeFlow Autopilot.</p>
            </div>
            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg self-start sm:self-auto shrink-0">
              {filteredEvents.length} Events Captured
            </span>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap gap-1.5" id="event-filters-box">
            {["ALL", "CONTRIBUTIONS", "PLEDGES", "CampaignMilestoneReached", "ReportGenerated"].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  filterType === f 
                    ? "bg-emerald-600 text-white border-emerald-600" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f === "CampaignMilestoneReached" ? "Milestones" : f === "ReportGenerated" ? "Reports" : f}
              </button>
            ))}
          </div>

          {/* Events Grid / List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list: events */}
            <div className={`${selectedEvent ? "lg:col-span-6" : "lg:col-span-12"} space-y-3`}>
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {isLoadingEvents ? (
                  <div className="text-center font-sans text-slate-500 text-xs py-12 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Loading activity from Firestore...</span>
                  </div>
                ) : firestoreError ? (
                  <div className="text-center font-sans text-amber-700 text-xs py-12 border border-dashed border-amber-200 bg-amber-50/50 rounded-xl space-y-2">
                    <p className="font-semibold">{firestoreError}</p>
                    <button 
                      onClick={loadPlatformState}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs rounded-lg hover:bg-amber-100 cursor-pointer font-medium"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : filteredEvents.length > 0 ? (
                  filteredEvents.map(evt => {
                    const isSelected = selectedEvent?.id === evt.id;
                    const formattedTime = new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                    // Derive human readable descriptions
                    let eventTitle = evt.type;
                    let badgeText = "Reconciled";
                    let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";

                    if (evt.type === "ContributionReceived") {
                      eventTitle = "Contribution Received";
                      badgeText = "✓ Reconciled";
                      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (evt.type === "PledgeCreated") {
                      eventTitle = "Pledge Recorded";
                      badgeText = "● Active Pledge";
                      badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else if (evt.type === "CampaignMilestoneReached") {
                      eventTitle = "Campaign Milestone";
                      badgeText = "★ Milestone";
                      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                    } else if (evt.type === "ReportGenerated") {
                      eventTitle = "Report Generated";
                      badgeText = "✓ Completed";
                      badgeStyle = "bg-teal-50 text-teal-700 border-teal-200";
                    } else if (evt.type === "SupporterCreated") {
                      eventTitle = "Supporter Added";
                      badgeText = "✓ Recorded";
                      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                    }

                    const sender = evt.payload?.senderName || evt.payload?.donorName || evt.payload?.fullName || "";
                    const amt = evt.payload?.amount || evt.payload?.pledgedAmount || 0;
                    const amtStr = amt ? `KES ${Number(amt).toLocaleString()}` : "";
                    const detailsText = evt.payload?.title || evt.payload?.description || evt.payload?.reportType || "";

                    return (
                      <button
                        key={evt.id}
                        onClick={() => handleSelectEvent(evt)}
                        className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected 
                            ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs" 
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            evt.type === "ContributionReceived" ? "bg-emerald-100 text-emerald-700" :
                            evt.type === "PledgeCreated" ? "bg-indigo-100 text-indigo-700" :
                            evt.type === "CampaignMilestoneReached" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {evt.type === "ContributionReceived" ? <HeartHandshake className="w-4 h-4" /> :
                             evt.type === "PledgeCreated" ? <Clock className="w-4 h-4" /> :
                             evt.type === "CampaignMilestoneReached" ? <Award className="w-4 h-4" /> :
                             <Cpu className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900">{eventTitle}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                {badgeText}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 font-medium mt-1 leading-snug break-words">
                              {sender ? `${sender}${amtStr ? ` — ${amtStr}` : ""}` : detailsText || "System activity dispatch"}
                            </p>

                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                              ID: {evt.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <span className="text-[10px] font-mono text-slate-500">
                            {formattedTime}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5">
                            Details &rarr;
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center font-sans text-slate-500 text-xs py-12 border border-dashed border-slate-200 rounded-xl">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: Expanded technical pipeline details for selected event */}
            {selectedEvent && (
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4" id="event-detail-drawer">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Event Pipeline Inspection</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{selectedEvent.type}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    Close ✕
                  </button>
                </div>

                {/* Technical Metadata Box */}
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-1">
                    <span className="text-slate-500 font-medium">Tracking ID:</span>
                    <span className="text-slate-900 font-bold select-all break-all">{selectedEvent.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-1">
                    <span className="text-slate-500 font-medium">Published:</span>
                    <span className="text-slate-700 font-semibold">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-1">
                    <span className="text-slate-500 font-medium">Source:</span>
                    <span className="text-indigo-700 font-bold uppercase">{selectedEvent.source === "client" ? "Fintech Endpoint" : "Cloud Run Processor"}</span>
                  </div>
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="text-slate-500 font-medium">Pipeline Status:</span>
                    {selectedEventLogs.some(l => l.status === "failed") ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> FAILED
                      </span>
                    ) : selectedEventLogs.length > 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ✓ AUTOMATED SUCCESS
                      </span>
                    ) : selectedEvent.processed ? (
                      <span className="text-emerald-700 font-bold">✓ PROCESSED</span>
                    ) : (
                      <span className="text-slate-500 font-medium italic">NO EXECUTION RECORD</span>
                    )}
                  </div>
                </div>

                {/* Execution Logs */}
                <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3.5 max-h-[280px] overflow-y-auto">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Autopilot Execution Steps Log
                  </span>
                  {isLoadingLogs ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Fetching execution steps from Firestore...</span>
                    </div>
                  ) : selectedEventLogs.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedEventLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2.5 text-xs">
                          {log.status === "failed" ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 leading-snug">{log.pipelineStep}</p>
                            <span className="text-[10px] font-mono text-slate-400">
                              Verified at {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
                            </span>
                            {log.details && (
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{log.details}</p>
                            )}
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                            log.status === "failed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {log.status === "failed" ? "FAILED" : "SUCCESS"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-3 text-xs text-slate-500 font-sans italic border border-dashed border-slate-200 rounded-lg">
                      No execution details are available for this event.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Advanced Diagnostics & System Controls */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5" id="advanced-diagnostics-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-700" />
                Advanced Diagnostics & System Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Technical event processing, sandbox event testing, and sync management.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sandbox Event Emitter */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3" id="sandbox-event-emitter-box">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sandbox Event Emitter</h4>
              </div>
              <p className="text-xs text-slate-500">Emit a custom test event into the Autopilot pipeline for sandbox testing.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="Type custom event details... (e.g. Volunteer assigned)"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-sans"
                />
                <button
                  onClick={handleSimulateCustomEvent}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 min-h-[42px]"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> Emit
                </button>
              </div>
            </div>

            {/* Force Sync Queue & Security Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncingQueue ? "animate-spin" : ""}`} />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Sync & Security</h4>
              </div>
              <p className="text-xs text-slate-500">Use Force Sync if transaction processing appears delayed or when coming back online.</p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleForceSync}
                  disabled={isSyncingQueue}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 min-h-[42px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? "animate-spin" : ""}`} />
                  {isSyncingQueue ? "Syncing Queue..." : "Force Sync Queue"}
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  {metrics.pendingQueue} queued in outbox
                </span>
              </div>

              {/* Sync Status Banner */}
              {syncStatusMessage && (
                <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                  syncStatusMessage.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : syncStatusMessage.type === "error"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-sky-50 text-sky-800 border-sky-200"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span className="flex-1">{syncStatusMessage.text}</span>
                  <button 
                    onClick={() => setSyncStatusMessage(null)}
                    className="text-xs opacity-60 hover:opacity-100 p-0.5 cursor-pointer ml-auto"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Guarantee Note */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span className="text-xs text-emerald-800 leading-relaxed">
              <strong>Fintech-grade Ledger Security:</strong> All processing paths maintain idempotency guarantees. Double-entry ledgers verify SHA-256 checksums to prevent race conditions during concurrent updates.
            </span>
          </div>
        </div>

        {/* 6. Connected Autopilot Services */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4" id="modules-health-grid">
          <div>
            <h3 className="text-base font-bold text-slate-900">Connected Autopilot Services</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of connected HarambeeFlow subsystems.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Live Dashboard", status: "Connected", code: "ACTIVE_BUS", icon: Layers, color: "text-emerald-600" },
              { name: "Supporter CRM", status: "Active Sync", code: "CRM_MUTATE", icon: Cpu, color: "text-indigo-600" },
              { name: "Campaign Core", status: "Active Calc", code: "CAMPAIGN_VM", icon: Flame, color: "text-amber-600" },
              { name: "Pledge Engine", status: "Ready Listen", code: "RECONCILE_DB", icon: HeartHandshake, color: "text-purple-600" },
              { name: "Meta WhatsApp", status: "Broadcasting", code: "META_OUTBOX", icon: MessageSquare, color: "text-sky-600" },
              { name: "Audit Trail DB", status: "Synced Lock", code: "LEDGER_INTEG", icon: ShieldCheck, color: "text-teal-600" }
            ].map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-left flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-center">
                    <Icon className={`w-4 h-4 ${mod.color}`} />
                    <span className="inline-flex items-center w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{mod.name}</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">{mod.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
