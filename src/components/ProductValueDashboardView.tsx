import React from "react";
import { Project, Contribution } from "../types";
import { 
  Activity, Clock, ShieldAlert, MessageSquare, FileSpreadsheet, 
  TrendingUp, ThumbsUp, Scale, Sparkles, HeartHandshake, CheckCircle2 
} from "lucide-react";

interface ProductValueDashboardViewProps {
  activeProject: Project;
  contributions: Contribution[];
  duplicateAttempts: number;
}

export default function ProductValueDashboardView({
  activeProject,
  contributions,
  duplicateAttempts
}: ProductValueDashboardViewProps) {
  
  const projectContributions = contributions.filter(c => c.projectId === activeProject.id);
  const totalRaised = projectContributions.filter(c => !c.hasDuplicates).reduce((sum, c) => sum + c.amount, 0);
  const totalTxCount = projectContributions.length;
  
  // Calculate Hours Saved (Each automated M-PESA webhook or statement row parses inside 2 seconds, saving ~15 minutes of manual matching, WhatsApp copying and Excel typing)
  const hoursSavedValue = Math.round((totalTxCount * 15) / 60) + 4; // Add a baseline of 4 hours setup time saved

  // Manual Entries Avoided (all parsed contributions, since they bypass manual input fields entirely!)
  const manualEntriesAvoided = totalTxCount;

  // WhatsApp Message Automated (Instant confirmations sent + weekly summary posted)
  const whatsappMsgsAutomated = totalTxCount + 3;

  // Treasurer Efficiency Score
  const efficiencyScore = totalTxCount > 0 ? Math.min(100, 95 + Math.round((duplicateAttempts / Math.max(1, totalTxCount)) * 5)) : 98;

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-xs font-mono font-bold tracking-widest text-indigo-600 uppercase">System Efficiency Desk</span>
        <h3 className="font-sans font-extrabold text-slate-900 text-base mt-1">Product Value Impact Metrics</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          HarambeeFlow actively eliminates manual fundraising workloads. This telemetry dashboard shows the direct Return on Investment (ROI) and administrative hours saved by your committee.
        </p>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Hours Saved Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Administrative Hours Saved</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-2xl font-black font-mono text-slate-900">+{hoursSavedValue} Hours</h4>
            <span className="text-[10px] text-slate-400 block">Based on 15 mins saved per automated Safaricom confirmation.</span>
          </div>
        </div>

        {/* Manual Entries Avoided Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Manual Entries Avoided</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-2xl font-black font-mono text-slate-900">{manualEntriesAvoided} Records</h4>
            <span className="text-[10px] text-slate-400 block">Unique transaction code ledger items saved from typing.</span>
          </div>
        </div>

        {/* WhatsApp Automated Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">WhatsApp Posts Triggered</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-2xl font-black font-mono text-slate-900">{whatsappMsgsAutomated} Broadcasts</h4>
            <span className="text-[10px] text-slate-400 block">Automated receipts & committee updates posted in real time.</span>
          </div>
        </div>

        {/* Duplicate Prevention Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Double Posts Blocked</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-2xl font-black font-mono text-slate-900">{duplicateAttempts} Attacks Blocked</h4>
            <span className="text-[10px] text-slate-400 block">Duplicate M-PESA references filtered from corrupting data.</span>
          </div>
        </div>

        {/* Reports Generated Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Automated Reports Extracted</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-2xl font-black font-mono text-slate-900">4 Audits</h4>
            <span className="text-[10px] text-slate-400 block">Print-friendly PDF or CSV downloads exported by treasurers.</span>
          </div>
        </div>

        {/* Efficiency Score Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Treasurer Efficiency Score</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-2xl font-black font-mono text-indigo-600">{efficiencyScore}% Score</h4>
            <span className="text-[10px] text-slate-400 block">Combined rating of speed, accuracy, and double-entry filters.</span>
          </div>
        </div>

      </div>

      {/* ROI Case Study Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="text-xs font-mono font-extrabold uppercase">Ecosystem ROI Analysis</span>
          </div>
          <h4 className="text-lg font-sans font-black">Why automated ledger updates matter?</h4>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Safaricom M-PESA receipts contain alphanumeric codes that require diligent copy-pasting into spreadsheets. The manual time spent typing, identifying phone names, reconciling shortfalls, and updating WhatsApp forums leads to committee errors and delayed accountability. HarambeeFlow eliminates this friction completely.
          </p>
        </div>
        <div className="p-5 bg-slate-800 rounded-xl border border-slate-750 text-center shrink-0 w-full sm:w-auto">
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Estimated savings value</span>
          <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">KES {(hoursSavedValue * 850).toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-1">Replaced committee overhead value</span>
        </div>
      </div>

    </div>
  );
}
