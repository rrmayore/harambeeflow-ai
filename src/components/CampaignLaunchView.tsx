import React, { useState, useEffect } from "react";
import { Project, Contribution } from "../types";
import { 
  CheckCircle2, Sparkles, Smartphone, Landmark, Share2, 
  Copy, Check, ArrowRight, Printer, RefreshCw, Landmark as Bank, HeartHandshake, Eye
} from "lucide-react";

interface CampaignLaunchViewProps {
  activeProject: Project;
  contributions: Contribution[];
  lastSuccessfulStk: any;
  onNavigateToTab: (tab: string) => void;
}

export default function CampaignLaunchView({
  activeProject,
  contributions,
  lastSuccessfulStk,
  onNavigateToTab
}: CampaignLaunchViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPaybill, setCopiedPaybill] = useState(false);
  const [showPayDetails, setShowPayDetails] = useState(false);

  // Load custom manual states for some check items
  const [logoUploaded, setLogoUploaded] = useState(!!activeProject?.campaignLogo);
  const [committeeInvited, setCommitteeInvited] = useState(true); // Since step 8 default treasurer is in committee
  const [pageShared, setPageShared] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Derived checklist state
  const testStkDone = !!lastSuccessfulStk || contributions.length > 0;
  const receiveDonationDone = contributions.length > 0;

  const checklistItems = [
    { id: "logo", label: "Upload campaign logo", completed: logoUploaded, action: () => { setLogoUploaded(true); } },
    { id: "committee", label: "Invite committee members", completed: committeeInvited, action: () => { setCommitteeInvited(true); } },
    { id: "stk", label: "Test STK Push", completed: testStkDone, action: () => { onNavigateToTab("simulator"); } },
    { id: "share", label: "Share campaign page", completed: pageShared, action: () => { handleCopyLink(); } },
    { id: "donation", label: "Receive first donation", completed: receiveDonationDone, hint: "Simulate a payment to complete this step" },
    { id: "report", label: "Generate first report", completed: reportGenerated, action: () => { setReportGenerated(true); onNavigateToTab("reports"); } }
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  const publicLink = `${window.location.origin}/#/campaign/${activeProject.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setPageShared(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPaybill = () => {
    navigator.clipboard.writeText(`Paybill: ${activeProject.paybillNumber}, Account: ${activeProject.accountReference}`);
    setCopiedPaybill(true);
    setTimeout(() => setCopiedPaybill(false), 2000);
  };

  const handleShareWhatsApp = () => {
    setPageShared(true);
    const text = `Please support our fundraiser "${activeProject.name}" managed securely via HarambeeFlow.\nPaybill: ${activeProject.paybillNumber}\nAccount: ${activeProject.accountReference}\nGoal Target: KES ${activeProject.targetAmount.toLocaleString()}\n\nDonate here: ${publicLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-100 min-h-full">
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        
        {/* Splash Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900 border border-emerald-500/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-emerald-400" />
          </div>
          <div className="max-w-xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              Campaign is now LIVE
            </span>
            <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white leading-tight">
              🎉 Congratulations, your campaign is active!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your fundraising ledger has been established in Firestore. Welcome to HarambeeFlow. Let's launch your fundraiser to the world.
            </p>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left panel: Launch Checklist (Phase 4) */}
          <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Campaign Launch Checklist</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Complete steps to optimize success</p>
              </div>
              <span className="text-lg font-black font-mono text-emerald-400">{progressPercent}%</span>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono text-right">{completedCount} of 6 steps completed</p>
            </div>

            {/* Checklist Items list */}
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    item.completed 
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" 
                      : "bg-slate-950 border-slate-850 hover:bg-slate-850/50 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        item.completed 
                          ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                          : "border-slate-700"
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-bold ${item.completed ? "line-through text-emerald-400/80" : ""}`}>
                      {item.label}
                    </span>
                  </div>

                  {item.action && !item.completed && (
                    <button
                      onClick={item.action}
                      className="text-[10px] font-mono font-black text-emerald-400 hover:text-emerald-300 uppercase underline"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Start Receiving Contributions (Phase 5) */}
          <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-400">Today's First Task</h3>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">Share your campaign and receive your first donation.</p>
                </div>
              </div>

              {/* Huge Action Card Content */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Lipa Na M-PESA Code</span>
                    <span className="text-sm font-black text-slate-200 font-mono">Paybill {activeProject.paybillNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Account Reference</span>
                    <span className="text-sm font-black text-slate-200 font-mono">{activeProject.accountReference}</span>
                  </div>
                </div>

                {/* Primary Copy / Share CTA */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? "Copied Link!" : "Copy Public Link"}
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share WhatsApp
                  </button>
                </div>
              </div>

              {/* Flyer Utilities block */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={() => setShowPayDetails(!showPayDetails)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl text-left text-xs font-semibold text-slate-300 flex items-center justify-between transition"
                >
                  <span>Show Payment Instructions Flyer</span>
                  <ArrowRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showPayDetails ? "rotate-90" : ""}`} />
                </button>

                {showPayDetails && (
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-xs text-slate-400 leading-relaxed font-mono">
                    <p className="font-bold text-slate-200">M-PESA Giver Directions:</p>
                    <p>1. Open M-PESA Menu &gt; Lipa Na M-PESA</p>
                    <p>2. Select Paybill &gt; Enter shortcode <span className="text-emerald-400 font-bold">{activeProject.paybillNumber}</span></p>
                    <p>3. Enter Account &gt; <span className="text-emerald-400 font-bold">{activeProject.accountReference}</span></p>
                    <p>4. Enter Amount and click Pay.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action to Public view */}
            <button
              onClick={() => onNavigateToTab("public-pages")}
              className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
            >
              <Eye className="w-4 h-4" /> Preview Campaign Page
            </button>
          </div>

        </div>

        {/* Next step recommendation banner */}
        <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-between text-xs text-slate-300">
          <p>
            Ready to explore? Step into the <span className="font-bold text-emerald-400">Treasurer Command Center</span> once you have verified your settings.
          </p>
          <button
            onClick={() => onNavigateToTab("dashboard")}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition shrink-0 ml-4 text-[11px]"
          >
            Enter Command Center <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}
