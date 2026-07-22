import React, { useState } from "react";
import { 
  ArrowRight, Cpu, Check, HelpCircle, MessageSquare, Phone, Mail, Shield, 
  CheckCircle2, Info, Landmark, Layers, Sparkles, Send, X, AlertTriangle 
} from "lucide-react";
import { motion } from "motion/react";
import InteractiveTour from "./InteractiveTour";
import TrustSecurityView from "./TrustSecurityView";

interface LandingPageViewProps {
  onEnterApp: () => void;
  onEnterDemo?: () => void;
}

type MarketingTab = "home" | "how-it-works" | "pricing" | "trust" | "faq" | "contact";

export default function LandingPageView({ onEnterApp, onEnterDemo }: LandingPageViewProps) {
  const [showTour, setShowTour] = useState(false);
  const [activeTab, setActiveTab] = useState<MarketingTab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      {/* Modern Marketing Header Navbar */}
      <header className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shrink-0" id="marketing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}>
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white shadow-md shadow-emerald-500/10">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-black tracking-tight text-base text-white block leading-none">
                HarambeeFlow <span className="text-emerald-400 font-mono text-[9px] font-bold bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded ml-1">AI</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400 tracking-wider uppercase">
            {[
              { id: "home", label: "Home" },
              { id: "how-it-works", label: "How It Works" },
              { id: "pricing", label: "Pricing" },
              { id: "trust", label: "Trust & Security" },
              { id: "faq", label: "FAQ" },
              { id: "contact", label: "Contact" }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as MarketingTab)}
                className={`hover:text-emerald-400 transition cursor-pointer font-sans ${
                  activeTab === link.id ? "text-emerald-400 border-b-2 border-emerald-500/80 pb-1" : ""
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {onEnterDemo && (
              <button 
                onClick={onEnterDemo}
                className="text-xs font-extrabold text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Sandbox Demo
              </button>
            )}
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/5 transition cursor-pointer active:scale-95"
            >
              Start Free
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <span className="text-lg font-black font-mono">✕</span> : <span className="text-lg font-black font-mono">☰</span>}
          </button>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 border-t border-slate-900 pt-4 pb-2 space-y-3 animate-scale-up">
            {[
              { id: "home", label: "Home" },
              { id: "how-it-works", label: "How It Works" },
              { id: "pricing", label: "Pricing" },
              { id: "trust", label: "Trust & Security" },
              { id: "faq", label: "FAQ" },
              { id: "contact", label: "Contact" }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id as MarketingTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 text-xs font-black tracking-wider uppercase rounded-lg transition ${
                  activeTab === link.id ? "bg-slate-900 text-emerald-400" : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-3 px-3 border-t border-slate-900">
              {onEnterDemo && (
                <button
                  onClick={() => {
                    onEnterDemo();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs font-bold"
                >
                  Enter Sandbox Demo
                </button>
              )}
              <button
                onClick={() => {
                  onEnterApp();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-black"
              >
                Join Waitlist / Start Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Marketing Content Container */}
      <div className="flex-1 w-full flex flex-col justify-start relative">
        
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center z-20 relative max-w-5xl mx-auto w-full" id="home-view">
            <div className="flex flex-col items-center max-w-4xl py-6">
              
              {/* Badge: Kenya's Trusted M-PESA Fundraising Platform */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] sm:text-xs font-semibold text-slate-400 tracking-wide shadow-lg shadow-emerald-500/5 flex items-center gap-2 mb-6 sm:mb-8"
              >
                <span>🇰🇪 Kenya's Trusted M-PESA Fundraising Platform</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white mb-5 sm:mb-6"
              >
                Never Track M-PESA Contributions <br />
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                  Manually Again
                </span>
              </motion.h1>

              {/* Supporting text */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-slate-300 text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed mb-6 sm:mb-8"
              >
                Automatically record every M-PESA contribution, update your fundraiser instantly, and keep supporters informed on WhatsApp in real time.
              </motion.p>

              {/* Audience / Sectors Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col items-center gap-3 w-full mb-8 sm:mb-10"
              >
                <span className="text-[10px] sm:text-xs font-extrabold tracking-widest uppercase text-slate-500">
                  Built For
                </span>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {["Churches", "Schools", "Chamas", "NGOs", "Medical Appeals", "Funeral Committees"].map((sector) => (
                    <span 
                      key={sector} 
                      className="px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/60 text-[11px] sm:text-xs font-medium text-slate-300 shadow-sm"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Action Button */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                className="pt-2 flex flex-col items-center gap-4"
              >
                <button
                  onClick={onEnterApp}
                  className="px-12 py-6 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] border border-emerald-300/20 hover:border-emerald-200/30 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
                  id="btn-start-fundraising-primary"
                >
                  Start Fundraising
                  <ArrowRight className="w-5 h-5 stroke-[2.5] transition group-hover:translate-x-1" />
                </button>

                <button 
                  onClick={() => setActiveTab("how-it-works")}
                  className="text-xs font-extrabold text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
                >
                  Learn how the system is completely non-custodial
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
          <section className="max-w-5xl mx-auto px-6 py-12 space-y-12 z-20 relative w-full" id="pricing-view">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Simple Packages</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Transparent, Budget-Friendly Plans</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">No setup fees. No long commitments. Cancel or switch at any time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              
              {/* Plan 1 */}
              <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Chama / Mini-Fund</span>
                    <h3 className="text-lg font-black text-white">Starter Sandbox</h3>
                    <p className="text-xs text-slate-400">Great for small wedding cards, family medical appeals, or self-help groups.</p>
                  </div>
                  <div className="py-2">
                    <span className="text-3xl font-black text-white">KES 0</span>
                    <span className="text-xs text-slate-500 font-bold"> / Free Forever</span>
                  </div>
                  <div className="border-t border-slate-850 pt-4 space-y-2.5">
                    {["Up to KES 100,000 Raised", "1 Admin/Treasurer node", "Auto M-PESA SMS Parser", "Interactive Dashboard", "Standard Support Desk"].map((feat, idx) => (
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

              {/* Plan 2 */}
              <div className="p-6 bg-slate-900/90 border-2 border-emerald-500 rounded-2xl flex flex-col justify-between space-y-6 relative">
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider font-mono">
                  POPULAR FOR COMMITTEES
                </span>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Churches, NGOs & Schools</span>
                    <h3 className="text-lg font-black text-white">Committee Premium</h3>
                    <p className="text-xs text-slate-300">Complete suite for school boards, church harambees, and international NGOs.</p>
                  </div>
                  <div className="py-2">
                    <span className="text-3xl font-black text-white">KES 4,500</span>
                    <span className="text-xs text-slate-400 font-bold"> / per month</span>
                  </div>
                  <div className="border-t border-slate-800 pt-4 space-y-2.5">
                    {["Unlimited Funds & Campaigns", "Multi-Treasurer administration", "AI Automatic Pledge Reconciliation", "Insta WhatsApp Confirmation API", "Advanced Excel / PDF Export", "Data Privacy Hardening"].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={onEnterApp} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer">
                  Get Started Now
                </button>
              </div>

              {/* Plan 3 */}
              <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Enterprise</span>
                    <h3 className="text-lg font-black text-white">National Scale</h3>
                    <p className="text-xs text-slate-400">Custom solutions for massive charity trusts or disaster relief funds.</p>
                  </div>
                  <div className="py-2">
                    <span className="text-3xl font-black text-white">Custom</span>
                    <span className="text-xs text-slate-500 font-bold"> / Custom Quote</span>
                  </div>
                  <div className="border-t border-slate-850 pt-4 space-y-2.5">
                    {["Custom webhook integration", "Dedicated developer node sandbox", "SLA 99.99% Uptime Agreement", "National stress load testing", "Priority Account Manager"].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setActiveTab("contact")} className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer">
                  Contact Sales Desk
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
                { q: "How much does it cost?", a: "We offer a Free Starter package for small community fundraisers. For larger teams, schools, or churches with advanced WhatsApp receipt requirements, our Premium plan is KES 4,500/month." },
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
                    <span>rmayore@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>+254 712 345 678</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span>Makueni-Bus Complex, Nairobi</span>
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
                        placeholder="e.g. rmayore@gmail.com"
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

      {/* Modern Marketing Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 px-6 py-8 mt-auto shrink-0 z-10" id="marketing-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs font-black text-white">HarambeeFlow AI Ecosystem</p>
            <p className="text-[10px] text-slate-500">Non-custodial Lipa Na M-PESA organization and records automation.</p>
          </div>
          <div className="flex gap-4 text-slate-500 text-[11px] font-bold">
            <button onClick={() => setActiveTab("trust")} className="hover:text-slate-300">Trust & Security Policy</button>
            <span>•</span>
            <button onClick={() => setActiveTab("faq")} className="hover:text-slate-300">FAQ Help Desk</button>
            <span>•</span>
            <button onClick={() => setActiveTab("contact")} className="hover:text-slate-300">Contact Desk</button>
          </div>
          <p className="text-[10px] text-slate-600 font-mono">
            &copy; 2026 HarambeeFlow. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Onboarding tour modal overlay */}
      {showTour && (
        <InteractiveTour 
          onClose={() => setShowTour(false)} 
          activeTab="landing"
          setActiveTab={() => {}}
          wizardOpen={false}
          setWizardOpen={() => {}}
          projectsCount={0}
          contributionsCount={0}
        />
      )}

    </div>
  );
}
