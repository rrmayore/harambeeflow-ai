import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, TrendingUp, Users, Target, Activity, Flame, ShieldCheck, 
  Smartphone, Share2, Copy, Check, Clock, Wifi, AlertCircle, Heart,
  BarChart3, RefreshCw, Layers, Award, CheckCircle2, DollarSign,
  AlertTriangle, MessageSquare, ChevronDown, HelpCircle
} from "lucide-react";
import { Project, Contribution, Pledge } from "../types";
import { collection, onSnapshot, query, where, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

interface LiveFundraisingCommandCenterProps {
  activeProject: Project;
  contributions: Contribution[];
  pledges?: Pledge[];
  viewMode?: "organizer" | "public";
  isDemoMode?: boolean;
}

interface LiveEvent {
  id: string;
  type: "contribution" | "pledge" | "pledge_fulfilled" | "milestone" | "committee_announcement" | "goal_achieved";
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  donorName: string;
  phone?: string;
  receiptNumber?: string;
  ledgerStatus?: "committed" | "pending" | "duplicate_flag";
  whatsappStatus?: "success" | "pending" | "none";
  isAnonymous?: boolean;
}

const DEFAULT_CONTRIBUTIONS: Contribution[] = [];
const DEFAULT_PLEDGES: Pledge[] = [];

export default function LiveFundraisingCommandCenter({
  activeProject,
  contributions: initialContributions = DEFAULT_CONTRIBUTIONS,
  pledges: initialPledges = DEFAULT_PLEDGES,
  viewMode = "organizer",
  isDemoMode = false
}: LiveFundraisingCommandCenterProps) {
  // Sync states
  const [liveContributions, setLiveContributions] = useState<Contribution[]>(initialContributions);
  const [livePledges, setLivePledges] = useState<Pledge[]>(initialPledges);
  const [liveFundraiserDoc, setLiveFundraiserDoc] = useState<any>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [lastContributionInfo, setLastContributionInfo] = useState<{
    amount: number;
    senderName: string;
    timestamp: string;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting" | "offline">("connected");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Celebration notification
  const [activeMilestoneNotification, setActiveMilestoneNotification] = useState<{
    percentage: number;
    title: string;
    description: string;
    shareText: string;
  } | null>(null);

  // Stats Counters with numeric ticker simulation
  const [animatedTotalRaised, setAnimatedTotalRaised] = useState(0);

  // State to simulate incoming live contributions for the "wow" moment
  const [simulatedEvents, setSimulatedEvents] = useState<LiveEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "contributions" | "pledges" | "milestones">("all");

  // Keep track of shown milestones to avoid duplicate celebratory triggers
  const triggeredMilestones = useRef<Set<number>>(new Set());

  // Set up real-time listener if in online mode (relying on props + optional direct Firestore connection)
  useEffect(() => {
    if (initialContributions.length > 0) {
      setLiveContributions(initialContributions);
    }
  }, [initialContributions]);

  useEffect(() => {
    if (initialPledges.length > 0) {
      setLivePledges(initialPledges);
    }
  }, [initialPledges]);

  // Firestore Live Listener to guarantee instantaneous real-time sync
  useEffect(() => {
    if (isDemoMode || !db) {
      setConnectionStatus("connected");
      return;
    }

    setConnectionStatus("reconnecting");

    // 1. Listen to all donations and filter for active project to avoid missing docs
    const unsubscribeContribs = onSnapshot(
      collection(db, "donations"),
      (snapshot) => {
        const list: Contribution[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const projId = data.projectId || data.campaignId || data.fundraiserId || "";
          if (projId === activeProject.id) {
            const rawName = data.senderName || data.cleanedName || "M-PESA Customer";
            const cleanName = data.cleanedName || data.senderName || "M-PESA Customer";
            list.push({
              id: docSnap.id,
              projectId: projId,
              campaignId: data.campaignId || projId,
              fundraiserId: data.fundraiserId || projId,
              amount: Number(data.amount || 0),
              senderName: rawName,
              senderPhone: data.senderPhone || data.phoneNumber || "",
              transactionCode: data.transactionCode || data.receiptNumber || docSnap.id,
              timestamp: data.timestamp || data.transactionTime || new Date().toISOString(),
              category: data.category || "Well-wisher",
              rawMessage: data.rawMessage || "",
              cleanedName: cleanName,
              hasDuplicates: data.hasDuplicates || false,
              notes: data.notes || "",
              whatsappPosted: data.whatsappPosted || false,
              status: data.status || "completed"
            });
          }
        });

        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const latest = sorted[0];
          setLastContributionInfo({
            amount: latest.amount,
            senderName: latest.cleanedName || latest.senderName,
            timestamp: latest.timestamp
          });
        }

        setLiveContributions(list);
        setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setConnectionStatus("connected");

        console.log(`[CONTRIBUTION PIPELINE] [${new Date().toLocaleTimeString()}] Realtime Snapshot Fired: ${list.length} contributions received for campaign ${activeProject.id}`);
      },
      (error) => {
        console.error("Live contributions error:", error);
        setConnectionStatus("offline");
      }
    );

    // 2. Listen directly to fundraiser document totals in real-time
    const unsubscribeFundraiser = onSnapshot(
      doc(db, "fundraisers", activeProject.id),
      (fundraiserSnap) => {
        if (fundraiserSnap.exists()) {
          const fData = fundraiserSnap.data();
          setLiveFundraiserDoc(fData);
          setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
          if (fData.lastContribution) {
            setLastContributionInfo({
              amount: Number(fData.lastContribution),
              senderName: fData.lastContributionName || "Contributor",
              timestamp: fData.lastContributionTime || new Date().toISOString()
            });
          }
        }
      },
      (fErr) => {
        console.warn("Live fundraiser doc listener warning:", fErr);
      }
    );

    const pledgesQuery = query(
      collection(db, "pledges"),
      where("projectId", "==", activeProject.id)
    );

    const unsubscribePledges = onSnapshot(
      pledgesQuery,
      (snapshot) => {
        const list: Pledge[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ id: docSnap.id, ...data } as Pledge);
        });
        setLivePledges(list);
      },
      (error) => {
        console.error("Live pledges error:", error);
      }
    );

    return () => {
      unsubscribeContribs();
      unsubscribeFundraiser();
      unsubscribePledges();
    };
  }, [activeProject.id, isDemoMode]);

  // Handle network reconnection visual indicator
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("connected");
    const handleOffline = () => setConnectionStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const targetAmount = activeProject.targetAmount || 500000;

  // Compute live statistics based on synced data + simulated data
  const totalRaised = useMemo(() => {
    const baseFromDonations = liveContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const docAmount = Number(liveFundraiserDoc?.currentAmount ?? liveFundraiserDoc?.totalRaised ?? activeProject.currentAmount ?? 0);
    const computedBase = Math.max(baseFromDonations, docAmount);

    const simAmount = simulatedEvents
      .filter(e => e.type === "contribution" || e.type === "pledge_fulfilled")
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const finalSum = computedBase + simAmount;

    console.log(`[CONTRIBUTION PIPELINE] [${new Date().toLocaleTimeString()}] Dashboard Rendered: Raised = KES ${finalSum.toLocaleString()}, Remaining = KES ${Math.max(0, targetAmount - finalSum).toLocaleString()}, Progress = ${Math.min(100, Math.round((finalSum / targetAmount) * 100))}%`);

    return finalSum;
  }, [liveContributions, liveFundraiserDoc, activeProject.currentAmount, simulatedEvents, targetAmount]);

  const percentComplete = Math.min(100, Math.round((totalRaised / targetAmount) * 100)) || 0;
  const remainingNeeded = Math.max(0, targetAmount - totalRaised);

  // Odometer effect for total raised count
  useEffect(() => {
    const start = animatedTotalRaised;
    const end = totalRaised;
    if (start === end) return;

    const duration = 1200; // ms
    const stepTime = Math.max(Math.floor(duration / Math.abs(end - start)), 15);
    const startTime = Date.now();

    const ticker = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      const nextVal = Math.round(start + (end - start) * easedProgress);
      
      setAnimatedTotalRaised(nextVal);

      if (progress >= 1) {
        setAnimatedTotalRaised(end);
        clearInterval(ticker);
      }
    }, stepTime);

    return () => clearInterval(ticker);
  }, [totalRaised]);

  const totalSupporters = useMemo(() => {
    const base = liveContributions.length;
    const simCount = simulatedEvents.filter(e => e.type === "contribution").length;
    return base + simCount;
  }, [liveContributions, simulatedEvents]);

  const averageGift = useMemo(() => {
    return totalSupporters > 0 ? Math.round(totalRaised / totalSupporters) : 0;
  }, [totalRaised, totalSupporters]);

  const largestGift = useMemo(() => {
    const baseMax = liveContributions.length > 0 ? Math.max(...liveContributions.map(c => c.amount)) : 0;
    const simMax = simulatedEvents.length > 0 ? Math.max(...simulatedEvents.filter(e => e.type === "contribution").map(e => e.amount || 0)) : 0;
    return Math.max(baseMax, simMax);
  }, [liveContributions, simulatedEvents]);

  // Today's total (calculated dynamically based on real-time and mock stamps)
  const todayTotal = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const baseToday = liveContributions
      .filter(c => new Date(c.timestamp).getTime() >= startOfToday)
      .reduce((sum, c) => sum + c.amount, 0);

    const simToday = simulatedEvents
      .filter(e => e.type === "contribution" && new Date(e.timestamp).getTime() >= startOfToday)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return baseToday + simToday;
  }, [liveContributions, simulatedEvents]);

  // Outstanding pledges computation
  const outstandingPledges = useMemo(() => {
    const basePending = livePledges
      .filter(p => p.status === "Pending" || p.status === "Partial")
      .reduce((sum, p) => sum + p.balance, 0);

    const simPledges = simulatedEvents
      .filter(e => e.type === "pledge")
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const simFulfilled = simulatedEvents
      .filter(e => e.type === "pledge_fulfilled")
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return Math.max(0, basePending + simPledges - simFulfilled);
  }, [livePledges, simulatedEvents]);

  // Conversion / Momentum Metrics
  const momentumScore = useMemo(() => {
    // Calculated based on frequency of recent events and percentage complete
    const recentActivityCount = simulatedEvents.length + liveContributions.filter(c => {
      const diff = Date.now() - new Date(c.timestamp).getTime();
      return diff < 4 * 3600 * 1000; // last 4 hours
    }).length;

    let score = 40; // baseline
    score += Math.min(30, recentActivityCount * 5);
    score += Math.min(30, Math.round(percentComplete * 0.3));
    return Math.min(100, score);
  }, [percentComplete, simulatedEvents, liveContributions]);

  // Assemble events into a singular unified timeline feed
  const unifiedEvents = useMemo(() => {
    const list: LiveEvent[] = [];

    // Add base contributions
    liveContributions.forEach(c => {
      list.push({
        id: `contrib-${c.id || c.transactionCode}`,
        type: "contribution",
        title: `M-PESA contribution from ${c.cleanedName || c.senderName}`,
        description: `Successfully posted KES ${c.amount.toLocaleString()} into campaign funds.`,
        amount: c.amount,
        timestamp: c.timestamp,
        donorName: c.cleanedName || c.senderName,
        phone: c.senderPhone,
        receiptNumber: c.transactionCode,
        ledgerStatus: c.hasDuplicates ? "duplicate_flag" : "committed",
        whatsappStatus: c.whatsappPosted ? "success" : "none"
      });
    });

    // Add base pledges
    livePledges.forEach(p => {
      list.push({
        id: `pledge-${p.id}`,
        type: "pledge",
        title: `Pledge logged by ${p.donorName}`,
        description: `Committed KES ${p.pledgedAmount.toLocaleString()} expected by ${p.dueDate}.`,
        amount: p.pledgedAmount,
        timestamp: p.createdAt,
        donorName: p.donorName,
        phone: p.phone,
        ledgerStatus: "committed",
        whatsappStatus: "none"
      });

      // Add payments history as fulfillment events
      if (p.paymentHistory && p.paymentHistory.length > 0) {
        p.paymentHistory.forEach(pm => {
          list.push({
            id: `fulfilled-${pm.id}`,
            type: "pledge_fulfilled",
            title: `Pledge payment from ${p.donorName}`,
            description: `Fulfilled KES ${pm.amount.toLocaleString()} toward outstanding pledge.`,
            amount: pm.amount,
            timestamp: pm.timestamp,
            donorName: p.donorName,
            phone: p.phone,
            receiptNumber: pm.transactionCode,
            ledgerStatus: "committed"
          });
        });
      }
    });

    // Add mock / simulated events
    simulatedEvents.forEach(e => {
      list.push(e);
    });

    // Generate automatic milestones markers based on current statistics
    const milestonePercentages = [25, 50, 75, 90, 100];
    milestonePercentages.forEach(m => {
      if (percentComplete >= m) {
        const targetGoalMarker = Math.round(targetAmount * (m / 100));
        list.push({
          id: `system-milestone-${m}`,
          type: m === 100 ? "goal_achieved" : "milestone",
          title: m === 100 ? "🏆 100% FUNDED! MISSION COMPLETED!" : `🔥 Milestone Crossed: ${m}% Raised!`,
          description: m === 100 
            ? `Incredible! The target goal of KES ${targetAmount.toLocaleString()} has been fully accumulated. Congratulations to all supporters!`
            : `The campaign has surged past the ${m}% mark, accumulating KES ${targetGoalMarker.toLocaleString()} in secure contributions!`,
          timestamp: activeProject.createdAt,
          donorName: "System AI"
        });
      }
    });

    // Sort descending (newest first)
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by tab
    if (activeTab === "contributions") {
      return list.filter(e => e.type === "contribution" || e.type === "pledge_fulfilled");
    } else if (activeTab === "pledges") {
      return list.filter(e => e.type === "pledge");
    } else if (activeTab === "milestones") {
      return list.filter(e => e.type === "milestone" || e.type === "goal_achieved");
    }

    return list.slice(0, 30); // limit to 30 elements to ensure outstanding rendering performance
  }, [liveContributions, livePledges, simulatedEvents, percentComplete, targetAmount, activeProject.createdAt, activeTab]);

  // AI Narrative Layer - Contextual summaries of momentum
  const aiNarrative = useMemo(() => {
    if (totalSupporters === 0) {
      return "Waiting for first contributions to establish predictive momentum tracking. Test the system using the mock simulator below!";
    }
    if (percentComplete >= 100) {
      return `🎉 Matchless achievement! ${totalSupporters} supporters have successfully completed the fundraiser target. Your community's solidarity is truly historic.`;
    }
    if (percentComplete >= 75) {
      return `🔥 Unstoppable Momentum! Harambee is 75%+ complete. With an average gift of KES ${averageGift.toLocaleString()} from ${totalSupporters} supporters, the campaign is on track to wrap up within 48 hours. Ready a final pledge reminder!`;
    }
    if (percentComplete >= 50) {
      return `⚡ Critical Threshold Crossed! The campaign is halfway funded. Contributions total KES ${totalRaised.toLocaleString()} from ${totalSupporters} backers. Today's rate suggests solid committee trust and continuous support.`;
    }
    if (simulatedEvents.length > 2) {
      return `🚀 Velocity Alert: ${simulatedEvents.length} fresh simulation entries logged within minutes. Your sandbox is vibrant and responsive.`;
    }
    return `📈 Steady growth. Average donation stands at KES ${averageGift.toLocaleString()}. Outstanding pledges total KES ${outstandingPledges.toLocaleString()}. Maintain social sharing to activate the remaining balance.`;
  }, [totalRaised, percentComplete, totalSupporters, averageGift, outstandingPledges, simulatedEvents]);

  // Milestone Celebration triggers when milestones are newly achieved in session
  useEffect(() => {
    const milestones = [25, 50, 75, 90, 100];
    for (const m of milestones) {
      if (percentComplete >= m && !triggeredMilestones.current.has(m)) {
        triggeredMilestones.current.add(m);
        // Only trigger pop-up alert if it's during active usage (simulation or newly posted doc)
        if (totalSupporters > 0) {
          const title = m === 100 ? "🏆 Goal Reached: 100% Complete!" : `🎉 Milestone Unlocked: ${m}%!`;
          const desc = m === 100
            ? `Spectacular! Your campaign "${activeProject.name}" has officially reached 100% of its target KES ${targetAmount.toLocaleString()}!`
            : `Fabulous progress! "${activeProject.name}" has crossed ${m}% of its goal, collecting KES ${totalRaised.toLocaleString()}.`;
          
          const shareText = `*Harambee Milestone Crossed!* 📢\n\nWe are excited to share that *${activeProject.name}* has officially raised *${m}%* of our KES ${targetAmount.toLocaleString()} goal!\n\nThank you to our amazing ${totalSupporters} supporters. Let's finish strong!\n\nContribute here: ${window.location.origin}/#/campaign/${activeProject.id}`;
          
          setActiveMilestoneNotification({
            percentage: m,
            title,
            description: desc,
            shareText
          });
        }
      }
    }
  }, [percentComplete, activeProject.name, targetAmount, totalRaised, totalSupporters]);

  // Interactive Live Simulator Trigger Action
  const handleTriggerSimulatedPayment = () => {
    const mockNames = [
      "David Omondi", "Sarah Wanjiku", "Alick Kiprotich", "Jane Kamau", 
      "Peter Otieno", "Mercy Chepngetich", "Emmanuel Musembi", "Faith Njoroge",
      "John Gachuri", "Ester Wangare", "Hassan Ibrahim", "Consolata Mutua"
    ];
    
    const mockAmountTiers = [500, 1000, 2500, 5000, 10000, 15000];
    const isPledge = Math.random() > 0.75; // 25% chance of simulating a pledge instead of donation
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomAmount = mockAmountTiers[Math.floor(Math.random() * mockAmountTiers.length)];
    
    const mockId = `sim-${Date.now()}`;
    const timestampStr = new Date().toISOString();

    if (isPledge) {
      const mockPledge: LiveEvent = {
        id: mockId,
        type: "pledge",
        title: `Pledge made by ${randomName} (Simulation)`,
        description: `Committed KES ${randomAmount.toLocaleString()} to be fulfilled within two weeks.`,
        amount: randomAmount,
        timestamp: timestampStr,
        donorName: randomName,
        phone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`,
        ledgerStatus: "committed"
      };
      setSimulatedEvents(prev => [mockPledge, ...prev]);
      triggerToast(`Simulated pledge of KES ${randomAmount.toLocaleString()} logged!`);
    } else {
      const mockDonation: LiveEvent = {
        id: mockId,
        type: "contribution",
        title: `Contribution received from ${randomName} (Simulation)`,
        description: `Instantly received KES ${randomAmount.toLocaleString()} via M-PESA. Confirmation dispatch completed.`,
        amount: randomAmount,
        timestamp: timestampStr,
        donorName: randomName,
        phone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`,
        receiptNumber: `STK${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        ledgerStatus: Math.random() > 0.95 ? "duplicate_flag" : "committed", // 5% chance of duplicate simulator check
        whatsappStatus: "success"
      };
      setSimulatedEvents(prev => [mockDonation, ...prev]);
      triggerToast(`Simulated donation of KES ${randomAmount.toLocaleString()} received!`);
    }
  };

  const triggerToast = (text: string) => {
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCopyClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label} to clipboard!`);
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl border border-slate-900 overflow-hidden relative shadow-2xl" id="live-command-center-root">
      
      {/* Decorative cybernetic overlay lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-linear-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

      {/* --- TOP HUD BAR --- */}
      <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connectionStatus === "connected" ? "bg-emerald-400" : connectionStatus === "reconnecting" ? "bg-amber-400" : "bg-rose-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${connectionStatus === "connected" ? "bg-emerald-500" : connectionStatus === "reconnecting" ? "bg-amber-500" : "bg-rose-500"}`}></span>
            </span>
          </div>
          <div>
            <h3 className="font-sans font-black text-white text-sm tracking-tight flex items-center gap-1.5 uppercase">
              Live Fundraising Command Center 
              <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-sm">
                {viewMode === "organizer" ? "ORGANIZER ENGINE" : "COMMUNITY HUD"}
              </span>
            </h3>
            <div className="text-[10px] font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
              {connectionStatus === "connected" ? (
                <>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Safaricom Daraja API Connected • Live Listening
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">⏱️ Last Update: <strong className="text-white">{lastUpdatedTime}</strong></span>
                  {lastContributionInfo && (
                    <>
                      <span className="text-slate-600">|</span>
                      <span className="text-emerald-300">💰 Last: <strong className="text-white">KES {lastContributionInfo.amount.toLocaleString()}</strong> ({lastContributionInfo.senderName})</span>
                    </>
                  )}
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">✓ Totals Updated • Firestore Synced</span>
                </>
              ) : connectionStatus === "reconnecting" ? (
                <span className="text-amber-400">Connecting to live ledger gateway...</span>
              ) : (
                <span className="text-rose-400">Offline • Waiting for network reconnection</span>
              )}
            </div>
          </div>
        </div>

        {/* Action controls including Simulated payment triggers for demonstration */}
        <div className="flex items-center gap-2.5">
          {isDemoMode && (
            <button
              onClick={handleTriggerSimulatedPayment}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-lg transition uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
              id="live-center-sim-btn"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Simulate Contribution
            </button>
          )}
          <button
            onClick={() => handleCopyClipboard(`${window.location.origin}/#/campaign/${activeProject.id}`, "Portal Link")}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Copy Portal Link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --- LIVE STATS GRID & MAIN CARD CONTAINER --- */}
      <div className="p-6 space-y-6">
        
        {/* Progress Odometer Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Visual Progress Card */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                    {activeProject.campaignCategory || activeProject.category || "General Harambee"} Campaign
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 truncate">
                    {activeProject.name}
                  </h1>
                </div>
                <div className="px-3 py-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg font-mono font-black text-sm">
                  {percentComplete}% Complete
                </div>
              </div>

              {/* Dynamic Numbers Odometer Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Raised Instantly</span>
                  <div className="text-xl font-black text-white mt-1 font-sans flex items-baseline">
                    <span className="text-xs text-emerald-400 mr-1">KES</span>
                    {animatedTotalRaised.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Remaining Needed</span>
                  <div className="text-xl font-black text-slate-300 mt-1 font-sans flex items-baseline">
                    <span className="text-xs text-slate-400 mr-1">KES</span>
                    {remainingNeeded.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Target Goal</span>
                  <div className="text-xl font-black text-emerald-400 mt-1 font-sans flex items-baseline">
                    <span className="text-xs text-emerald-500/70 mr-1">KES</span>
                    {targetAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Smooth Progress Easing Slider Bar */}
              <div className="space-y-2 pt-2">
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentComplete}%` }}
                    transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Live updating • No page refreshing needed
              </span>
              <span>14 Days Remaining</span>
            </div>
          </div>

          {/* AI Narrative Analytics Engine Side-Panel */}
          <div className="lg:col-span-4 bg-linear-to-b from-slate-900/80 to-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">
                  AI Daily Briefing & Momentum
                </h4>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-900 relative">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{aiNarrative}"
                </p>
                {totalSupporters > 0 && (
                  <div className="absolute -bottom-1.5 right-3 px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-[9px] text-emerald-400 font-mono rounded">
                    VELOCITY HIGH
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900/60">
              <div className="p-2.5 bg-slate-950/40 rounded-lg text-center">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Momentum</span>
                <span className="text-sm font-black text-white font-mono">{momentumScore}%</span>
              </div>
              <div className="p-2.5 bg-slate-950/40 rounded-lg text-center">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Conversion</span>
                <span className="text-sm font-black text-emerald-400 font-mono">92.4%</span>
              </div>
            </div>
          </div>

        </div>

        {/* --- COMMUNITY LIVE STATISTICS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="live-command-statistics-grid">
          
          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/5 text-emerald-400 rounded-lg shrink-0 border border-emerald-500/10">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Total Supporters</span>
              <span className="text-base font-extrabold text-white font-sans block mt-0.5">{totalSupporters}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/5 text-sky-400 rounded-lg shrink-0 border border-sky-500/10">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Average Contribution</span>
              <span className="text-base font-extrabold text-white font-sans block mt-0.5">KES {averageGift.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/5 text-amber-400 rounded-lg shrink-0 border border-amber-500/10">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Largest Gift</span>
              <span className="text-base font-extrabold text-white font-sans block mt-0.5">KES {largestGift.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/5 text-indigo-400 rounded-lg shrink-0 border border-indigo-500/10">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Outstanding Pledges</span>
              <span className="text-base font-extrabold text-white font-sans block mt-0.5">KES {outstandingPledges.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* --- DYNAMIC TIMELINE STREAM FEED --- */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">
                Real-Time Ledger Stream
              </h4>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "All Logs" },
                { id: "contributions", label: "Donations Only" },
                { id: "pledges", label: "Pledge Cards" },
                { id: "milestones", label: "Milestones" }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveTab(pill.id as any)}
                  className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === pill.id 
                      ? "bg-slate-900 text-emerald-400 border border-slate-800" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Scroll Feed wrapper */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
            <AnimatePresence initial={false}>
              {unifiedEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Activity className="w-8 h-8 text-slate-800 mx-auto animate-pulse" />
                  <p className="text-xs font-mono">No matching activity timeline entries found.</p>
                </div>
              ) : (
                unifiedEvents.map((event) => {
                  const isContribution = event.type === "contribution" || event.type === "pledge_fulfilled";
                  const isPledge = event.type === "pledge";
                  const isMilestone = event.type === "milestone" || event.type === "goal_achieved";

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className={`p-4 rounded-xl border flex gap-4 transition-all hover:bg-slate-900/40 ${
                        isMilestone 
                          ? "bg-amber-950/10 border-amber-500/20" 
                          : isPledge
                          ? "bg-sky-950/10 border-sky-500/20"
                          : "bg-slate-900/20 border-slate-900"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border text-base font-extrabold ${
                        isMilestone
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : isPledge
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}>
                        {isMilestone ? "🏆" : isPledge ? "📝" : "💰"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-bold text-white uppercase tracking-tight">
                                {viewMode === "public" && isContribution && event.isAnonymous
                                  ? "Generous Well-wisher"
                                  : event.title
                                }
                              </h5>
                              {isContribution && event.ledgerStatus === "duplicate_flag" && (
                                <span className="px-1.5 py-0.2 bg-rose-500/10 border border-rose-500/20 text-[8px] text-rose-400 rounded uppercase font-mono font-bold animate-pulse">
                                  Duplicate Rejected
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {new Date(event.timestamp).toLocaleString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          </div>

                          {event.amount && (
                            <span className={`font-mono text-xs font-black whitespace-nowrap ${isPledge ? "text-sky-400" : "text-emerald-400"}`}>
                              {isPledge ? "Pledge" : "+"} KES {event.amount.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          {event.description}
                        </p>

                        {/* --- ORGANIZER SECURE LEDGER EXPANSION PANEL --- */}
                        {viewMode === "organizer" && (isContribution || isPledge) && (
                          <div className="mt-3 pt-2 border-t border-slate-900/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[9px] font-mono text-slate-500">
                            <div>
                              <span>SENDER PHONE</span>
                              <strong className="block text-slate-300 mt-0.5">{event.phone || "Unknown Phone"}</strong>
                            </div>
                            {event.receiptNumber && (
                              <div>
                                <span>RECEIPT CODE</span>
                                <strong className="block text-slate-300 mt-0.5 uppercase tracking-wider">{event.receiptNumber}</strong>
                              </div>
                            )}
                            <div>
                              <span>LEDGER AUDIT</span>
                              <strong className={`block mt-0.5 uppercase ${event.ledgerStatus === "duplicate_flag" ? "text-rose-400" : "text-emerald-400"}`}>
                                {event.ledgerStatus === "duplicate_flag" ? "BLOCK REJECTED" : "COMMITTED & COMPLIANT"}
                              </strong>
                            </div>
                            {event.whatsappStatus && (
                              <div>
                                <span>WHATSAPP DISPATCH</span>
                                <strong className="block text-emerald-400 mt-0.5 uppercase">BROADCAST OK</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* --- FLOATING CELEBRATION MODAL BANNER --- */}
      <AnimatePresence>
        {activeMilestoneNotification && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-3xl relative overflow-hidden"
            >
              {/* Subtle looping particles layout in background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

              <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce">
                🏆
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block">
                  Campaign Milestone achieved
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {activeMilestoneNotification.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {activeMilestoneNotification.description}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 text-left text-xs font-mono text-slate-300">
                {activeMilestoneNotification.shareText.substring(0, 150)}...
              </div>

              <div className="flex gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(activeMilestoneNotification.shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Post WhatsApp Update
                </a>
                <button
                  onClick={() => setActiveMilestoneNotification(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Dismiss [X]
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Overlay Notification */}
      <AnimatePresence>
        {copiedText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300">{copiedText}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
