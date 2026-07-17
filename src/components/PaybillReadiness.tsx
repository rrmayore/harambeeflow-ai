import React, { useState } from "react";
import { 
  Building2, Landmark, CheckSquare, Square, ThumbsUp, AlertCircle, ChevronRight,
  ShieldCheck, FileCheck, ClipboardList, RefreshCw, Layers, Sparkles
} from "lucide-react";

export default function PaybillReadiness() {
  const [activeStep, setActiveStep] = useState(0);
  const [kycProgress, setKycProgress] = useState({
    certificateReg: true,
    kraPin: true,
    committeeMinutes: true,
    chiefLetter: false,
    utilityBill: false
  });
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);

  const steps = [
    {
      title: "Business / Entity Registration",
      desc: "Confirm registered self-help group certificate, church license, or NGO trust deeds."
    },
    {
      title: "KRA Tax Pin Activation",
      desc: "Retrieve and map valid KRA pin certificates to match Daraja KYC compliance checklines."
    },
    {
      title: "Safaricom Letter of Request",
      desc: "Draft official letter signed by 3 registered committee trustees on official letterhead."
    },
    {
      title: "Production Daraja Migration",
      desc: "Promote credentials Sandbox API key and bind Callback URLs to public HTTPS endpoints."
    }
  ];

  const handleUpdateKyc = (key: keyof typeof kycProgress) => {
    setKycProgress(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTriggerVerification = () => {
    setOnboardingSuccess(true);
    setTimeout(() => {
      setOnboardingSuccess(false);
      if (activeStep < steps.length - 1) {
        setActiveStep(prev => prev + 1);
      }
    }, 3200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in" id="paybill-readiness-root">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase font-bold">Daraja Production Portal Onboarding</span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            Safaricom PayBill Readiness <Landmark className="w-6 h-6 text-emerald-600" />
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">System-guided checklist to transition community fundraisers safely from testing Sandbox limits to live national PayBills.</p>
        </div>
      </div>

      {/* Main split: Left Steps Wizard - Right KYC indicator checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Onboarding Wizard Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200 space-y-5">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Launch Checklist Checklist Tracking
            </h4>

            <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 text-xs">
              {steps.map((s, idx) => {
                const isActive = activeStep === idx;
                const isPassed = activeStep > idx;
                return (
                  <div key={idx} className="relative">
                    {/* Ring indicator bullet */}
                    <div className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border ${
                      isPassed ? "bg-emerald-500 text-white border-emerald-500" :
                      isActive ? "bg-indigo-600 text-white border-indigo-600 animate-pulse" :
                      "bg-white text-slate-400 border-slate-200"
                    }`}>
                      {isPassed ? "✓" : idx + 1}
                    </div>

                    <div className={`${isActive ? "text-slate-900 font-bold" : "text-slate-550"} space-y-1`}>
                      <span className="text-sm block">{s.title}</span>
                      <p className="text-xs text-slate-500 max-w-lg font-sans font-medium">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {onboardingSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-xl border border-emerald-100 animate-fade-in">
                ✓ Connecting to Safaricom audit desk. Committing credentials keys...
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition disabled:opacity-40 cursor-pointer"
              >
                Previous Step
              </button>
              
              <button
                onClick={handleTriggerVerification}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
                id="btn-onboarding-advance"
              >
                Verify & Advance
              </button>
            </div>
          </div>

          {/* Compliance church/NGO specifics */}
          <div className="glass-card p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-150 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h5 className="font-bold text-xs text-emerald-950">Church Onboarding Tracks Active</h5>
              <p className="text-[11px] text-emerald-900 leading-relaxed mt-1">
                Local parishes of major churches (ACK, Catholic Church, CITAM, Deliverance, Presbyterian, etc.) can bypass traditional self-help group certificates by utilizing the main National Registered Trustee exemption letters.
              </p>
            </div>
          </div>
        </div>

        {/* Right checklist columns for KYC checklines */}
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-indigo-600" /> KYC Status Indicators
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">Ensure that your organization's legal files match these compliance checks prior to requesting production credentials:</p>

            <div className="space-y-3">
              <button
                onClick={() => handleUpdateKyc("certificateReg")}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left text-xs transition cursor-pointer"
              >
                {kycProgress.certificateReg ? <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-350 shrink-0" />}
                <div>
                  <span className="font-bold text-slate-800 block">Registration Certificate</span>
                  <span className="text-[10px] text-slate-400">Status: {kycProgress.certificateReg ? "Verified Vetted" : "Awaiting Letter Upload"}</span>
                </div>
              </button>

              <button
                onClick={() => handleUpdateKyc("kraPin")}
                className="w-full flex items-center gap-3 p-3 bg-slate-55/40 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left text-xs transition cursor-pointer"
              >
                {kycProgress.kraPin ? <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-350 shrink-0" />}
                <div>
                  <span className="font-bold text-slate-800 block">KRA PIN Certificate</span>
                  <span className="text-[10px] text-slate-400">Status: {kycProgress.kraPin ? "Verified Vetted" : "Awaiting Letter Upload"}</span>
                </div>
              </button>

              <button
                onClick={() => handleUpdateKyc("committeeMinutes")}
                className="w-full flex items-center gap-3 p-3 bg-slate-55/40 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left text-xs transition cursor-pointer"
              >
                {kycProgress.committeeMinutes ? <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-350 shrink-0" />}
                <div>
                  <span className="font-bold text-slate-800 block">Signed Advisory Board Minutes</span>
                  <span className="text-[10px] text-slate-400">Status: {kycProgress.committeeMinutes ? "Verified Vetted" : "Awaiting Letter Upload"}</span>
                </div>
              </button>

              <button
                onClick={() => handleUpdateKyc("chiefLetter")}
                className="w-full flex items-center gap-3 p-3 bg-slate-55/40 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left text-xs transition cursor-pointer"
              >
                {kycProgress.chiefLetter ? <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-350 shrink-0" />}
                <div>
                  <span className="font-bold text-slate-800 block">Chief's Introduction Letter</span>
                  <span className="text-[10px] text-slate-400">Status: {kycProgress.chiefLetter ? "Verified Vetted" : "Awaiting Letter Upload"}</span>
                </div>
              </button>

              <button
                onClick={() => handleUpdateKyc("utilityBill")}
                className="w-full flex items-center gap-3 p-3 bg-slate-55/40 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left text-xs transition cursor-pointer"
              >
                {kycProgress.utilityBill ? <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-350 shrink-0" />}
                <div>
                  <span className="font-bold text-slate-800 block">utility Bill Address Verify</span>
                  <span className="text-[10px] text-slate-400">Status: {kycProgress.utilityBill ? "Verified Vetted" : "Awaiting Letter Upload"}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Legal alert warning */}
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-950 text-xs leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Safaricom AML Requirements:</strong> Submitting forged certificates or operating unvetted funds pools carries penalties under the Anti-Money Laundering Act KES 5,000,000.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
