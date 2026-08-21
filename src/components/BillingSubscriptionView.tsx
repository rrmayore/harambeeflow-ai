import React, { useState, useEffect, useRef } from "react";
import { 
  CreditCard, Check, Sparkles, Zap, ShieldCheck, ArrowRight, Download, 
  HelpCircle, Clock, AlertCircle, Phone, Mail, Lock, CheckCircle2, Copy, 
  BarChart3, HardDrive, Cpu, Users, Target, X, ExternalLink, RefreshCw,
  FileText, Heart, Layers, MessageSquare, FileSpreadsheet, Building2,
  Edit3, Globe, Shield, Database, Cloud, Award, CheckCircle, Tag, User, 
  LockKeyhole, ChevronDown, ChevronUp, Server, CheckSquare, TrendingUp,
  DollarSign, ShieldAlert, FileCheck, Landmark, Key, Users2, Loader2
} from "lucide-react";
import { auth } from "../firebase";

interface BillingSubscriptionViewProps {
  onBackToSettings?: () => void;
  currentUser?: any;
  activeProject?: any;
}

export interface AuthoritativeSubscriptionState {
  authenticated?: boolean;
  userId?: string;
  planId: "community" | "standard" | "professional";
  status: "free" | "trial" | "active" | "past_due" | "expired" | "cancelled";
  access: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  entitlements?: Record<string, any>;
  subscription?: {
    userId?: string;
    planId?: string;
    status?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    autoRenew?: boolean;
  };
}

export default function BillingSubscriptionView({ 
  onBackToSettings, 
  currentUser,
  activeProject 
}: BillingSubscriptionViewProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<string>("Standard");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [mpesaPhone, setMpesaPhone] = useState(currentUser?.phoneNumber || "0712345678");
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Authoritative server-side subscription state
  const [serverSub, setServerSub] = useState<AuthoritativeSubscriptionState | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isInitiatingUpgrade, setIsInitiatingUpgrade] = useState<boolean>(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [stkResponse, setStkResponse] = useState<any | null>(null);

  // Automatic Payment & Subscription Confirmation Polling State
  const [pollingStatus, setPollingStatus] = useState<"idle" | "polling" | "confirmed" | "timeout" | "failed">("idle");
  const [confirmedSubData, setConfirmedSubData] = useState<AuthoritativeSubscriptionState | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingDeadlineRef = useRef<number>(0);

  // Safe helper to stop any active polling timer
  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  // Clean up polling timer on component unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Organization Information local state
  const [orgInfo, setOrgInfo] = useState({
    name: activeProject?.organizationName || "Nairobi Medical & Welfare Fund",
    type: "Welfare Group", // Church, School, Welfare Group, NGO, Business
    owner: currentUser?.displayName || currentUser?.email || "Rev. Joseph Mwangi",
    email: currentUser?.email || "billing@harambeeflow.org",
    phone: currentUser?.phoneNumber || "0712345678",
    country: "Kenya",
    currency: "KES",
    timeZone: "Africa/Nairobi",
    taxStatus: "Tax-Exempt Non-Profit (KRA Registered)",
    orgId: "ORG-KE-2026-8842",
    dateRegistered: "Jan 15, 2026",
    lastUpdated: "Jul 22, 2026",
  });

  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [tempOrgInfo, setTempOrgInfo] = useState(orgInfo);

  // Fetch Authoritative Subscription Status from Secure Backend API
  const fetchSubscriptionStatus = async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const user = currentUser || auth?.currentUser;
      if (!user) {
        // Safe unauthenticated fallback: default to community free tier
        setServerSub({
          planId: "community",
          status: "free",
          access: true,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          autoRenew: false
        });
        setIsLoadingStatus(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/subscription/status", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required. Please sign in to view authoritative subscription details.");
        } else if (res.status === 403) {
          throw new Error("Access forbidden. You do not have permission to view subscription status.");
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error (${res.status}) while retrieving subscription status.`);
        }
      }

      const data: AuthoritativeSubscriptionState = await res.json();
      setServerSub(data);
    } catch (err: any) {
      console.error("[BILLING UI] Error fetching subscription status:", err);
      setStatusError(err.message || "Failed to load authoritative subscription status.");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [currentUser]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@harambeeflow.org");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleOpenUpgradeModal = (planName: string = "Standard") => {
    stopPolling();
    setSelectedPlanForUpgrade(planName);
    setInitiateError(null);
    setStkResponse(null);
    setPollingStatus("idle");
    setConfirmedSubData(null);
    setShowUpgradeModal(true);
    setUpgradeSubmitted(false);
  };

  const handleCloseUpgradeModal = () => {
    stopPolling();
    setShowUpgradeModal(false);
    setPollingStatus("idle");
  };

  // Starts lightweight authoritative subscription confirmation polling
  const startPaymentConfirmationPolling = (targetPlanKey: "standard" | "professional") => {
    stopPolling();
    setPollingStatus("polling");
    setConfirmedSubData(null);
    // Timeout after 2.5 minutes (150,000 ms)
    pollingDeadlineRef.current = Date.now() + 150000;

    const pollInterval = setInterval(async () => {
      // Check for timeout
      if (Date.now() > pollingDeadlineRef.current) {
        stopPolling();
        setPollingStatus("timeout");
        return;
      }

      try {
        const user = currentUser || auth?.currentUser;
        if (!user) {
          stopPolling();
          setPollingStatus("failed");
          return;
        }

        const token = await user.getIdToken();
        const res = await fetch("/api/subscription/status", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data: AuthoritativeSubscriptionState = await res.json();
          // Check if the plan is now authoritatively active or trial
          if (data.planId === targetPlanKey && (data.status === "active" || data.status === "trial")) {
            stopPolling();
            setServerSub(data);
            setConfirmedSubData(data);
            setPollingStatus("confirmed");
            setFeedbackMsg(`🎉 Payment Confirmed! Your ${targetPlanKey === "professional" ? "Professional" : "Standard"} subscription is now active.`);
          }
        }
      } catch (pollErr) {
        console.warn("[BILLING UI] Polling check encountered transient error:", pollErr);
      }
    }, 3500);

    pollingTimerRef.current = pollInterval;
  };

  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitiateError(null);
    setStkResponse(null);

    const planKey = selectedPlanForUpgrade.toLowerCase() as "community" | "standard" | "professional";

    if (planKey === "community") {
      setFeedbackMsg("You are currently on the Community Tier (Free forever).");
      setShowUpgradeModal(false);
      return;
    }

    const user = currentUser || auth?.currentUser;
    if (!user) {
      setInitiateError("You must be authenticated with Firebase to initiate an upgrade. Please sign in.");
      return;
    }

    setIsInitiatingUpgrade(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/subscription/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: planKey,
          billingCycle,
          phoneNumber: mpesaPhone
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data.message || data.error || `Payment initiation failed with status ${response.status}.`;
        setInitiateError(errMsg);
        return;
      }

      setStkResponse(data);
      setUpgradeSubmitted(true);
      setFeedbackMsg(data.customerMessage || `M-PESA STK Push prompt sent to ${mpesaPhone}! Please enter your PIN on your phone.`);

      // Automatically start confirmation polling loop
      startPaymentConfirmationPolling(planKey);
    } catch (err: any) {
      console.error("[BILLING UI] Payment initiation error:", err);
      setInitiateError(err.message || "Network error while connecting to M-PESA payment gateway. Please check your connection.");
    } finally {
      setIsInitiatingUpgrade(false);
    }
  };

  const handleOpenEditOrgModal = () => {
    setTempOrgInfo(orgInfo);
    setShowEditOrgModal(true);
  };

  const handleSaveOrgInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...tempOrgInfo,
      lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    setOrgInfo(updated);
    setShowEditOrgModal(false);
    setFeedbackMsg("Organization Information updated successfully!");
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Feature matrix rows for Compare Plans
  const featureMatrix = [
    {
      feature: "Active Campaigns",
      icon: Target,
      community: "1 Campaign",
      standard: "Unlimited",
      professional: "Unlimited"
    },
    {
      feature: "Contributions & Pledges",
      icon: Users,
      community: "Up to KES 100k",
      standard: "Unlimited",
      professional: "Unlimited"
    },
    {
      feature: "M-PESA Reconciliation",
      icon: Phone,
      community: "Manual Entry",
      standard: "Automatic Daraja Sync",
      professional: "Multi-Till & Paybill API"
    },
    {
      feature: "AI Treasurer Assistant",
      icon: Sparkles,
      community: "Basic Generator",
      standard: "Full AI Treasurer Assistant",
      professional: "Custom Dedicated Models"
    },
    {
      feature: "WhatsApp Receipts & Group Alerts",
      icon: MessageSquare,
      community: "Shareable Links",
      standard: "Instant Group Receipts",
      professional: "Custom WhatsApp Business API"
    },
    {
      feature: "Reports & Financial Ledger",
      icon: FileSpreadsheet,
      community: "Basic PDF Reports",
      standard: "Excel & PDF Executive Vault",
      professional: "Custom Audits & Automated Exports"
    },
    {
      feature: "Treasurers & Committee Roles",
      icon: Building2,
      community: "1 Treasurer",
      standard: "Multiple Treasurers",
      professional: "Multi-Branch Roles & Audit Trail"
    }
  ];

  const valueProps = [
    { title: "No Setup Fees", desc: "Get started immediately with zero onboarding fees or surprise charges.", icon: CheckSquare },
    { title: "Cancel Anytime", desc: "Full flexibility with month-to-month subscriptions and no lock-in contracts.", icon: Clock },
    { title: "Secure Cloud Backups", desc: "Automatic real-time backups protecting all treasurer records and donor ledgers.", icon: Cloud },
    { title: "AI Treasurer Automation", desc: "Instant M-PESA STK reconciliation and automated WhatsApp receipts.", icon: Cpu },
    { title: "Built Specifically for Kenya", desc: "Custom-tailored for churches, schools, chamas, and community Harambees.", icon: Globe },
    { title: "Dedicated Customer Support", desc: "Local phone, email, and WhatsApp support from our Kenya-based team.", icon: HelpCircle }
  ];

  const roiBenefits = [
    {
      title: "Save Hours Every Week",
      desc: "Eliminate manual bookkeeping, cross-checking spreadsheets, and chasing unassigned payments.",
      icon: Clock,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Automatic M-PESA Reconciliation",
      desc: "Match incoming Daraja transactions instantly to contributors without human error.",
      icon: RefreshCw,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Instant Reports",
      desc: "Generate audit-ready Excel ledgers and PDF executive summaries for committee meetings in seconds.",
      icon: FileCheck,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "AI Treasurer Assistance",
      desc: "Smart prompt tools draft donor appreciation notes, analyze pledge drop-offs, and track fundraising milestones.",
      icon: Sparkles,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    }
  ];

  const trustCards = [
    {
      title: "Churches",
      desc: "Tithing, Thanksgiving & Cathedral Building Drives",
      detail: "Automate weekly giving tracking and send digital WhatsApp receipts to congregation members.",
      icon: Landmark,
      color: "text-emerald-400 border-emerald-500/30"
    },
    {
      title: "Schools",
      desc: "Alumni Welfare, Bus Projects & Infrastructure",
      detail: "Transparent multi-class pledge tracking with downloadable PDF reports for board members.",
      icon: Building2,
      color: "text-teal-400 border-teal-500/30"
    },
    {
      title: "NGOs",
      desc: "Multi-Donor Grant Operations & Field Relief",
      detail: "Bank-grade audit trails, strict role permissions, and enterprise multi-branch visibility.",
      icon: Globe,
      color: "text-indigo-400 border-indigo-500/30"
    },
    {
      title: "Chamas & Welfare Groups",
      desc: "Merry-Go-Rounds, Bereavement & Emergency Funds",
      detail: "Member contribution statements, instant M-PESA reconciliation, and automated alerts.",
      icon: Users2,
      color: "text-blue-400 border-blue-500/30"
    }
  ];

  const guaranteeItems = [
    { title: "No setup fees", desc: "Start in 60 seconds with zero onboarding cost.", icon: CheckCircle2 },
    { title: "Cancel anytime", desc: "Pause or cancel with 1-click whenever needed.", icon: Clock },
    { title: "Your data always belongs to you", desc: "You maintain 100% ownership of your member records.", icon: Key },
    { title: "Export your data whenever you wish", desc: "Download raw CSVs, Excel files, and PDF statements anytime.", icon: Download },
    { title: "Secure encrypted cloud storage", desc: "Bank-grade SSL encryption with Firebase security rules.", icon: ShieldCheck }
  ];

  const faqs = [
    {
      q: "Do I need a contract?",
      a: "No long-term contracts are required! HarambeeFlow operates on a flexible month-to-month or annual subscription. You can upgrade, downgrade, or pause your plan at any time with complete transparency."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes, absolutely. You can cancel your subscription at any time directly from your billing dashboard with zero cancellation fees or penalties."
    },
    {
      q: "Can I upgrade later?",
      a: "Yes! As your church, school, or community project grows, you can instantly upgrade from Community to Standard or Professional with a single click. Your existing data, campaigns, and donor records are preserved."
    },
    {
      q: "Is my data secure?",
      a: "HarambeeFlow uses bank-grade SSL encryption, secure Firebase authentication, and encrypted cloud backups. Your campaign records and treasurer financial logs are protected under Kenyan Data Protection regulations."
    },
    {
      q: "Does HarambeeFlow support M-PESA?",
      a: "Yes! HarambeeFlow features native Safaricom Daraja M-PESA reconciliation for automated STK pushes, Till numbers, and Paybills with instant WhatsApp receipt generation."
    },
    {
      q: "Can multiple treasurers use one account?",
      a: "Yes, on Standard and Professional plans you can invite multiple treasurers, committee members, and auditors with role-based access control and detailed audit trail logs."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8 text-slate-100 min-h-full space-y-12" id="billing-subscription-container">
      
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-300 shadow-xl animate-scale-up sticky top-2 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg("")} 
            className="font-bold underline text-[10px] hover:text-white shrink-0 ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase tracking-widest shadow-sm">
              Pricing & Subscriptions
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
              Kenya&apos;s AI Treasurer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2 tracking-tight" id="billing-page-header-title">
            Simple, Transparent Pricing for Kenya
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Empower your church, school, chama, or NGO with Kenya&apos;s AI Treasurer. Choose a plan that fits your fundraising scale.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onBackToSettings && (
            <button
              onClick={onBackToSettings}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition cursor-pointer"
              id="btn-back-to-general-settings"
            >
              ← Back to General Settings
            </button>
          )}
          <button
            onClick={() => handleOpenUpgradeModal("Standard")}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition cursor-pointer active:scale-95"
            id="billing-upgrade-pro-top-btn"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Start 14-Day Free Trial
          </button>
        </div>
      </div>

      {/* PRICING TOGGLE & TIERS SECTION */}
      <div className="space-y-8" id="billing-plans-section">
        
        {/* Segmented Billing Selector Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-md shadow-lg">
          <div>
            <span className="text-xs font-bold text-white block">Select Billing Frequency</span>
            <p className="text-[11px] text-slate-400">Save 20% on annual subscriptions for churches, schools, and non-profits.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto shadow-inner relative" id="billing-cycle-toggle-container">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative z-10 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                billingCycle === "monthly" 
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="billing-cycle-monthly-btn"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`relative z-10 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                billingCycle === "annual" 
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="billing-cycle-annual-btn"
            >
              <span>Annual (Save 20%)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-tight transition-colors ${
                billingCycle === "annual" 
                  ? "bg-slate-950 text-emerald-400" 
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                20% OFF
              </span>
            </button>
          </div>
        </div>        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* COMMUNITY CARD */}
          <div className={`bg-slate-900 border rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative transition shadow-xl ${
            (serverSub?.planId || "community") === "community" ? "border-slate-600 bg-slate-900/90" : "border-slate-800 hover:border-slate-700"
          }`} id="billing-plan-community">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                  (serverSub?.planId || "community") === "community" 
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" 
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}>
                  {(serverSub?.planId || "community") === "community" ? "CURRENT PLAN" : "FREE"}
                </span>
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Community</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                  Perfect for first-time fundraisers and small community projects.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800/80 space-y-1">
                <div className="text-3xl font-black text-white font-mono">
                  {billingCycle === "monthly" ? "KES 0" : "KES 0"}
                  <span className="text-xs text-slate-400 font-normal"> / {billingCycle === "monthly" ? "month" : "year"}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Free forever for grassroots drives</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">What&apos;s included:</p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Up to KES 100,000 Raised</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>1 Campaign</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>1 Treasurer</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Manual Contributions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Basic Dashboard</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Basic Reports</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Community Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => handleOpenUpgradeModal("Community")}
                disabled={(serverSub?.planId || "community") === "community"}
                className={`w-full py-3 font-bold text-xs rounded-xl border transition cursor-pointer text-center ${
                  (serverSub?.planId || "community") === "community"
                    ? "bg-slate-800/80 text-emerald-400 border-slate-700 cursor-default"
                    : "bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border-slate-700"
                }`}
                id="billing-btn-select-community"
              >
                {(serverSub?.planId || "community") === "community" ? "Active Community Plan" : "Start Free"}
              </button>
              <p className="text-[10px] text-slate-500 text-center font-medium">No credit card required.</p>
            </div>
          </div>

          {/* STANDARD CARD (MOST POPULAR) */}
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10 md:-translate-y-2" id="billing-plan-standard">
            
            {/* Most Popular Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-lg font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{serverSub?.planId === "standard" ? "ACTIVE PLAN" : "MOST POPULAR"}</span>
            </div>

            <div className="space-y-5 pt-1">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 uppercase tracking-wider">
                  INSTITUTIONAL FAVORITE
                </span>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Standard</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed min-h-[36px]">
                  Ideal for churches, schools, chamas and welfare groups.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800/80 space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                  {billingCycle === "monthly" ? "KES 1,500" : "KES 14,400"}
                  <span className="text-xs text-slate-400 font-normal"> / {billingCycle === "monthly" ? "month" : "year"}</span>
                </div>
                
                <div className="space-y-0.5">
                  {billingCycle === "annual" ? (
                    <p className="text-[11px] font-bold font-mono text-emerald-300">
                      Equivalent to KES 1,200/month
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold font-mono text-emerald-300">
                      Approximately KES 50/day
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Everything in Community, plus:</p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Unlimited Campaigns</span>
                  </li>
                  <li className="flex items-start gap-2.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Unlimited Contributions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Automatic M-PESA Reconciliation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>AI Treasurer Assistant</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Instant WhatsApp Receipts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Excel & PDF Reports</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Multiple Treasurers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Donor Management</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Priority Email Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => handleOpenUpgradeModal("Standard")}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                id="billing-btn-upgrade-standard"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>{serverSub?.planId === "standard" ? "Manage Standard Plan" : "Start 14-Day Free Trial"}</span>
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-300 font-semibold">
                <span>No setup fees</span>
                <span>•</span>
                <span>Cancel anytime</span>
              </div>

              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[10px] text-emerald-300 text-center leading-tight">
                <span className="font-bold block text-emerald-400 mb-0.5">Founding Member Pricing</span>
                Lock in this subscription price while you remain continuously subscribed.
              </div>
            </div>
          </div>

          {/* PROFESSIONAL CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition shadow-xl" id="billing-plan-professional">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50 uppercase tracking-wider">
                  {serverSub?.planId === "professional" ? "CURRENT PLAN" : "ENTERPRISE & NGOS"}
                </span>
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Professional</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                  Built for large churches, NGOs and multi-branch organizations.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800/80 space-y-1">
                <div className="text-3xl font-black text-white font-mono">
                  {billingCycle === "monthly" ? "KES 3,500" : "KES 33,600"}
                  <span className="text-xs text-slate-400 font-normal"> / {billingCycle === "monthly" ? "month" : "year"}</span>
                </div>
                
                <div className="space-y-0.5">
                  {billingCycle === "annual" ? (
                    <p className="text-[11px] font-bold font-mono text-indigo-300">
                      Equivalent to KES 2,800/month
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold font-mono text-indigo-300">
                      Approximately KES 117/day
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">Everything in Standard, plus:</p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5 font-semibold text-white">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Everything in Standard</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Unlimited Organizations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Multi-Branch Management</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Committee Roles & Permissions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Advanced Analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Custom Branding</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>API Integrations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Audit Logs</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Priority Support</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Dedicated Onboarding</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => handleOpenUpgradeModal("Professional")}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer text-center"
                id="billing-btn-contact-professional"
              >
                {serverSub?.planId === "professional" ? "Manage Professional Plan" : "Upgrade to Professional"}
              </button>
              <p className="text-[10px] text-slate-500 text-center font-medium">Custom volume billing & dedicated setup.</p>
            </div>
          </div>
        </div>
      </div>

      {/* VALUE SECTION */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="billing-value-section">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase tracking-widest">
            Unmatched Value
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Why Organizations Choose HarambeeFlow
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered specifically to eliminate treasurer friction, streamline M-PESA audit trails, and give committees full financial confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {valueProps.map((vp, idx) => {
            const IconComp = vp.icon;
            return (
              <div key={idx} className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2.5 hover:border-slate-700 transition shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{vp.title}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {vp.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROI SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="billing-roi-section">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase tracking-widest">
            Return On Investment
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Save More Than Your Subscription Costs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Most organizations spend many hours every month manually reconciling M-PESA contributions, preparing reports and answering payment questions. HarambeeFlow automates these tasks so treasurers spend less time on administration and more time serving their organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {roiBenefits.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TRUST SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="billing-trust-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-black text-white">Built for Kenyan Community Organizations</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Trusted by organizations that need transparency, accountability and simple fundraising management.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 font-mono text-xs font-bold rounded-full self-start md:self-auto">
            100% Kenya Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-1">
          {trustCards.map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div key={idx} className={`p-5 bg-slate-950/80 border rounded-2xl space-y-2.5 transition ${card.color}`}>
                <div className="flex items-center gap-2">
                  <IconComp className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-black text-white">{card.title}</h3>
                </div>
                <p className="text-xs font-bold text-slate-300">{card.desc}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center">
          <p className="text-xs font-bold text-slate-300">
            Trusted by organizations that need transparency, accountability and simple fundraising management.
          </p>
        </div>
      </div>

      {/* RISK-FREE GUARANTEE SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="billing-guarantee-section">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase tracking-widest">
            100% Peace of Mind
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Try HarambeeFlow Risk-Free
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything is designed to protect your organization&apos;s records and privacy without lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {guaranteeItems.map((g, idx) => {
            const IconComp = g.icon;
            return (
              <div key={idx} className="p-4 bg-slate-950/90 border border-slate-800/80 rounded-2xl space-y-2 text-center flex flex-col items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white">{g.title}</h3>
                <p className="text-[10px] text-slate-400 leading-tight">{g.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="billing-faq-section">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest block">
            Got Questions?
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Everything you need to know about HarambeeFlow pricing, billing, and subscription management.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white hover:text-emerald-400 transition cursor-pointer"
                  id={`faq-btn-${idx}`}
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 pt-1 sm:px-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: COMPARE PLANS FEATURE MATRIX */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6" id="billing-feature-matrix-card">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Compare Plans Feature Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed breakdown of features across Community, Standard, and Professional plans.
          </p>
        </div>

        <div className="overflow-x-auto" id="billing-feature-matrix-table-container">
          <table className="w-full text-left text-xs border-collapse" id="billing-feature-matrix-table">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="py-3 px-4 rounded-l-xl w-1/3">Feature</th>
                <th className="py-3 px-4 text-center">Community</th>
                <th className="py-3 px-4 text-center bg-emerald-950/40 text-emerald-400 border-x border-emerald-500/20">
                  Standard ⭐
                </th>
                <th className="py-3 px-4 text-center rounded-r-xl">Professional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {featureMatrix.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <tr key={idx} className="hover:bg-slate-850/60 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                      <ItemIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.feature}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {item.community}
                    </td>
                    <td className="py-3.5 px-4 text-center bg-emerald-950/20 font-bold text-emerald-300 border-x border-emerald-500/10">
                      {item.standard}
                    </td>
                    <td className="py-3.5 px-4 text-center text-indigo-300 font-medium">
                      {item.professional}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: ORGANIZATION INFORMATION & BILLING SUMMARY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="billing-org-and-summary-grid">
        
        {/* Organization Information Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl" id="billing-org-info-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-black text-white">Organization Information</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official entity registration, contacts, and tax status for HarambeeFlow billing statements.
              </p>
            </div>

            <button
              onClick={handleOpenEditOrgModal}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
              id="btn-edit-org-info"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Organization Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Organization Name</span>
              <p className="font-bold text-white font-mono truncate">{orgInfo.name}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Organization Type</span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                {orgInfo.type}
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Subscription Owner</span>
              <p className="font-semibold text-slate-200 truncate">{orgInfo.owner}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Billing Contact Email</span>
              <p className="font-mono text-slate-300 truncate">{orgInfo.email}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Billing Contact Phone</span>
              <p className="font-mono text-slate-300">{orgInfo.phone}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Country</span>
              <p className="font-semibold text-slate-200">{orgInfo.country}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Currency</span>
              <p className="font-mono font-bold text-emerald-400">{orgInfo.currency} (Kenyan Shilling)</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Time Zone</span>
              <p className="font-mono text-slate-300">{orgInfo.timeZone}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Tax Status</span>
              <p className="text-slate-300 truncate">{orgInfo.taxStatus}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Organization ID</span>
              <p className="font-mono font-bold text-slate-300">{orgInfo.orgId}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Date Registered</span>
              <p className="font-mono text-slate-400">{orgInfo.dateRegistered}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Last Updated</span>
              <p className="font-mono text-slate-400">{orgInfo.lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Billing Summary Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between" id="billing-summary-panel">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-black text-white">Billing Summary</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSubscriptionStatus}
                  disabled={isLoadingStatus}
                  title="Refresh authoritative subscription status"
                  className="p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer rounded-lg hover:bg-slate-800"
                  id="btn-refresh-subscription-status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? "animate-spin text-emerald-400" : ""}`} />
                </button>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  {isLoadingStatus ? "Syncing..." : "Server Verified"}
                </span>
              </div>
            </div>

            {statusError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-[11px] text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{statusError}</span>
                  <button 
                    onClick={fetchSubscriptionStatus} 
                    className="block font-bold text-rose-300 underline hover:text-white mt-1 cursor-pointer"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Current Plan:</span>
                <span className="font-black text-emerald-400 font-mono capitalize">
                  {serverSub?.planId ? `${serverSub.planId} Tier` : "Community Tier"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Subscription Status:</span>
                {isLoadingStatus ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-400 font-mono text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                    Checking...
                  </span>
                ) : serverSub?.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                    Active
                  </span>
                ) : serverSub?.status === "trial" ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-teal-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_6px_#2dd4bf]" />
                    14-Day Free Trial
                  </span>
                ) : serverSub?.status === "past_due" ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Past Due
                  </span>
                ) : serverSub?.status === "expired" ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-300 font-mono">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Free Grassroots
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="font-bold text-white font-mono capitalize">{billingCycle}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Next Renewal Date:</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {serverSub?.currentPeriodEnd 
                    ? new Date(serverSub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Free Tier (No Expiry)"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Authoritative Pricing:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {serverSub?.planId === "standard"
                    ? billingCycle === "annual" ? "KES 14,400 / year (KES 1,200/mo)" : "KES 1,500 / month"
                    : serverSub?.planId === "professional"
                    ? billingCycle === "annual" ? "KES 33,600 / year (KES 2,800/mo)" : "KES 3,500 / month"
                    : "KES 0 / month (Free)"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-300/80">Annual Savings:</span>
                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                  {billingCycle === "annual" ? "20% Discount Applied" : "Save 20% on Annual Plan"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenUpgradeModal("Standard")}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            id="billing-summary-upgrade-btn"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{serverSub?.planId === "standard" ? "Manage Standard Subscription" : "Start 14-Day Free Trial"}</span>
          </button>
        </div>

      </div>

      {/* SECTION: USAGE STATISTICS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6" id="billing-usage-statistics-card">
        <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Resource Usage Statistics & Quotas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current usage metrics monitored against your Community tier subscription limit.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold rounded-full self-start md:self-auto">
            Quota Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="w-4 h-4 text-emerald-400" />
                Active Campaigns
              </span>
              <span className="font-mono font-bold text-white">1 / 1</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
            </div>
            <span className="text-[10px] text-slate-500 block">Upgrade to Standard for Unlimited Campaigns</span>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-blue-400" />
                Contributors Logged
              </span>
              <span className="font-mono font-bold text-white">148 / Unlimited</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: "45%" }} />
            </div>
            <span className="text-[10px] text-slate-500 block">Unlimited on Standard & Pro</span>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                Document Vault Storage
              </span>
              <span className="font-mono font-bold text-white">1.2 / 5.0 GB</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: "24%" }} />
            </div>
            <span className="text-[10px] text-slate-500 block">PDF receipts, vouchers & media</span>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-amber-400" />
                AI & WhatsApp API Requests
              </span>
              <span className="font-mono font-bold text-white">4,250 / 10,000</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: "42.5%" }} />
            </div>
            <span className="text-[10px] text-slate-500 block">AI prompts & M-PESA callbacks</span>
          </div>

        </div>
      </div>

      {/* SECTION: BILLING HISTORY & INVOICES */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6" id="billing-history-section">
        <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Billing History & Tax Invoices
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Official PDF receipts and monthly statements generated for your Harambee organization.
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center space-y-3" id="billing-invoices-empty-state">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed" id="billing-empty-invoices-text">
            No invoices available yet. Your official invoices will appear here following your first subscription settlement.
          </p>
        </div>
      </div>

      {/* SECTION: PAYMENT METHOD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6" id="billing-payment-method-card">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            Payment Method & M-PESA Settlement
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure default M-PESA settlement line for automated STK Push subscription renewal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="font-black text-xs font-mono text-emerald-400">M-PESA</span>
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Safaricom Lipa Na M-PESA Express</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">Default</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Phone: <strong className="text-slate-200">{mpesaPhone}</strong>
              </p>
              <p className="text-[10px] text-slate-500">Automated STK Push prompts will be sent to this line.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOpenUpgradeModal("Standard")}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              id="billing-pay-mpesa-btn"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Activate Standard Plan via M-PESA</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Direct automated M-PESA STK Push checkout takes under 5 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: SUPPORT */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6" id="billing-support-card">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Need Help or Custom Billing Setup?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Have questions about non-profit discounts, custom church diocese volume licenses, or M-PESA Till setup?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-200">support@harambeeflow.org</span>
          </div>

          <button
            onClick={handleCopyEmail}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
            title="Copy support email address"
            id="billing-btn-copy-support-email"
          >
            {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SECTION: FOUNDER APPRECIATION */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/20 rounded-3xl relative overflow-hidden shadow-lg" id="billing-founder-appreciation-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
            <Heart className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase font-mono tracking-widest text-emerald-400">
              Community Appreciation
            </span>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl" id="billing-founder-appreciation-text">
              Thank you for supporting HarambeeFlow during its early growth. Your subscription helps us build better fundraising tools for churches, schools, charities, and community organizations across Africa.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="pt-2 pb-6 text-center border-t border-slate-800/60" id="billing-footer-note">
        <p className="text-xs text-slate-400 max-w-3xl mx-auto leading-relaxed">
          HarambeeFlow is designed to provide secure, transparent and accountable fundraising for churches, schools, charities, welfare groups and community organizations across Africa.
        </p>
      </div>

      {/* MODAL 1 — UPGRADE CONFIRMATION & AUTOMATIC ACTIVATION DIALOG */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="billing-upgrade-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            
            <button
              onClick={handleCloseUpgradeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              id="billing-upgrade-modal-close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STATE 1: PAYMENT CONFIRMED & SUBSCRIPTION ACTIVATED */}
            {pollingStatus === "confirmed" ? (
              <div className="space-y-6 text-center py-4 animate-scale-up" id="billing-upgrade-confirmed-view">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                  <CheckCircle2 className="w-9 h-9 text-slate-950 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    Server Verified
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    PAYMENT CONFIRMED!
                  </h2>
                  <p className="text-sm text-slate-300">
                    Your <strong className="text-emerald-400 font-bold">{selectedPlanForUpgrade} Plan</strong> is now active.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-2.5 text-xs text-left">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Active Tier:</span>
                    <span className="font-bold text-emerald-400 font-mono capitalize">{selectedPlanForUpgrade}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Subscription Status:</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Next Renewal Date:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {(confirmedSubData?.currentPeriodEnd || serverSub?.currentPeriodEnd)
                        ? new Date(confirmedSubData?.currentPeriodEnd || serverSub?.currentPeriodEnd!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Active Period"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseUpgradeModal}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  id="billing-upgrade-done-btn"
                >
                  <Check className="w-4 h-4" />
                  <span>View Updated Subscription</span>
                </button>
              </div>

            /* STATE 2: POLLING FOR M-PESA PAYMENT CONFIRMATION */
            ) : pollingStatus === "polling" ? (
              <div className="space-y-6 text-center py-2 animate-fade-in" id="billing-upgrade-polling-view">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto relative">
                  <Phone className="w-7 h-7 text-emerald-400 animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    M-PESA PROMPT SENT
                  </div>
                  <h2 className="text-xl font-black text-white">
                    Please Check Your Phone
                  </h2>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    An STK prompt was sent to <strong className="text-white font-mono">{mpesaPhone}</strong>. Please enter your M-PESA PIN on your mobile device to complete payment.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 text-xs text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Payment Status:</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-teal-400 font-mono text-[11px]">
                      <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                      Waiting for payment confirmation...
                    </span>
                  </div>
                  {stkResponse?.checkoutRequestId && (
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                      <span className="text-slate-400">Checkout Ref:</span>
                      <span className="font-mono text-slate-400 text-[10px]">{stkResponse.checkoutRequestId}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                    HarambeeFlow will automatically activate your subscription the moment Safaricom confirms your payment.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseUpgradeModal}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    id="billing-polling-close-btn"
                  >
                    Close (Processes in Background)
                  </button>
                  <button
                    onClick={fetchSubscriptionStatus}
                    disabled={isLoadingStatus}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                    id="billing-polling-refresh-btn"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? "animate-spin" : ""}`} />
                    <span>Check Status Now</span>
                  </button>
                </div>
              </div>

            /* STATE 3: TIMEOUT (STILL PROCESSING) */
            ) : pollingStatus === "timeout" ? (
              <div className="space-y-6 text-center py-2 animate-fade-in" id="billing-upgrade-timeout-view">
                <div className="w-16 h-16 rounded-3xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-950 text-amber-400 border border-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    Still Processing
                  </div>
                  <h2 className="text-xl font-black text-white">
                    M-PESA payment is still being processed.
                  </h2>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Safaricom is taking slightly longer than usual to return the payment confirmation.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-left space-y-2">
                  <p className="text-slate-300">
                    If you have already entered your PIN, your subscription will activate automatically as soon as Safaricom completes the callback.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    You can check your status anytime using the Refresh button in the Billing Summary panel.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseUpgradeModal}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    id="billing-timeout-close-btn"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      await fetchSubscriptionStatus();
                      if (serverSub?.planId === selectedPlanForUpgrade.toLowerCase()) {
                        setPollingStatus("confirmed");
                      }
                    }}
                    disabled={isLoadingStatus}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    id="billing-timeout-retry-btn"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? "animate-spin" : ""}`} />
                    <span>Check Status Now</span>
                  </button>
                </div>
              </div>

            /* STATE 4: INITIAL UPGRADE FORM */
            ) : (
              <>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    Confirm Plan Upgrade
                  </div>
                  <h2 className="text-xl font-black text-white">
                    Upgrade to {selectedPlanForUpgrade} Plan
                  </h2>
                  <p className="text-xs text-slate-400">
                    Confirm your request to upgrade your HarambeeFlow organization subscription.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Selected Plan:</span>
                    <span className="font-bold text-white font-mono">{selectedPlanForUpgrade}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Billing Cycle:</span>
                    <span className="font-bold text-emerald-400 font-mono capitalize">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Billing Amount:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {selectedPlanForUpgrade === "Community"
                        ? "KES 0 / month"
                        : selectedPlanForUpgrade === "Standard"
                        ? billingCycle === "monthly" ? "KES 1,500 / month" : "KES 14,400 / year"
                        : billingCycle === "monthly" ? "KES 3,500 / month" : "KES 33,600 / year"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Settlement Channel:</span>
                    <span className="font-bold text-slate-200">Safaricom M-PESA STK Push</span>
                  </div>
                </div>

                <form onSubmit={handleConfirmUpgrade} className="space-y-4">
                  {initiateError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-[11px] text-rose-300 flex items-start gap-2 animate-scale-up" id="billing-upgrade-error-banner">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-rose-200">Upgrade Error</strong>
                        <span>{initiateError}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Confirm M-PESA Registered Phone Number:
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        disabled={isInitiatingUpgrade}
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="0712345678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                        id="billing-modal-phone-input"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      You will receive an automated M-PESA PIN prompt on this phone line to confirm your subscription.
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Includes 14-day full free trial. You can cancel at any time with zero penalty.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isInitiatingUpgrade}
                      onClick={handleCloseUpgradeModal}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                      id="billing-modal-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isInitiatingUpgrade}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      id="billing-modal-submit-btn"
                    >
                      {isInitiatingUpgrade ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Sending M-PESA Prompt...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2 — EDIT ORGANIZATION INFORMATION DIALOG */}
      {showEditOrgModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="billing-edit-org-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowEditOrgModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              id="billing-edit-org-modal-close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Building2 className="w-3.5 h-3.5" />
                Edit Organization Profile
              </div>
              <h2 className="text-xl font-black text-white">
                Edit Organization Information
              </h2>
              <p className="text-xs text-slate-400">
                Update entity registration details, billing contact information, and tax status.
              </p>
            </div>

            <form onSubmit={handleSaveOrgInfo} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={tempOrgInfo.name}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    id="edit-org-input-name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Organization Type</label>
                  <select
                    value={tempOrgInfo.type}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                    id="edit-org-select-type"
                  >
                    <option value="Church">Church</option>
                    <option value="School">School</option>
                    <option value="Welfare Group">Welfare Group</option>
                    <option value="NGO">NGO</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Subscription Owner</label>
                  <input
                    type="text"
                    required
                    value={tempOrgInfo.owner}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, owner: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                    id="edit-org-input-owner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Billing Contact Email</label>
                  <input
                    type="email"
                    required
                    value={tempOrgInfo.email}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    id="edit-org-input-email"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Billing Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={tempOrgInfo.phone}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    id="edit-org-input-phone"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Country</label>
                  <input
                    type="text"
                    required
                    value={tempOrgInfo.country}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                    id="edit-org-input-country"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Currency</label>
                  <input
                    type="text"
                    required
                    value={tempOrgInfo.currency}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    id="edit-org-input-currency"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Time Zone</label>
                  <input
                    type="text"
                    required
                    value={tempOrgInfo.timeZone}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, timeZone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    id="edit-org-input-timezone"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-300 block">Tax Status</label>
                  <input
                    type="text"
                    required
                    value={tempOrgInfo.taxStatus}
                    onChange={(e) => setTempOrgInfo({ ...tempOrgInfo, taxStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                    id="edit-org-input-taxstatus"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400 block">Organization ID (System Auto-generated)</label>
                  <input
                    type="text"
                    disabled
                    value={tempOrgInfo.orgId}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-slate-400 font-mono cursor-not-allowed"
                    id="edit-org-input-orgid"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400 block">Date Registered</label>
                  <input
                    type="text"
                    disabled
                    value={tempOrgInfo.dateRegistered}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-slate-400 font-mono cursor-not-allowed"
                    id="edit-org-input-dateregistered"
                  />
                </div>

              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditOrgModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  id="edit-org-modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  id="edit-org-modal-save-btn"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
