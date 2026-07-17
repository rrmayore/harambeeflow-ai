import React, { useState, useMemo } from "react";
import { Project, Contribution } from "../types";
import { 
  FileText, Download, Printer, Users, Landmark, Target, BarChart3, ChevronRight 
} from "lucide-react";

interface ReportViewProps {
  activeProject: Project;
  contributions: Contribution[];
}

export default function ReportView({
  activeProject,
  contributions
}: ReportViewProps) {
  const [copiedCsv, setCopiedCsv] = useState(false);

  const campaignContributions = useMemo(() => {
    return contributions.filter(c => c.projectId === activeProject.id || c.campaignId === activeProject.id);
  }, [contributions, activeProject.id]);

  const totalRaised = useMemo(() => {
    return campaignContributions.reduce((sum, c) => sum + Number(c.amount), 0);
  }, [campaignContributions]);

  const percentComplete = Math.min(100, Math.round((totalRaised / activeProject.targetAmount) * 100));

  const averageDonation = useMemo(() => {
    if (campaignContributions.length === 0) return 0;
    return Math.round(totalRaised / campaignContributions.length);
  }, [campaignContributions.length, totalRaised]);

  const largestDonation = useMemo(() => {
    if (campaignContributions.length === 0) return 0;
    return Math.max(...campaignContributions.map(c => Number(c.amount)));
  }, [campaignContributions]);

  // Generate simulated CSV string
  const handleExportCsv = () => {
    const headers = "Transaction Code,Date,Contributor,Phone Number,Amount (KES),Category,Status\n";
    const rows = campaignContributions.map(c => {
      const date = c.timestamp ? new Date(c.timestamp).toISOString().split("T")[0] : "2026-07-02";
      return `${c.transactionCode},${date},"${c.senderName || c.cleanedName}","${c.senderPhone || c.phoneNumber}",${c.amount},"${c.category || "Well-wisher"}",Reconciled`;
    }).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `HarambeeFlow_Report_${activeProject.accountReference}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100 min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Desk Panel */}
        <div className="border-b border-slate-800 pb-4" id="reports-header">
          <h1 className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight" id="reports-header-title">
            Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1" id="reports-header-subtitle">
            View your fundraising summary, contributor records, and printable financial reports.
          </p>
        </div>

        {campaignContributions.length === 0 && (
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3.5 text-slate-200 animate-fade-in" id="reports-empty-state">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-white">Start receiving contributions to generate reports.</h4>
              <p className="text-slate-400 leading-relaxed font-sans">
                Your report is empty because no contributions have been recorded yet. Share your campaign and receive payments to generate a financial summary.
              </p>
            </div>
          </div>
        )}

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="reports-summary-cards">
          {/* Card 1: Amount Raised */}
          <div className="p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-950/5">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Amount Raised</span>
              <p className="text-xl font-black text-emerald-400 font-sans">KES {totalRaised.toLocaleString()}</p>
            </div>
          </div>

          {/* Card 2: Contributors */}
          <div className="p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-950/5">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Contributors</span>
              <p className="text-xl font-black text-slate-100 font-sans">{campaignContributions.length}</p>
            </div>
          </div>

          {/* Card 3: Average Contribution */}
          <div className="p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-950/5">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Average Contribution</span>
              <p className="text-xl font-black text-slate-100 font-sans">KES {averageDonation.toLocaleString()}</p>
            </div>
          </div>

          {/* Card 4: Largest Contribution */}
          <div className="p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-950/5">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Largest Contribution</span>
              <p className="text-xl font-black text-slate-100 font-sans">KES {largestDonation.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap gap-3" id="reports-primary-actions">
          <button
            onClick={() => window.print()}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition duration-150 cursor-pointer shadow-md min-h-[44px]"
            id="btn-print-report"
          >
            <span className="text-sm">🟢</span> Print Report
          </button>
          <button
            onClick={handleExportCsv}
            disabled={campaignContributions.length === 0}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs rounded-xl flex items-center gap-2 transition duration-150 cursor-pointer min-h-[44px]"
            id="btn-export-excel"
          >
            <span className="text-sm">⬜</span> Export to Excel
          </button>
        </div>

        {/* Report Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl" id="panel-report-preview">
          
          {/* Paper document representation */}
          <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 space-y-8 font-sans relative shadow-md">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <h4 className="text-base font-black uppercase tracking-wider text-slate-900 leading-none" id="preview-report-title">Campaign Summary</h4>
                <p className="text-[10px] text-slate-500 font-medium">Prepared by HarambeeFlow</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-bold text-slate-700">Ref: HF-{activeProject.accountReference}</p>
                <p className="text-[10px] text-slate-400">Generated: 2 July 2026</p>
              </div>
            </div>

            {/* Campaign Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs border-b border-slate-100 pb-5">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Campaign</span>
                <span className="font-extrabold text-slate-800">{activeProject.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Goal</span>
                <span className="font-extrabold text-slate-800">KES {activeProject.targetAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Amount Raised</span>
                <span className="font-extrabold text-emerald-700">KES {totalRaised.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Progress</span>
                <span className="font-extrabold text-slate-800">{percentComplete}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 sm:col-span-2">
                <span className="text-slate-400 font-medium">Generated</span>
                <span className="font-extrabold text-slate-800">2 July 2026</span>
              </div>
            </div>

            {/* Contribution History Table */}
            <div className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wide text-slate-700">Contribution History</h5>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Contributor</th>
                      <th className="py-3 px-4">Receipt Number</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-xs">
                    {campaignContributions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">No contribution transactions compiled in active dataset.</td>
                      </tr>
                    ) : (
                      campaignContributions.map((c, index) => {
                        const date = c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "2 July 2026";
                        return (
                          <tr key={c.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/55"}>
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{date}</td>
                            <td className="py-3.5 px-4 font-black text-slate-800">{c.senderName || c.cleanedName}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{c.transactionCode}</td>
                            <td className="py-3.5 px-4 font-black font-sans text-right text-emerald-800">KES {Number(c.amount).toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report Footer */}
            <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-medium text-center sm:text-left">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-600">Prepared by HarambeeFlow</p>
                <p>Secure M-PESA Fundraising Reports</p>
              </div>
              <div className="text-center sm:text-right space-y-0.5">
                <p className="font-semibold text-slate-500">Generated on 2 July 2026</p>
                <p className="text-[9px]">This report reflects contributions received up to the generation date.</p>
              </div>
            </div>

          </div>

          {/* Secondary Action Buttons */}
          <div className="flex gap-3 pt-2" id="reports-secondary-actions">
            <button
              onClick={() => {
                const message = `Check out our campaign summary report for "${activeProject.name}": We have successfully raised KES ${totalRaised.toLocaleString()} from ${campaignContributions.length} contributors!`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700 min-h-[44px]"
              id="btn-share-report"
            >
              📤 Share Report
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700 min-h-[44px]"
              id="btn-download-pdf"
            >
              📥 Download PDF
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
