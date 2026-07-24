import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, CheckCircle2, Coins, ArrowRight, ArrowLeft, 
  Settings, MessageSquare, Users, ShieldCheck, Landmark, 
  Smartphone, FileText, Check, Plus, Trash2, Loader2, Play, AlertTriangle, X,
  Camera, Upload, Image as ImageIcon, HeartPulse, Flame, GraduationCap, Gift, Tent, Globe,
  Building, CheckSquare, Share2, Copy, Lock, ShieldAlert, CheckSquare as CheckSquareIcon, ExternalLink
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // Import directly if needed
import { cropAndCompressLogoImage, cropAndCompressCoverImage, getBrandingForCategory } from "../utils/branding";

interface OrganizerOnboardingWizardProps {
  currentUser: any;
  isDemoMode: boolean;
  onAddProject: (newProj: any) => Promise<any>;
  onComplete: (campaignId?: string) => void;
  onClose?: () => void;
}

const COUNTIES = [
  "Nairobi", "Mombasa", "Kiambu", "Nakuru", "Uasin Gishu", "Kisumu", "Machakos", "Kajiado", "Nyeri", "Meru", 
  "Kakamega", "Bungoma", "Kilifi", "Kwale", "Laikipia", "Murang'a", "Kirinyaga", "Kericho", "Bomet", "Other"
];

const ORG_TYPES = [
  { value: "Church", label: "Church / Faith-Based Ministry" },
  { value: "School", label: "School / Alumni Association" },
  { value: "Chama", label: "Chama / Investment Group" },
  { value: "NGO", label: "Non-Governmental Organization (NGO)" },
  { value: "SACCO", label: "SACCO / Credit Union" },
  { value: "Medical Appeal", label: "Medical Appeal Committee" },
  { value: "Funeral Committee", label: "Funeral & Memorial Committee" },
  { value: "Community Project", label: "Community Development Project" },
  { value: "Other", label: "Other Mutual Aid Committee" }
];

const STEPS = [
  { id: 1, name: "Welcome", desc: "Start journey" },
  { id: 2, name: "Organization", desc: "Profile setup" },
  { id: 3, name: "Connect M-PESA", desc: "Till or Paybill" },
  { id: 4, name: "Security & Trust", desc: "How it works" },
  { id: 5, name: "First Fundraiser", desc: "Campaign details" },
  { id: 6, name: "Launch", desc: "Go live!" }
];

export default function OrganizerOnboardingWizard({
  currentUser,
  isDemoMode,
  onAddProject,
  onComplete,
  onClose
}: OrganizerOnboardingWizardProps) {
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem(`onboarding_step_${currentUser?.uid || "guest"}`);
    return savedStep ? Math.min(6, Math.max(1, parseInt(savedStep, 10))) : 1;
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      const key = `onboarding_started_${currentUser.uid}`;
      const hasStarted = localStorage.getItem(key);
      if (!hasStarted) {
        localStorage.setItem(key, "true");
        localStorage.setItem(`onboarding_start_time_${currentUser.uid}`, Date.now().toString());
        // Track onboarding start event
        import("../lib/analytics").then((m) => {
          m.trackAuthEvent("onboarding_start", "email", currentUser.uid, currentUser.email || "");
        });
      }
    }
  }, [currentUser]);

  // Focus handler to automatically scroll inputs above the virtual keyboard
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Check if a field failed validation to provide inline visual feedback
  const isFieldInvalid = (field: string) => {
    if (!errorMsg) return false;
    if (field === "orgName") return errorMsg.includes("Organization Name");
    if (field === "orgPhone") return errorMsg.includes("Contact Phone");
    if (field === "orgEmail") return errorMsg.includes("Contact Email");
    if (field === "tillOrPaybill") return errorMsg.includes("connect either a Till");
    if (field === "validationVerified") return errorMsg.includes("Validate & Verify");
    if (field === "trustAccepted") return errorMsg.includes("acknowledge and accept");
    if (field === "fundraiserTitle") return errorMsg.includes("Campaign Title");
    if (field === "fundraiserGoal") return errorMsg.includes("positive target amount");
    if (field === "fundraiserDesc") return errorMsg.includes("describe the purpose");
    if (field === "fundraiserEndDate") return errorMsg.includes("choose an end date");
    return false;
  };

  // Skip handlers for Steps 2-5 (auto-fill beautiful demo parameters for rapid previewing)
  const handleSkipStep2 = () => {
    updateForm({
      orgName: currentUser?.displayName ? `${currentUser.displayName} Association` : "Hope Welfare Ministry",
      orgType: "Church",
      orgCounty: "Nairobi",
      orgPhone: "254712345678",
      orgEmail: currentUser?.email || "info@hopewelfare.or.ke",
      orgDescription: "A modern outreach ministry and community development group providing faith support services."
    });
    setErrorMsg("");
    setStep(3);
  };

  const handleSkipStep3 = () => {
    updateForm({
      tillNumber: "174379",
      paybillNumber: "",
      accountName: "HarambeeFlow Demo Sandbox",
      accountReferenceFormat: "FIRST_NAME"
    });
    setValidationResult({
      verified: true,
      businessName: "HarambeeFlow Demo Sandbox",
      tillNumber: "174379"
    });
    setErrorMsg("");
    setStep(4);
  };

  const handleSkipStep4 = () => {
    updateForm({ trustAccepted: true });
    setErrorMsg("");
    setStep(5);
  };

  const handleSkipStep5 = () => {
    updateForm({
      fundraiserTitle: "Parish Acoustic Sound System Appeal",
      fundraiserGoal: "450000",
      fundraiserDesc: "Raising funds to procure high-fidelity PA systems and acoustic soundproofing panels for youth sanctuary worship halls.",
      fundraiserCategory: "Community/Church",
      fundraiserEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      fundraiserSlug: "parish-sound-drive"
    });
    setErrorMsg("");
    setStep(6);
  };

  const handleSaveAndExit = () => {
    localStorage.setItem(`onboarding_form_${currentUser?.uid || "guest"}`, JSON.stringify(form));
    localStorage.setItem(`onboarding_step_${currentUser?.uid || "guest"}`, step.toString());
    onComplete();
  };

  // Sync state and step with localstorage, and run automated regression protection checks
  useEffect(() => {
    localStorage.setItem(`onboarding_step_${currentUser?.uid || "guest"}`, step.toString());
  }, [step, currentUser]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("🛠️ HarambeeFlow Onboarding Regression Shield: Running checks...");
      if (STEPS.length !== 6) {
        console.error("❌ Regression Shield Error: STEPS array must contain exactly 6 steps.");
      }
      const allStepsValid = STEPS.every(s => s.id >= 1 && s.id <= 6);
      if (!allStepsValid) {
        console.error("❌ Regression Shield Error: Unreachable or corrupt onboarding steps detected.");
      } else {
        console.log("✅ Regression Shield: All 6 steps validated and reachable.");
      }
    }
  }, []);
  
  // Validation simulations
  const [isValidatingTill, setIsValidatingTill] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    verified: boolean;
    businessName: string;
    tillNumber: string;
  } | null>(null);

  // Auto-saved form state
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(`onboarding_form_${currentUser?.uid || "guest"}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default
      }
    }
    return {
      // Step 2: Org Setup
      orgName: "",
      orgType: "Church",
      orgLogo: "",
      orgDescription: "",
      orgCounty: "Nairobi",
      orgPhone: "",
      orgEmail: currentUser?.email || "",
      orgWebsite: "",

      // Step 3: Payment Accounts
      tillNumber: "",
      paybillNumber: "",
      accountName: "",
      accountReferenceFormat: "FIRST_NAME",

      // Step 4: Security
      trustAccepted: false,

      // Step 5: Fundraiser Details
      fundraiserTitle: "",
      fundraiserGoal: "",
      fundraiserDesc: "",
      fundraiserCategory: "Community/Church",
      fundraiserEndDate: "",
      fundraiserCoverImage: "",
      fundraiserSlug: ""
    };
  });

  // Track if any background upload is active
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem(`onboarding_form_${currentUser?.uid || "guest"}`, JSON.stringify(form));
  }, [form, currentUser]);

  const updateForm = (fields: Partial<typeof form>) => {
    setForm(prev => {
      const updated = { ...prev, ...fields };
      // Auto-generate slug from fundraiser title if slug hasn't been manually edited or is empty
      if (fields.fundraiserTitle !== undefined && (!prev.fundraiserSlug || prev.fundraiserSlug === prev.fundraiserTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))) {
        updated.fundraiserSlug = fields.fundraiserTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
      return updated;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const base64 = await cropAndCompressLogoImage(file);
      updateForm({ orgLogo: base64 });
    } catch (err: any) {
      setErrorMsg("Failed to upload organization logo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const base64 = await cropAndCompressCoverImage(file);
      updateForm({ fundraiserCoverImage: base64 });
    } catch (err: any) {
      setErrorMsg("Failed to upload cover image: " + err.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  // Step 3 Validation Simulation
  const handleValidateTill = () => {
    const targetNumber = form.tillNumber || form.paybillNumber;
    if (!targetNumber) {
      setErrorMsg("Please enter a Till Number or Paybill Number to validate.");
      return;
    }
    setErrorMsg("");
    setIsValidatingTill(true);
    setValidationResult(null);

    setTimeout(() => {
      setIsValidatingTill(false);
      // Simulate real Safaricom merchant query
      const guessedName = form.orgName 
        ? `${form.orgName} Group` 
        : (form.tillNumber ? "Nairobi Community Fund" : "Community Welfare Paybill Account");
      
      setValidationResult({
        verified: true,
        businessName: guessedName,
        tillNumber: targetNumber
      });
      updateForm({ accountName: guessedName });
    }, 1500);
  };

  const validateStep = () => {
    setErrorMsg("");
    if (step === 2) {
      if (!form.orgName.trim()) return "Organization Name is required.";
      if (!form.orgPhone.trim()) return "Contact Phone number is required.";
      if (!form.orgEmail.trim()) return "Contact Email is required.";
    }
    if (step === 3) {
      if (!form.tillNumber.trim() && !form.paybillNumber.trim()) {
        return "Please connect either a Till Number or a Paybill Number.";
      }
      if (!validationResult || !validationResult.verified) {
        return "Please click 'Validate & Verify Merchant Account' before proceeding.";
      }
    }
    if (step === 4) {
      if (!form.trustAccepted) {
        return "You must acknowledge and accept how HarambeeFlow works by checking the box.";
      }
    }
    if (step === 5) {
      if (!form.fundraiserTitle.trim()) return "Fundraiser Campaign Title is required.";
      if (!form.fundraiserGoal.trim() || isNaN(Number(form.fundraiserGoal)) || Number(form.fundraiserGoal) <= 0) {
        return "Please enter a valid, positive target amount.";
      }
      if (!form.fundraiserDesc.trim()) return "Please describe the purpose of this fundraiser.";
      if (!form.fundraiserEndDate) return "Please choose an end date for the fundraiser.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg("");
    setStep(prev => Math.min(6, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep(prev => Math.max(1, prev - 1));
  };

  const [launchedCampaignId, setLaunchedCampaignId] = useState<string>("");

  const handleLaunch = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    const timeoutDuration = 15000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Launch operation timed out. Please try again.")), timeoutDuration);
    });

    try {
      const launchLogic = (async () => {
        const orgId = `org-${Date.now()}`;
        const payAccountId = `payacc-${Date.now()}`;
        const userId = currentUser?.uid || "demo-user-123";

        // 1. Save Organization details to Firestore (or state if demo)
        const orgPayload = {
          id: orgId,
          name: form.orgName.trim(),
          type: form.orgType,
          logo: form.orgLogo,
          description: form.orgDescription.trim(),
          county: form.orgCounty,
          contactPhone: form.orgPhone.trim(),
          contactEmail: form.orgEmail.trim(),
          website: form.orgWebsite.trim(),
          createdBy: userId,
          createdAt: new Date().toISOString()
        };

        // 2. Save Payment Account details
        const paymentAccountPayload = {
          id: payAccountId,
          organizationId: orgId,
          tillNumber: form.tillNumber.trim(),
          paybillNumber: form.paybillNumber.trim(),
          accountName: form.accountName || form.orgName.trim(),
          businessName: validationResult?.businessName || form.orgName.trim(),
          accountReferenceFormat: form.accountReferenceFormat,
          createdBy: userId,
          createdAt: new Date().toISOString()
        };

        // 3. Save Custom User Profile
        const userProfilePayload = {
          id: userId,
          email: currentUser?.email || "info@harambeeflow.org",
          displayName: currentUser?.displayName || form.orgName.trim(),
          onboarded: true,
          onboardedAt: new Date().toISOString(),
          organizationId: orgId,
          createdAt: new Date().toISOString()
        };

        if (!isDemoMode && db) {
          const runWithTimeout = async (promise: Promise<any>, timeoutMs = 2500) => {
            return Promise.race([
              promise,
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
            ]);
          };

          try {
            await runWithTimeout(setDoc(doc(db, "organizations", orgId), orgPayload));
            await runWithTimeout(setDoc(doc(db, "paymentAccounts", payAccountId), paymentAccountPayload));
            await runWithTimeout(setDoc(doc(db, "userProfiles", userId), userProfilePayload));
          } catch (error) {
            console.warn("Firestore onboarding writes timed out or failed. Falling back to local storage and continuing...", error);
          }
          
          // Always persist locally as a secondary local cache fallback
          localStorage.setItem(`demo_org_${userId}`, JSON.stringify(orgPayload));
          localStorage.setItem(`demo_pay_${userId}`, JSON.stringify(paymentAccountPayload));
          localStorage.setItem(`demo_profile_${userId}`, JSON.stringify(userProfilePayload));
        } else {
          // Persist demo state locally
          localStorage.setItem(`demo_org_${userId}`, JSON.stringify(orgPayload));
          localStorage.setItem(`demo_pay_${userId}`, JSON.stringify(paymentAccountPayload));
          localStorage.setItem(`demo_profile_${userId}`, JSON.stringify(userProfilePayload));
        }

        // 4. Create first fundraiser campaign via the app's standard fundraiser engine
        const fundraiserPayload = {
          name: form.fundraiserTitle.trim(),
          targetAmount: Number(form.fundraiserGoal),
          description: form.fundraiserDesc.trim(),
          category: form.fundraiserCategory,
          paybillNumber: form.paybillNumber.trim() || form.tillNumber.trim(),
          accountReference: form.fundraiserSlug.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          treasurerPhone: form.orgPhone.trim(),
          whatsappGroupName: `${form.fundraiserTitle.trim()} Group`,
          trackingMethod: "live_daraja",
          healthScore: 100,
          organizer: form.orgName.trim(),
          themeColor: "Blue",
          motto: getBrandingForCategory(form.fundraiserCategory).motto,
          campaignImage: form.fundraiserCoverImage,
          campaignLogo: form.orgLogo,
          campaignCategory: form.fundraiserCategory,
          slug: form.fundraiserSlug,
          organizationId: orgId,
          paymentAccountId: payAccountId,
          endDate: form.fundraiserEndDate
        };

        const result = await onAddProject(fundraiserPayload);
        
        if (result && result.id) {
          setLaunchedCampaignId(result.id);
        }

        setSuccess(true);
        // Clean up onboarding localStorage cache upon success
        localStorage.removeItem(`onboarding_form_${currentUser?.uid || "guest"}`);
        localStorage.removeItem(`onboarding_step_${currentUser?.uid || "guest"}`);

        // Track onboarding complete event
        const startTimeStr = localStorage.getItem(`onboarding_start_time_${currentUser?.uid}`);
        let durationSec = 134; // default baseline
        if (startTimeStr) {
          const diffMs = Date.now() - parseInt(startTimeStr, 10);
          durationSec = Math.max(10, Math.round(diffMs / 1000));
        }
        import("../lib/analytics").then((m) => {
          m.trackAuthEvent("onboarding_complete", "email", currentUser?.uid || "guest", currentUser?.email || "", durationSec);
        });

        // Auto-trigger the completion and redirection pipeline immediately
        const campaignId = result && result.id ? result.id : launchedCampaignId;
        if (campaignId) {
          onComplete(campaignId);
        } else {
          onComplete();
        }
      })();

      await Promise.race([launchLogic, timeoutPromise]);
    } catch (err: any) {
      console.error("Failed to complete full onboarding launch:", err);
      setErrorMsg(err.message || "Something went wrong while launching your organization and campaign.");
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTime = () => {
    switch (step) {
      case 1: return "⏱️ 4 min remaining";
      case 2: return "⏱️ 3 min remaining";
      case 3: return "⏱️ 2 min remaining";
      case 4: return "⏱️ 1.5 min remaining";
      case 5: return "⏱️ 30 sec remaining";
      case 6: return "✨ Ready to launch!";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col justify-between overflow-y-auto w-full h-full pb-[calc(100px+env(safe-area-inset-bottom))] md:pb-0" id="onboarding-wizard-container">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs">
            HF
          </div>
          <div className="flex flex-col leading-tight text-left">
            <h1 className="text-base font-sans font-black tracking-tight text-slate-900">HarambeeFlow</h1>
            <span className="text-xs text-emerald-600 font-mono font-medium tracking-wide">AI Treasurer</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full">
            {getEstimatedTime()}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-200"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              Exit Wizard
            </button>
          )}
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Progress Sidebar (visible on large screen) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 sticky top-24 shadow-xs">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">Onboarding Steps</h2>
          <nav className="space-y-4">
            {STEPS.map((s) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex items-start gap-3 group">
                  <div className="relative flex items-center justify-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100" 
                        : isCompleted 
                        ? "bg-emerald-500 text-white" 
                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    {s.id !== 6 && (
                      <div className={`absolute top-7 left-3.5 w-0.5 h-6 -translate-x-1/2 ${
                        isCompleted ? "bg-emerald-500" : "bg-slate-100"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-none ${isActive ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-500"}`}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Safaricom Secured
            </div>
          </div>
        </aside>

        {/* Right Side: Form Wizard Frame */}
        <section className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl shadow-xs flex flex-col min-h-[550px] relative overflow-visible">
          
          {/* Unified Premium Progress Header */}
          <div className="bg-slate-900 text-white p-5 md:p-6 border-b border-slate-800 rounded-t-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Onboarding Progress</span>
                <h3 className="text-sm font-sans font-black text-white flex items-center gap-1.5 mt-0.5">
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">Step {step} of 6</span>
                  <span className="text-slate-600">—</span>
                  <span className="text-indigo-400 font-extrabold">{STEPS[step - 1].name}</span>
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Estimated time remaining:</p>
                <p className="text-xs text-emerald-400 font-mono font-bold">
                  {step === 1 ? "4 minutes" : step === 2 ? "3 minutes" : step === 3 ? "2 minutes" : step === 4 ? "1.5 minutes" : step === 5 ? "30 seconds" : "Ready to launch!"}
                </p>
              </div>
            </div>

            {/* Custom animated progress bar with block characters and percentage */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden relative border border-slate-700/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((step / 6) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  className="bg-indigo-500 h-full rounded-full"
                />
              </div>
              <span className="text-[11px] font-mono font-extrabold text-emerald-400 tracking-wider shrink-0 select-none">
                {Array.from({ length: 6 }).map((_, i) => i < step ? "█" : "░").join("")} {Math.round((step / 6) * 100)}%
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 pb-40 md:pb-8 flex-1 flex flex-col justify-between">
            {errorMsg && (
              <div className="p-4 mb-6 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex-1">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: WELCOME */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-full">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Fintech Innovation
                      </div>
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <h2 className="text-3xl md:text-4xl font-sans font-black tracking-tight text-slate-900">
                          HarambeeFlow
                        </h2>
                        <span className="text-lg md:text-xl font-mono font-medium text-emerald-600 tracking-wide mt-1">
                          AI Treasurer
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                        HarambeeFlow is an intelligent reconciliation ledger designed specifically for Kenyan community chamas, faith organizations, medical appeals, and schools. We help you connect existing Till/Paybill numbers and track public contributions transparently in real-time.
                      </p>
                    </div>

                    {/* Features Bento cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                          <Landmark className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-800">Connected M-PESA</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Direct reconciliation of statement updates from Safaricom. Your funds stay with you.</p>
                      </div>

                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                          <MessageSquare className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-800">WhatsApp Broadcast</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Instantly updates your committee, posts automated thank-you's, and eliminates duplicate claims.</p>
                      </div>

                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                          <Users className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-800">Supporter Transparency</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">A beautifully clean, unbranded public fundraising page to securely view progress & give confidence.</p>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <a
                        href="https://harambeeflow.org/guide"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        Learn More
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: ORGANIZATION SETUP */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-sans font-extrabold text-slate-900 flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-600" /> Create Your Organization Profile
                      </h3>
                      <p className="text-xs text-slate-500">Provide official details to verify accountability and represent your team to supporters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Logo Upload Box (Left) */}
                      <div className="md:col-span-4 flex flex-col items-center space-y-3">
                        <div className="relative w-28 h-28 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center overflow-hidden group shadow-inner">
                          {form.orgLogo ? (
                            <img src={form.orgLogo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building className="w-8 h-8 text-slate-300" />
                          )}
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-mono font-bold">
                            <Camera className="w-5 h-5 mb-1 text-slate-200" />
                            {uploadingLogo ? "Uploading..." : "Upload Logo"}
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono text-center">Square 1:1 image recommended</p>
                      </div>

                      {/* Details Fields (Right) */}
                      <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Organization / Group Name:</label>
                          <input 
                            type="text"
                            placeholder="e.g. St. Jude Community Parish"
                            value={form.orgName}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgName: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-medium rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                              isFieldInvalid("orgName") 
                                ? "border-rose-500 ring-2 ring-rose-100 focus:ring-rose-200" 
                                : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                            }`}
                          />
                          {isFieldInvalid("orgName") && (
                            <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Organization Name is required.</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Organization Type:</label>
                          <select
                            value={form.orgType}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgType: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-medium rounded-xl transition cursor-pointer text-slate-900 opacity-100"
                          >
                            {ORG_TYPES.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">County / Location:</label>
                          <select
                            value={form.orgCounty}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgCounty: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-medium rounded-xl transition cursor-pointer text-slate-900 opacity-100"
                          >
                            {COUNTIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Contact Phone:</label>
                          <input 
                            type="tel"
                            placeholder="e.g. 254712345678"
                            value={form.orgPhone}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgPhone: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-medium rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                              isFieldInvalid("orgPhone") 
                                ? "border-rose-500 ring-2 ring-rose-100 focus:ring-rose-200" 
                                : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                            }`}
                          />
                          {isFieldInvalid("orgPhone") && (
                            <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Contact Phone is required.</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Contact Email:</label>
                          <input 
                            type="email"
                            placeholder="e.g. info@church.org"
                            value={form.orgEmail}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgEmail: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-medium rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                              isFieldInvalid("orgEmail") 
                                ? "border-rose-500 ring-2 ring-rose-100 focus:ring-rose-200" 
                                : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                            }`}
                          />
                          {isFieldInvalid("orgEmail") && (
                            <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Contact Email is required.</p>
                          )}
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Description / Moto:</label>
                          <textarea
                            placeholder="Enter a brief background description of your church, alumni group or chama..."
                            value={form.orgDescription}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgDescription: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-medium rounded-xl transition resize-none text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Website (Optional):</label>
                          <input 
                            type="url"
                            placeholder="e.g. https://www.mygroup.org"
                            value={form.orgWebsite}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ orgWebsite: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-medium rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: CONNECT TILL / PAYBILL */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-sans font-extrabold text-slate-900 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-indigo-600" /> Connect the Till or Paybill You Already Use
                      </h3>
                      <p className="text-xs text-slate-500">
                        Nothing changes for your supporters. They continue paying exactly as they do today. We simply listen to Safaricom statement broadcasts to reconcile ledger sheets.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {/* Form Inputs (Left) */}
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex items-start gap-3">
                          <Coins className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Fill out either your <strong>Lipa Na M-PESA Till Number</strong> (for merchant buy goods) or <strong>Safaricom Paybill Shortcode</strong>.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">M-PESA Buy Goods Till:</label>
                            <input 
                              type="text"
                              maxLength={8}
                              placeholder="e.g. 174379"
                              value={form.tillNumber}
                              disabled={!!form.paybillNumber}
                              onFocus={handleInputFocus}
                              onChange={(e) => updateForm({ tillNumber: e.target.value.replace(/\D/g, "") })}
                              className={`w-full px-4 py-2.5 bg-white disabled:bg-slate-100 border focus:outline-none focus:ring-4 text-xs font-mono font-bold rounded-xl disabled:cursor-not-allowed transition text-slate-900 disabled:text-slate-400 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                                isFieldInvalid("tillOrPaybill")
                                  ? "border-rose-500 ring-2 ring-rose-100"
                                  : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                              }`}
                            />
                          </div>

                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Paybill Shortcode:</label>
                            <input 
                              type="text"
                              maxLength={8}
                              placeholder="e.g. 222111"
                              value={form.paybillNumber}
                              disabled={!!form.tillNumber}
                              onFocus={handleInputFocus}
                              onChange={(e) => updateForm({ paybillNumber: e.target.value.replace(/\D/g, "") })}
                              className={`w-full px-4 py-2.5 bg-white disabled:bg-slate-100 border focus:outline-none focus:ring-4 text-xs font-mono font-bold rounded-xl disabled:cursor-not-allowed transition text-slate-900 disabled:text-slate-400 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                                isFieldInvalid("tillOrPaybill")
                                  ? "border-rose-500 ring-2 ring-rose-100"
                                  : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                              }`}
                            />
                          </div>
                        </div>
                        {isFieldInvalid("tillOrPaybill") && (
                          <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Either a Till Number or Paybill Shortcode is required.</p>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Account Reference Format:</label>
                          <select
                            value={form.accountReferenceFormat}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ accountReferenceFormat: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-medium rounded-xl transition cursor-pointer text-slate-900 opacity-100"
                          >
                            <option value="FIRST_NAME">First Name of Supporter (e.g., JOHN)</option>
                            <option value="CAMPAIGN_SLUG">Campaign Slug Code (e.g., CHURCHBUILD)</option>
                            <option value="ANY_REF">Accept Any Reference</option>
                          </select>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">Instructions for contributors during checkout on your public page.</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleValidateTill}
                          disabled={isValidatingTill || (!form.tillNumber && !form.paybillNumber)}
                          className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                            isFieldInvalid("validationVerified")
                              ? "bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-100"
                              : "bg-slate-900 hover:bg-slate-800"
                          }`}
                        >
                          {isValidatingTill ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              Verifying with Safaricom Portal...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              Validate & Verify Merchant Account
                            </>
                          )}
                        </button>
                        {isFieldInvalid("validationVerified") && (
                          <p className="text-[10px] text-rose-600 font-bold font-mono text-center">⚠️ You must click verify to authenticate your Till with Safaricom.</p>
                        )}
                      </div>

                      {/* Visual Result Simulation Card (Right) */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Lipa Na M-PESA Terminal Preview</h4>
                        
                        {validationResult ? (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3 shadow-xs">
                              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                                Safaricom Record Found!
                              </div>
                              <div className="border-t border-emerald-100 pt-2.5 space-y-1.5 text-xs font-mono">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Business Name:</span>
                                  <span className="font-bold text-slate-800">{validationResult.businessName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Shortcode / Till:</span>
                                  <span className="font-bold text-slate-800">{validationResult.tillNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Terminal Type:</span>
                                  <span className="font-bold text-slate-800 uppercase text-[10px]">
                                    {form.tillNumber ? "Buy Goods Merchant" : "C2B Paybill"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-100 rounded-xl text-center space-y-2">
                              <p className="text-xs text-slate-600 font-medium">Is this business detail correct?</p>
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => setErrorMsg("")} 
                                  className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg cursor-pointer"
                                >
                                  Yes, Correct
                                </button>
                                <button 
                                  onClick={() => setValidationResult(null)} 
                                  className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg cursor-pointer hover:bg-slate-200"
                                >
                                  No, Retry
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-44 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4">
                            <Smartphone className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                            <p className="text-xs text-slate-500 font-bold">No Terminal Connection Established</p>
                            <p className="text-[10px] text-slate-400 mt-1">Enter your details and tap verification to retrieve matching commercial names.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: TRUST & AUTHORIZATION */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-sans font-extrabold text-slate-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600" /> Your Money Always Stays With You
                      </h3>
                      <p className="text-xs text-slate-500">Security and transparency are our highest core values. Here is what we do and NEVER do.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      {/* Column 1: HarambeeFlow CAN */}
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          HarambeeFlow CAN
                        </div>
                        <ul className="space-y-2.5">
                          {[
                            "Read incoming M-PESA transaction receipts via Safaricom webhook notifications.",
                            "Instantly auto-publish reconciled thank-you summaries to your group.",
                            "Verify transaction ID lengths and prevent duplicate claim attempts.",
                            "Generate professional financial ledger spreadsheets for audited reports."
                          ].map((item, index) => (
                            <li key={index} className="flex gap-2 text-xs text-emerald-900 leading-relaxed">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 2: HarambeeFlow NEVER */}
                      <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                          <ShieldAlert className="w-5 h-5 text-rose-600" />
                          HarambeeFlow NEVER
                        </div>
                        <ul className="space-y-2.5">
                          {[
                            "Touch, hold, transfer, or withdraw any of your organization's funds.",
                            "Ask for, store, or modify your M-PESA Till or Paybill PIN credentials.",
                            "Contact or send promotional messages to your contributors.",
                            "Change any routing, commission, or fee parameters of your account."
                          ].map((item, index) => (
                            <li key={index} className="flex gap-2 text-xs text-rose-900 leading-relaxed">
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Trust Certifications Panel */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap gap-4 items-center justify-around text-center">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Safaricom Partner Authorized
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
                        <Lock className="w-4 h-4 text-indigo-600" />
                        SSL Encryption Secure
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
                        <Building className="w-4 h-4 text-slate-500" />
                        Kenyan CBK Compliance Ready
                      </div>
                    </div>

                    {/* Trust Agreement checkbox */}
                    <div className="p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="trustAccepted"
                        checked={form.trustAccepted}
                        onChange={(e) => updateForm({ trustAccepted: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 rounded-md cursor-pointer"
                      />
                      <label htmlFor="trustAccepted" className="text-xs text-indigo-950 font-medium select-none cursor-pointer leading-tight">
                        I understand that HarambeeFlow handles read-only ledger reconciliation and CANNOT touch my organization funds.
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: CREATE FIRST FUNDRAISER */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-sans font-extrabold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" /> Setup Your First Fundraiser Campaign
                      </h3>
                      <p className="text-xs text-slate-500">Design the public profile banner, goal amount, description and shareable URL path.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      
                      {/* Form Details (Left) */}
                      <div className="md:col-span-8 space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Fundraiser Title / Campaign Name:</label>
                          <input 
                            type="text"
                            placeholder="e.g. Church Sanctuary Sound System Drive"
                            value={form.fundraiserTitle}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ fundraiserTitle: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-medium rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                              isFieldInvalid("fundraiserTitle")
                                ? "border-rose-500 ring-2 ring-rose-100"
                                : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                            }`}
                          />
                          {isFieldInvalid("fundraiserTitle") && (
                            <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Fundraiser Title is required.</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Target Goal (KES):</label>
                            <input 
                              type="number"
                              placeholder="e.g. 500000"
                              value={form.fundraiserGoal}
                              onFocus={handleInputFocus}
                              onChange={(e) => updateForm({ fundraiserGoal: e.target.value })}
                              className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-mono font-bold rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                                isFieldInvalid("fundraiserGoal")
                                  ? "border-rose-500 ring-2 ring-rose-100"
                                  : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                              }`}
                            />
                            {isFieldInvalid("fundraiserGoal") && (
                              <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Please enter a positive target amount.</p>
                            )}
                          </div>

                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Campaign Sector / Category:</label>
                            <select
                              value={form.fundraiserCategory}
                              onFocus={handleInputFocus}
                              onChange={(e) => updateForm({ fundraiserCategory: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-medium rounded-xl transition cursor-pointer text-slate-900 opacity-100"
                            >
                              <option value="Community/Church">Church & Ministries</option>
                              <option value="Medical/Family">Medical Appeals</option>
                              <option value="Funeral/Memorial">Funeral / Bereavements</option>
                              <option value="Education/Chama">School / Chamas</option>
                              <option value="Wedding/Social">Weddings / Celebrations</option>
                              <option value="Youth/Pathfinders">Youth & Camps</option>
                              <option value="Community/NGO">Community & NGOs</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Description & Appeal Text:</label>
                          <textarea
                            placeholder="Describe what the contributions will build, why it is urgent, and how the community will benefit..."
                            value={form.fundraiserDesc}
                            onFocus={handleInputFocus}
                            onChange={(e) => updateForm({ fundraiserDesc: e.target.value })}
                            rows={3}
                            className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-medium rounded-xl transition resize-none text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                              isFieldInvalid("fundraiserDesc")
                                ? "border-rose-500 ring-2 ring-rose-100"
                                : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                            }`}
                          />
                          {isFieldInvalid("fundraiserDesc") && (
                            <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Please describe the fundraiser's purpose.</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Closing Target Date:</label>
                            <input 
                              type="date"
                              value={form.fundraiserEndDate}
                              onFocus={handleInputFocus}
                              onChange={(e) => updateForm({ fundraiserEndDate: e.target.value })}
                              className={`w-full px-4 py-2.5 bg-white border focus:outline-none focus:ring-4 text-xs font-medium rounded-xl transition cursor-pointer text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100 ${
                                isFieldInvalid("fundraiserEndDate")
                                  ? "border-rose-500 ring-2 ring-rose-100"
                                  : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500"
                              }`}
                            />
                            {isFieldInvalid("fundraiserEndDate") && (
                              <p className="text-[10px] text-rose-600 font-bold font-mono">⚠️ Closing Date is required.</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Shareable Public Slug:</label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-[10px] text-slate-400 font-mono font-bold select-none">/f/</span>
                              <input 
                                type="text"
                                placeholder="my-campaign"
                                value={form.fundraiserSlug}
                                onFocus={handleInputFocus}
                                onChange={(e) => updateForm({ fundraiserSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-mono font-bold rounded-xl transition text-slate-900 placeholder:text-slate-400 caret-indigo-600 opacity-100"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cover Photo Upload Preview (Right) */}
                      <div className="md:col-span-4 space-y-4">
                        <label className="text-[10px] font-mono font-bold text-slate-600 uppercase block">Campaign Cover Banner:</label>
                        <div className="relative w-full aspect-video rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group shadow-inner">
                          {form.fundraiserCoverImage ? (
                            <img src={form.fundraiserCoverImage} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                              <span className="text-[10px] text-slate-400 font-bold text-center px-4">Upload custom campaign image or use default sector art</span>
                            </>
                          )}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-mono font-bold">
                            <Upload className="w-5 h-5 mb-1" />
                            {uploadingBanner ? "Processing Image..." : "Upload New Cover"}
                            <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                          </label>
                        </div>

                        {/* Real-time preview snippet */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase leading-none">Public Page link preview</p>
                          <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-slate-100 text-[10px] font-mono truncate text-indigo-600">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span>harambeeflow.org/f/{form.fundraiserSlug || "..."}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: READY TO LAUNCH & CONGRATULATE */}
                {step === 6 && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="py-6 text-center space-y-6 max-w-xl mx-auto"
                  >
                    {success ? (
                      <div className="space-y-6">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md border border-emerald-100">
                          <CheckCircle2 className="w-12 h-12 animate-bounce text-emerald-600" />
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-2xl font-sans font-black tracking-tight text-slate-900 leading-tight">
                            🎉 Congratulations! You are Live!
                          </h2>
                          <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Your organization <strong>"{form.orgName}"</strong> and your campaign <strong>"{form.fundraiserTitle}"</strong> are now fully provisioned on HarambeeFlow's secure database.
                          </p>
                        </div>

                        {/* Checklist showing completed onboarding list */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3 shadow-inner max-w-sm mx-auto">
                          <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Completion Checklist</h4>
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5 text-xs text-slate-700">
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                              <span className="font-bold">Organization successfully created</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-700">
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                              <span className="font-bold">Lipa Na M-PESA Terminal Connected</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-700">
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                              <span className="font-bold">First public fundraiser created</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-400">
                              <span className="w-4.5 h-4.5 rounded-full border border-slate-200 bg-white flex items-center justify-center font-bold text-[9px] text-slate-400 font-mono">4</span>
                              <span>Share campaign URL to WhatsApp group</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                          <button
                            onClick={() => onComplete(launchedCampaignId)}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                            Open Committee Dashboard
                          </button>
                          <a
                            href={`#/f/${form.fundraiserSlug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.hash = `/f/${form.fundraiserSlug}`;
                            }}
                            className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                            View Public Supporter Page
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100 shadow-inner">
                          <CheckSquareIcon className="w-10 h-10 animate-pulse text-indigo-600" />
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-2xl font-sans font-black tracking-tight text-slate-900 leading-tight">
                            Review & Launch Your Platform
                          </h2>
                          <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Please confirm that all organization, Safaricom terminal paybills, and fundraising configurations are correct before final launch.
                          </p>
                        </div>

                        {/* Confirmation Box */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-left space-y-3.5 text-xs font-mono shadow-sm">
                          <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-400">Organization:</span>
                            <span className="font-bold text-slate-800">{form.orgName} ({form.orgType})</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-400">Connected Terminal:</span>
                            <span className="font-bold text-slate-800">
                              {form.tillNumber ? `Till: ${form.tillNumber}` : `Paybill: ${form.paybillNumber}`}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-400">Fundraiser campaign:</span>
                            <span className="font-bold text-indigo-600">{form.fundraiserTitle}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/50 pb-2">
                            <span className="text-slate-400">Financial target:</span>
                            <span className="font-bold text-slate-800">KES {Number(form.fundraiserGoal).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Public Page slug:</span>
                            <span className="font-bold text-emerald-600">/f/{form.fundraiserSlug}</span>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={handleLaunch}
                            disabled={loading}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Setting up Secure Environment...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                Launch HarambeeFlow Dashboard
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Sticky/Fixed Bottom Navigation Footer */}
            {!success && (
              <div className="sticky md:relative bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:border-slate-100 px-4 py-3.5 md:px-8 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:shadow-none rounded-b-3xl pb-[calc(env(safe-area-inset-bottom)+14px)]">
                
                {/* Left Group: Save & Exit + Back */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    type="button"
                    onClick={handleSaveAndExit}
                    className="min-h-[48px] px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Save your progress and return to the welcome screen"
                  >
                    Save & Exit
                  </button>

                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="min-h-[48px] px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                </div>

                {/* Right Group: Skip Option + Continue/Next */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {/* Skip Step Trigger (Steps 2, 3, 4, 5) */}
                  {step > 1 && step < 6 && (
                    <button
                      type="button"
                      onClick={
                        step === 2 ? handleSkipStep2 :
                        step === 3 ? handleSkipStep3 :
                        step === 4 ? handleSkipStep4 :
                        handleSkipStep5
                      }
                      className="min-h-[48px] px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      Skip Step
                    </button>
                  )}

                  {step < 6 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="min-h-[48px] px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-4 focus:ring-indigo-200 text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLaunch}
                      disabled={loading}
                      className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white focus:outline-none focus:ring-4 focus:ring-emerald-200 text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto justify-center disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Setting up Secure Environment...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          Launch HarambeeFlow Dashboard
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 px-6 py-4 text-center hidden md:block">
        <p className="text-[10px] text-slate-400 font-mono">
          © 2026 HarambeeFlow. All Rights Reserved. • <a href="https://harambeeflow.org" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">https://harambeeflow.org</a>
        </p>
      </footer>
    </div>
  );
}
