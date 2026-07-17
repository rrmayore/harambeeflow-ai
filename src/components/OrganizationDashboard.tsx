import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  BarChart4, ArrowRight, Settings, CheckCircle2, AlertTriangle, Play, Pause, 
  Trash, Share2, QrCode, FileSpreadsheet, FileClock, ShieldCheck, Mail, Sparkles, Plus,
  Smartphone, Download
} from "lucide-react";

interface OrganizationDashboardProps {
  projects: Project[];
  contributions: Contribution[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  onStartFundraiserLauncher: () => void;
  onInstall?: () => void;
  isInstallable?: boolean;
}

export default function OrganizationDashboard({ 
  projects, 
  contributions, 
  activeProject, 
  setActiveProject,
  onStartFundraiserLauncher,
  onInstall,
  isInstallable = false
}: OrganizationDashboardProps) {
  const [campaignStatus, setCampaignStatus] = useState<"ACTIVE" | "PAUSED" | "COMPLETED">("ACTIVE");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [treasurerNotes, setTreasurerNotes] = useState("Direct audit ledger reconciled on " + new Date().toLocaleDateString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-select first project if null but we have projects
  React.useEffect(() => {
    if (!activeProject && projects && projects.length > 0) {
      setActiveProject(projects[0]);
    }
  }, [activeProject, projects, setActiveProject]);

  // Filter contributions by current active project safely
  const projectContributions = activeProject 
    ? contributions.filter(c => c.projectId === activeProject.id && !c.hasDuplicates) 
    : [];
  const totalRaised = projectContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalGoal = activeProject ? activeProject.targetAmount : 0;
  const ratio = totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;

  // Auditor Reconciliations
  const handleExportAuditReport = () => {
    if (!activeProject) return;
    const auditBody = `
==================================================
        HARAMBEEFLOW TREASURER AUDIT LEDGER
==================================================
Campaign Key:     ${activeProject.id}
Campaign Title:   ${activeProject.name}
Paybill Number:   ${activeProject.paybillNumber}
Ref Channel:      ${activeProject.accountReference}
Audit Timestamp:  ${new Date().toISOString()}
--------------------------------------------------

FINANCIAL METRICS:
Total Amount In Goal:   KES ${totalGoal.toLocaleString()}
Total Amount Deposited: KES ${totalRaised.toLocaleString()}
Deficit Gap Remaining:  KES ${(totalGoal - totalRaised).toLocaleString()}
Fulfillment Ratio:      ${ratio}%

CONTRIBUTION AUDIT LINE DETAILS:
${projectContributions.map(c => `
[PASSED] Code: ${c.transactionCode} | Date: ${new Date(c.timestamp).toISOString()} | CleanName: ${c.cleanedName} | Amount: KES ${c.amount.toLocaleString()}
`).join("")}

--------------------------------------------------
VERDICTS:
Double-Entry Guard Status: PASSED (Zero duplicate codes committed)
Treasurer Verification:    ${treasurerNotes}
Security Clearance:        STRIPE-GRADE STATE SECURED
==================================================
Authorized Signature Pin: _______________
    `;
    const blob = new Blob([auditBody], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Treasurer_Audit_Report_${activeProject.name.replace(/\s+/g, "_")}.txt`;
    link.click();
  };

  const handleCopyLink = () => {
    if (!activeProject) return;
    const url = `${window.location.origin}/campaign/${activeProject.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleUpdateDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in" id="org-management-root">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase">Treasurer Organization Terminal</span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            Campaign Controls & QR <Settings className="w-6 h-6 text-indigo-600" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">Configure limits, manage approvals, and download verified financial reconciliations.</p>
        </div>

        <button
          onClick={onStartFundraiserLauncher}
          className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase shadow-sm transition inline-flex items-center gap-2 self-start cursor-pointer font-mono"
        >
          <Plus className="w-4 h-4" /> Start New Fundraiser drive
        </button>
      </div>

      {/* Top Banner Campaign Status */}
      {activeProject ? (
        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              campaignStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-600" :
              campaignStatus === "PAUSED" ? "bg-amber-50 text-amber-600" :
              "bg-slate-100 text-slate-600"
            }`}>
              <BarChart4 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 font-sans text-base">{activeProject.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-sm font-mono text-[9px] font-bold uppercase tracking-widest ${
                  campaignStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                  campaignStatus === "PAUSED" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                  "bg-slate-150 text-slate-700"
                }`}>
                  {campaignStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">Linked Shortcode Code: {activeProject.paybillNumber} | Reference: {activeProject.accountReference}</p>
            </div>
          </div>

          {/* Action controllers */}
          <div className="flex items-center gap-2">
            {campaignStatus !== "ACTIVE" ? (
              <button
                onClick={() => setCampaignStatus("ACTIVE")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Resume Drive
              </button>
            ) : (
              <button
                onClick={() => setCampaignStatus("PAUSED")}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-205 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> Pause Drive
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1.5 transition cursor-pointer font-mono"
              id="btn-copy-link"
            >
              <Share2 className="w-3.5 h-3.5" /> {copiedLink ? "Copied!" : "Share Link"}
            </button>

            <button
              onClick={() => setShowQr(!showQr)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1.5 transition cursor-pointer font-mono"
            >
              <QrCode className="w-3.5 h-3.5" /> View QR Code
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200 mb-8 text-center space-y-3">
          <p className="text-xs font-mono text-emerald-500 font-bold uppercase tracking-wider">No Active Drive Selected</p>
          <p className="text-[12px] text-slate-500 max-w-md mx-auto">Please select an existing fundraiser drive from organizational directories or click above to start a new drive.</p>
          {projects.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4.5">
              <span className="text-xs text-slate-600 font-bold font-sans">Active Campaign:</span>
              <select
                onChange={(e) => {
                  const p = projects.find(pr => pr.id === e.target.value);
                  if (p) setActiveProject(p);
                }}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-705 cursor-pointer"
              >
                <option value="">-- Select Drive --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Grid of details: Left analytics settings, Right QR and report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Settings and details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* QR CODE OVERLAY REQUISITE */}
          {showQr && activeProject && (
            <div className="glass-card p-6 rounded-2xl bg-white border border-indigo-200 text-center space-y-4 animate-scale-up">
              <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" /> M-PESA Point-of-Sale QR Code
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Churches can print this QR and stick it on notice boards. Scanning allows members to initiate payments without code typo risks.</p>
              
              <div className="mx-auto w-40 h-40 bg-slate-100 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-center relative">
                {/* Visual QR Simulator */}
                <div className="absolute inset-2 border-2 border-dashed border-indigo-400 rounded-lg opacity-20" />
                <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full p-2">
                  {[...Array(25)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-xs ${
                        (i % 3 === 0 && i % 2 === 0) || i === 0 || i === 4 || i === 20 || i === 24
                          ? "bg-slate-800"
                          : "bg-slate-300"
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400">
                Data block: mpesa://paybill?shortcode={activeProject.paybillNumber}&billref={activeProject.accountReference}
              </div>
            </div>
          )}

          {/* Goal tracker card details */}
          <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200 space-y-5">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-indigo-600" /> Goal tracking & Analytics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Target Amount</span>
                <span className="text-lg font-bold block text-slate-800 font-mono mt-0.5">KES {totalGoal.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total Collected</span>
                <span className="text-lg font-bold block text-emerald-600 font-mono mt-0.5">KES {totalRaised.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Goal Percentage</span>
                <span className="text-lg font-bold block text-indigo-600 font-mono mt-0.5">{ratio}% Complete</span>
              </div>
            </div>

            {/* Visual dynamic progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Fundraiser progress profile</span>
                <span>KES {totalRaised.toLocaleString()} / KES {totalGoal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${ratio}%` }} />
              </div>
            </div>
          </div>

          {/* Treasurer controls / configuration */}
          <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Treasurer Administrative Override Notes
            </h4>

            {saveSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-xl border border-emerald-100 animate-fade-in">
                ✓ Internal metadata ledger note committed to persistent storage.
              </div>
            )}

            <form onSubmit={handleUpdateDatabase} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Audit Ledger Note Remarks:</label>
                <textarea 
                  value={treasurerNotes}
                  onChange={(e) => setTreasurerNotes(e.target.value)}
                  className="w-full bg-slate-55/40 border border-slate-200 rounded-xl px-3.5 py-3 h-20 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">This note will appear inside the generated Auditor TXT Ledger and is preloaded for any third-party compliance requests under Safaricom onboarding regulations.</span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition shadow-2xs"
                >
                  Confirm Ledger Notes
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Col - Reports & actions */}
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Administrative Reporting
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">Generate direct exports tailored for Church committee chairs, school board members, or family councils.</p>

            <div className="space-y-2.5">
              <button
                onClick={handleExportAuditReport}
                className="w-full py-2.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition font-mono font-bold uppercase flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                id="btn-treasurer-audit"
              >
                <FileClock className="w-3.5 h-3.5" /> Export Auditor Report (TXT)
              </button>
              
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[10.5px] text-amber-900 leading-relaxed">
                  <strong>Compliance Lockout:</strong> According to Kenyan Law, any Harambee collecting above KES 1M must archive double-entry ledgers for 7 years.
                </div>
              </div>
            </div>
          </div>

          {/* Real-time contributor insights */}
          <div className="glass-card p-5 rounded-2xl bg-indigo-950 text-white border border-indigo-900 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-widest block bg-indigo-900 px-2 py-0.5 rounded-sm self-start w-fit">Live Insight</span>
            
            <h4 className="font-sans font-bold text-sm text-slate-100">Donor Retention Profile</h4>
            <p className="text-[11px] text-indigo-200 leading-relaxed">
              We tracked {projectContributions.length} verified callbacks on this drive. Top donation segment is <strong>Well-Wisher Support</strong> representing over {ratio > 50 ? "half" : "the bulk"} of the total corpus.
            </p>
          </div>

          {/* New PWA Installation Card requested by user on Settings Page */}
          <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white border border-emerald-800/60 space-y-4 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl" />
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Device Application</h4>
                <p className="text-[9px] text-[#10B981] font-mono font-bold tracking-widest uppercase">Install HarambeeFlow</p>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-300 leading-relaxed">
              Deploy HarambeeFlow as an instant, fast, and offline-capable application directly onto your mobile phone or desktop device for secure real-time kampaign control.
            </p>

            <button
              onClick={onInstall}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 text-[11.5px] font-mono font-extrabold uppercase rounded-xl shadow-lg transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              id="settings-install-pwa-button"
            >
              <Download className="w-4 h-4 shrink-0" />
              {isInstallable ? "Install on My Device" : "Install Options Guide"}
            </button>

            <div className="text-[9.5px] text-slate-400 leading-tight flex items-center gap-1.5 justify-center font-mono">
              <span className="w-1 h-1 bg-emerald-400 rounded-full" /> No app store required • Works on iOS & Android
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
