import React, { useState, useEffect } from "react";
import { 
  X, ArrowRight, ArrowLeft, Sparkles, Smartphone, Landmark, Share2, Bot, 
  Plus, Coins, LayoutDashboard, FileText, Trophy, Gift, CheckCircle,
  Building2, CreditCard, Settings, Users, Target, ShieldCheck
} from "lucide-react";

interface InteractiveTourProps {
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
  projectsCount: number;
  contributionsCount: number;
}

export default function InteractiveTour({
  onClose,
  activeTab,
  setActiveTab,
  wizardOpen,
  setWizardOpen,
  projectsCount,
  contributionsCount,
}: InteractiveTourProps) {
  const [step, setStep] = useState(1);

  const tourSteps = [
    {
      id: 1,
      tab: "dashboard",
      title: "Welcome to HarambeeFlow",
      desc: "HarambeeFlow helps church treasurers, school bursars, and community organizers manage fundraising transparently with M-PESA synchronization, instant receipting, and executive audit reports.",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: 2,
      tab: "dashboard",
      title: "Dashboard Command Center",
      desc: "Keep a real-time pulse on your fundraising progress. Monitor overall totals raised, track daily contribution trends, view live M-PESA activity streams, and receive smart AI agent insights.",
      icon: LayoutDashboard,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: 3,
      tab: "campaigns",
      title: "Campaigns Management",
      desc: "Easily set up and manage multiple fundraising appeals. Define target goals, sector categories, committee roles, and generate pre-formatted WhatsApp share messages or custom QR code flyers.",
      icon: Target,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: 4,
      tab: "supporters",
      title: "Contributions & M-PESA Sync",
      desc: "Track every supporter contribution in real-time. Process instant Safaricom M-PESA STK Push prompts, log offline cash pledges, search donor history by phone number, and issue automated receipts.",
      icon: Smartphone,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: 5,
      tab: "report",
      title: "Reports & Audit Certificates",
      desc: "Say goodbye to stressful manual audits. Instantly compile executive financial ledgers, export clean CSV spreadsheets, and generate verified PDF certificates for committee reviews.",
      icon: FileText,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: 6,
      tab: "billing",
      title: "Billing & Subscription",
      desc: "Manage your subscription tiers (Community, Professional, or Enterprise), monitor resource quotas, review official tax invoices, and maintain your official Organization Information profile.",
      icon: CreditCard,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      id: 7,
      tab: "settings",
      title: "Settings & System Controls",
      desc: "Configure organization profile details, committee user roles, system preferences, developer sandbox simulation controls, and access 24/7 support resources.",
      icon: Settings,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: 8,
      tab: "dashboard",
      title: "You're Ready to Fundraise!",
      desc: "Congratulations! You've mastered HarambeeFlow. Your campaign database is secure and ready to receive live M-PESA payments. Let's make your next fundraising project a resounding success!",
      icon: Trophy,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-bounce",
    }
  ];

  const currentStepData = tourSteps[step - 1];

  // Sync activeTab with step
  useEffect(() => {
    if (currentStepData && currentStepData.tab) {
      setActiveTab(currentStepData.tab);
    }
  }, [step]);

  const handleNext = () => {
    if (step < tourSteps.length) {
      setStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("harambeeflowTutorialCompleted", "true");
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem("harambeeflowTutorialCompleted", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-scale-up space-y-6"
        id="interactive-tour-modal"
      >
        {/* Top X Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          id="btn-close-tour-x"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step {step} of {tourSteps.length}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700 uppercase">
            {currentStepData.tab}
          </span>
        </div>

        {/* Dynamic Step Content */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className={`p-5 rounded-2xl border ${currentStepData.color} shrink-0 shadow-lg`}>
              {React.createElement(currentStepData.icon, { className: "w-12 h-12 stroke-[1.5]" })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-black text-white tracking-tight leading-none">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-md mx-auto">
              {currentStepData.desc}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  step === idx + 1 ? "w-8 bg-emerald-400" : "w-2 bg-slate-800 hover:bg-slate-700"
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            id="btn-skip-tour"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="p-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 disabled:opacity-30 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center disabled:cursor-not-allowed cursor-pointer"
              id="btn-tour-back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            {step < tourSteps.length ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 uppercase transition cursor-pointer shadow-md"
                id="btn-tour-next"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl transition uppercase cursor-pointer shadow-lg shadow-emerald-950/20"
                id="btn-tour-finish"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
