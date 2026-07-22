import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Copy, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  X, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Layers, 
  Smartphone, 
  Send, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Database,
  Activity
} from "lucide-react";
import { Contribution, Project } from "../types";
import { getDonorBadgeInfo } from "../utils/donor";

interface LiveActivityFeedProps {
  contributions: Contribution[];
  projects: Project[];
  activeProject: Project | null;
}

// Helper to determine status from contribution
function getContributionStatus(c: Contribution) {
  if (c.hasDuplicates) {
    return {
      label: "Duplicate",
      icon: "❌",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/50",
      textClass: "text-rose-700",
      dotClass: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
    };
  }
  const notesLower = (c.notes || "").toLowerCase();
  if (notesLower.includes("flagged") || notesLower.includes("suspicious") || notesLower.includes("risk") || notesLower.includes("verify")) {
    return {
      label: "Flagged",
      icon: "⚠",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/50",
      textClass: "text-amber-700",
      dotClass: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
    };
  }
  if (notesLower.includes("pending") || notesLower.includes("queued")) {
    return {
      label: "Pending",
      icon: "⏳",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200/50",
      textClass: "text-blue-700",
      dotClass: "bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse",
    };
  }
  return {
    label: "Verified",
    icon: "✔",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    textClass: "text-[#10B981]",
    dotClass: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
  };
}

// Formatting date cleanly matching local time 
function formatFriendlyDate(timestampStr: string) {
  try {
    const date = new Date(timestampStr);
    const now = new Date();
    
    // Check if valid date
    if (isNaN(date.getTime())) return "Today • 12:00 PM";

    // Set times to midnight to check dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    const timeString = date.toLocaleTimeString("en-US", timeOptions);

    if (compareDate.getTime() === today.getTime()) {
      return `Today • ${timeString}`;
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return `Yesterday • ${timeString}`;
    } else {
      const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
      return `${date.toLocaleDateString("en-US", dateOptions)} • ${timeString}`;
    }
  } catch (err) {
    return "Just now";
  }
}

// Utility to mask phone numbers nicely
function maskPhone(phone: string) {
  if (!phone) return "254705***222";
  const clean = phone.trim();
  if (clean.length >= 9) {
    return `${clean.substring(0, 6)}***${clean.substring(clean.length - 3)}`;
  }
  return clean;
}

export default function LiveActivityFeed({ contributions, projects, activeProject }: LiveActivityFeedProps) {
  // Filters State
  const [activeTab, setActiveTab] = useState<"all" | "today" | "verified" | "pending" | "flagged" | "duplicates">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchReceipt, setSearchReceipt] = useState("");
  const [amountRange, setAmountRange] = useState<"all" | "low" | "medium" | "high">("all");
  const [customMinAmount, setCustomMinAmount] = useState("");
  const [customMaxAmount, setCustomMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(25);

  // Toast / notification feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep a last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Update lastUpdated when contributions array changes
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [contributions]);

  // Show toast notification helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Copy receipt helper
  const handleCopyReceipt = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    triggerToast(`Copied receipt ${code} to clipboard!`);
  };

  // Long press / copy all details helper
  const handleLongPressCopy = (c: Contribution, campaignName: string) => {
    const text = `
HarambeeFlow Contribution Receipt
----------------------------------
Donor: ${c.cleanedName || c.senderName}
Receipt: ${c.transactionCode}
Phone: ${c.senderPhone}
Amount: KES ${c.amount.toLocaleString()}
Campaign: ${campaignName}
Received: ${new Date(c.timestamp).toLocaleString()}
Status: ${getContributionStatus(c).label}
Doc ID: ${c.id}
    `.trim();
    navigator.clipboard.writeText(text);
    triggerToast(`Copied complete transaction details for ${c.transactionCode}!`);
  };

  // Today reference (Fixed year/month/day corresponding to sandbox local time: 2026-06-27)
  const isDateToday = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      // We explicitly check if it matches June 27, 2026
      return date.getFullYear() === 2026 && date.getMonth() === 5 && date.getDate() === 27;
    } catch {
      return false;
    }
  };

  // Computed today's statistics
  const stats = useMemo(() => {
    // We filter contributions matching today's sandbox date (June 27, 2026)
    const todayContribs = contributions.filter(c => isDateToday(c.timestamp) && !c.hasDuplicates);
    const count = todayContribs.length;
    const totalAmount = todayContribs.reduce((sum, c) => sum + c.amount, 0);
    const avg = count > 0 ? Math.round(totalAmount / count) : 0;
    const largest = count > 0 ? Math.max(...todayContribs.map(c => c.amount)) : 0;

    return {
      count,
      totalAmount,
      avg,
      largest
    };
  }, [contributions]);

  // Main filter/search implementation
  const filteredContributions = useMemo(() => {
    let list = [...contributions];

    // Sort descending by timestamp
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 1. Tab Status filters
    if (activeTab === "today") {
      list = list.filter(c => isDateToday(c.timestamp));
    } else if (activeTab === "verified") {
      list = list.filter(c => !c.hasDuplicates && !getContributionStatus(c).label.includes("Flagged") && !getContributionStatus(c).label.includes("Pending"));
    } else if (activeTab === "pending") {
      list = list.filter(c => getContributionStatus(c).label === "Pending");
    } else if (activeTab === "flagged") {
      list = list.filter(c => getContributionStatus(c).label === "Flagged");
    } else if (activeTab === "duplicates") {
      list = list.filter(c => c.hasDuplicates);
    }

    // 2. Project / Campaign Filter
    if (selectedProjectId !== "all") {
      list = list.filter(c => c.projectId === selectedProjectId);
    }

    // 3. Search Donor (Case insensitive)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.cleanedName || "").toLowerCase().includes(query) || 
        (c.senderName || "").toLowerCase().includes(query)
      );
    }

    // 4. Search Receipt Number
    if (searchReceipt.trim() !== "") {
      const query = searchReceipt.toUpperCase().trim();
      list = list.filter(c => c.transactionCode.toUpperCase().includes(query));
    }

    // 5. Amount Range filter
    if (amountRange === "low") {
      list = list.filter(c => c.amount < 1000);
    } else if (amountRange === "medium") {
      list = list.filter(c => c.amount >= 1000 && c.amount <= 5000);
    } else if (amountRange === "high") {
      list = list.filter(c => c.amount > 5000);
    }

    // 6. Custom Amount filters
    if (customMinAmount !== "") {
      const minVal = parseFloat(customMinAmount);
      if (!isNaN(minVal)) {
        list = list.filter(c => c.amount >= minVal);
      }
    }
    if (customMaxAmount !== "") {
      const maxVal = parseFloat(customMaxAmount);
      if (!isNaN(maxVal)) {
        list = list.filter(c => c.amount <= maxVal);
      }
    }

    return list;
  }, [contributions, activeTab, selectedProjectId, searchQuery, searchReceipt, amountRange, customMinAmount, customMaxAmount]);

  // Sliced list for lazy loading
  const slicedContributions = useMemo(() => {
    return filteredContributions.slice(0, visibleCount);
  }, [filteredContributions, visibleCount]);

  // Map project ID to project name
  const getProjectName = (projectId: string) => {
    const found = projects.find(p => p.id === projectId);
    return found ? found.name : "Active Campaign";
  };

  // Map project ID to project object
  const getProjectDetails = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  return (
    <div className="w-full space-y-6" id="live-activity-feed-root">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-800 text-emerald-400 px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs font-bold tracking-tight flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Counter Header (Today's Stats Panel) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="live-activity-counters">
        
        {/* Today's Count */}
        <div className="glass-card p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#10B981] rounded-lg shadow-2xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Today's Posts</span>
            <span className="text-base font-extrabold text-slate-800 block mt-0.5">{stats.count} valid</span>
          </div>
        </div>

        {/* Total KES Today */}
        <div className="glass-card p-4 rounded-xl flex items-center gap-3 col-span-1">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shadow-2xs shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Total Amount</span>
            <span className="text-base font-extrabold text-slate-800 block mt-0.5">KES {stats.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Avg Contribution */}
        <div className="glass-card p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shadow-2xs shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Avg Contribution</span>
            <span className="text-base font-extrabold text-slate-800 block mt-0.5">KES {stats.avg.toLocaleString()}</span>
          </div>
        </div>

        {/* Largest Contribution */}
        <div className="glass-card p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shadow-2xs shrink-0">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Largest Contribution</span>
            <span className="text-base font-extrabold text-slate-800 block mt-0.5">KES {stats.largest.toLocaleString()}</span>
          </div>
        </div>

        {/* Last Sync Indicator */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-center col-span-2 lg:col-span-1 bg-linear-to-r from-emerald-50/10 to-slate-50/20">
          <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">M-PESA Webhook Feed</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-700">Listening Live</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1 block">Refreshed: {lastUpdated}</span>
        </div>
      </div>

      {/* Main Feed Shell Card */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 shadow-md flex flex-col" id="live-feed-card-wrapper">
        
        {/* Header and Smart Filters Toggle */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-b from-white to-slate-50/40">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
            <h3 className="font-sans font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              Live Contribution Activity <span className="px-1.5 py-0.5 bg-emerald-100 text-[#10B981] rounded-md font-mono text-[10px] font-bold">({filteredContributions.length} listed)</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 border text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                showFilters 
                ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              id="live-feed-filter-toggle"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showFilters ? "Hide Filters" : "Filter & Search"}
            </button>
          </div>
        </div>

        {/* Collapsible Smart Filter Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden border-b border-slate-100 bg-slate-50/50"
              id="smart-filters-box"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                
                {/* Column 1: Text search queries */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Search Donor Name</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search e.g. Alick Omondi..."
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        id="search-donor-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Search Receipt Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchReceipt}
                        onChange={(e) => setSearchReceipt(e.target.value)}
                        placeholder="Search e.g. STK990..."
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        id="search-receipt-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Campaign Filter & Amount Tier */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Filter by Campaign</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      id="filter-campaign-select"
                    >
                      <option value="all">All Campaigns</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Amount Tier</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "Any", value: "all" },
                        { label: "<1K", value: "low" },
                        { label: "1K-5K", value: "medium" },
                        { label: ">5K", value: "high" }
                      ].map((tier) => (
                        <button
                          key={tier.value}
                          onClick={() => setAmountRange(tier.value as any)}
                          className={`py-1 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                            amountRange === tier.value 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 3: Custom Amount Ranges & Reset */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Custom Amount Range (KES)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        placeholder="Min"
                        value={customMinAmount}
                        onChange={(e) => setCustomMinAmount(e.target.value)}
                        className="w-1/2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-slate-400 font-mono text-[9px] uppercase">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={customMaxAmount}
                        onChange={(e) => setCustomMaxAmount(e.target.value)}
                        className="w-1/2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchReceipt("");
                        setSelectedProjectId("all");
                        setAmountRange("all");
                        setCustomMinAmount("");
                        setCustomMaxAmount("");
                        setActiveTab("all");
                        setVisibleCount(25);
                        triggerToast("Filters fully reset.");
                      }}
                      className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-md transition-all cursor-pointer"
                    >
                      Clear All Filter Keys
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Pills Selection */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none bg-slate-50/20" id="live-feed-tab-scroller">
          {[
            { id: "all", label: "All Logs" },
            { id: "today", label: "Today" },
            { id: "verified", label: "Verified Only" },
            { id: "pending", label: "Pending" },
            { id: "flagged", label: "Flagged" },
            { id: "duplicates", label: "Duplicate Blocked" }
          ].map((tab) => {
            const count = tab.id === "all" ? contributions.length :
                          tab.id === "today" ? contributions.filter(c => isDateToday(c.timestamp)).length :
                          tab.id === "verified" ? contributions.filter(c => !c.hasDuplicates && !getContributionStatus(c).label.includes("Flagged")).length :
                          tab.id === "pending" ? contributions.filter(c => getContributionStatus(c).label === "Pending").length :
                          tab.id === "flagged" ? contributions.filter(c => getContributionStatus(c).label === "Flagged").length :
                          contributions.filter(c => c.hasDuplicates).length;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setVisibleCount(25); // reset scroll load
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  activeTab === tab.id
                  ? "bg-slate-900 border-slate-900 text-white shadow-inner scale-102"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.1 text-[9px] rounded-full ${activeTab === tab.id ? "bg-slate-750 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive List View of Feed */}
        <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto relative" id="live-feed-scrollable-container">
          
          {slicedContributions.length === 0 ? (
            /* Empty State Layout */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center" id="live-feed-empty-state">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 relative mb-4">
                <Activity className="w-8 h-8 text-slate-300 animate-pulse" />
                <div className="absolute right-2 bottom-2 w-3.5 h-3.5 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center font-mono text-[9px] font-bold">!</div>
              </div>
              <h4 className="font-sans font-extrabold text-slate-800 text-sm">No contributions found matching requirements</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                No contributions have been received yet. Your first verified M-PESA payment will appear here instantly.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {slicedContributions.map((c, index) => {
                const statusDetails = getContributionStatus(c);
                const isExpanded = expandedId === c.id;
                const campaignName = getProjectName(c.projectId);
                const projDetails = getProjectDetails(c.projectId);
                const isNew = index === 0 && (Date.now() - new Date(c.timestamp).getTime() < 12000); // Highlight newest transactions within 12s

                return (
                  <motion.div
                    key={c.id}
                    layoutId={`contrib-card-${c.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      boxShadow: isNew ? "inset 0 0 12px rgba(16, 185, 129, 0.08)" : "none"
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleLongPressCopy(c, campaignName);
                    }}
                    className={`p-4 md:p-5 transition-all duration-200 cursor-pointer hover:bg-slate-50/60 relative ${
                      isNew ? "bg-emerald-50/20" : ""
                    } ${isExpanded ? "bg-slate-50/90 shadow-inner border-l-4 border-slate-800" : ""}`}
                    id={`feed-item-${c.transactionCode}`}
                  >
                    
                    {/* Glowing highlight indicator for instant real-time entries */}
                    {isNew && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    )}

                    {/* Standard Card View Grid */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Status Icon Indicator */}
                        <div className="mt-1 flex items-center justify-center shrink-0">
                          <span className={`w-3.5 h-3.5 rounded-full ${statusDetails.dotClass} flex items-center justify-center text-[7px] text-white font-extrabold`}>
                            {statusDetails.icon}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          {/* Sender Name */}
                          <div className="flex items-center flex-wrap gap-2">
                            <span 
                              onClick={() => {
                                if ((window as any).viewDonorProfile) {
                                  (window as any).viewDonorProfile(c.senderPhone || c.phoneNumber || "");
                                }
                              }}
                              className="font-extrabold text-slate-800 uppercase tracking-tight truncate max-w-[220px] hover:underline hover:text-indigo-600 cursor-pointer block transition"
                            >
                              {c.cleanedName || c.senderName}
                            </span>
                            
                            {/* Short Status Badge */}
                            <span className={`px-2 py-0.5 border rounded-full font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0 ${statusDetails.badgeClass}`}>
                              {statusDetails.label}
                            </span>

                            {/* Donor Recognition Badge */}
                            {(() => {
                              const badge = getDonorBadgeInfo(c.senderPhone || c.phoneNumber || "", c.id || c.transactionCode, contributions);
                              return (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider ${badge.badgeColor}`}>
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Quick subdetails list */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-slate-500">
                            <span className="flex items-center gap-0.5 hover:text-emerald-600 transition" onClick={(e) => handleCopyReceipt(e, c.transactionCode)}>
                              Receipt: <strong className="text-slate-700 hover:underline select-all">{c.transactionCode}</strong>
                              <Copy className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                            </span>
                            <span>•</span>
                            <span>Phone: <strong className="text-slate-600">{maskPhone(c.senderPhone)}</strong></span>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-[140px]">Cam: {campaignName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Hand Side: Amount and Time */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-100 pt-2 md:pt-0 shrink-0">
                        <span className="font-sans font-black text-[#10B981] text-base">
                          KES {c.amount.toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatFriendlyDate(c.timestamp)}
                        </span>
                      </div>

                    </div>

                    {/* Expanded Detail Panel Section */}
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-slate-200/60 text-xs text-slate-600 space-y-4 font-sans select-text cursor-default"
                        onClick={(e) => e.stopPropagation()}
                        id={`feed-item-expanded-${c.transactionCode}`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 p-4 rounded-xl border border-slate-200/40">
                          
                          {/* Sub-column 1: Financial & Identity Details */}
                          <div className="space-y-2.5">
                            <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Financial & Identity Metadata</h5>
                            
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Full M-PESA Name:</span>
                              <span className="font-extrabold text-slate-800 uppercase">{c.senderName}</span>
                            </div>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Cleaned Name:</span>
                              <span className="font-extrabold text-slate-800 uppercase">{c.cleanedName || c.senderName}</span>
                            </div>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Sender Mobile Number:</span>
                              <span className="font-mono font-bold text-slate-700 select-all">{c.senderPhone || "Unknown"}</span>
                            </div>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Transferred KES Amount:</span>
                              <span className="font-sans font-black text-emerald-600">KES {c.amount.toLocaleString()}.00</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Fundraising Category:</span>
                              <span className="font-semibold text-slate-800">{c.category}</span>
                            </div>
                          </div>

                          {/* Sub-column 2: Delivery & Sandbox Verification */}
                          <div className="space-y-2.5">
                            <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Autopilot Delivery Pipeline</h5>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Campaign Account Ref:</span>
                              <span className="font-mono font-bold text-indigo-600 uppercase">{projDetails?.accountReference || "M-PESA REF"}</span>
                            </div>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Firestore Doc ID:</span>
                              <span className="font-mono text-[9px] text-slate-400 truncate max-w-[150px] select-all" title={c.id}>{c.id}</span>
                            </div>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">Double-Entry Ledger:</span>
                              <span className={`font-mono text-[10px] font-bold flex items-center gap-1 uppercase ${c.hasDuplicates ? "text-rose-600" : "text-emerald-600"}`}>
                                <Database className="w-3 h-3" />
                                {c.hasDuplicates ? "REJECTED (DUPLICATE)" : "COMMITTED & LOCKED"}
                              </span>
                            </div>

                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="text-slate-400 font-medium">WhatsApp Notification:</span>
                              <span className={`font-mono text-[10px] font-bold flex items-center gap-1 uppercase ${c.whatsappPosted ? "text-emerald-600 animate-pulse" : "text-amber-500"}`}>
                                <MessageSquare className="w-3 h-3" />
                                {c.whatsappPosted ? "BROADCAST SUCCESS" : "NOT REQUIRED / MANUAL"}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Raw Payload Message:</span>
                              <span className="text-[10px] italic text-slate-500 line-clamp-1 truncate max-w-[150px]" title={c.rawMessage}>{c.rawMessage}</span>
                            </div>
                          </div>

                        </div>

                        {/* Expandable Utility Actions */}
                        <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl text-[10px] font-mono font-bold uppercase">
                          <span className="text-slate-400">💡 Hint: Long-press / right-click this card to copy all diagnostic metadata strings.</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLongPressCopy(c, campaignName);
                            }}
                            className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md transition cursor-pointer"
                          >
                            Copy Payload Block
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

        </div>

        {/* Lazy Loading Footer Controls */}
        {filteredContributions.length > visibleCount && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center" id="live-feed-lazy-loader-box">
            <button
              onClick={() => setVisibleCount(prev => prev + 25)}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-700 shadow-2xs transition-all hover:border-slate-300 cursor-pointer active:scale-98"
              id="live-feed-load-more-btn"
            >
              Load Older Sandbox Contributions (25 records)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
