import React, { useState } from "react";
import { Sparkles, Plus, Play, HelpCircle, ArrowRight, X, Smartphone, Users, Landmark, FileText, Check } from "lucide-react";

interface WelcomeViewProps {
  onCreateCampaign: () => void;
  onLoadSampleCampaign: () => void;
  isLoading: boolean;
  onStartTour: () => void;
}

export default function WelcomeView({
  onCreateCampaign,
  onLoadSampleCampaign,
  isLoading,
  onStartTour
}: WelcomeViewProps) {
  const [showTour, setShowTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);

  const tourSteps = [
    {
      title: "1. Create your Campaign",
      desc: "Fill in the simple wizard with your campaign goal, category, committee members, and paybill details.",
      icon: Plus,
    },
    {
      title: "2. Copy & Share the Public Link",
      desc: "Your givers can access a gorgeous mobile-friendly public donation landing page with payment guidelines.",
      icon: Smartphone,
    },
    {
      title: "3. Automated Reconciliation",
      desc: "No more manual spreadsheets! Contributors receive instant automated receipts and WhatsApp announcements.",
      icon: Landmark,
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 min-h-full">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

      <div className="max-w-xl w-full text-center space-y-10 relative z-10 animate-fade-in py-12">
        {/* Logo Icon with Pulse */}
        <div className="flex justify-center">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl shadow-2xl shadow-emerald-950/40 relative">
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 animate-ping opacity-75" />
            <Sparkles className="w-12 h-12 text-emerald-400 relative z-10" />
          </div>
        </div>

        {/* Headline and Subtitle */}
        <div className="flex flex-col items-center justify-center leading-tight space-y-1">
          <h1 className="text-4xl sm:text-5xl font-sans font-black tracking-tight text-white">
            HarambeeFlow
          </h1>
          <span className="text-xl sm:text-2xl font-mono font-medium text-emerald-400 tracking-wide mt-1">
            AI Treasurer
          </span>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed pt-3">
            Create your first fundraising campaign in less than two minutes. Let's create your first fundraising campaign.
          </p>
        </div>

        {/* Main Distraction-free Action Buttons */}
        <div className="flex flex-col gap-3.5 max-w-sm mx-auto">
          {/* Create Fundraising Campaign Button */}
          <button
            onClick={() => {
              const completed = localStorage.getItem("harambeeflowTutorialCompleted") === "true";
              if (!completed) {
                setShowOnboardingPrompt(true);
              } else {
                onCreateCampaign();
              }
            }}
            id="welcome-create-campaign-btn"
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/15 cursor-pointer transition transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            Create Fundraising Campaign
          </button>

          {/* Load Sample Campaign Button */}
          <button
            onClick={onLoadSampleCampaign}
            disabled={isLoading}
            id="welcome-load-sample-btn"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/20 text-sm font-sans font-semibold rounded-2xl cursor-pointer transition disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                Loading Sample Ledger...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Load Sample Campaign
              </>
            )}
          </button>

          {/* Secondary Options */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            {/* Watch Tour Button */}
            <button
              onClick={onStartTour}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-850/80 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition"
              id="welcome-start-tour-btn"
            >
              <Play className="w-3.5 h-3.5" />
              Take the 60-Second Tour
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-850/80 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Help & Setup
            </button>
          </div>
        </div>

        {/* Passive Status Footer */}
        <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
          <span>© 2026 HarambeeFlow. All Rights Reserved.</span>
          <span>•</span>
          <a href="https://harambeeflow.org" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            https://harambeeflow.org
          </a>
        </p>
      </div>

      {/* --- TOUR MODAL COMPONENT --- */}
      {showTour && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-scale-up">
            <button
              onClick={() => setShowTour(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                  {React.createElement(tourSteps[tourStep - 1].icon, { className: "w-8 h-8" })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{tourSteps[tourStep - 1].title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {tourSteps[tourStep - 1].desc}
                </p>
              </div>

              {/* Step dots */}
              <div className="flex justify-center gap-1.5">
                {tourSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      tourStep === idx + 1 ? "w-6 bg-emerald-400" : "w-1.5 bg-slate-800"
                    }`}
                  />
                ))}
              </div>

              {/* Footer controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setShowTour(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Skip Tour
                </button>

                {tourStep < 3 ? (
                  <button
                    onClick={() => setTourStep(prev => prev + 1)}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold rounded-xl"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowTour(false);
                      onCreateCampaign();
                    }}
                    className="px-5 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold rounded-xl"
                  >
                    Get Started Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HELP MODAL COMPONENT --- */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-scale-up">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">HarambeeFlow Support Desk</h3>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200">How do I test STK Pushes?</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Once you publish your fundraiser, use our built-in M-PESA Daraja Simulator. You can type any phone number and amount to simulate a successful payment.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200">Do I need an actual M-PESA Paybill?</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    No! You can use our default sandbox M-PESA Paybill <span className="font-mono text-emerald-400 bg-emerald-950/50 px-1 py-0.5 rounded">225588</span> to test complete end-to-end functionality right in the browser.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200">How do WhatsApp receipt notifications work?</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Any successfully processed simulation contribution instantly generates a beautiful M-PESA notification message on our simulated phone sidebar.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl"
              >
                Understood, Close Help
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Onboarding Prompt Modal */}
      {showOnboardingPrompt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-scale-up space-y-6">
            <button
              onClick={() => {
                setShowOnboardingPrompt(false);
                onCreateCampaign();
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Welcome to HarambeeFlow</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm mx-auto">
                  Before creating your first fundraiser, would you like a quick 60-second guided tour?
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowOnboardingPrompt(false);
                  onStartTour();
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                🟢 Yes, Show Me
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("harambeeflowTutorialCompleted", "true");
                  setShowOnboardingPrompt(false);
                  onCreateCampaign();
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-sans font-bold text-sm rounded-xl transition cursor-pointer"
              >
                ⚪ Skip & Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
