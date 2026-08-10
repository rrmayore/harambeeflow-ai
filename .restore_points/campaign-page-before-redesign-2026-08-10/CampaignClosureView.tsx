import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  Flame, Lock, ShieldAlert, FileText, Download, CheckCircle2, 
  Archive, Landmark, Info, AlertTriangle, ChevronRight, RefreshCw 
} from "lucide-react";

interface CampaignClosureViewProps {
  activeProject: Project | null;
  contributions: Contribution[];
  onArchiveCampaign?: (projId: string) => void;
}

export default function CampaignClosureView({
  activeProject,
  contributions,
  onArchiveCampaign
}: CampaignClosureViewProps) {
  const [step, setStep] = useState<"initial" | "processing" | "closed">("initial");
  const [isLocking, setIsLocking] = useState(false);
  const [closureDate, setClosureDate] = useState("");

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No active campaign found. Please select a campaign in the home screen.
      </div>
    );
  }

  const projContributions = contributions.filter(c => c.projectId === activeProject.id);
  const raisedAmount = projContributions.reduce((sum, c) => sum + c.amount, 0);
  const deficit = activeProject.targetAmount - raisedAmount;
  const percent = Math.min(100, Math.round((raisedAmount / activeProject.targetAmount) * 100)) || 0;

  const handleCloseCampaign = () => {
    setIsLocking(true);
    setTimeout(() => {
      setIsLocking(false);
      setStep("closed");
      setClosureDate(new Date().toLocaleString());
      if (onArchiveCampaign) {
        onArchiveCampaign(activeProject.id);
      }
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="campaign-closure-root">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase border border-rose-100 flex items-center gap-1 w-max">
            <Flame className="w-3.5 h-3.5" /> Campaign Closure Workflow
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Official Campaign Closing Procedures
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile outstanding balances, finalize registers, lock ledger entries, and compile audit-ready closure packages.
          </p>
        </div>
      </div>

      {step === "initial" && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
            <h3 className="text-base font-extrabold text-slate-900 uppercase font-mono tracking-wide">
              Initiate Ledger Closure
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Closing a campaign is a legal and structural audit boundary. This will freeze transaction matching, lock manual edits, and prepare the final financial register package.
            </p>
          </div>

          {/* Current Campaign Summary metrics before closing */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Current Campaign Status</h4>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Campaign Title</span>
                <p className="font-bold text-slate-800 mt-0.5">{activeProject.name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Total Raised</span>
                <p className="font-bold text-emerald-600 mt-0.5">KES {raisedAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Target Goal</span>
                <p className="font-bold text-slate-800 mt-0.5">KES {activeProject.targetAmount.toLocaleString()} ({percent}%)</p>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Outstanding Deficit</span>
                <p className="font-bold text-rose-600 mt-0.5">
                  KES {deficit > 0 ? deficit.toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Guidelines checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
              <Info className="w-4 h-4 text-slate-400" /> Closure Guidelines
            </h4>
            <ul className="text-[11px] text-slate-500 space-y-2 pl-4 list-disc leading-relaxed">
              <li>Ensure all offline M-PESA messages or cash donations are manually uploaded in the dashboard before initiating this lock.</li>
              <li>Safaricom Daraja webhook listener will be safely unsubscribed from this campaign's account reference code.</li>
              <li>All committee members will automatically lose any remaining operational matching overrides, preserving a read-only archive ledger.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setStep("processing")}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              Start Official Closure <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xs text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto animate-spin" />
          <h3 className="text-base font-extrabold text-slate-900 uppercase font-mono tracking-wide">
            Finalizing Ledgers & Generating Package...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Please wait while the HarambeeFlow automated auditor compiles final contribution statements, calculates participation curves, audits duplicate attempts, and seals the package with encryption signatures.
          </p>

          <div className="space-y-2.5 max-w-xs mx-auto text-left font-mono text-[10px] text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-emerald-600 font-bold">✓ Compiled Contribution Register</p>
            <p className="text-emerald-600 font-bold">✓ Formulated Deficit Calculations</p>
            <p className="text-indigo-600 font-bold">⏱ Sealing audit log journals...</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center gap-4">
            <button
              onClick={handleCloseCampaign}
              disabled={isLocking}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isLocking ? "Locking & Archiving..." : "Lock Ledger & Seal Package"}
            </button>
          </div>
        </div>
      )}

      {step === "closed" && (
        <div className="space-y-8">
          
          {/* Confirmed Lock plaque */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 border border-slate-800 shadow-xl max-w-3xl mx-auto text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <div>
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                AUDIT SEALED & CLOSED
              </span>
              <h3 className="text-xl font-black tracking-tight mt-1">
                Campaign Ledger Permanently Frozen
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                The campaign <strong>{activeProject.name}</strong> has been successfully archived. Manual edits have been locked, and its transactions are sealed into a historical immutable register.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-center gap-6 text-[10px] font-mono text-slate-400">
              <span>CLOSED AT: {closureDate || "Today"}</span>
              <span>COMPLIANCE REG: HF-ODPC-2026-LOCK</span>
            </div>
          </div>

          {/* Displaying generated reports package */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-4xl mx-auto space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                Generated Archive Reports Package
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Review and download components of the official permanent fundraising record.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Report Card 1: Final Financial */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-slate-50">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-sm uppercase">
                    Document 1
                  </span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="font-bold text-slate-800 text-xs">Final Financial Report</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Summary of total targets, actual aggregate funds cleared at Daraja M-PESA gateway, and final surplus/deficit evaluations.
                </p>
                <div className="text-[10px] font-mono text-indigo-600 font-bold">
                  Target: KES {activeProject.targetAmount.toLocaleString()} | Raised: KES {raisedAmount.toLocaleString()}
                </div>
              </div>

              {/* Report Card 2: Contribution register */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-slate-50">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-sm uppercase">
                    Document 2
                  </span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="font-bold text-slate-800 text-xs">Contribution Register</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The complete chronological ledger of all {projContributions.length} verified contributors, transaction reference IDs, and timestamp hashes.
                </p>
                <div className="text-[10px] font-mono text-indigo-600 font-bold">
                  Chronology matches sealed audit guidelines
                </div>
              </div>

              {/* Report Card 3: Participation Report */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-slate-50">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-sm uppercase">
                    Document 3
                  </span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="font-bold text-slate-800 text-xs">Participation Report</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Audits overall committee engagement levels, WhatsApp update posts coverage, and consistency metrics of group givers.
                </p>
                <div className="text-[10px] font-mono text-indigo-600 font-bold">
                  Average Giver Sum: KES {projContributions.length > 0 ? Math.round(raisedAmount / projContributions.length).toLocaleString() : 0}
                </div>
              </div>

              {/* Report Card 4: Health Audit */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-slate-50">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-sm uppercase">
                    Document 4
                  </span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="font-bold text-slate-800 text-xs">Campaign Health Report</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Seals structural health scores, duplicate matching preventions indices, and SMS mismatch checks.
                </p>
                <div className="text-[10px] font-mono text-indigo-600 font-bold">
                  Final score evaluated at {activeProject.healthScore || 85}% Optimized
                </div>
              </div>

            </div>

            {/* Action panel to download zip */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => alert("Downloading secure ZIP package of campaign audit logs...")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Complete ZIP package
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
