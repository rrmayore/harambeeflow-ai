import React, { useState } from "react";
import { 
  ArrowRight, Check, HelpCircle, MessageSquare, Phone, Mail, Shield, 
  CheckCircle2, Info, Landmark, Layers, Sparkles, Send, X, AlertTriangle,
  Menu, Home, CreditCard, LogIn
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
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 min-h-[38px] bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-200 transition flex items-center justify-center cursor-pointer active:scale-95 gap-1.5 px-3.5 text-xs font-bold"
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
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
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
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onEnterApp();
                  }}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950 shrink-0" />
                  <span>Start Fundraising</span>
                </button>

                {/* Secondary Action: Sign In */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onEnterApp();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
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
                className="flex flex-col items-center w-full sm:w-auto mb-0"
              >
                <button
                  onClick={onEnterApp}
                  className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] border border-emerald-300/20 hover:border-emerald-200/30 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer group min-h-[48px] mb-3"
                  id="btn-start-fundraising-primary"
                >
                  Start Fundraising →
                </button>

                <button 
                  onClick={() => setActiveTab("trust")}
                  className="text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
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
          <section className="max-w-5xl mx-auto px-6 py-12 space-y-10 z-20 relative w-full" id="pricing-view">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Simple Packages</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Transparent, Budget-Friendly Plans</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">No setup fees. No long commitments. Cancel or switch at any time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              
              {/* Plan 1: Starter */}
              <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Starter</span>
                    <h3 className="text-lg font-black text-white">Starter</h3>
                    <p className="text-xs text-slate-400">Perfect for first-time fundraisers and small community projects.</p>
                  </div>
                  <div className="py-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">FREE FOREVER</span>
                  </div>
                  <div className="border-t border-slate-850 pt-4 space-y-2.5">
                    {[
                      "Up to KES 100,000 raised",
                      "1 Campaign",
                      "1 Treasurer",
                      "Manual Contributions",
                      "Basic Dashboard",
                      "Basic Reports",
                      "Community Support"
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={onEnterApp} className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer">
                  Launch Free Fundraiser
                </button>
              </div>

              {/* Plan 2: Professional */}
              <div className="p-6 bg-slate-900/90 border-2 border-emerald-500 rounded-2xl flex flex-col justify-between space-y-6 relative">
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider font-mono flex items-center gap-1">
                  ⭐ MOST POPULAR
                </span>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Professional</span>
                    <h3 className="text-lg font-black text-white">Professional</h3>
                    <p className="text-xs text-slate-300">Ideal for churches, schools, chamas and welfare groups.</p>
                  </div>
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">KES 1,000</span>
                      <span className="text-xs text-slate-400 font-bold"> / month</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">Approximately KES 33/day</p>
                  </div>
                  <div className="border-t border-slate-800 pt-4 space-y-2.5">
                    {[
                      "Unlimited Campaigns",
                      "Unlimited Contributions",
                      "Multiple Treasurers",
                      "Automatic M-PESA Parsing",
                      "AI Treasurer Assistant",
                      "Instant WhatsApp Receipts",
                      "Excel & PDF Reports",
                      "Priority Email Support"
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={onEnterApp} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer">
                  Upgrade to Professional
                </button>
              </div>

              {/* Plan 3: Enterprise */}
              <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Enterprise</span>
                    <h3 className="text-lg font-black text-white">Enterprise</h3>
                    <p className="text-xs text-slate-400">Built for large churches, NGOs and multi-committee organizations.</p>
                  </div>
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">KES 2,000</span>
                      <span className="text-xs text-slate-400 font-bold"> / month</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">Approximately KES 67/day</p>
                  </div>
                  <div className="border-t border-slate-850 pt-4 space-y-2.5">
                    {[
                      "Everything in Professional",
                      "Unlimited Organizations",
                      "Multi-Branch Management",
                      "Committee Roles & Permissions",
                      "Advanced Analytics",
                      "Custom Branding",
                      "API Integrations",
                      "Priority Support",
                      "Dedicated Onboarding"
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setActiveTab("contact")} className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer">
                  Contact Sales
                </button>
              </div>

            </div>

            {/* Conversion Statements */}
            <div className="text-center space-y-1.5 pt-4">
              <p className="text-sm font-semibold text-slate-200 max-w-2xl mx-auto">
                Affordable pricing designed for churches, schools, NGOs and community organizations across Kenya.
              </p>
              <p className="text-xs text-slate-400">
                No setup fees • Cancel anytime • Upgrade whenever you're ready
              </p>
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
