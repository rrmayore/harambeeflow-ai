import React, { useState } from "react";
import { Project } from "../types";
import { 
  CheckCircle2, Sparkles, Smartphone, Landmark, Share2, 
  Copy, Check, ArrowRight, Printer, RefreshCw, Landmark as Bank, HeartHandshake, Eye, QrCode, AlertCircle, Users, Activity
} from "lucide-react";
import CampaignLogo from "./CampaignLogo";

interface CampaignActivationWizardProps {
  activeProject: Project;
  onCompleteActivation: () => void;
  onAddManualContribution?: (payload: any) => Promise<any>;
}

export default function CampaignActivationWizard({
  activeProject,
  onCompleteActivation,
  onAddManualContribution
}: CampaignActivationWizardProps) {
  const [step, setStep] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);

  // STK Push state for inline tester
  const [testAmount, setTestAmount] = useState("1000");
  const [testPhone, setTestPhone] = useState("254712345678");
  const [testName, setTestName] = useState("RICHARD MAYORE");
  const [testStatus, setTestStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  const publicLink = `${window.location.origin}/#/campaign/${activeProject.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyInstructions = () => {
    const text = `Please support our fundraiser "${activeProject.name}" managed securely via HarambeeFlow.\nPaybill: ${activeProject.paybillNumber || "222111"}\nAccount: ${activeProject.accountReference}\nGoal Target: KES ${activeProject.targetAmount.toLocaleString()}\n\nDonate here: ${publicLink}`;
    navigator.clipboard.writeText(text);
    setCopiedInstructions(true);
    setTimeout(() => setCopiedInstructions(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Please support our fundraiser "${activeProject.name}" managed securely via HarambeeFlow.\nPaybill: ${activeProject.paybillNumber || "222111"}\nAccount: ${activeProject.accountReference}\nGoal Target: KES ${activeProject.targetAmount.toLocaleString()}\n\nDonate here: ${publicLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleTriggerTestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddManualContribution) {
      setTestMessage("Contribution processor is not linked. Please complete activation to test.");
      setTestStatus("error");
      return;
    }
    if (!testAmount || isNaN(Number(testAmount)) || Number(testAmount) <= 0) {
      setTestMessage("Please enter a valid test donation amount.");
      setTestStatus("error");
      return;
    }

    setTestStatus("processing");
    setTestMessage("Simulating Daraja STK Push trigger... Handshaking with Safaricom Sandbox...");

    setTimeout(async () => {
      try {
        const txCode = `MPX${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        await onAddManualContribution({
          projectId: activeProject.id,
          amount: Number(testAmount),
          senderName: testName.trim() || "Test Donor",
          senderPhone: testPhone.trim() || "254712345678",
          transactionCode: txCode,
          category: "Well-wisher",
          notes: "Daraja Success Page Simulation"
        });

        setTestStatus("success");
        setTestMessage(`🎉 Simulated STK Callback Succeeded! TransCode: ${txCode}. Verified by HarambeeFlow Ledger.`);
      } catch (err: any) {
        console.error(err);
        setTestStatus("error");
        setTestMessage(err.message || "Simulation callback failed.");
      }
    }, 1200);
  };

  // Estimate days remaining from startDate to closingDate
  const getEstimatedDaysRemaining = () => {
    const today = new Date();
    const close = activeProject.closingDate ? new Date(activeProject.closingDate) : new Date(Date.now() + 30 * 86400000);
    const diffTime = close.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 30;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-100 min-h-full flex items-center justify-center font-sans">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-8 animate-scale-up my-8 relative">
        
        {/* Background glow effect */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="w-64 h-64 text-emerald-400 animate-pulse" />
        </div>

        {/* Success Header with elegant SVG checkmark illustration */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-125 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 text-slate-950 stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
              ✅ Campaign Published Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeProject.name} is LIVE
            </h1>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Activation Sequence • Step {step} of 2
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className={`w-6 h-1.5 rounded-full transition ${step === 1 ? "bg-emerald-400" : "bg-slate-800"}`} />
            <span className={`w-6 h-1.5 rounded-full transition ${step === 2 ? "bg-emerald-400" : "bg-slate-800"}`} />
          </div>
        </div>

        {step === 1 ? (
          /* Step 1: Detailed Specifications & Identity Card */
          <div className="space-y-6 animate-fade-in">
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed text-center max-w-lg mx-auto">
              Your campaign is now safely registered in cloud Firestore. HarambeeFlow has secured Daraja callback routes. Review your verified specifications below:
            </p>

            {/* Main content split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Identity & Specs */}
              <div className="md:col-span-8 space-y-4">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3.5 pb-3 border-b border-slate-850">
                    <CampaignLogo project={activeProject} size="sm" />
                    <div>
                      <h3 className="text-sm font-black text-white leading-snug">{activeProject.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Category: {activeProject.campaignCategory || activeProject.sectorCategory}
                      </p>
                    </div>
                  </div>

                  {activeProject.description && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Description</span>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{activeProject.description}</p>
                    </div>
                  )}

                  {/* Grid of details */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Lipa Na M-PESA Paybill</span>
                      <p className="text-xs font-black text-emerald-400">{activeProject.paybillNumber || "222111"}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Account Reference</span>
                      <p className="text-xs font-black text-slate-200">{activeProject.accountReference}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Target Goal Amount</span>
                      <p className="text-xs font-black text-slate-200">KES {activeProject.targetAmount?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Closing Date</span>
                      <p className="text-xs font-black text-indigo-400">{getEstimatedDaysRemaining()} Days Left</p>
                    </div>
                  </div>
                </div>

                {/* Committee details */}
                {activeProject.committee && activeProject.committee.length > 0 && (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase font-mono tracking-wider">Verified Committee Officers</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {activeProject.committee.map((member: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/40 p-2 rounded-xl border border-slate-850/60 flex justify-between items-center">
                          <span className="font-semibold text-slate-300">{member.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded-md">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Mini Progress Ring & Goal Card */}
              <div className="md:col-span-4 flex flex-col justify-center">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-center space-y-4">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Campaign Progress</span>
                  
                  {/* Elegant circular progress ring SVG */}
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Inner grey circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="text-slate-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Active emerald tracker */}
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="text-emerald-500"
                        strokeWidth="8"
                        strokeDasharray={326.7}
                        strokeDashoffset={326.7} // 0% completed initially
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center space-y-0.5">
                      <p className="text-lg font-black text-white leading-none">0%</p>
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Raised</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400">Target KES {activeProject.targetAmount?.toLocaleString()}</p>
                    <p className="text-xs font-extrabold text-white">KES 0.00 Raised</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-2 border-t border-slate-850">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer font-sans uppercase shadow-lg shadow-emerald-500/10"
                id="activation-continue-btn"
              >
                Continue Setup <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Digital Launch Kit & Integrated Tester */
          <div className="space-y-6 animate-fade-in">
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed text-center max-w-lg mx-auto">
              Ready to raise funds! Givers can send donations directly to your Safaricom paybill. Below is your official digital launch kit and integrated testing panel:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Left Card: QR & Copy Assets */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span className="text-xs font-bold font-mono uppercase">Promotions & Flyers</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A beautiful public page is now online. Supporters can scan the flyer QR code to check real-time goals and trigger payments easily.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex items-center justify-center relative group">
                  <div className="p-2 bg-white rounded-lg inline-block transition-transform duration-300 group-hover:scale-105">
                    <QrCode className="w-20 h-20 text-slate-950" />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-[10.5px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    {copiedLink ? "Link Copied!" : "Copy Campaign Link"}
                  </button>
                  <button
                    onClick={handleCopyInstructions}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-[10.5px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedInstructions ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
                    {copiedInstructions ? "Instructions Copied!" : "Copy WhatsApp Promo"}
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 text-[10.5px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Broadcast on WhatsApp
                  </button>
                </div>
              </div>

              {/* Right Card: Integrated Test M-PESA Simulator Panel (Phase 3 & 10) */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold font-mono uppercase">Dry-Run M-PESA payment</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Execute a simulated secure M-PESA STK push. Instant callback verification and real-time ledger updates will instantly populate:
                  </p>
                </div>

                <form onSubmit={handleTriggerTestPayment} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase font-bold block">Giver Name</label>
                      <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase font-bold block">Donation Phone</label>
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-hidden"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-bold block">Test Amount (KES)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testStatus === "processing"}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    {testStatus === "processing" ? "Reconciling Callback..." : "Trigger Simulation STK"}
                  </button>
                </form>

                {testStatus !== "idle" && (
                  <div className={`p-2.5 border rounded-xl flex items-start gap-2 text-[10px] leading-relaxed font-sans ${
                    testStatus === "success" 
                      ? "bg-emerald-950/20 border-emerald-500/25 text-emerald-400"
                      : testStatus === "processing"
                      ? "bg-slate-900 border-slate-850 text-slate-300"
                      : "bg-rose-950/20 border-rose-500/25 text-rose-300"
                  }`}>
                    {testStatus === "processing" && <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />}
                    {testStatus === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                    {testStatus === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                    <span>{testMessage}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Launch Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">✔ Ready to begin fundraising</span>
              <button
                onClick={onCompleteActivation}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer font-sans uppercase shadow-lg shadow-emerald-500/10"
                id="open-treasurer-command-center-btn"
              >
                Open Treasurer Command Center <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
