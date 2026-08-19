import React, { useState } from "react";
import { 
  ArrowRight, Check, HelpCircle, MessageSquare, Phone, Mail, Shield, 
  CheckCircle2, Info, Landmark, Layers, Sparkles, Send, X, AlertTriangle,
  Menu, Home, CreditCard, LogIn, ChevronDown, ChevronUp, Clock, Cloud,
  Cpu, Globe, Users, Users2, Building2, Download, Key, ShieldCheck, CheckSquare,
  Award, RefreshCw, FileCheck, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TrustSecurityView from "./TrustSecurityView";
import { getRuntimeEnvironmentInfo, IS_SANDBOX } from "../utils/env";

interface LandingPageViewProps {
  onEnterApp: () => void;
  onEnterDemo?: () => void;
}

type MarketingTab = "home" | "how-it-works" | "pricing" | "trust" | "faq" | "contact";

export default function LandingPageView({ onEnterApp, onEnterDemo }: LandingPageViewProps) {
  const [activeTab, setActiveTab] = useState<MarketingTab>("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pricing Toggle & FAQ Accordion State
  const [pricingBillingCycle, setPricingBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openPricingFaq, setOpenPricingFaq] = useState<number | null>(null);

  // Contact Form Simulated State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // FAQ Active Item
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setContactSubmitted(false);
    }, 5000);
  };

  return (
    <div 
      className="bg-[#030712] min-h-screen w-full text-slate-100 font-sans relative overflow-x-hidden flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300" 
      id="landing-page-root"
    >
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-[#030712]/80 backdrop-blur-md border-b border-slate-900/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm" id="landing-header">
        {/* Left: HF Logo + HarambeeFlow + AI Treasurer */}
        <div 
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            HF
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm sm:text-base font-black text-white tracking-tight leading-none group-hover:text-emerald-300 transition-colors">
              HarambeeFlow
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 leading-tight mt-0.5">
              AI Treasurer
            </span>
          </div>
        </div>

        {/* Right: Menu / Hamburger Trigger */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 min-h-[38px] bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-200 transition flex items-center justify-center cursor-pointer active:scale-95 gap-1.5 px-3.5 text-xs font-bold touch-manipulation select-none"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="inline">Menu</span>
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Right-Side Slide-out Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-[82vw] max-w-xs sm:max-w-sm bg-[#030712] border-l border-slate-800/90 z-50 flex flex-col justify-between shadow-2xl p-5 overflow-y-auto"
              id="mobile-nav-drawer"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between mb-4">
                  <div 
                    onClick={() => { setActiveTab("home"); setIsDrawerOpen(false); }}
                    className="flex items-center gap-2.5 cursor-pointer group select-none"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-emerald-500/20 shrink-0">
                      HF
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-white tracking-tight leading-none group-hover:text-emerald-300 transition-colors">
                        HarambeeFlow
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 leading-tight mt-0.5">
                        AI Treasurer
                      </span>
                    </div>
                  </div>

                  {/* Close X Button */}
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition active:scale-95 cursor-pointer touch-manipulation"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-b border-slate-800/80 mb-4" />

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => { setActiveTab("home"); setIsDrawerOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === "home" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Home className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("how-it-works"); setIsDrawerOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === "how-it-works" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Features</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("pricing"); setIsDrawerOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === "pricing" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Pricing</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("trust"); setIsDrawerOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === "trust" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Security & Privacy</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("faq"); setIsDrawerOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === "faq" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Resources & FAQ</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("contact"); setIsDrawerOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === "contact" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Mail className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Contact</span>
                  </button>
                </nav>
              </div>

              {/* Actions & Footer Section */}
              <div className="pt-5 border-t border-slate-800/80 mt-auto flex flex-col gap-2.5">
                {/* Primary Action: Start Fundraising */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onEnterApp();
                  }}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] touch-manipulation select-none"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950 shrink-0" />
                  <span>Start Fundraising</span>
                </button>

                {/* Secondary Action: Sign In */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onEnterApp();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] touch-manipulation select-none"
                >
                  <LogIn className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sign In</span>
                </button>

                {/* Footer Info */}
                <div className="mt-2 text-center flex flex-col gap-0.5 text-[10px] text-slate-500 font-mono">
                  <span>HarambeeFlow v2.4 • Non-Custodial</span>
                  <span>© 2026 HarambeeFlow</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Marketing Content Container */}
      <div className="flex-1 w-full flex flex-col justify-start relative">
        
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <main className="flex-1 flex flex-col items-center justify-center px-4 pt-6 sm:pt-8 md:pt-10 pb-0 text-center z-20 relative max-w-5xl mx-auto w-full" id="home-view">
            <div className="flex flex-col items-center max-w-4xl py-0">
              
              {/* Badge: Kenya's Trusted Fundraising Platform */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] sm:text-xs font-semibold text-slate-300 tracking-wide shadow-lg flex items-center gap-2 mb-5"
              >
                <span>🇰🇪 Kenya's Trusted Fundraising Platform</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] sm:leading-[1.08] text-white mb-5"
              >
                Never Track M-PESA Contributions <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                  Manually Again
                </span>
              </motion.h1>

              {/* Supporting text */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-slate-300 text-xs sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed mb-6"
              >
                Automatically record every M-PESA contribution, update your fundraiser instantly, and keep supporters informed on WhatsApp in real time.
              </motion.p>

              {/* Supported Organizations */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col items-center gap-2 sm:gap-2.5 w-full mb-6"
              >
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Supported organizations
                </span>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {["Churches", "Schools", "Chamas", "NGOs", "Medical Appeals", "Funeral Committees"].map((sector) => (
                    <span 
                      key={sector} 
                      className="px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/60 text-xs font-medium text-slate-300 shadow-xs"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Primary CTA & Secondary Link */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                className="flex flex-col items-center w-full sm:w-auto mb-0 relative z-30"
              >
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] border border-emerald-300/20 hover:border-emerald-200/30 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer group min-h-[48px] mb-3 touch-manipulation select-none relative z-30"
                  id="btn-start-fundraising-primary"
                >
                  Start Fundraising →
                </button>

                <button 
                  type="button"
                  onClick={() => setActiveTab("trust")}
                  className="text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 transition underline cursor-pointer touch-manipulation"
                >
                  Learn how HarambeeFlow remains completely non-custodial
                </button>
              </motion.div>

            </div>
          </main>
        )}

        {/* TAB 2: HOW IT WORKS */}
        {activeTab === "how-it-works" && (
          <section className="max-w-5xl mx-auto px-6 py-12 space-y-12 z-20 relative w-full" id="how-it-works-view">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Operational Blueprint</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">How HarambeeFlow Automates Fundraising</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">From transaction to thank-you, experience complete financial organization in 4 simple steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Launch Campaign", desc: "Create your custom, secure campaign dashboard in under 60 seconds with specific goals, custom styling, and target milestones." },
                { step: "02", title: "Link Paybill or Till", desc: "Connect your existing Safaricom merchant Till or Paybill. We do NOT touch your cash; we simply listen for read-only informational alerts." },
                { step: "03", title: "AI-Powered Parsing", desc: "Our engine automatically reads M-PESA confirmations, records contribution receipts, matches supporter logs, and reconciles pending promises." },
                { step: "04", title: "Instant WhatsApp Receipt", desc: "HarambeeFlow triggers automated, polite thank-you summaries straight to the contributor's phone, improving relationship trust." }
              ].map((s, idx) => (
                <div key={idx} className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl relative space-y-3">
                  <span className="text-4xl font-mono font-black text-emerald-500/10 absolute top-4 right-4">{s.step}</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-max font-bold text-xs font-mono">Step {s.step}</div>
                  <h3 className="text-sm font-black text-white">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Is my organizational money safe?
                </h4>
                <p className="text-xs text-slate-400">Absolutely. We NEVER hold or manage any cash. All donations continue going straight to Safaricom.</p>
              </div>
              <button
                onClick={() => setActiveTab("trust")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
              >
                Read Trust & Security Page
              </button>
            </div>
          </section>
        )}

        {/* TAB 3: PRICING */}
        {activeTab === "pricing" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 z-20 relative w-full" id="public-pricing-view">
            
            {/* Header Title */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-widest">
                  Kenya&apos;s AI Treasurer
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Simple, Transparent Pricing for Kenya
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Empower your church, school, chama, or NGO with Kenya&apos;s AI Treasurer. Choose a plan that fits your fundraising scale.
              </p>
            </div>

            {/* Segmented Billing Selector Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-md shadow-xl max-w-4xl mx-auto">
              <div>
                <span className="text-xs font-bold text-white block">Select Billing Frequency</span>
                <p className="text-[11px] text-slate-400">Save 20% on annual subscriptions for churches, schools, and non-profits.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto shadow-inner relative" id="marketing-billing-toggle-container">
                <button
                  onClick={() => setPricingBillingCycle("monthly")}
                  className={`relative z-10 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                    pricingBillingCycle === "monthly" 
                      ? "bg-emerald-500 text-slate-950 shadow-md font-black" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="marketing-toggle-monthly-btn"
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPricingBillingCycle("annual")}
                  className={`relative z-10 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    pricingBillingCycle === "annual" 
                      ? "bg-emerald-500 text-slate-950 shadow-md font-black" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  id="marketing-toggle-annual-btn"
                >
                  <span>Annual (Save 20%)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-tight transition-colors ${
                    pricingBillingCycle === "annual" 
                      ? "bg-slate-950 text-emerald-400" 
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    20% OFF
                  </span>
                </button>
              </div>
            </div>

            {/* PRICING CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
              
              {/* COMMUNITY CARD */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition shadow-xl" id="public-plan-community">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                      FREE
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
                      {pricingBillingCycle === "monthly" ? "KES 0" : "KES 0"}
                      <span className="text-xs text-slate-400 font-normal"> / {pricingBillingCycle === "monthly" ? "month" : "year"}</span>
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
                    onClick={onEnterApp}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer text-center active:scale-98"
                    id="public-btn-start-free"
                  >
                    Start Free
                  </button>
                  <p className="text-[10px] text-slate-500 text-center font-medium">No credit card required.</p>
                </div>
              </div>

              {/* STANDARD CARD (MOST POPULAR) */}
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10 md:-translate-y-2" id="public-plan-standard">
                
                {/* Most Popular Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-lg font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>MOST POPULAR</span>
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
                      {pricingBillingCycle === "monthly" ? "KES 1,500" : "KES 14,400"}
                      <span className="text-xs text-slate-400 font-normal"> / {pricingBillingCycle === "monthly" ? "month" : "year"}</span>
                    </div>
                    
                    <div className="space-y-0.5">
                      {pricingBillingCycle === "annual" ? (
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
                    onClick={onEnterApp}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    id="public-btn-start-trial-standard"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Start 14-Day Free Trial</span>
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
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition shadow-xl" id="public-plan-professional">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50 uppercase tracking-wider">
                      ENTERPRISE & NGOS
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
                      {pricingBillingCycle === "monthly" ? "KES 3,500" : "KES 33,600"}
                      <span className="text-xs text-slate-400 font-normal"> / {pricingBillingCycle === "monthly" ? "month" : "year"}</span>
                    </div>
                    
                    <div className="space-y-0.5">
                      {pricingBillingCycle === "annual" ? (
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
                    onClick={() => setActiveTab("contact")}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer text-center active:scale-98"
                    id="public-btn-contact-professional"
                  >
                    Contact Sales
                  </button>
                  <p className="text-[10px] text-slate-500 text-center font-medium">Custom volume billing & dedicated setup.</p>
                </div>
              </div>

            </div>

            {/* VALUE SECTION */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="public-value-section">
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
                {[
                  { title: "No Setup Fees", desc: "Get started immediately with zero onboarding fees or surprise charges.", icon: CheckSquare },
                  { title: "Cancel Anytime", desc: "Full flexibility with month-to-month subscriptions and no lock-in contracts.", icon: Clock },
                  { title: "Secure Cloud Backups", desc: "Automatic real-time backups protecting all treasurer records and donor ledgers.", icon: Cloud },
                  { title: "AI Treasurer Automation", desc: "Instant M-PESA STK reconciliation and automated WhatsApp receipts.", icon: Cpu },
                  { title: "Built Specifically for Kenya", desc: "Custom-tailored for churches, schools, chamas, and community Harambees.", icon: Globe },
                  { title: "Dedicated Customer Support", desc: "Local phone, email, and WhatsApp support from our Kenya-based team.", icon: HelpCircle }
                ].map((vp, idx) => {
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="public-roi-section">
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
                {[
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
                ].map((item, idx) => {
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="public-trust-section">
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
                {[
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
                ].map((card, idx) => {
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
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="public-guarantee-section">
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
                {[
                  { title: "No setup fees", desc: "Start in 60 seconds with zero onboarding cost.", icon: CheckCircle2 },
                  { title: "Cancel anytime", desc: "Pause or cancel with 1-click whenever needed.", icon: Clock },
                  { title: "Your data always belongs to you", desc: "You maintain 100% ownership of your member records.", icon: Key },
                  { title: "Export your data whenever you wish", desc: "Download raw CSVs, Excel files, and PDF statements anytime.", icon: Download },
                  { title: "Secure encrypted cloud storage", desc: "Bank-grade SSL encryption with Firebase security rules.", icon: ShieldCheck }
                ].map((g, idx) => {
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" id="public-faq-section">
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
                {[
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
                ].map((faq, idx) => {
                  const isOpen = openPricingFaq === idx;
                  return (
                    <div 
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden transition"
                    >
                      <button
                        onClick={() => setOpenPricingFaq(isOpen ? null : idx)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white hover:text-emerald-400 transition cursor-pointer"
                        id={`public-pricing-faq-btn-${idx}`}
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

            {/* Bottom Call to Action */}
            <div className="p-8 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl text-center space-y-4 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Ready to Transform Your Organization&apos;s Financial Transparency?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Join churches, schools, NGOs, and chamas across Kenya automating their M-PESA reconciliation and treasurer workflows today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={onEnterApp}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  id="public-pricing-cta-btn"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Start 14-Day Free Trial</span>
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  Talk to Sales
                </button>
              </div>
            </div>

          </section>
        )}

        {/* TAB 4: TRUST & SECURITY */}
        {activeTab === "trust" && (
          <TrustSecurityView 
            onStartFundraising={onEnterApp} 
            onNavigateToHowItWorks={() => setActiveTab("how-it-works")} 
          />
        )}

        {/* TAB 5: FAQ */}
        {activeTab === "faq" && (
          <section className="max-w-3xl mx-auto px-6 py-12 space-y-10 z-20 relative w-full" id="faq-view">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Help Center</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions</h2>
              <p className="text-sm text-slate-400">Find quick responses to typical questions about our setup and services.</p>
            </div>

            <div className="space-y-4">
              {[
                { q: "Is HarambeeFlow licensed by Safaricom?", a: "HarambeeFlow is an independent software tool that integrates with the standard public M-PESA Daraja APIs and SMS notification gateways. All transactions flow strictly within Safaricom's regulated ecosystem." },
                { q: "How much does it cost?", a: "We offer a Free Starter package for small community fundraisers. For larger teams, schools, or churches with advanced WhatsApp receipt requirements, our Professional plan is KES 1,000/month." },
                { q: "Can we use a Paybill or Till?", a: "Yes, our system is fully compatible with both merchant Till numbers (Lipa na M-PESA) and organizational Paybills." },
                { q: "Do contributors receive confirmations?", a: "Yes, you can enable automatic WhatsApp thank-you receipts. Once a payment is detected, HarambeeFlow parses the contact, looks up active pledge lists, and dispatches a friendly WhatsApp receipt message." },
                { q: "Can we track manual cash contributions?", a: "Yes, treasurers can easily log physical cash or direct bank transfers manually into the workspace dashboard so the total campaign progress stays perfectly accurate." },
                { q: "How do we disconnect our account?", a: "You can stop syncs or remove API credentials instantly inside the Settings tab. All database hooks are completely deleted from the cloud instantly." }
              ].map((faq, index) => (
                <div key={index} className="border border-slate-850 rounded-xl bg-slate-900/20 overflow-hidden">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full text-left p-5 flex items-center justify-between text-sm font-bold text-white hover:bg-slate-900/40 focus:outline-none transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-emerald-400 font-mono text-xs">
                      {activeFaq === index ? "▲" : "▼"}
                    </span>
                  </button>
                  {activeFaq === index && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed bg-slate-950/20 animate-scale-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 6: CONTACT */}
        {activeTab === "contact" && (
          <section className="max-w-4xl mx-auto px-6 py-12 space-y-12 z-20 relative w-full" id="contact-view">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Get In Touch</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">We are Here to Help</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">Have questions about committee integration or Till setup? Reach out to our technical desk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Details */}
              <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-6">
                <h3 className="text-sm font-black text-white">Direct Contacts</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span>info@harambeeflow.org</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>+254 722 530 411</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span>South C, Nairobi, Kenya</span>
                  </div>
                </div>
              </div>

              {/* Right Message Form */}
              <div className="md:col-span-2 p-6 bg-slate-900/60 border border-slate-850 rounded-2xl">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Richard Mayore"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Your Email</label>
                      <input 
                        type="email" 
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. info@harambeeflow.org"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Message Detail</label>
                    <textarea 
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your Till / Paybill requirements or question..."
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {contactSubmitted ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 text-xs font-bold rounded-xl text-center animate-scale-up">
                      ✓ Message Sent! Our support team will get back to you at {contactEmail} within 2 hours.
                    </div>
                  ) : (
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      Send Message
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>

            </div>
          </section>
        )}

      </div>

      {/* Minimal SaaS Footer */}
      <footer className="w-full pt-3 pb-5 px-4 sm:px-6 mt-4 sm:mt-5 shrink-0 z-10" id="marketing-footer">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-1.5 text-center">
          
          {/* Row 1: Copyright */}
          <span className="text-xs sm:text-sm font-medium text-slate-500">
            © 2026 HarambeeFlow
          </span>

          {/* Row 2: Links */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-slate-300">
            <button 
              onClick={() => setActiveTab("how-it-works")} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Platform
            </button>
            <span className="text-slate-700/80 text-[10px] select-none">•</span>
            <button 
              onClick={() => setActiveTab("pricing")} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <span className="text-slate-700/80 text-[10px] select-none">•</span>
            <button 
              onClick={() => setActiveTab("faq")} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Resources
            </button>
            <span className="text-slate-700/80 text-[10px] select-none">•</span>
            <button 
              onClick={() => setActiveTab("trust")} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <span className="text-slate-700/80 text-[10px] select-none">•</span>
            <button 
              onClick={() => setActiveTab("trust")} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-slate-700/80 text-[10px] select-none">•</span>
            <button 
              onClick={() => setActiveTab("contact")} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}
