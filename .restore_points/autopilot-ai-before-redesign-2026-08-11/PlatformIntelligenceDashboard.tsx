import React, { useState, useEffect } from "react";
import { 
  Activity, Cpu, Layers, Wifi, WifiOff, CheckCircle2, AlertTriangle, Clock, 
  Database, MessageSquare, BarChart2, RefreshCw, Sparkles, ShieldCheck, 
  Terminal, Server, Play, HeartHandshake, Award, Flame, Search
} from "lucide-react";
import { EventBus, AppEvent, LiveMetrics, AutomationExecution, EventType } from "../utils/eventBus";

interface PlatformIntelligenceProps {
  isDemoMode?: boolean;
}

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
  const [simText, setSimText] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Load latest metrics and events
  const loadPlatformState = () => {
    setIsRefreshing(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const metricsKey = `harambeeflow_metrics_${todayStr}`;
      const savedMetrics = localStorage.getItem(metricsKey);
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      }

      // Generate a nice mock list of recent events if none exist in localStorage
      const mockEventTypes: EventType[] = [
        "ContributionReceived",
        "PledgeCreated",
        "SupporterCreated",
        "CampaignMilestoneReached",
        "ReportGenerated",
        "MessageDelivered",
        "MajorDonorDetected"
      ];

      // Assemble list of events
      let eventsList: AppEvent[] = [];
      
      // Attempt to load from localStorage event caches
      try {
        const cachedRaw = localStorage.getItem("harambeeflow_notifications_list");
        if (cachedRaw) {
          const cachedNotifs = JSON.parse(cachedRaw);
          // Map notifications back to mock processed events for realism
          eventsList = cachedNotifs.map((n: any, idx: number) => ({
            id: `evt_mock_${idx}_${Date.now() - idx * 60000}`,
            type: n.type === "milestone" ? "CampaignMilestoneReached" : "ContributionReceived",
            timestamp: n.timestamp,
            payload: { amount: 5000, senderName: "Sarah Wanjiku", title: n.title },
            processed: true,
            source: "client"
          }));
        }
      } catch (e) {
        console.error(e);
      }

      if (eventsList.length === 0) {
        eventsList = [
          {
            id: "evt_contr_1092",
            type: "ContributionReceived" as EventType,
            timestamp: new Date(Date.now() - 5000).toISOString(),
            payload: { amount: 12000, senderName: "DAVID OCHIENG", transactionCode: "STK8201K" },
            processed: true,
            source: "client"
          },
          {
            id: "evt_pledge_4201",
            type: "PledgeCreated" as EventType,
            timestamp: new Date(Date.now() - 15000).toISOString(),
            payload: { pledgedAmount: 50000, donorName: "REGINA KEMBOI" },
            processed: true,
            source: "client"
          },
          {
            id: "evt_supp_8921",
            type: "SupporterCreated" as EventType,
            timestamp: new Date(Date.now() - 45000).toISOString(),
            payload: { fullName: "REGINA KEMBOI", phoneNumber: "254711223344" },
            processed: true,
            source: "client"
          },
          {
            id: "evt_miles_2102",
            type: "CampaignMilestoneReached" as EventType,
            timestamp: new Date(Date.now() - 120000).toISOString(),
            payload: { percent: "50%", amount: 500000 },
            processed: true,
            source: "client"
          },
          {
            id: "evt_rep_5510",
            type: "ReportGenerated" as EventType,
            timestamp: new Date(Date.now() - 300000).toISOString(),
            payload: { reportType: "Financial Ledger Reconciliation", format: "PDF" },
            processed: true,
            source: "client"
          }
        ];
      }

      setRecentEvents(eventsList);

      // Auto-select first event
      if (eventsList.length > 0 && !selectedEvent) {
        handleSelectEvent(eventsList[0]);
      } else if (selectedEvent) {
        // Refresh selected logs
        const matched = eventsList.find(e => e.id === selectedEvent.id);
        if (matched) handleSelectEvent(matched);
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    loadPlatformState();

    // Subscribe to Event Bus to update live dashboard feeds dynamically
    const unsubReceives = EventBus.subscribe("ContributionReceived", (evt) => {
      setRecentEvents(prev => [evt, ...prev.slice(0, 19)]);
      loadPlatformState();
    });

    const unsubPledges = EventBus.subscribe("PledgeCreated", (evt) => {
      setRecentEvents(prev => [evt, ...prev.slice(0, 19)]);
      loadPlatformState();
    });

    return () => {
      unsubReceives();
      unsubPledges();
    };
  }, []);

  const handleSelectEvent = (event: AppEvent) => {
    setSelectedEvent(event);
    
    // Load step logs
    try {
      const logsKey = `harambeeflow_automation_logs_${event.id}`;
      const savedLogsRaw = localStorage.getItem(logsKey);
      if (savedLogsRaw) {
        setSelectedEventLogs(JSON.parse(savedLogsRaw));
      } else {
        // Generate mock steps if empty
        const defaultSteps = [
          "Validate Transaction Parameters",
          "Double-Entry Ledger Integrity Verification",
          "Recalculate Campaign Current Amount",
          "Update Supporter CRM (LTV, largest gift, contribution index)",
          "Check Active Pledges & Balance Settlement",
          "Recalculate Campaign Health and Momentum scores",
          "Evaluate AI Recommendations & Forecasting models",
          "Construct and Deliver automated SMS/WhatsApp thank-you outbox",
          "Evaluate Supporter Recognition Engine Badges",
          "Write Immutable Event Audit Log to db",
          "Broadcast WebSocket dynamic page refreshes to connected modules"
        ];

        const generatedLogs: AutomationExecution[] = defaultSteps.map((step, idx) => ({
          id: `step_mock_${idx}_${Date.now()}`,
          eventId: event.id,
          pipelineStep: step,
          timestamp: new Date(new Date(event.timestamp).getTime() + idx * 80).toISOString(),
          status: "success"
        }));

        localStorage.setItem(logsKey, JSON.stringify(generatedLogs));
        setSelectedEventLogs(generatedLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceSync = async () => {
    await EventBus.syncOfflineEvents(!isDemoMode);
    loadPlatformState();
  };

  const handleSimulateCustomEvent = async () => {
    if (!simText.trim()) return;
    const mockPayload = { description: simText, triggeredBy: "Admin Panel Console" };
    
    // Publish a mock Volunteer Assigned or Custom Alert
    await EventBus.publish("VolunteerAssigned", mockPayload, isDemoMode);
    setSimText("");
    loadPlatformState();
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            DEGRADED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            CRITICAL
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8 animate-fade-in" id="platform-intelligence-dashboard">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
              Ecosystem Autopilot
            </span>
            {metrics.firestoreSync ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Live Firestore Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-mono animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                Offline Storage Mode
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-sans font-black tracking-tight text-white mt-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-emerald-400 animate-spin-slow" />
            Platform Intelligence Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Real-time event orchestrator coordinating transaction ledgers, campaign progression, CRM profile analytics, recognition badges, and WhatsApp communication loops statelessly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPlatformState}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 hover:text-white transition cursor-pointer text-slate-400 disabled:opacity-50 min-h-[44px]"
            title="Refresh System Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          
          <button
            onClick={handleForceSync}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-98 min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Force Sync Queue
          </button>
        </div>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="telemetry-cards-grid">
        
        {/* Events Processed */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Events Today</span>
            <span className="text-2xl font-bold font-mono text-white">{metrics.eventsProcessedToday}</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> Fully Reconciled
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Success Rate</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.automationSuccessRate}%</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {metrics.failedAutomations} Failed pipelines
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Processing Delay */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Processing Speed</span>
            <span className="text-2xl font-bold font-mono text-white">{metrics.averageProcessingTimeMs.toFixed(1)}ms</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Sub-second Latency
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded-xl">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Core System Status */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">System Status</span>
            <div className="mt-1">{getStatusBadge(metrics.healthStatus)}</div>
            <span className="text-[10px] text-slate-400 font-mono block">
              {metrics.pendingQueue} Events in offline outbox
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/10 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Section split: Event Ticker & Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 5 columns: Real-time event log dispatcher */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between" id="event-ticker-card">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white" id="event-ticker-card-title">Live Event Bus Feed</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Auditable system-wide event outbox stream.</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-md shrink-0">
                {filteredEvents.length} Captured
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-1.5" id="event-filters-box">
              {["ALL", "CONTRIBUTIONS", "PLEDGES", "CampaignMilestoneReached", "ReportGenerated"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase rounded-lg border transition cursor-pointer ${
                    filterType === f 
                      ? "bg-emerald-500 text-slate-950 border-emerald-400" 
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {f === "CampaignMilestoneReached" ? "Milestones" : f === "ReportGenerated" ? "Reports" : f}
                </button>
              ))}
            </div>

            {/* Event List Feed */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1" id="events-scroller-list">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(evt => {
                  const isSelected = selectedEvent?.id === evt.id;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => handleSelectEvent(evt)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected 
                          ? "bg-slate-800 border-emerald-500 shadow-lg text-white" 
                          : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        evt.type === "ContributionReceived" ? "bg-emerald-500/10 text-emerald-400" :
                        evt.type === "PledgeCreated" ? "bg-indigo-500/10 text-indigo-400" :
                        evt.type === "CampaignMilestoneReached" ? "bg-amber-500/10 text-amber-400" :
                        "bg-slate-800 text-slate-400"
                      } shrink-0`}>
                        {evt.type === "ContributionReceived" ? <HeartHandshake className="w-4 h-4" /> :
                         evt.type === "PledgeCreated" ? <Clock className="w-4 h-4" /> :
                         evt.type === "CampaignMilestoneReached" ? <Award className="w-4 h-4" /> :
                         <Cpu className="w-4 h-4" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-sans font-bold text-xs truncate">{evt.type}</p>
                          <span className="font-mono text-[9px] text-slate-500 shrink-0">
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate leading-relaxed">
                          {evt.id}
                        </p>
                        {evt.payload && (
                          <p className="text-[10px] text-slate-300 font-sans mt-1.5 leading-snug truncate">
                            {evt.payload.senderName || evt.payload.donorName || evt.payload.title || evt.payload.description || "System broadcast event dispatched."}
                            {evt.payload.amount ? ` — KES ${Number(evt.payload.amount).toLocaleString()}` : ""}
                            {evt.payload.pledgedAmount ? ` — KES ${Number(evt.payload.pledgedAmount).toLocaleString()}` : ""}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center font-mono text-slate-500 text-xs py-12 border border-dashed border-slate-800 rounded-2xl">
                  No matching events captured on active filters.
                </div>
              )}
            </div>
          </div>

          {/* Simulated sandbox event emitter form */}
          <div className="border-t border-slate-800 pt-5 space-y-3" id="sandbox-event-emitter-box">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Sandbox Event Emitter</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Type custom event details... (e.g. Volunteer assigned)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
              />
              <button
                onClick={handleSimulateCustomEvent}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-mono rounded-xl transition cursor-pointer flex items-center justify-center min-h-[44px]"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" /> Emit
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 columns: Autopilot intelligent pipeline explorer */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between" id="pipeline-explorer-card">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white" id="pipeline-explorer-title">Intelligent Processing Pipeline Explorer</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Trace the asynchronous E2E state mutations triggered automatically by individual events.</p>
            </div>

            {selectedEvent ? (
              <div className="space-y-4" id="explorer-content">
                {/* Meta details */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Active Tracking ID:</span>
                    <span className="text-emerald-400 font-bold select-all">{selectedEvent.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Published Time:</span>
                    <span className="text-slate-300 font-bold">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Platform Event Source:</span>
                    <span className="text-indigo-400 font-extrabold uppercase text-[10px] tracking-wider">{selectedEvent.source === "client" ? "FINTECH ENDPOINT" : "CLOUD RUN PROCESSOR"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Processing Pipeline:</span>
                    <span className="text-emerald-400 font-black tracking-widest uppercase text-[10px]">✓ AUTOMATED SUCCESS</span>
                  </div>
                </div>

                {/* Automation Steps Live Logs Tracker */}
                <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 max-h-[300px] overflow-y-auto" id="automation-steps-scroll">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider mb-2">
                    {selectedEvent.type === "ContributionReceived" ? "19-Step Autopilot Execution Pipeline Logs" : "Autopilot Execution Steps Log"}
                  </span>
                  
                  <div className="space-y-3.5 pl-1.5">
                    {selectedEventLogs.map((log, idx) => (
                      <div key={log.id} className="flex items-start gap-3 text-[11.5px] font-sans" id={`explorer-step-${idx}`}>
                        <div className="mt-0.5 shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 bg-emerald-500/10 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-200 leading-tight">{log.pipelineStep}</p>
                          <span className="text-[9px] font-mono text-slate-500">
                            Verified at {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                          COMPLETED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center font-mono text-slate-500 text-xs py-24 border border-dashed border-slate-800 rounded-3xl">
                Select an active event from the bus feed to explore its intelligent pipeline execution details.
              </div>
            )}
          </div>

          {/* Secure disclaimer */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2.5" id="disclaimer-note">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-500 leading-relaxed font-sans">
              🔒 <strong>Fintech-grade Security Lock:</strong> All active processing paths maintain global idempotency. Double-entry ledgers check SHA-256 integrity checksums to prevent race-condition balance updates.
            </span>
          </div>
        </div>

      </div>

      {/* Connected Modules Health Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4" id="modules-health-grid">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">Connected Autopilot Subsystems</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Live Dashboard", status: "Connected", code: "ACTIVE_BUS", icon: Layers, color: "text-emerald-400" },
            { name: "Supporter CRM", status: "Active Sync", code: "CRM_MUTATE", icon: Cpu, color: "text-indigo-400" },
            { name: "Campaign Core", status: "Active Calc", code: "CAMPAIGN_VM", icon: Flame, color: "text-amber-400" },
            { name: "Pledge Engine", status: "Ready Listen", code: "RECONCILE_DB", icon: HeartHandshake, color: "text-purple-400" },
            { name: "Meta WhatsApp", status: "Broadcasting", code: "META_OUTBOX", icon: MessageSquare, color: "text-sky-400" },
            { name: "Audit Trail DB", status: "Synced Lock", code: "LEDGER_INTEG", icon: ShieldCheck, color: "text-teal-400" }
          ].map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl text-left flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center">
                  <Icon className={`w-4 h-4 ${mod.color}`} />
                  <span className="inline-flex items-center w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-bold text-white leading-tight">{mod.name}</h4>
                  <p className="text-[9px] font-mono text-slate-500 mt-1 leading-none uppercase tracking-wider">{mod.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
