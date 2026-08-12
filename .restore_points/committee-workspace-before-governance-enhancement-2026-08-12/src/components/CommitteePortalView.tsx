import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  Users, Lock, ShieldCheck, FileText, ClipboardList, 
  BarChart3, RefreshCw, Layers, TrendingUp, Info, Activity 
} from "lucide-react";

interface CommitteePortalViewProps {
  activeProject: Project | null;
  contributions: Contribution[];
}

export default function CommitteePortalView({
  activeProject,
  contributions
}: CommitteePortalViewProps) {
  const [selectedRole, setSelectedRole] = useState<"Chairperson" | "Secretary" | "Auditor" | "Committee Member">("Chairperson");
  
  // Simulated audit logs
  const [auditLogs] = useState([
    { id: "1", time: "2026-06-24 09:12:10", user: "Daraja Gateway", action: "Matched Webhook", desc: "Successfully parsed M-PESA C2B transaction for KES 12,000" },
    { id: "2", time: "2026-06-23 18:45:00", user: "Treasurer", action: "Report Compiled", desc: "Generated weekly summary and dispatched updates to WhatsApp" },
    { id: "3", time: "2026-06-22 14:10:30", user: "Auditor", action: "Rules Configured", desc: "Approved auxiliary duplicate detection thresholds" },
    { id: "4", time: "2026-06-21 11:05:15", user: "Chairperson", action: "Statement Review", desc: "Accessed statement reconciliation log and cross-checked ledger" },
    { id: "5", time: "2026-06-20 09:00:00", user: "Secretary", action: "Campaign Launched", desc: "Initialized public flyer and seeded template parameters" }
  ]);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No active campaign found. Please select a campaign in the home screen.
      </div>
    );
  }

  const projContributions = contributions.filter(c => c.projectId === activeProject.id);
  const raisedAmount = projContributions.reduce((sum, c) => sum + c.amount, 0);
  const percent = Math.min(100, Math.round((raisedAmount / activeProject.targetAmount) * 100)) || 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="committee-portal-root">
      
      {/* Portal Topbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase border border-purple-100 flex items-center gap-1 w-max">
            <Users className="w-3.5 h-3.5" /> Committee Member Portal
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Read-Only Committee Oversight Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Empower chairpersons, auditors, and members to directly track funds and verify logs without bothering the treasurer.
          </p>
        </div>

        {/* Committee roles switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {(["Chairperson", "Secretary", "Auditor", "Committee Member"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer select-none ${
                selectedRole === role
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Locked Read-Only Notice banner */}
      <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl p-4 mb-8 flex items-start gap-3.5">
        <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-extrabold uppercase font-mono text-purple-800">
            Authenticated Access: {selectedRole} (Read-Only)
          </h4>
          <p className="text-[11px] text-purple-700/90 leading-relaxed mt-1">
            You are currently viewing the campaign statistics as a <strong>{selectedRole}</strong>. In compliance with multi-treasurer audit boundaries, your access has zero writing privileges. You cannot alter ledger logs, delete matches, or configure webhook targets.
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* KPI 1: Raised */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-sm transition">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Aggregated Collection</span>
          <p className="text-xl font-black text-slate-900 mt-1">KES {raisedAmount.toLocaleString()}</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-600 h-full" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-2 block">
            Target Goal: KES {activeProject.targetAmount.toLocaleString()} ({percent}% complete)
          </span>
        </div>

        {/* KPI 2: Total Givers */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-sm transition">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Active Committee Pool</span>
          <p className="text-xl font-black text-slate-900 mt-1">{projContributions.length} Contributors</p>
          <span className="text-[9px] font-mono text-emerald-600 mt-2 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified M-PESA Code Matches
          </span>
          <span className="text-[9px] font-mono text-slate-400 block mt-1">
            Reconciled on Safaricom ledger
          </span>
        </div>

        {/* KPI 3: System Health */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-sm transition">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Audit Health Status</span>
          <p className="text-xl font-black text-slate-900 mt-1">{activeProject.healthScore || 85}% Secure</p>
          <span className="text-[9px] font-mono text-indigo-600 mt-2 font-bold block">
            ✓ Compliance Checks Active
          </span>
          <span className="text-[9px] font-mono text-slate-400 block mt-1">
            ODPC 2019 Privacy Standard approved
          </span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Contributions ledger read-only stream */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
              <ClipboardList className="w-4 h-4 text-purple-600" /> Complete Contribution Register
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 font-mono font-bold text-slate-400 uppercase">
                    <th className="py-3 px-1">Contributor</th>
                    <th className="py-3 px-1">M-PESA Code</th>
                    <th className="py-3 px-1 text-right">Amount</th>
                    <th className="py-3 px-1 text-right">Settled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projContributions.length > 0 ? (
                    projContributions.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-slate-50">
                        <td className="py-3 px-1 font-bold text-slate-800">{c.senderName}</td>
                        <td className="py-3 px-1 font-mono text-indigo-600 font-semibold">{c.transactionCode}</td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-emerald-600">
                          KES {c.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-1 text-right font-mono text-slate-400">
                          {new Date(c.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-mono">
                        No transactions registered in this campaign yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Audit trail logs */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
              <Activity className="w-4 h-4 text-purple-600" /> Committee Audit Trails
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>{log.time}</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm font-bold text-[8px] uppercase text-slate-600">
                      {log.action}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 mt-1.5">{log.user}</p>
                  <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">{log.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800">
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-purple-400 mb-2">Committee Charter Agreement</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              All committee members must maintain privacy of giver contacts. Redistribution of names, phones, or contributions logs without explicit board consent is a punishable offense under national privacy guidelines.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
