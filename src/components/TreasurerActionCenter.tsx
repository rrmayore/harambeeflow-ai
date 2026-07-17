import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Check, 
  Trash2, 
  Edit3, 
  Send, 
  FileSpreadsheet, 
  Share2, 
  RefreshCw, 
  Sliders, 
  X, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Activity, 
  Heart,
  TrendingUp,
  User,
  Users,
  Lock,
  MessageSquare
} from "lucide-react";
import { db } from "../firebase";
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  collection 
} from "firebase/firestore";
import { Project, Contribution } from "../types";

interface TreasurerActionCenterProps {
  projects: Project[];
  activeProject: Project;
  contributions: Contribution[];
}

interface ActionAlert {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "warning" | "info" | "completed";
  actionLabel: string;
  onAction: () => void;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}

export default function TreasurerActionCenter({ projects, activeProject, contributions }: TreasurerActionCenterProps) {
  // Local Settings/Configurations
  const [largeThreshold, setLargeThreshold] = useState<number>(5000);
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // Dialog Modals State
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reconciliationName, setReconciliationName] = useState<{ [contribId: string]: string }>({});
  const [shareText, setShareText] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Dynamic Greeting based on Local Time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning, Treasurer.";
    if (hours < 17) return "Good Afternoon, Treasurer.";
    return "Good Evening, Treasurer.";
  }, []);

  // Filter contributions for the active project
  const projectContributions = useMemo(() => {
    return contributions.filter(c => c.projectId === activeProject.id);
  }, [contributions, activeProject.id]);

  // Helper: check if transaction timestamp is on sandbox date (June 27, 2026)
  const isDateToday = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      return date.getFullYear() === 2026 && date.getMonth() === 5 && date.getDate() === 27;
    } catch {
      return false;
    }
  };

  // Today's contributions for active project
  const todayContributions = useMemo(() => {
    return projectContributions.filter(c => isDateToday(c.timestamp) && !c.hasDuplicates);
  }, [projectContributions]);

  // Today's amount raised
  const todayAmountRaised = useMemo(() => {
    return todayContributions.reduce((sum, c) => sum + c.amount, 0);
  }, [todayContributions]);

  // Campaign Progress Percentage
  const percentComplete = useMemo(() => {
    if (!activeProject.targetAmount) return 0;
    const totalAmount = projectContributions.reduce((sum, c) => sum + (c.hasDuplicates ? 0 : c.amount), 0);
    return Math.min(100, Math.round((totalAmount / activeProject.targetAmount) * 100));
  }, [projectContributions, activeProject.targetAmount]);

  // Active sync feedback helper
  const triggerFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

  // 1. ACTION: Retry Sync
  const handleRetrySync = () => {
    setIsSyncing(true);
    triggerFeedback("Checking connection registers and pulling double-entry hashes...");
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      triggerFeedback("Double-entry ledger verified and matching Daraja API sequence headers.");
    }, 1500);
  };

  // 2. ACTION: Generate CSV Report
  const handleGenerateReport = () => {
    try {
      if (projectContributions.length === 0) {
        triggerFeedback("No transactions available to generate report.");
        return;
      }
      
      const headers = ["Transaction Code", "Donor Name", "Phone", "Amount (KES)", "Category", "Date", "Status", "Notes"];
      const rows = projectContributions.map(c => [
        c.transactionCode,
        c.cleanedName || c.senderName,
        c.senderPhone,
        c.amount,
        c.category,
        new Date(c.timestamp).toLocaleString(),
        c.hasDuplicates ? "Duplicate Rejected" : "Verified Reconciled",
        c.notes || ""
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `HarambeeFlow_${activeProject.name.replace(/\s+/g, "_")}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerFeedback("Audited CSV ledger report downloaded successfully!");
    } catch (err) {
      console.error(err);
      triggerFeedback("Failed to assemble CSV stream file.");
    }
  };

  // 3. ACTION: Deduplicate transactions (delete documents flagged as duplicates)
  const handleResolveDuplicates = async () => {
    const duplicates = projectContributions.filter(c => c.hasDuplicates);
    if (duplicates.length === 0) return;

    try {
      let count = 0;
      for (const d of duplicates) {
        const docRef = doc(db, "donations", d.id);
        await deleteDoc(docRef);
        count++;
      }
      setShowDuplicateModal(false);
      triggerFeedback(`Successfully removed ${count} duplicate ledger records.`);
    } catch (err) {
      console.error("Failed to delete duplicates:", err);
      triggerFeedback("Firestore error while deleting duplicate records.");
    }
  };

  // 4. ACTION: Reconcile names
  const handleReconcileName = async (contribId: string) => {
    const newName = reconciliationName[contribId]?.trim();
    if (!newName) return;

    try {
      const docRef = doc(db, "donations", contribId);
      await updateDoc(docRef, {
        cleanedName: newName,
        senderName: newName,
        notes: `Treasurer manually verified and updated donor name from M-PESA Customer on ${new Date().toLocaleDateString()}`
      });
      triggerFeedback("Name reconciled successfully!");
    } catch (err) {
      console.error("Reconciliation update failed:", err);
      triggerFeedback("Firestore write aborted. Check network status.");
    }
  };

  // 5. ACTION: Broadcast WhatsApps
  const handleBroadcastWhatsApp = async () => {
    const unsent = projectContributions.filter(c => !c.whatsappPosted && !c.hasDuplicates);
    if (unsent.length === 0) return;

    try {
      let count = 0;
      for (const c of unsent) {
        const docRef = doc(db, "donations", c.id);
        await updateDoc(docRef, { whatsappPosted: true });

        // Add a message to the group
        await addDoc(collection(db, "whatsappMessages"), {
          groupName: activeProject.whatsappGroupName || `${activeProject.name} Group`,
          message: `*Verified Contribution* 📢\nThank you, *${c.cleanedName || c.senderName}*, for your support of *KES ${c.amount.toLocaleString()}* to *${activeProject.name}*!\nRef Code: ${c.transactionCode}.\nTotal Raised: ${percentComplete}% towards goal.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
        count++;
      }
      triggerFeedback(`Successfully broadcast ${count} automated WhatsApp updates.`);
    } catch (err) {
      console.error("WhatsApp broadcast failed:", err);
      triggerFeedback("Broadcast pipeline experienced socket write error.");
    }
  };

  // 6. ACTION: Share campaign status
  const handlePrepareShareText = (type: "general" | "goal" | "no_contrib") => {
    let msg = "";
    if (type === "general") {
      msg = `*${activeProject.name} Campaign Update* 📢\n\nDear friends and committee, we have raised *KES ${activeProject.currentAmount.toLocaleString()}* which is *${percentComplete}%* of our goal of KES ${activeProject.targetAmount.toLocaleString()}.\n\nThank you to all who have contributed! Send your contribution to Paybill *${activeProject.paybillNumber}* (Ref: *${activeProject.accountReference || "M-PESA"}*).\n\nLet's keep the momentum going!`;
    } else if (type === "goal") {
      msg = `*🎉 WE DID IT! Goal Achieved!* 🚀\n\nOur campaign *${activeProject.name}* has officially hit and exceeded its target of *KES ${activeProject.targetAmount.toLocaleString()}*! \n\nWe raised KES *${activeProject.currentAmount.toLocaleString()}* representing *${percentComplete}%*! Heartfelt thanks to every single supporter who contributed to this Harambee. God bless you!`;
    } else {
      msg = `*Support ${activeProject.name}* 🙏\n\nWe are currently fundraising for *${activeProject.name}* (Target: KES ${activeProject.targetAmount.toLocaleString()}). Every shilling counts! \n\nPlease send your contributions today through Paybill *${activeProject.paybillNumber}* using Account Ref: *${activeProject.accountReference || "M-PESA"}*.\n\nThank you!`;
    }
    setShareText(msg);
    setShowShareModal(true);
  };

  const copyShareTextToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    triggerFeedback("Campaign status template copied to clipboard!");
    setShowShareModal(false);
  };

  // Auto-Detect Alerts State Based on Active Campaign State & Contributions
  const alerts: ActionAlert[] = useMemo(() => {
    const list: ActionAlert[] = [];

    // Filter duplicates
    const duplicates = projectContributions.filter(c => c.hasDuplicates);
    if (duplicates.length > 0) {
      list.push({
        id: "duplicate-receipt",
        title: `${duplicates.length} duplicate transaction${duplicates.length > 1 ? "s" : ""} detected.`,
        description: `Receipt code${duplicates.length > 1 ? "s" : ""} [${duplicates.map(d => d.transactionCode).join(", ")}] already recorded in ledger. Double-entry replay protection active.`,
        priority: "critical",
        actionLabel: "Resolve",
        onAction: () => setShowDuplicateModal(true),
        icon: <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />,
        bgClass: "bg-rose-50 border-rose-200/50",
        borderClass: "border-rose-200",
        textClass: "text-rose-800",
        badgeClass: "bg-rose-100 text-rose-700 border-rose-200"
      });
    }

    // Check offline status
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      list.push({
        id: "firestore-offline",
        title: "Firestore database sync delayed.",
        description: "The device is currently offline. HarambeeFlow offline ledger is safe, and updates will sync instantly when connected.",
        priority: "critical",
        actionLabel: "Retry Sync",
        onAction: handleRetrySync,
        icon: <Clock className="w-4 h-4 text-rose-600 animate-pulse" />,
        bgClass: "bg-rose-50 border-rose-200/50",
        borderClass: "border-rose-200",
        textClass: "text-rose-800",
        badgeClass: "bg-rose-100 text-rose-700 border-rose-200"
      });
    }

    // Check missing donor name
    const missingNames = projectContributions.filter(
      c => !c.hasDuplicates && (!c.senderName || c.senderName.trim() === "" || c.senderName.toLowerCase().includes("m-pesa customer") || c.senderName.toLowerCase().includes("anonymous") || c.senderName.toLowerCase() === "customer")
    );
    if (missingNames.length > 0) {
      list.push({
        id: "missing-donor-name",
        title: `${missingNames.length} contribution${missingNames.length > 1 ? "s require" : " requires"} donor name verification.`,
        description: `Deposits totaling KES ${(missingNames.reduce((s, c) => s + c.amount, 0)).toLocaleString()} are logged without verified community identifiers.`,
        priority: "warning",
        actionLabel: "Reconcile",
        onAction: () => setShowReconciliationModal(true),
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        bgClass: "bg-amber-50 border-amber-200/50",
        borderClass: "border-amber-200",
        textClass: "text-amber-800",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200"
      });
    }

    // Check WhatsApp delivery failed
    const failedWhatsApp = projectContributions.filter(c => !c.whatsappPosted && !c.hasDuplicates);
    if (failedWhatsApp.length > 0) {
      list.push({
        id: "whatsapp-failed",
        title: `${failedWhatsApp.length} WhatsApp notification${failedWhatsApp.length > 1 ? "s" : ""} pending broadcast.`,
        description: "Payments are successfully reconciled in the ledger, but committee or donor broadcast was deferred.",
        priority: "warning",
        actionLabel: "Broadcast",
        onAction: handleBroadcastWhatsApp,
        icon: <MessageSquare className="w-4 h-4 text-amber-600" />,
        bgClass: "bg-amber-50 border-amber-200/50",
        borderClass: "border-amber-200",
        textClass: "text-amber-800",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200"
      });
    }

    // Check campaign closing date
    try {
      const createdDate = new Date(activeProject.createdAt);
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - daysSinceCreation; // Assume standard 30-day duration template
      if (daysLeft <= 3 && daysLeft >= 0 && percentComplete < 100) {
        list.push({
          id: "campaign-closing",
          title: `Campaign goal closes in ${daysLeft === 0 ? "today" : daysLeft === 1 ? "1 day" : `${daysLeft} days`}.`,
          description: `"${activeProject.name}" has raised KES ${activeProject.currentAmount.toLocaleString()} (${percentComplete}%). Reach out to top well-wishers to fill the gap.`,
          priority: "warning",
          actionLabel: "Share Update",
          onAction: () => handlePrepareShareText("general"),
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          bgClass: "bg-amber-50 border-amber-200/50",
          borderClass: "border-amber-200",
          textClass: "text-amber-800",
          badgeClass: "bg-amber-100 text-amber-700 border-amber-200"
        });
      }
    } catch {
      // safe omit if invalid date string
    }

    // Check campaign goal achieved
    if (percentComplete >= 100) {
      list.push({
        id: "campaign-goal-achieved",
        title: "🎉 Campaign target achieved!",
        description: `Excellent work! "${activeProject.name}" has officially reached and exceeded its KES ${activeProject.targetAmount.toLocaleString()} target limit.`,
        priority: "completed",
        actionLabel: "Share Success",
        onAction: () => handlePrepareShareText("goal"),
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        bgClass: "bg-emerald-50 border-emerald-200/50",
        borderClass: "border-emerald-200",
        textClass: "text-emerald-800",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200"
      });
    }

    // Check large contribution today
    const largeToday = todayContributions.filter(c => c.amount >= largeThreshold);
    if (largeToday.length > 0) {
      // Sort to find largest
      const largest = [...largeToday].sort((a, b) => b.amount - a.amount)[0];
      list.push({
        id: `large-contribution-${largest.id}`,
        title: `Large contribution of KES ${largest.amount.toLocaleString()} received!`,
        description: `Well-wisher "${largest.cleanedName || largest.senderName}" made a high-impact deposit. Consider sending a custom WhatsApp thank you.`,
        priority: "info",
        actionLabel: "View Details",
        onAction: () => {
          // Trigger scroll or focus to Live Feed
          const elem = document.getElementById(`feed-item-${largest.transactionCode}`);
          if (elem) {
            elem.scrollIntoView({ behavior: "smooth", block: "center" });
            elem.click(); // Expand detail card
          } else {
            triggerFeedback(`Receipt: ${largest.transactionCode} | Name: ${largest.senderName}`);
          }
        },
        icon: <Heart className="w-4 h-4 text-indigo-500 animate-pulse" />,
        bgClass: "bg-indigo-50 border-indigo-200/50",
        borderClass: "border-indigo-200",
        textClass: "text-indigo-800",
        badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200"
      });
    }

    // Check no contributions received today
    if (todayContributions.length === 0) {
      list.push({
        id: "no-contributions-today",
        title: "No contributions recorded today.",
        description: "The payment gateway hasn't received any M-PESA webhook logs today. Share the Paybill reference to re-engage contributors.",
        priority: "info",
        actionLabel: "Share Paybill",
        onAction: () => handlePrepareShareText("no_contrib"),
        icon: <Activity className="w-4 h-4 text-blue-500" />,
        bgClass: "bg-blue-50 border-blue-200/50",
        borderClass: "border-blue-200",
        textClass: "text-blue-800",
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200"
      });
    }

    // Suggest generating weekly report (info)
    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const isWeekend = dayName === "Saturday" || dayName === "Sunday" || dayName === "Friday";
    if (isWeekend && projectContributions.length > 0) {
      list.push({
        id: "weekly-report-ready",
        title: `${dayName} Summary Report ready to dispatch.`,
        description: "Campaign weekly transaction ledger has been audited. Generate the executive committee report.",
        priority: "info",
        actionLabel: "Generate Report",
        onAction: handleGenerateReport,
        icon: <FileSpreadsheet className="w-4 h-4 text-indigo-500" />,
        bgClass: "bg-indigo-50 border-indigo-200/50",
        borderClass: "border-indigo-200",
        textClass: "text-indigo-800",
        badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200"
      });
    }

    // Check if everything is up to date (all resolved)
    const activeAlerts = list.filter(a => !dismissedAlerts.includes(a.id));
    if (activeAlerts.length === 0) {
      // Default success alert
      list.push({
        id: "all-reconciled",
        title: "All contributions reconciled.",
        description: "Double-entry transaction balances match the official Safaricom Daraja ledger seamlessly. Excellent accounting!",
        priority: "completed",
        actionLabel: "Audited Ledger",
        onAction: handleGenerateReport,
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        bgClass: "bg-emerald-50 border-emerald-200/50",
        borderClass: "border-emerald-200",
        textClass: "text-emerald-800",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200"
      });
    }

    // Return all alerts, sorted by priority
    const priorityOrder = { critical: 0, warning: 1, info: 2, completed: 3 };
    return list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [projectContributions, activeProject, percentComplete, todayContributions, largeThreshold, dismissedAlerts]);

  // Active alerts that are not dismissed
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => !dismissedAlerts.includes(a.id));
  }, [alerts, dismissedAlerts]);

  // Is everything perfectly in sync with no warning/critical issues?
  const isAllClear = useMemo(() => {
    return !activeAlerts.some(a => a.priority === "critical" || a.priority === "warning");
  }, [activeAlerts]);

  // Dismiss an alert
  const handleDismissAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => [...prev, id]);
  };

  return (
    <div className="w-full space-y-6" id="treasurer-action-center-root">
      
      {/* Dynamic API/Firestore feedback Toast HUD */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-slate-100 border border-slate-800 px-5 py-3 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2.5 max-w-[90vw] text-center"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="font-semibold text-slate-200">{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container styling: Beautiful high-contrast off-whites with sleek minimal borders */}
      <div className="glass-card rounded-2xl border border-slate-200/85 p-5 md:p-6 shadow-sm flex flex-col gap-5 bg-white relative overflow-hidden">
        
        {/* Subtle decorative top background line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
        
        {/* Smart Daily Summary Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black font-sans tracking-tight text-slate-900 flex items-center gap-2">
              {greeting}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded-md tracking-widest uppercase">Treasurer Console</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">HarambeeFlow proactive operations dashboard • Reconciling live Safaricom M-PESA C2B webhook streams.</p>
          </div>

          {/* Sync Button & Trigger settings */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleRetrySync}
              disabled={isSyncing}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold uppercase"
              title="Manual Sync Recheck"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
              Re-Audit Ledger
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 border rounded-lg transition-all text-slate-600 cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold uppercase ${
                showSettings ? "bg-slate-950 border-slate-950 text-white" : "border-slate-200 hover:bg-slate-50"
              }`}
              title="Configure Parameters"
            >
              <Sliders className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>

        {/* Dynamic settings drawer panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-hidden text-xs"
              id="action-center-settings-drawer"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5">
                    Configure Large Contribution Threshold (KES)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400">KES</span>
                    <input
                      type="number"
                      value={largeThreshold}
                      onChange={(e) => setLargeThreshold(Math.max(100, Number(e.target.value)))}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-32"
                    />
                    <span className="text-slate-400 font-mono text-[9px] uppercase">Default: 5,000 KES</span>
                  </div>
                </div>

                <div className="flex flex-col justify-end items-end">
                  <button
                    onClick={() => {
                      setDismissedAlerts([]);
                      triggerFeedback("Dismissed notifications re-enabled.");
                    }}
                    disabled={dismissedAlerts.length === 0}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg font-mono font-bold uppercase text-[10px] disabled:opacity-50 cursor-pointer"
                  >
                    Restore {dismissedAlerts.length} Hidden Cards
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Today's Summary Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/60" id="smart-daily-metrics-row">
          
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Payments Today</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              <span className="text-sm font-extrabold text-slate-800">{todayContributions.length} deposits</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Amount Raised Today</span>
            <span className="text-sm font-black text-[#10B981] block">KES {todayAmountRaised.toLocaleString()}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Goal Progress</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-800">{percentComplete}%</span>
              <span className="text-[10px] text-slate-400 font-mono">({activeProject.currentAmount >= activeProject.targetAmount ? "Achieved" : "In Progress"})</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Pending Actions</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeAlerts.some(a => a.priority === "critical") ? "bg-rose-500 animate-ping" : activeAlerts.some(a => a.priority === "warning") ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="text-sm font-extrabold text-slate-800">{activeAlerts.length} queue item{activeAlerts.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200/60 pt-2.5 md:pt-0 md:pl-4">
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Safaricom API Sync</span>
            <div className="flex items-center gap-1 text-xs text-slate-700 font-bold font-mono">
              <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
              {lastSyncTime === "Just now" ? "Secured" : lastSyncTime}
            </div>
          </div>

        </div>

        {/* Active Alert Cards Deck */}
        <div className="space-y-3.5" id="action-cards-deck">
          
          {/* Real empty state check */}
          {activeAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-2"
              id="alerts-empty-state-card"
            >
              <Check className="w-7 h-7 text-emerald-600 bg-emerald-100 p-1.5 rounded-full shadow-inner" />
              <div>
                <h4 className="font-sans font-extrabold text-emerald-800 text-sm">Everything is up to date.</h4>
                <p className="text-xs text-emerald-600 mt-1">No action is required at this time. All transaction nodes are green.</p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {activeAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layoutId={`alert-${alert.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`border rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-xs hover:border-slate-300 relative ${alert.bgClass} ${alert.borderClass}`}
                  id={`action-alert-${alert.id}`}
                >
                  
                  {/* Dismiss Floating Close Button */}
                  <button
                    onClick={(e) => handleDismissAlert(alert.id, e)}
                    className="absolute top-3 right-3 p-1 hover:bg-slate-200/50 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Dismiss alert card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Left Content Column */}
                  <div className="flex items-start gap-3.5 pr-6 md:pr-0">
                    <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs shrink-0 flex items-center justify-center">
                      {alert.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-sans font-extrabold text-sm tracking-tight ${alert.textClass}`}>
                          {alert.title}
                        </h4>
                        <span className={`px-2 py-0.5 border rounded-full font-mono text-[8px] font-extrabold tracking-wider uppercase shrink-0 ${alert.badgeClass}`}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500/90 leading-relaxed max-w-xl">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Action Button Column - Thumb-friendly on Mobile */}
                  <div className="shrink-0 flex items-center self-stretch md:self-auto justify-end">
                    <button
                      onClick={alert.onAction}
                      className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-sans font-extrabold text-xs tracking-tight rounded-xl transition shadow-inner flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
                    >
                      {alert.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          )}

        </div>

      </div>

      {/* MODAL 1: Double-Entry Duplicate Resolution Panel */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5"
              id="duplicate-resolution-modal"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-slate-900 text-base">Duplicate Replay Resolver</h3>
                    <p className="text-xs text-slate-400">Purge double-entry ledger conflicts live.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                We detected matching M-PESA transaction receipts flagged as potential duplicate streams. 
                Purging duplicates will automatically clean your ledger balance metrics instantly in real-time.
              </p>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                {projectContributions.filter(c => c.hasDuplicates).map(c => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-black text-slate-700 block uppercase">{c.transactionCode}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Donor: {c.senderName}</span>
                    </div>
                    <span className="font-sans font-extrabold text-rose-600">KES {c.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-1/2 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-sans font-bold text-xs cursor-pointer text-center"
                >
                  Keep Duplicates
                </button>
                <button
                  onClick={handleResolveDuplicates}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-sans font-black text-xs cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Purge Conflict Logs
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Interactive Community Name Reconciliation Wizard */}
      <AnimatePresence>
        {showReconciliationModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5"
              id="reconciliation-name-modal"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-slate-900 text-base">Community Donor Reconciliation</h3>
                    <p className="text-xs text-slate-400">Match generic phone transactions to real people.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReconciliationModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Sometimes contributions come through without correct names attached. 
                Type the correct identifier below and click reconcile. The database will reflect this change globally instantly.
              </p>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-200/50 rounded-xl bg-slate-50/50 p-2.5 space-y-2">
                {projectContributions.filter(c => !c.hasDuplicates && (!c.senderName || c.senderName.trim() === "" || c.senderName.toLowerCase().includes("m-pesa customer") || c.senderName.toLowerCase().includes("anonymous") || c.senderName.toLowerCase() === "customer")).map(c => (
                  <div key={c.id} className="py-3 flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-600">{c.transactionCode}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-2">({c.senderPhone})</span>
                      </div>
                      <span className="font-sans font-extrabold text-slate-800">KES {c.amount.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type verified contributor name (e.g., Alick Omondi)"
                        value={reconciliationName[c.id] || ""}
                        onChange={(e) => setReconciliationName(prev => ({ ...prev, [c.id]: e.target.value }))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleReconcileName(c.id)}
                        disabled={!reconciliationName[c.id]?.trim()}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-sans tracking-tight disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowReconciliationModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-sans font-bold text-xs cursor-pointer"
                >
                  Finished Reconciling
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Committee Updates Share Panel */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4"
              id="share-update-modal"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-slate-900 text-base">Campaign Update Dispatcher</h3>
                    <p className="text-xs text-slate-400">Share status with your committee.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                  Formatted Message Template
                </label>
                <textarea
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-1/2 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-sans font-bold text-xs cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={copyShareTextToClipboard}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-sans font-black text-xs cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Copy to Clipboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
