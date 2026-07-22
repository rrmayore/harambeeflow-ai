import React, { useState } from "react";
import { 
  CreditCard, Check, Sparkles, Zap, ShieldCheck, ArrowRight, Download, 
  HelpCircle, Clock, AlertCircle, Phone, Mail, Lock, CheckCircle2, Copy, 
  BarChart3, HardDrive, Cpu, Users, Target, X, ExternalLink, RefreshCw,
  FileText, Heart, Layers, MessageSquare, FileSpreadsheet, Building2,
  Edit3, Globe, Shield, Database, Cloud, Award, CheckCircle, Tag, User, LockKeyhole
} from "lucide-react";

interface BillingSubscriptionViewProps {
  onBackToSettings?: () => void;
  currentUser?: any;
  activeProject?: any;
}

export default function BillingSubscriptionView({ 
  onBackToSettings, 
  currentUser,
  activeProject 
}: BillingSubscriptionViewProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<string>("Professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [mpesaPhone, setMpesaPhone] = useState(currentUser?.phoneNumber || "0712345678");
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Organization Information local state
  const [orgInfo, setOrgInfo] = useState({
    name: activeProject?.organizationName || "Nairobi Medical & Welfare Fund",
    type: "Welfare Group", // Church, School, Welfare Group, NGO, Business
    owner: currentUser?.displayName || currentUser?.email || "Rev. Joseph Mwangi",
    email: currentUser?.email || "billing@nairobiwelfare.org",
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

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@harambeeflow.org");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleOpenUpgradeModal = (planName: string = "Professional") => {
    setSelectedPlanForUpgrade(planName);
    setShowUpgradeModal(true);
    setUpgradeSubmitted(false);
  };

  const handleConfirmUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeSubmitted(true);
    setFeedbackMsg(`Upgrade request for ${selectedPlanForUpgrade} Plan (${billingCycle}) submitted! M-PESA confirmation will be sent to ${mpesaPhone} when automated billing activates.`);
    setTimeout(() => {
      setShowUpgradeModal(false);
      setUpgradeSubmitted(false);
    }, 2500);
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

  // Feature matrix rows for Compare Plans
  const featureMatrix = [
    {
      feature: "Active Campaigns",
      icon: Target,
      community: "Up to 3",
      professional: "Unlimited",
      enterprise: "Unlimited"
    },
    {
      feature: "Contributors & Pledges",
      icon: Users,
      community: "Up to 250",
      professional: "Unlimited",
      enterprise: "Unlimited"
    },
    {
      feature: "AI Assistant & Agent",
      icon: Sparkles,
      community: "Basic Campaign Generator",
      professional: "Full HarambeeFlow AI Agent",
      enterprise: "Custom Dedicated Models"
    },
    {
      feature: "WhatsApp Notifications",
      icon: MessageSquare,
      community: "Shareable Campaign Links",
      professional: "Automated Group Broadcasts",
      enterprise: "Custom WhatsApp Business API"
    },
    {
      feature: "Reports & Certificates",
      icon: FileSpreadsheet,
      community: "Printable PDF Receipts",
      professional: "Executive Ledger & PDF Vault",
      enterprise: "Custom Audits & Automated Exports"
    },
    {
      feature: "Multi-Organization Support",
      icon: Building2,
      community: "1 Organization",
      professional: "Multi-User Roles & Audit Trail",
      enterprise: "Multi-Tenant Enterprise Dashboard"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 text-slate-100 min-h-full space-y-8" id="billing-subscription-container">
      
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300 shadow-xl animate-scale-up sticky top-2 z-40">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase tracking-widest">
              Settings & Account
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1" id="billing-page-header-title">
            Billing & Subscription
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your organization profile, subscription tier, resource quotas, invoices, and M-PESA payment options.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={() => handleOpenUpgradeModal("Professional")}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition cursor-pointer active:scale-95"
            id="billing-upgrade-pro-top-btn"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Upgrade to Professional
          </button>
        </div>
      </div>

      {/* Informational Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300 shadow-md" id="billing-mpesa-info-banner">
        <span className="text-base shrink-0">🚀</span>
        <span className="font-semibold">Live M-PESA subscription payments are coming soon.</span>
      </div>

      {/* SECTION: ORGANIZATION INFORMATION & BILLING SUMMARY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="billing-org-and-summary-grid">
        
        {/* REQUIREMENT 1, 2, 3: Organization Information Card */}
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
              <span>Edit Organization Information</span>
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

        {/* REQUIREMENT 4: Billing Summary Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between" id="billing-summary-panel">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-black text-white">Billing Summary</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                Live Overview
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Current Plan:</span>
                <span className="font-black text-emerald-400 font-mono">Community Edition</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Subscription Status:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                  Active
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="font-bold text-white font-mono capitalize">{billingCycle}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Next Renewal Date:</span>
                <span className="font-mono text-slate-200 font-semibold">Aug 31, 2026</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Current Monthly Cost:</span>
                <span className="font-mono font-bold text-emerald-400">KES 0 / month</span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-300/80">Annual Savings:</span>
                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                  {billingCycle === "annual" ? "Save 20% (KES 1,200/yr)" : "20% off on Annual switch"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenUpgradeModal("Professional")}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            id="billing-summary-upgrade-btn"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Upgrade Subscription</span>
          </button>
        </div>

      </div>

      {/* SECTION: CURRENT PLAN */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl" id="billing-current-plan-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                Community Edition
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                Active Status
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                Grassroots Plan
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              HarambeeFlow Community Edition
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are currently using the Community Edition with access to HarambeeFlow AI Ecosystem features, Safaricom Daraja M-PESA STK Push callbacks, WhatsApp automations, and executive PDF reporting for community fundraising.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Renewal Date: <strong className="text-slate-200 font-mono">Aug 31, 2026</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CBK Fintech & Data Protection Compliant</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shrink-0 md:w-72">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Current Cost</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                KES 0<span className="text-xs text-slate-400 font-normal"> / month</span>
              </div>
              <p className="text-[11px] text-slate-400">Community Edition for grassroots campaigns</p>
            </div>

            <button
              onClick={() => handleOpenUpgradeModal("Professional")}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              id="billing-upgrade-pro-card-btn"
            >
              <span>Upgrade to Professional</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: AVAILABLE PLANS */}
      <div className="space-y-6" id="billing-plans-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Available Subscription Plans
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose a plan tailored for your church Harambee, medical emergency, welfare group, or organizational foundation.
            </p>
          </div>

          {/* Monthly / Annual Toggle with "Save 20%" */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto" id="billing-cycle-toggle-container">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingCycle === "monthly" 
                  ? "bg-emerald-500 text-slate-950 shadow-md" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="billing-cycle-monthly-btn"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                billingCycle === "annual" 
                  ? "bg-emerald-500 text-slate-950 shadow-md" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="billing-cycle-annual-btn"
            >
              <span>Annual</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-tight ${
                billingCycle === "annual" 
                  ? "bg-slate-950 text-emerald-400" 
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COMMUNITY PLAN */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition" id="billing-plan-community">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 uppercase">
                  Grassroots & Individuals
                </span>
                <h3 className="text-xl font-black text-white mt-2">Community</h3>
                <p className="text-xs text-slate-400">Ideal for small family Harambees and urgent medical emergency appeals.</p>
              </div>

              <div className="py-2 border-y border-slate-800/80">
                <div className="text-2xl font-black text-white font-mono">
                  {billingCycle === "monthly" ? "KES 500" : "KES 400"}{" "}
                  <span className="text-xs text-slate-400 font-normal">/ month</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {billingCycle === "monthly" ? "Billed monthly via M-PESA" : "Billed annually (KES 4,800/yr)"}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Up to <strong>3 Active Campaigns</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Up to 250 Contributors</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Basic M-PESA STK Push logging</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Printable PDF Receipts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>WhatsApp shareable campaign links</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Standard Email Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOpenUpgradeModal("Community")}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              id="billing-btn-select-community"
            >
              Select Community
            </button>
          </div>

          {/* PROFESSIONAL PLAN */}
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10 scale-102" id="billing-plan-professional">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-md font-mono">
              ⭐ RECOMMENDED
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40 uppercase">
                  Churches & Institutions
                </span>
                <h3 className="text-xl font-black text-white mt-2 flex items-center justify-between">
                  <span>Professional</span>
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-300">Complete suite for active church committees, wedding boards & welfare funds.</p>
              </div>

              <div className="py-2 border-y border-slate-800/80">
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {billingCycle === "monthly" ? "KES 2,000" : "KES 1,600"}{" "}
                  <span className="text-xs text-slate-400 font-normal">/ month</span>
                </div>
                <span className="text-[10px] text-emerald-300/80 font-medium">
                  {billingCycle === "monthly" ? "Billed monthly via M-PESA Express" : "Billed annually (KES 19,200/yr)"}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-start gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Active Campaigns</strong></span>
                </li>
                <li className="flex items-start gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Contributors & Pledges</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time M-PESA Daraja Callbacks & Till Sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>HarambeeFlow AI Agent & Autopilot</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Automated WhatsApp Group Broadcasts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Executive Ledger & PDF Certificate Vault</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Multi-User Committee Roles & Audit Trail</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Priority 24/7 Dedicated Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOpenUpgradeModal("Professional")}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              id="billing-btn-upgrade-professional"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to Professional</span>
            </button>
          </div>

          {/* ENTERPRISE PLAN */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition" id="billing-plan-enterprise">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/40 uppercase">
                  Foundations & NGOs
                </span>
                <h3 className="text-xl font-black text-white mt-2">Enterprise</h3>
                <p className="text-xs text-slate-400">For national welfare foundations, multi-diocese churches & corporate CSRs.</p>
              </div>

              <div className="py-2 border-y border-slate-800/80">
                <div className="text-2xl font-black text-white font-mono">
                  Contact Sales
                </div>
                <span className="text-[10px] text-slate-500">Custom volume billing & annual SLAs</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Dedicated M-PESA Paybill / Till Numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Custom CBK Fintech & Audit Compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Dedicated Account Manager & Onboarding</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>On-premises data export & API Webhooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Multi-Tenant Organization Dashboard</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOpenUpgradeModal("Enterprise")}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              id="billing-btn-contact-enterprise"
            >
              Contact Sales
            </button>
          </div>

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
            Detailed breakdown of features across Community, Professional, and Enterprise plans.
          </p>
        </div>

        <div className="overflow-x-auto" id="billing-feature-matrix-table-container">
          <table className="w-full text-left text-xs border-collapse" id="billing-feature-matrix-table">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="py-3 px-4 rounded-l-xl w-1/3">Feature</th>
                <th className="py-3 px-4 text-center">Community</th>
                <th className="py-3 px-4 text-center bg-emerald-950/30 text-emerald-400 border-x border-emerald-500/20">
                  Professional ⭐
                </th>
                <th className="py-3 px-4 text-center rounded-r-xl">Enterprise</th>
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
                      {item.professional}
                    </td>
                    <td className="py-3.5 px-4 text-center text-indigo-300 font-medium">
                      {item.enterprise}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              Current usage metrics monitored against your Community Edition subscription tier.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold rounded-full self-start md:self-auto">
            65% Remaining Quota
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Active Campaigns */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="w-4 h-4 text-emerald-400" />
                Active Campaigns
              </span>
              <span className="font-mono font-bold text-white">2 / 3</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "66.6%" }} />
            </div>
            <span className="text-[10px] text-slate-500 block">66.6% of campaign slot limit</span>
          </div>

          {/* Contributors Logged */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-blue-400" />
                Contributors Logged
              </span>
              <span className="font-mono font-bold text-white">148 / 250</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: "59.2%" }} />
            </div>
            <span className="text-[10px] text-slate-500 block">59.2% of supporter profile limit</span>
          </div>

          {/* Storage Usage */}
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

          {/* API & Automation Requests */}
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
            <span className="text-[10px] text-slate-500 block">Gemini prompts & M-PESA STK callbacks</span>
          </div>

        </div>
      </div>

      {/* SECTION: PROFESSIONAL SECURITY & TRUST / COMPLIANCE GRID (REQUIREMENTS 5 & 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="billing-security-trust-grid">
        
        {/* REQUIREMENT 5: Professional Security Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl" id="billing-security-section">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black text-white">Professional Security</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              Enterprise Grade
            </span>
          </div>

          <ul className="space-y-3 text-xs text-slate-200">
            <li className="flex items-center gap-3 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-200">SSL Protected</span>
            </li>

            <li className="flex items-center gap-3 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-200">Secure Firebase Authentication</span>
            </li>

            <li className="flex items-center gap-3 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-200">Encrypted Payment Processing</span>
            </li>

            <li className="flex items-center gap-3 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-200">GDPR & Privacy Ready</span>
            </li>

            <li className="flex items-center gap-3 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-200">Audit Logging Enabled</span>
            </li>
          </ul>
        </div>

        {/* REQUIREMENT 6: Trust & Compliance Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl" id="billing-trust-section">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-black text-white">Trust & Compliance</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/40">
              Verified Stack
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Safaricom Daraja Ready</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-amber-500/30 rounded-2xl text-xs font-bold text-amber-300 shadow-sm">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Firebase Hosted</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-blue-500/30 rounded-2xl text-xs font-bold text-blue-300 shadow-sm">
              <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Secure Cloud Infrastructure</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-indigo-500/30 rounded-2xl text-xs font-bold text-indigo-300 shadow-sm">
              <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Automatic Backups</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-teal-500/30 rounded-2xl text-xs font-bold text-teal-300 shadow-sm">
              <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
              <span>AI Powered</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Bank-Grade Infrastructure:</span>
            <p className="leading-relaxed">
              All transaction records are dual-validated through Safaricom API webhooks and cryptographically signed audit ledger logs.
            </p>
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

        {/* Empty state */}
        <div className="p-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center space-y-3" id="billing-invoices-empty-state">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed" id="billing-empty-invoices-text">
            No invoices available yet. Your invoices will appear after your first successful subscription payment.
          </p>
        </div>
      </div>

      {/* SECTION: PAYMENT METHOD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6" id="billing-payment-method-card">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            Payment Method
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure default M-PESA settlement account for automated STK Push subscription billing.
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
            <div className="relative">
              <button
                disabled
                className="w-full py-3 px-4 bg-slate-800/50 text-slate-500 font-bold text-xs rounded-xl border border-slate-800/80 cursor-not-allowed flex items-center justify-center gap-2"
                id="billing-pay-mpesa-btn-disabled"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Pay with M-PESA</span>
                <span className="px-2 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-800/50 text-[10px] font-mono font-bold rounded-full ml-1">
                  Coming Soon
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Direct automated M-PESA subscription checkout will activate following standard Safaricom Daraja merchant clearance.
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

      {/* REQUIREMENT 7: FOOTER NOTE */}
      <div className="pt-2 pb-6 text-center border-t border-slate-800/60" id="billing-footer-note">
        <p className="text-xs text-slate-400 max-w-3xl mx-auto leading-relaxed">
          HarambeeFlow is designed to provide secure, transparent and accountable fundraising for churches, schools, charities, welfare groups and community organizations across Africa.
        </p>
      </div>

      {/* MODAL 1 — UPGRADE CONFIRMATION DIALOG */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="billing-upgrade-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              id="billing-upgrade-modal-close"
            >
              <X className="w-5 h-5" />
            </button>

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
                    ? billingCycle === "monthly" ? "KES 500 / month" : "KES 400 / month (KES 4,800/yr)"
                    : selectedPlanForUpgrade === "Enterprise"
                    ? "Custom Quote"
                    : billingCycle === "monthly" ? "KES 2,000 / month" : "KES 1,600 / month (KES 19,200/yr)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Settlement Channel:</span>
                <span className="font-bold text-slate-200">Safaricom M-PESA STK Push</span>
              </div>
            </div>

            <form onSubmit={handleConfirmUpgrade} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Confirm M-PESA Registered Phone Number:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    id="billing-modal-phone-input"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  You will receive an automated M-PESA PIN prompt on this phone line once subscription billing goes live.
                </span>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  No immediate charge will be made today. Submitting registers your priority spot for automated M-PESA billing.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  id="billing-modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  id="billing-modal-submit-btn"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Request</span>
                </button>
              </div>
            </form>

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
                
                {/* Organization Name */}
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

                {/* Organization Type */}
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

                {/* Subscription Owner */}
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

                {/* Billing Contact Email */}
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

                {/* Billing Contact Phone */}
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

                {/* Country */}
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

                {/* Currency */}
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

                {/* Time Zone */}
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

                {/* Tax Status */}
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

                {/* Readonly Organization ID */}
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

                {/* Readonly Date Registered */}
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
