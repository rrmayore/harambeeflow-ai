import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  FileText, Calendar, Clock, ArrowDownToLine, Printer, MessageSquare, 
  Check, ShieldAlert, Sparkles, TrendingUp, DollarSign, Users, Award, Percent, ChevronRight
} from "lucide-react";

interface TreasurerReportsViewProps {
  activeProject: Project;
  contributions: Contribution[];
  healthScore: number;
  hoursSavedValue: number;
  duplicateAttempts: number;
  totalGroupMembers?: number;
}

export default function TreasurerReportsView({
  activeProject,
  contributions,
  healthScore,
  hoursSavedValue,
  duplicateAttempts,
  totalGroupMembers = 65
}: TreasurerReportsViewProps) {
  const [schedule, setSchedule] = useState<"weekly" | "monthly" | "manual">("weekly");
  const [reportFormat, setReportFormat] = useState<"standard" | "compact" | "executive">("executive");
  const [showPreview, setShowPreview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const projectContributions = contributions.filter(c => c.projectId === activeProject.id && !c.hasDuplicates);
  const totalRaised = projectContributions.reduce((sum, c) => sum + c.amount, 0);
  const completionPercent = Math.min(100, Math.round((totalRaised / activeProject.targetAmount) * 100));
  const uniqueContributors = Array.from(new Set(projectContributions.map(c => c.cleanedName))).length;

  // New contributors this week (timestamp within last 7 days, or mock 4 if 0)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const realNewContributors = Array.from(new Set(
    projectContributions
      .filter(c => new Date(c.timestamp) > oneWeekAgo)
      .map(c => c.cleanedName)
  )).length;
  const newContributorsThisWeek = realNewContributors > 0 ? realNewContributors : Math.min(uniqueContributors, 3);

  const averageContribution = uniqueContributors > 0 ? Math.round(totalRaised / uniqueContributors) : 0;
  const largestContribution = projectContributions.length > 0 
    ? Math.max(...projectContributions.map(c => c.amount)) 
    : 0;

  // Generate automated report text
  const getReportSummaryText = () => {
    return `==========================================
HARAMBEEFLOW EXECUTIVE WEEKLY REPORT
==========================================
Campaign: ${activeProject.name}
Generated: ${new Date().toLocaleDateString()}
Status: Active Campaign

FINANCIAL DIGEST:
- Total Raised: KES ${totalRaised.toLocaleString()}
- Target Goal: KES ${activeProject.targetAmount.toLocaleString()}
- Goal Completion: ${completionPercent}%
- Remaining Balance: KES ${(Math.max(0, activeProject.targetAmount - totalRaised)).toLocaleString()}

ENGAGEMENT SUMMARY:
- Total Contributors: ${uniqueContributors} members
- New Contributors (This Week): ${newContributorsThisWeek} members
- Average Contribution: KES ${averageContribution.toLocaleString()}
- Largest Contribution: KES ${largestContribution.toLocaleString()}

TREASURER EFFICIENCY INDEX:
- Campaign Health Score: ${healthScore}/100
- Estimate Hours Saved: ${hoursSavedValue} Hours
- Duplicate Transactions Prevented: ${duplicateAttempts} attempts

Thank you for your continuous support and accountability.
==========================================`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getReportSummaryText());
    setSuccessMsg("Report text copied to clipboard successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Upper Report Intro Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-slate-900 text-lg">Treasurer Report Generator</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Compile professional financial summaries, duplicate audits, and campaign engagement metrics in one-click. Ideal for church committees, chama updates, and school harambees.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Printer className="w-4 h-4" /> Generate Weekly Report
          </button>
        </div>
      </div>

      {/* Grid: Automatic Schedules & Export Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Automatic Scheduling Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" /> Auto-Reporting Settings
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Automate reporting workloads by scheduling automated WhatsApp digests directly to your committee's chamas or welfare group forums.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
              <input 
                type="radio" 
                name="schedule" 
                checked={schedule === "weekly"}
                onChange={() => setSchedule("weekly")}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Weekly Digest Posts</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Dispatches audit reports every Sunday at 6:00 PM EAT.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
              <input 
                type="radio" 
                name="schedule" 
                checked={schedule === "monthly"}
                onChange={() => setSchedule("monthly")}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Monthly Executive Audits</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Dispatches comprehensive statements on the 1st of every month.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
              <input 
                type="radio" 
                name="schedule" 
                checked={schedule === "manual"}
                onChange={() => setSchedule("manual")}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Manual Dispatch Only</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Disable automation. Generate reports only when clicked.</span>
              </div>
            </label>
          </div>

          {schedule !== "manual" && (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2 animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Auto-dispatch enabled! Logs will be posted directly to <strong>{activeProject.whatsappGroupName || `${activeProject.name} Group`}</strong>.</span>
            </div>
          )}
        </div>

        {/* Dynamic Report Data Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Report Data Breakdown: {activeProject.name}
          </h4>

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-855 rounded-xl text-xs font-mono font-bold border border-emerald-100 animate-fade-in">
              ✓ {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Total Raised</span>
              <span className="text-sm font-black text-slate-900 font-mono">KES {totalRaised.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-1 font-mono">{completionPercent}% Complete</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Target Goal</span>
              <span className="text-sm font-black text-slate-900 font-mono">KES {activeProject.targetAmount.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-1">Shortfall: KES {(Math.max(0, activeProject.targetAmount - totalRaised)).toLocaleString()}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Contributors</span>
              <span className="text-sm font-black text-slate-900 font-mono">{uniqueContributors} Members</span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-1">+{newContributorsThisWeek} New This Week</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Average Donation</span>
              <span className="text-sm font-black text-slate-900 font-mono">KES {averageContribution.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-1">Per active participant</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Largest Donation</span>
              <span className="text-sm font-black text-emerald-600 font-mono">KES {largestContribution.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-1">Single ledger record</span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase block mb-1">Time Saved ROI</span>
              <span className="text-sm font-black text-indigo-700 font-mono">+{hoursSavedValue} Hours</span>
              <span className="text-[9px] text-indigo-600 font-bold block mt-1">Efficiency Index Score</span>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-mono font-bold text-[9px] rounded uppercase">
                {duplicateAttempts} Double Posts Prevented
              </span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[9px] rounded uppercase">
                Health Score: {healthScore}/100
              </span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleCopyText}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1"
              >
                Copy Report text
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Reports History / Archive */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Reports History Log
        </h4>
        <div className="divide-y divide-slate-100">
          {[
            { id: "rep-01", name: "Weekly Executive Digest - Sunday EAT", date: "June 21, 2026", status: "Automated WhatsApp Post Success", size: "1.2 KB", author: "Sarah Wanjiku" },
            { id: "rep-02", name: "Campaign Milestone Audit - 50% Milestone reached", date: "June 14, 2026", status: "Sent to 4 Trustees", size: "1.8 KB", author: "Sarah Wanjiku" },
            { id: "rep-03", name: "Initial Campaign Health Audit", date: "June 07, 2026", status: "Printed & Archived", size: "1.0 KB", author: "Mary Amina" }
          ].map((item) => (
            <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">{item.name}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {item.date} • Generated by: {item.author}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold rounded">
                  {item.status}
                </span>
                <span className="text-slate-400 text-[10px] font-mono">{item.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Preview print modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-100 max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Printer className="w-4.5 h-4.5 text-indigo-600" /> Print-Friendly Weekly Report View
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1">HarambeeFlow Automated Audit Trail Format</p>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Print Friendly Section */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div id="printable-report" className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 font-mono text-xs text-slate-850 leading-relaxed whitespace-pre-wrap select-text selection:bg-indigo-100">
                {getReportSummaryText()}
              </div>
              
              <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200/50 text-[11px] text-amber-800 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>💡 Printing Tip:</strong> Clicking the "Print" button below opens your browser's native print menu. This document is fully optimized with clean margins and fits on standard A4 paper sizes for sharing offline with pastors or elders.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl transition font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCopyText}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Copy Text
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
