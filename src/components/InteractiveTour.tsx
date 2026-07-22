import React, { useState } from "react";
import { 
  X, ArrowRight, ArrowLeft, Sparkles, Smartphone, Landmark, Share2, Bot, 
  Plus, Coins, LayoutDashboard, FileText, Trophy, Gift, CheckCircle
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
      title: "Welcome to HarambeeFlow",
      desc: "HarambeeFlow helps church treasurers, school bursars, and community organizers manage fundraising transparently. We specialize in M-PESA ledger synchronization, instant receipting, and real-time committee audit reports.",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: 2,
      title: "Create Campaign",
      desc: "Setting up a fundraiser is incredibly simple. Our step-by-step registration wizard captures your target goals, sector category, and committee members to establish clear accountability from day one.",
      icon: Plus,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: 3,
      title: "Publish Campaign",
      desc: "Once you submit your details, your campaign is published to our secure Firestore cloud database. This ensures your ledger is locked, tamper-proof, and accessible to authorized committee members instantly.",
      icon: CheckCircle,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: 4,
      title: "Share Campaign",
      desc: "Reach your supporters where they are. Easily copy-paste a pre-formatted message directly to your WhatsApp committee groups, or print a beautiful flyer with a custom QR code for physical boards.",
      icon: Share2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: 5,
      title: "Receive M-PESA Contributions",
      desc: "Well-wishers can make instant, secure contributions via M-PESA STK Push. Invoices are settled in seconds, and our simulator lets you dry-run transactions safely to verify connection state.",
      icon: Smartphone,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: 6,
      title: "Track Live Dashboard",
      desc: "Keep a pulse on your campaign's progress. Monitor live totals raised, track daily contribution trends, and receive smart AI insights to optimize fundraising momentum.",
      icon: LayoutDashboard,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
    {
      id: 7,
      title: "Generate Reports",
      desc: "Say goodbye to stressful manual audits. Instantly compile formal PDF financial reports, export clean CSV spreadsheets, and generate verified receipts to build absolute trust with your givers.",
      icon: FileText,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: 8,
      title: "You're Ready!",
      desc: "Congratulations! You've mastered HarambeeFlow. Your campaign database is secure and ready to receive live M-PESA payments. Let's make your next fundraising project a resounding success!",
      icon: Trophy,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-bounce",
    }
  ];

  const currentStepData = tourSteps[step - 1];

  const handleNext = () => {
    if (step < 8) {
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
    if (projectsCount === 0 && activeTab !== "landing") {
      setWizardOpen(true);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("harambeeflowTutorialCompleted", "true");
    onClose();
    if (projectsCount === 0 && activeTab !== "landing") {
      setWizardOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-scale-up space-y-6">
        
        {/* Top X Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
          Step {step} of 8
        </div>

        {/* Dynamic Step Content */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className={`p-5 rounded-2xl border ${currentStepData.color} shrink-0`}>
              {React.createElement(currentStepData.icon, { className: "w-12 h-12 stroke-[1.5]" })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-black text-white tracking-tight leading-none">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-sans max-w-md mx-auto">
              {currentStepData.desc}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pt-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`h-2 rounded-full transition-all duration-300 ${
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
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="p-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 disabled:opacity-30 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            {step < 8 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 uppercase transition cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl transition uppercase cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                Finish
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
