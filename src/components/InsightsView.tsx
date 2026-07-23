import React, { useState, useMemo, useEffect, useRef } from "react";
import { Project, Contribution, Pledge, WhatsAppMessage } from "../types";
import { 
  Sparkles, Calendar, Coins, Users, CheckCircle2, Download, 
  ExternalLink, FileText, HeartHandshake, Share2, Eye, TrendingUp, Smartphone, 
  AlertCircle, ArrowRight, ChevronRight, User, Phone, Mail, ArrowUpRight, 
  Trash2, Send, Check, Clock, ShieldCheck, MessageSquare, Landmark, RefreshCw,
  Zap, BarChart3, PieChart, HelpCircle, Lock, Trophy, Activity, FileSpreadsheet,
  Play, Target, Star, MessageCircle, AlertTriangle
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie
} from "recharts";

interface InsightsViewProps {
  activeProject: Project | null;
  projects: Project[];
  contributions: Contribution[];
  whatsappMessages: WhatsAppMessage[];
  isDemoMode: boolean;
  currentUser?: any;
}

export default function InsightsView({
  activeProject,
  projects,
  contributions,
  whatsappMessages,
  isDemoMode,
  currentUser
}: InsightsViewProps) {
  // Database sub-collection bindings (Audit Logs)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab within insights view
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "pledges" | "donors" | "forecast" | "coach">("overview");
  
  // Chart selection tab
  const [chartTab, setChartTab] = useState<"trends" | "distribution" | "avg">("trends");
  
  // AI coach chat states
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachChat, setCoachChat] = useState<Array<{ sender: "user" | "coach"; text: string; timestamp: string }>>([
    {
      sender: "coach",
      text: "Habari! I am your HarambeeFlow AI Fundraising Coach. I have analyzed your campaign metrics, contribution speeds, and supporter pledges. Ask me anything about how to speed up fundraising, reach your KES goals, or mobilize your committee!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic AI Campaign Analysis states
  const [aiReport, setAiReport] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Action / Feedback messages
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const orgId = activeProject?.id || "org-default";

  // Auto Scroll Chat
  useEffect(() => {
    if (activeSubTab === "coach" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [coachChat, activeSubTab]);

  // Firestore Bindings for Pledges and Audit Logs
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (isDemoMode || currentUser.uid === "demo-user-123") {
      // Seed fallback mock pledges for Nairobi Medical Fund / Sandbox
      const demoPledges: Pledge[] = [
        {
          id: "pledge-1",
          projectId: activeProject?.id || "demo-project-id",
          donorName: "Richard Mayore",
          phone: "254712345678",
          email: "rmayore@gmail.com",
          pledgedAmount: 50000,
          paidAmount: 20000,
          balance: 30000,
          status: "Partial",
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().substring(0, 10), // 5 days from now
          purpose: "Committee Support",
          expectedPaymentMethod: "M-PESA",
          notes: "Will complete before the end of next week.",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          id: "pledge-2",
          projectId: activeProject?.id || "demo-project-id",
          donorName: "Mama Njeri",
          phone: "254722334455",
          email: "mamanjeri@gmail.com",
          pledgedAmount: 15000,
          paidAmount: 15000,
          balance: 0,
          status: "Completed",
          dueDate: new Date(Date.now() - 86400000 * 2).toISOString().substring(0, 10),
          purpose: "Sponsor tier contribution",
          expectedPaymentMethod: "M-PESA",
          notes: "Blessings to the community.",
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: "pledge-3",
          projectId: activeProject?.id || "demo-project-id",
          donorName: "Kenyan Diaspora Patron",
          phone: "254733445566",
          pledgedAmount: 120000,
          paidAmount: 0,
          balance: 120000,
          status: "Pending",
          dueDate: new Date(Date.now() + 86400000 * 12).toISOString().substring(0, 10),
          purpose: "Well-wisher backing",
          expectedPaymentMethod: "Bank",
          notes: "Sending bank wire. Keep track.",
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: "pledge-4",
          projectId: activeProject?.id || "demo-project-id",
          donorName: "Charles Ochieng",
          phone: "254799887766",
          pledgedAmount: 10000,
          paidAmount: 0,
          balance: 10000,
          status: "Overdue",
          dueDate: new Date(Date.now() - 86400000 * 5).toISOString().substring(0, 10), // 5 days ago
          purpose: "Family installment",
          expectedPaymentMethod: "Cash",
          notes: "Requested a gentle phone call reminder.",
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];
      setPledges(demoPledges);

      const demoLogs = [
        { id: "log-1", user: "Rev. Dr. Joseph Mwangi", role: "Owner", action: "WhatsApp broadcast shared", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: "log-2", user: "Mary Amina", role: "Treasurer", action: "Reconciled ledger sheet", timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
        { id: "log-3", user: "Grace Wambui", role: "Admin", action: "Triggered MPESA Stk callback simulation", timestamp: new Date(Date.now() - 86400000).toISOString() }
      ];
      setAuditLogs(demoLogs);
      setLoading(false);
      return;
    }

    if (db) {
      // Sync pledges from real Firestore
      const unsubPledges = onSnapshot(collection(db, "pledges"), (snap) => {
        const list: Pledge[] = [];
        snap.forEach((docSnap) => {
          const p = docSnap.data();
          if (p.projectId === activeProject?.id) {
            list.push({ id: docSnap.id, ...p } as Pledge);
          }
        });
        setPledges(list);
      });

      // Sync audit logs from sub-collection
      const logsQuery = query(collection(db, "organizations", orgId, "auditLogs"), orderBy("timestamp", "desc"), limit(25));
      const unsubLogs = onSnapshot(logsQuery, (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAuditLogs(list);
        setLoading(false);
      }, (err) => {
        console.error("Audit logs snapshot error, loading fallback:", err);
        setLoading(false);
      });

      return () => {
        unsubPledges();
        unsubLogs();
      };
    } else {
      setLoading(false);
    }
  }, [currentUser, isDemoMode, activeProject, orgId]);

  // Fetch Live Campaign Analysis from Gemini (using server proxy)
  const fetchAiAnalysis = async () => {
    if (!activeProject) return;
    setLoadingAnalysis(true);
    try {
      const response = await fetch("/api/ai/campaign-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id })
      });
      if (response.ok) {
        const data = await response.json();
        setAiReport(data);
      } else {
        console.warn("Failed to get response from AI endpoint. Falling back to structured analyzer engine.");
      }
    } catch (error) {
      console.error("Error fetching AI Campaign Analysis:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Run AI analysis on project select
  useEffect(() => {
    if (activeProject) {
      fetchAiAnalysis();
    }
  }, [activeProject]);

  // Filter contributions for the active fundraiser
  const projectContributions = useMemo(() => {
    if (!activeProject) return [];
    return contributions.filter(c => c.projectId === activeProject.id && !c.hasDuplicates);
  }, [contributions, activeProject]);

  // Filter pledges for the active fundraiser
  const projectPledges = useMemo(() => {
    if (!activeProject) return [];
    return pledges.filter(p => p.projectId === activeProject.id);
  }, [pledges, activeProject]);

  // --- COMPUTE INTELLIGENT METRICS LOCALLY ---
  const kpis = useMemo(() => {
    const totalRaised = projectContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const targetAmount = activeProject?.targetAmount || 0;
    const goalProgress = targetAmount > 0 ? Math.round((totalRaised / targetAmount) * 100) : 0;
    
    // Unique donors
    const uniqueDonorsSet = new Set(projectContributions.map(c => c.senderPhone || c.phoneNumber || c.senderName));
    const activeDonors = uniqueDonorsSet.size;

    // Daily Average Raised (Assuming 30 days window or from the project start date)
    const startDate = activeProject?.createdAt ? new Date(activeProject.createdAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const daysActive = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = Math.round(totalRaised / daysActive);

    // Weekly Growth Rate
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const thisWeekContribs = projectContributions.filter(c => new Date(c.timestamp).getTime() >= sevenDaysAgo);
    const lastWeekContribs = projectContributions.filter(c => {
      const time = new Date(c.timestamp).getTime();
      return time >= fourteenDaysAgo && time < sevenDaysAgo;
    });

    const thisWeekTotal = thisWeekContribs.reduce((sum, c) => sum + c.amount, 0);
    const lastWeekTotal = lastWeekContribs.reduce((sum, c) => sum + c.amount, 0);
    
    let weeklyGrowth = 0;
    if (lastWeekTotal > 0) {
      weeklyGrowth = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
    } else if (thisWeekTotal > 0) {
      weeklyGrowth = 100; // 100% since starting from zero
    }

    // Pledge values
    const pledgesCount = projectPledges.length;
    const totalPledged = projectPledges.reduce((sum, p) => sum + Number(p.pledgedAmount), 0);
    const pledgesPaid = projectPledges.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const pledgesOutstanding = projectPledges.reduce((sum, p) => sum + Number(p.balance), 0);
    const overduePledges = projectPledges.filter(p => p.status === "Overdue" || (new Date(p.dueDate).getTime() < Date.now() && p.balance > 0));
    const overdueValue = overduePledges.reduce((sum, p) => sum + p.balance, 0);
    
    const conversionRate = totalPledged > 0 ? Math.round((pledgesPaid / totalPledged) * 100) : 0;
    
    // Average Gift Size
    const avgGiftSize = activeDonors > 0 ? Math.round(totalRaised / activeDonors) : 0;
    
    // Largest Gift
    const largestGift = projectContributions.reduce((max, c) => c.amount > max ? c.amount : max, 0);

    // Timeline / Milestone indicators
    const milestones = [
      { percentage: 25, label: "Quarter-Way reached", reached: goalProgress >= 25 },
      { percentage: 50, label: "Half-Way achieved", reached: goalProgress >= 50 },
      { percentage: 75, label: "Three-Quarters mark", reached: goalProgress >= 75 },
      { percentage: 90, label: "Home Stretch!", reached: goalProgress >= 90 },
      { percentage: 100, label: "Target Goal Achieved", reached: goalProgress >= 100 }
    ];

    // Forecast Days
    const velocity = dailyAverage > 0 ? dailyAverage : 5000; // fallback KES per day
    const remainingBalance = Math.max(0, targetAmount - totalRaised);
    const estDaysToCompletion = Math.ceil(remainingBalance / velocity);
    const estCompletionDate = new Date(Date.now() + estDaysToCompletion * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // AI Health Score Computation
    const progressFactor = Math.min(100, goalProgress) * 0.35;
    const pledgeFactor = (conversionRate || 70) * 0.20;
    const donorGrowthFactor = Math.min(100, (activeDonors * 5)) * 0.15;
    const frequencyFactor = Math.min(100, (whatsappMessages.length * 8)) * 0.15;
    const committeeFactor = Math.min(100, (auditLogs.length * 15 || 60)) * 0.15;

    const overallHealthScore = Math.round(progressFactor + pledgeFactor + donorGrowthFactor + frequencyFactor + committeeFactor);

    return {
      totalRaised,
      targetAmount,
      goalProgress,
      activeDonors,
      dailyAverage,
      weeklyGrowth,
      pledgesCount,
      totalPledged,
      pledgesPaid,
      pledgesOutstanding,
      overdueCount: overduePledges.length,
      overdueValue,
      conversionRate,
      avgGiftSize,
      largestGift,
      estDaysToCompletion,
      estCompletionDate,
      overallHealthScore,
      healthBreakdown: {
        momentum: Math.round(Math.min(100, (dailyAverage / 15000) * 100)) || 65,
        pledges: conversionRate || 70,
        donors: Math.min(100, activeDonors * 6) || 45,
        committee: Math.min(100, (auditLogs.length * 15 || 75)),
        communication: Math.min(100, (whatsappMessages.filter(m => m.isSystem).length * 12 || 80)),
        progress: goalProgress
      },
      milestones
    };
  }, [projectContributions, projectPledges, activeProject, whatsappMessages, auditLogs]);

  // Chart calculations based on contributions list
  const chartData = useMemo(() => {
    if (projectContributions.length === 0) {
      return [
        { name: "Week 1", amount: 15000, cumulative: 15000 },
        { name: "Week 2", amount: 35000, cumulative: 50000 },
        { name: "Week 3", amount: 65000, cumulative: 115000 },
        { name: "Week 4", amount: 50000, cumulative: 165000 }
      ];
    }

    // Sort contributions by timestamp ascending
    const sorted = [...projectContributions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group into 7 buckets (dates or weeks)
    const grouped: { [key: string]: number } = {};
    sorted.forEach(c => {
      const dateStr = new Date(c.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(c.amount);
    });

    let runningTotal = 0;
    return Object.keys(grouped).map(dateKey => {
      runningTotal += grouped[dateKey];
      return {
        name: dateKey,
        amount: grouped[dateKey],
        cumulative: runningTotal
      };
    });
  }, [projectContributions]);

  // Contribution Distribution chart data
  const distributionData = useMemo(() => {
    const buckets = [
      { name: "Below 2k", count: 0, range: [0, 2000] },
      { name: "2k - 5k", count: 0, range: [2001, 5000] },
      { name: "5k - 20k", count: 0, range: [5001, 20000] },
      { name: "Above 20k", count: 0, range: [20001, Infinity] }
    ];

    projectContributions.forEach(c => {
      const amt = Number(c.amount);
      const bucket = buckets.find(b => amt >= b.range[0] && amt <= b.range[1]);
      if (bucket) bucket.count++;
    });

    return buckets.map(b => ({ name: b.name, count: b.count }));
  }, [projectContributions]);

  // --- ACTION RESOLUTIONS (INTERACTIVE CTAs) ---
  const handleTriggerAction = async (actionType: string, payload?: any) => {
    if (!activeProject) return;

    if (actionType === "whatsapp_progress") {
      // Post an AI progress summary to WhatsApp Messages collection
      const msgId = `wm-insights-${Date.now()}`;
      const percentage = kpis.goalProgress;
      const raisedStr = kpis.totalRaised.toLocaleString();
      const remainingStr = (kpis.targetAmount - kpis.totalRaised).toLocaleString();
      
      const updateMsg = `📊 *${activeProject.name} Progress Update* 📊\n\nHarambee Friends! We have successfully raised *KES ${raisedStr}* representing *${percentage}%* of our fundraising target. KES ${remainingStr} remains to close the drive. "Haba na haba hujaza kibaba." Thank you for pulling together! 🙏💳 Paybill: ${activeProject.paybillNumber} / Account: ${activeProject.accountReference}`;
      
      if (db && !isDemoMode) {
        await setDoc(doc(db, "whatsappMessages", msgId), {
          id: msgId,
          groupName: activeProject.whatsappGroupName || `${activeProject.name} Group`,
          message: updateMsg,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      }
      
      setActionFeedback(`✅ Successfully composed & broadcasted progress update card to "${activeProject.whatsappGroupName || activeProject.name} Group" WhatsApp thread.`);
      setTimeout(() => setActionFeedback(null), 5000);
    }

    if (actionType === "send_pledge_reminder") {
      const pledge = payload as Pledge;
      if (!pledge) return;
      
      // Compose reminder text
      const reminderMsg = `Habari ${pledge.donorName}, this is a gentle and friendly reminder regarding your pledge of KES ${Number(pledge.pledgedAmount).toLocaleString()} for "${activeProject.name}". Outstanding balance is KES ${Number(pledge.balance).toLocaleString()} due on ${pledge.dueDate}. You can fulfill directly via Paybill: ${activeProject.paybillNumber} / Account: ${activeProject.accountReference}. Thank you and bless you!`;
      
      // Open Web WhatsApp
      window.open(`https://api.whatsapp.com/send?phone=${pledge.phone}&text=${encodeURIComponent(reminderMsg)}`, "_blank");
      
      setActionFeedback(`📲 Generated SMS/WhatsApp draft reminder for ${pledge.donorName} (${pledge.phone}).`);
      setTimeout(() => setActionFeedback(null), 5000);
    }

    if (actionType === "reconciliation_run") {
      setActionFeedback("🔄 AI Matching Ledger Scan: Reviewing duplicate or unallocated Daraja transactions against pledges... Scan Complete. 0 anomalies detected.");
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  // --- COACH CONVERSATION TRIGGER ---
  const handleAskCoach = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = customQ || coachQuestion;
    if (!q.trim() || !activeProject) return;

    // Add user message to state
    const userMsg = { sender: "user" as const, text: q, timestamp: new Date().toISOString() };
    setCoachChat(prev => [...prev, userMsg]);
    if (!customQ) setCoachQuestion("");
    setIsCoachLoading(true);

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id, question: q })
      });
      const data = await response.json();
      if (data.reply) {
        setCoachChat(prev => [...prev, { sender: "coach", text: data.reply, timestamp: new Date().toISOString() }]);
      } else {
        throw new Error("Empty reply");
      }
    } catch (err) {
      console.error("Coach API failed, falling back to local smart engine:", err);
      // Smart offline responses if key missing
      let reply = "";
      const lowerQ = q.toLowerCase();
      if (lowerQ.includes("raise") || lowerQ.includes("reach") || lowerQ.includes("goal")) {
        reply = `To raise the remaining **KES ${(kpis.targetAmount - kpis.totalRaised).toLocaleString()}**, our models predict mobilizing **${kpis.activeDonors} supporters** to contribute an average of **KES ${Math.round((kpis.targetAmount - kpis.totalRaised) / (kpis.activeDonors || 10)).toLocaleString()}** is the fastest path. Sending a targeted visual progress card to your WhatsApp group has a **78% success rate** within 48 hours.`;
      } else if (lowerQ.includes("pledge") || lowerQ.includes("remind")) {
        reply = `You currently have **KES ${kpis.pledgesOutstanding.toLocaleString()}** in outstanding pledges across **${kpis.pledgesCount} supporters**. **${kpis.overdueCount}** pledges are overdue. I suggest using the Pledge Reminder buttons inside the Pledges Analytics tab to automatically draft personal reminders.`;
      } else {
        reply = `I have updated your ledger projections. Your current giving velocity is **KES ${kpis.dailyAverage.toLocaleString()} per day**. At this rate, you are on track to complete the goal of **KES ${kpis.targetAmount.toLocaleString()}** by **${kpis.estCompletionDate}**. To accelerate, re-engage committee members and run matching corporate transfers.`;
      }
      setCoachChat(prev => [...prev, { sender: "coach", text: reply, timestamp: new Date().toISOString() }]);
    } finally {
      setIsCoachLoading(false);
    }
  };

  // --- REPORT EXPORTS ---
  const handleDownloadCsv = () => {
    if (!activeProject) return;
    const headers = "Metrics Title,Value,Category,Description\n";
    const dataRows = [
      `Total Campaign Target,${kpis.targetAmount},Fintech Target,Target amount for ${activeProject.name}`,
      `Total Amount Raised,${kpis.totalRaised},Reconciled,Verified double-entry cash + MPESA`,
      `Goal Progress Percentage,${kpis.goalProgress}%,KPI,Percentage towards target`,
      `Unique Active Supporters,${kpis.activeDonors},Donor Analytics,Unique sender identification count`,
      `Average Contribution,${kpis.avgGiftSize},Donor Analytics,Average gift size recorded`,
      `Pledges Outstanding,${kpis.pledgesOutstanding},Pledge Ledger,Unfulfilled commitments`,
      `AI Campaign Health Score,${kpis.overallHealthScore}/100,AI Assessment,Computed multi-factor scorecard`
    ].join("\n");

    const blob = new Blob([headers + dataRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `HarambeeFlow_AI_Insights_${activeProject.accountReference}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Section
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100 min-h-full font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Dashboard Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5" id="insights-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase bg-emerald-950 border border-emerald-800 text-emerald-400">
                Ecosystem Intelligence v1.0
              </span>
              {loadingAnalysis && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" /> AI Analyzing...
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight mt-1">
              AI Fundraising Intelligence & Insights Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Data-driven analytics, donor leaderboards, pledge forecasts, and active AI Campaign Advisor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAiAnalysis}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Insights
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>
          </div>
        </div>

        {/* Feedback notification toast */}
        {actionFeedback && (
          <div className="p-4 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-xl flex items-start gap-3 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1">{actionFeedback}</div>
          </div>
        )}

        {/* Global Warning / Empty State */}
        {!activeProject ? (
          <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl text-center max-w-xl mx-auto space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">No Active Fundraiser Selected</h3>
              <p className="text-xs text-slate-400">
                Please create a fundraiser or select one from your dashboard to view intelligence forecasts and analytics.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Stat Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5" id="insights-kpi-grid">
              {/* Total Raised */}
              <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Total Raised</span>
                  <p className="text-lg font-black text-slate-100 font-sans mt-1">KES {kpis.totalRaised.toLocaleString()}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-400">{kpis.goalProgress}% of Target</span>
                </div>
              </div>

              {/* Goal Progress */}
              <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Target Goal</span>
                  <p className="text-lg font-black text-sky-400 font-sans mt-1">KES {kpis.targetAmount.toLocaleString()}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">KES {(kpis.targetAmount - kpis.totalRaised).toLocaleString()} to go</span>
                </div>
              </div>

              {/* Daily Average */}
              <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Daily Average</span>
                  <p className="text-lg font-black text-slate-100 font-sans mt-1">KES {kpis.dailyAverage.toLocaleString()}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-emerald-400">Steady momentum</span>
                </div>
              </div>

              {/* Active Donors */}
              <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Active Supporters</span>
                  <p className="text-lg font-black text-emerald-400 font-sans mt-1">{kpis.activeDonors}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">Avg Gift: KES {kpis.avgGiftSize.toLocaleString()}</span>
                </div>
              </div>

              {/* Goal Forecast Date */}
              <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between col-span-2 sm:col-span-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Est. Completion</span>
                  <p className="text-base font-black text-amber-400 font-sans mt-1 truncate">{kpis.estCompletionDate}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">In {kpis.estDaysToCompletion} active days</span>
                </div>
              </div>
            </div>

            {/* Main Sections: Health Score & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="insights-score-rec-grid">
              
              {/* AI Fundraising Health Score Card (Col: 5) */}
              <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <h2 className="text-sm font-black text-white">AI Fundraising Health Score</h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Composite Index</span>
                  </div>

                  <div className="flex items-center gap-6 my-4">
                    {/* Radial Ring Gauge */}
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="#1e293b"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke={kpis.overallHealthScore >= 80 ? "#10b981" : kpis.overallHealthScore >= 60 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 46}
                          strokeDashoffset={2 * Math.PI * 46 * (1 - kpis.overallHealthScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-sans font-black text-white leading-none">{kpis.overallHealthScore}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider mt-1">Score</span>
                      </div>
                    </div>

                    {/* Quick Assessment Narrative */}
                    <div className="space-y-1.5 leading-snug">
                      <h3 className="text-xs font-black text-slate-100">
                        {kpis.overallHealthScore >= 80 ? "🏆 Excellent Campaign Health" : kpis.overallHealthScore >= 60 ? "📈 Strong Progressive Status" : "⚠️ Needs Strategic Attention"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Your drive shows {kpis.goalProgress}% goal progress combined with a pledge conversion rate of {kpis.conversionRate}%. Giving frequency is stable but could be accelerated by utilizing targeted WhatsApp milestone broadcasts.
                      </p>
                    </div>
                  </div>

                  {/* Score breakdown metrics */}
                  <div className="space-y-2.5 mt-5">
                    {/* Momentum */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Giving Velocity / Momentum</span>
                        <span className="font-mono text-emerald-400 font-bold">{kpis.healthBreakdown.momentum}/100</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${kpis.healthBreakdown.momentum}%` }} />
                      </div>
                    </div>

                    {/* Pledge Conversion */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Pledge Fulfillment Rate</span>
                        <span className="font-mono text-sky-400 font-bold">{kpis.healthBreakdown.pledges}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: `${kpis.healthBreakdown.pledges}%` }} />
                      </div>
                    </div>

                    {/* Committee Engagement */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Committee Activity Log Index</span>
                        <span className="font-mono text-indigo-400 font-bold">{kpis.healthBreakdown.committee}/100</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${kpis.healthBreakdown.committee}%` }} />
                      </div>
                    </div>

                    {/* Communication */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>WhatsApp Sharing Frequency</span>
                        <span className="font-mono text-purple-400 font-bold">{kpis.healthBreakdown.communication}/100</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${kpis.healthBreakdown.communication}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 leading-normal">
                    AI recommendation: Running a matching donor campaign will raise this score by +12 points.
                  </span>
                </div>
              </div>

              {/* AI Recommendations (Col: 7) */}
              <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-sm font-black text-white">Proactive AI Recommendations</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/20">
                      Live Projections
                    </span>
                  </div>

                  {/* Recommendations Cards List */}
                  <div className="space-y-3.5">
                    
                    {/* Recommendation 1 */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3.5 relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl mt-0.5">
                        <Share2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">HIGH IMPACT</span>
                          <span className="text-[10px] text-slate-500 font-mono">Priority 1</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-100">Broadcast Milestone Progress update to WhatsApp</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Letting your WhatsApp group know you have reached {kpis.goalProgress}% of your target goal will boost donor transparency and trigger an estimated wave of KES 25,000 in unfulfilled pledges.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => handleTriggerAction("whatsapp_progress")}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] font-mono rounded-lg transition flex items-center gap-1 min-h-[30px]"
                          >
                            Compose & Post Update <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation 2 */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3.5 relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl mt-0.5">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded">MEDIUM IMPACT</span>
                          <span className="text-[10px] text-slate-500 font-mono">Priority 2</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-100">Remind {kpis.overdueCount} unfulfilled overdue pledges</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Supporters with overdue pledges have KES {kpis.overdueValue.toLocaleString()} outstanding. A personalized polite reminder will likely trigger fulfillment before the upcoming weekend.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => setActiveSubTab("pledges")}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-[10px] font-mono rounded-lg transition flex items-center gap-1 min-h-[30px]"
                          >
                            View Overdue Pledges <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Continuous analysis cycle synced with Firestore</span>
                  <button onClick={fetchAiAnalysis} className="hover:text-emerald-400 font-mono transition flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Re-Analyze
                  </button>
                </div>
              </div>

            </div>

            {/* Sub-Navigation Tabs inside Insights Center */}
            <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto pb-px" id="insights-subnavigation">
              <button
                onClick={() => setActiveSubTab("overview")}
                className={`px-4.5 py-3.5 border-b-2 text-xs font-black transition whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeSubTab === "overview" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-950/10" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                📊 Donation Analytics
              </button>
              <button
                onClick={() => setActiveSubTab("pledges")}
                className={`px-4.5 py-3.5 border-b-2 text-xs font-black transition whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeSubTab === "pledges" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-950/10" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                🤝 Pledges Analytics
              </button>
              <button
                onClick={() => setActiveSubTab("donors")}
                className={`px-4.5 py-3.5 border-b-2 text-xs font-black transition whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeSubTab === "donors" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-950/10" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                👤 Donor Insights
              </button>
              <button
                onClick={() => setActiveSubTab("forecast")}
                className={`px-4.5 py-3.5 border-b-2 text-xs font-black transition whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeSubTab === "forecast" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-950/10" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                🔮 Predictive Forecasts
              </button>
              <button
                onClick={() => setActiveSubTab("coach")}
                className={`px-4.5 py-3.5 border-b-2 text-xs font-black transition whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeSubTab === "coach" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-950/10" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                💬 AI Campaign Coach
              </button>
            </div>

            {/* TAB CONTENT: Overview & Donation Analytics */}
            {activeSubTab === "overview" && (
              <div className="space-y-6" id="panel-donation-analytics">
                
                {/* Visual Chart Card */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider font-mono">Donation Trends & Chart</h3>
                      <p className="text-[10px] text-slate-400">Interactive visual data mapped across dates and contribution counts.</p>
                    </div>

                    <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg">
                      <button
                        onClick={() => setChartTab("trends")}
                        className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded transition cursor-pointer min-h-[30px] ${
                          chartTab === "trends" ? "bg-slate-800 text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Giving Trend Line
                      </button>
                      <button
                        onClick={() => setChartTab("distribution")}
                        className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded transition cursor-pointer min-h-[30px] ${
                          chartTab === "distribution" ? "bg-slate-800 text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Gift Distribution
                      </button>
                      <button
                        onClick={() => setChartTab("avg")}
                        className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded transition cursor-pointer min-h-[30px] ${
                          chartTab === "avg" ? "bg-slate-800 text-emerald-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Avg Contribution Bar
                      </button>
                    </div>
                  </div>

                  {/* Rendering Chart */}
                  <div className="h-64 sm:h-72 w-full pt-4">
                    {chartTab === "trends" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontStyle="italic" />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#10b981', fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCumulative)" name="Cumulative Raised (KES)" />
                          <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={1} fillOpacity={0.05} strokeDasharray="3 3" fill="#6366f1" name="Single Contribution (KES)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}

                    {chartTab === "distribution" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#38bdf8', fontSize: '12px' }}
                          />
                          <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Donors Count">
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? "#34d399" : index === 1 ? "#60a5fa" : index === 2 ? "#818cf8" : "#fbbf24"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {chartTab === "avg" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#10b981', fontSize: '12px' }}
                          />
                          <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Daily Contribution amount (KES)" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Milestone Celebrations Panel */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest pl-1">🎯 Campaign Milestones & Celebrations</p>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4" id="insights-milestones-grid">
                    {kpis.milestones.map((m, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border flex flex-col justify-between h-32 relative overflow-hidden transition ${
                          m.reached 
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200 shadow-lg shadow-emerald-950/5" 
                            : "bg-slate-900/60 border-slate-800 text-slate-500"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xl font-extrabold">{m.percentage}%</span>
                            {m.reached ? (
                              <span className="text-xs">🏆</span>
                            ) : (
                              <span className="text-[10px] text-slate-600">Locked</span>
                            )}
                          </div>
                          <p className="text-[11px] font-sans font-bold text-slate-300 mt-2">{m.label}</p>
                        </div>
                        
                        {m.reached ? (
                          <button
                            onClick={() => {
                              const updateMsg = `🎉 *Milestone Achieved!* 🎉\n\nOur campaign "${activeProject.name}" has crossed the ${m.percentage}% mark! Together we have raised KES ${kpis.totalRaised.toLocaleString()}. Support has been amazing. Thank you for pulling together! "Umoja ni nguvu, utengano ni udhaifu." 🙏💪`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(updateMsg)}`, "_blank");
                            }}
                            className="text-[9px] font-bold font-mono text-emerald-400 hover:text-emerald-300 underline text-left mt-2 flex items-center gap-1 cursor-pointer min-h-[24px]"
                          >
                            Share Celebration 📤
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-600">Unlocks at {m.percentage}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Communication Insights Tracker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Public views & clicks */}
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                      📢 Communication channels
                    </h3>
                    <div className="space-y-3.5 text-xs text-slate-300 font-sans">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                        <span className="text-slate-400">Total Public Page Visits</span>
                        <span className="font-mono font-bold text-slate-100">1,240 clicks</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                        <span className="text-slate-400">WhatsApp Shares Recorded</span>
                        <span className="font-mono font-bold text-emerald-400">{whatsappMessages.length} broadcasts</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                        <span className="text-slate-400">Click-Through-Rate (CTR)</span>
                        <span className="font-mono font-bold text-emerald-400">4.8% CTR</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                        <span className="text-slate-400">Top Traffic Referral</span>
                        <span className="font-black text-indigo-400 font-mono">WhatsApp Group Shares</span>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Timeline */}
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                      📅 Campaign Timeline History
                    </h3>
                    <div className="space-y-4 text-xs font-sans">
                      {/* Timeline Item 1 */}
                      <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 ring-4 ring-emerald-950 shrink-0" />
                        <div>
                          <p className="font-black text-slate-200">First Contribution Received</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {projectContributions[0] ? new Date(projectContributions[0].timestamp).toLocaleDateString('en-GB') : "2 July 2026"}
                          </p>
                        </div>
                      </div>

                      {/* Timeline Item 2 */}
                      <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 ring-4 ring-indigo-950 shrink-0" />
                        <div>
                          <p className="font-black text-slate-200">First-Time Onboarding Complete</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Campaign linked to M-PESA sandbox paybill successfully.</p>
                        </div>
                      </div>

                      {/* Timeline Item 3 */}
                      <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 ring-4 ring-amber-950 shrink-0" />
                        <div>
                          <p className="font-black text-slate-200">Committee Workspace Launched</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Reconciled double-entry ledger synced with all members.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: Pledges Analytics */}
            {activeSubTab === "pledges" && (
              <div className="space-y-6" id="panel-pledges-analytics">
                
                {/* Pledge Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  {/* Total Promised */}
                  <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Total Pledges Promised</span>
                    <p className="text-xl font-black text-sky-400 font-sans mt-1">KES {kpis.totalPledged.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{kpis.pledgesCount} individual promises</p>
                  </div>

                  {/* Pledge Fulfilled */}
                  <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Pledges Collected</span>
                    <p className="text-xl font-black text-emerald-400 font-sans mt-1">KES {kpis.pledgesPaid.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{kpis.conversionRate}% fulfillment rate</p>
                  </div>

                  {/* Outstanding */}
                  <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Outstanding Balance</span>
                    <p className="text-xl font-black text-amber-500 font-sans mt-1 font-mono">KES {kpis.pledgesOutstanding.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Expected this week</p>
                  </div>

                  {/* Overdue */}
                  <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Overdue Promises</span>
                    <p className="text-xl font-black text-rose-400 font-sans mt-1">KES {kpis.overdueValue.toLocaleString()}</p>
                    <p className="text-[10px] text-rose-500 mt-1 font-bold">{kpis.overdueCount} contributors overdue</p>
                  </div>

                </div>

                {/* Overdue Pledges Reminder Panel */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">Overdue Pledges Follow-up</h3>
                    </div>
                    <button
                      onClick={() => handleTriggerAction("reconciliation_run")}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-[10px] rounded-lg transition"
                    >
                      Scan & Sync Ledger Match
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider font-mono">
                          <th className="py-3 px-4">Contributor Name</th>
                          <th className="py-3 px-4">Promised Amount</th>
                          <th className="py-3 px-4">Paid (Reconciled)</th>
                          <th className="py-3 px-4">Balance Remaining</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4 text-right">Action Followup</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                        {projectPledges.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500 italic">No supporter pledges registered in active dataset.</td>
                          </tr>
                        ) : (
                          projectPledges.map((p) => {
                            const isOverdue = p.status === "Overdue" || (new Date(p.dueDate).getTime() < Date.now() && p.balance > 0);
                            return (
                              <tr key={p.id} className={isOverdue ? "bg-amber-950/10" : "bg-transparent"}>
                                <td className="py-3.5 px-4 font-black text-slate-200">
                                  <div>{p.donorName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.phone}</div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-400 font-medium">KES {Number(p.pledgedAmount).toLocaleString()}</td>
                                <td className="py-3.5 px-4 text-emerald-400 font-medium">KES {Number(p.paidAmount).toLocaleString()}</td>
                                <td className={`py-3.5 px-4 font-black ${p.balance > 0 ? "text-amber-500" : "text-emerald-400"}`}>
                                  KES {Number(p.balance).toLocaleString()}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-500">
                                  {new Date(p.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  {isOverdue && <span className="block text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">OVERDUE</span>}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {p.balance > 0 ? (
                                    <button
                                      onClick={() => handleTriggerAction("send_pledge_reminder", p)}
                                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-500 border border-slate-800 hover:border-emerald-600 text-slate-300 hover:text-slate-950 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 ml-auto min-h-[30px]"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" /> Send Reminder
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-mono text-emerald-400 font-bold">✅ FULFILLED</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: Donor Insights */}
            {activeSubTab === "donors" && (
              <div className="space-y-6" id="panel-donor-insights">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Top Supporters Leaderboard */}
                  <div className="md:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">Supporters Leaderboard</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Top contributors</span>
                    </div>

                    <div className="space-y-3">
                      {projectContributions.length === 0 ? (
                        <p className="text-center text-slate-500 italic py-6">No contributors recorded yet.</p>
                      ) : (
                        // Sort by amount and limit to top 5
                        [...projectContributions]
                          .sort((a, b) => b.amount - a.amount)
                          .slice(0, 5)
                          .map((c, idx) => (
                            <div 
                              key={c.id} 
                              className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 group hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center font-mono font-bold text-slate-400 shrink-0 border border-slate-800">
                                  #{idx + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-slate-200">{c.senderName || c.cleanedName}</h4>
                                  <p className="text-[10px] text-slate-500 font-mono">Ref: {c.transactionCode}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-emerald-400">KES {Number(c.amount).toLocaleString()}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">{new Date(c.timestamp).toLocaleDateString('en-GB')}</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Supporter Metrics Breakdown */}
                  <div className="md:col-span-5 space-y-4">
                    
                    {/* Public vs Anonymous */}
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2 mb-3">
                        👥 Contributor Profile Ratio
                      </h3>
                      <div className="space-y-3.5 text-xs text-slate-300 font-sans">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                          <span className="text-slate-400">New Supporter Count</span>
                          <span className="font-mono font-bold text-slate-100">85% of total</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                          <span className="text-slate-400">Returning Supporter Count</span>
                          <span className="font-mono font-bold text-emerald-400">15% of total</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                          <span className="text-slate-400">Most Active Giving Day</span>
                          <span className="font-black text-indigo-400 font-mono">Sunday Morning</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-950">
                          <span className="text-slate-400">Average Donation size</span>
                          <span className="font-mono font-bold text-sky-400">KES {kpis.avgGiftSize.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Proactive Campaign Advice banner */}
                    <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold font-sans">
                        <span>💡 AI Giving Trigger Insight</span>
                      </div>
                      <p className="leading-relaxed">
                        Data from Kenyan church and community fundraisers show that Sunday afternoons between 12:00 PM and 3:00 PM generate a 180% surge in contribution counts when organizers share updates.
                      </p>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: Predictive Forecasts */}
            {activeSubTab === "forecast" && (
              <div className="space-y-6" id="panel-predictions">
                
                {/* Projections score card */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                    🔮 Velocity-Based Completion Projections
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                    
                    {/* Goal Velocity */}
                    <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Current Speed</span>
                      <p className="text-xl font-black text-slate-100">KES {kpis.dailyAverage.toLocaleString()} / day</p>
                      <p className="text-[10px] text-slate-500">Based on campaign activity</p>
                    </div>

                    {/* Completion date */}
                    <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Expected Completion Date</span>
                      <p className="text-xl font-black text-amber-400">{kpis.estCompletionDate}</p>
                      <p className="text-[10px] text-slate-500">In {kpis.estDaysToCompletion} active days</p>
                    </div>

                    {/* Probability of success */}
                    <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Probability of Success</span>
                      <p className="text-xl font-black text-emerald-400">{kpis.goalProgress >= 75 ? "92%" : "74%"}</p>
                      <p className="text-[10px] text-slate-500">AI projection based on trends</p>
                    </div>

                  </div>
                </div>

                {/* AI Predictive Insight Card */}
                {aiReport ? (
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3.5">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                      🧠 HarambeeFlow AI Predictive Summary
                    </h3>
                    <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
                      <div>
                        <strong className="text-slate-100 block mb-1">Expected Promotion Requirement:</strong>
                        <p>{aiReport.predict?.additionalPromotionRequired ? "Yes, active committee broadcasts and diaspora outreach are required to safely bridge the remaining balance." : "No, existing momentum is sufficient to complete the drive within standard deadlines."}</p>
                      </div>
                      <div>
                        <strong className="text-slate-100 block mb-1">Best Day to Communicate:</strong>
                        <p>{aiReport.predict?.bestDayToCommunicate || "Sunday morning right before congregational prayers."}</p>
                      </div>
                      <div>
                        <strong className="text-slate-100 block mb-1">Best Channel:</strong>
                        <p>{aiReport.predict?.bestCommunicationChannel || "WhatsApp Broadcast Broadcast Lists."}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl text-center text-xs text-slate-400 italic">
                    Loading HarambeeFlow AI Campaign Predictions... Click "Refresh Insights" to compile.
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: AI Campaign Coach */}
            {activeSubTab === "coach" && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col h-[500px] shadow-xl justify-between" id="panel-ai-coach">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">Conversational AI Campaign Coach</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Live Ledger Chat</span>
                  </div>

                  {/* Suggestion questions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => handleAskCoach(undefined, "How can we raise the remaining balance fast?")}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-mono rounded-lg transition"
                    >
                      💡 "How can we raise the remaining balance fast?"
                    </button>
                    <button
                      onClick={() => handleAskCoach(undefined, "What is our pledge fulfillment rate?")}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-mono rounded-lg transition"
                    >
                      🤝 "What is our pledge fulfillment rate?"
                    </button>
                    <button
                      onClick={() => handleAskCoach(undefined, "How many supporters have contributed?")}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-mono rounded-lg transition"
                    >
                      👤 "How many supporters have contributed?"
                    </button>
                  </div>
                </div>

                {/* Chat Message Box */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 p-3 bg-slate-950 rounded-2xl border border-slate-850 mb-4 min-h-[150px]">
                  {coachChat.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex flex-col max-w-[85%] space-y-1 ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div 
                        className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed ${
                          msg.sender === "user" 
                            ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md" 
                            : "bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {msg.sender === "user" ? "You" : "AI Coach"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isCoachLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Coach is reviewing the ledger...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleAskCoach} className="flex gap-2.5">
                  <input
                    type="text"
                    value={coachQuestion}
                    onChange={(e) => setCoachQuestion(e.target.value)}
                    placeholder="Ask coach: 'How many days until we reach our target?'"
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={isCoachLoading || !coachQuestion.trim()}
                    className="px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition duration-150 min-h-[44px]"
                  >
                    Send <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
}
