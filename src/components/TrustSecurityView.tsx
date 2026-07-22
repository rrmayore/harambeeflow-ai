import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Shield, Check, X, Server, Database, Lock, Users, ArrowRight, HelpCircle, AlertTriangle, Key, Landmark, CheckCircle2, RefreshCw, Layers, ShieldCheck, HeartHandshake, EyeOff, ClipboardList
} from "lucide-react";

interface TrustSecurityViewProps {
  onStartFundraising?: () => void;
  onNavigateToHowItWorks?: () => void;
}

export default function TrustSecurityView({ 
  onStartFundraising,
  onNavigateToHowItWorks
}: TrustSecurityViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="w-full bg-[#030712] text-slate-100 font-sans min-h-screen selection:bg-emerald-500/30 selection:text-emerald-300" id="trust-security-root">
      
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center z-10" id="trust-hero">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 tracking-wide w-max mx-auto flex items-center gap-2 mb-6"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Fintech Trust & Compliance Protocol</span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white mb-6"
        >
          Your Money Never Passes <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
            Through HarambeeFlow
          </span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-slate-300 text-sm sm:text-base md:text-lg font-medium max-w-3xl leading-relaxed mx-auto mb-10"
        >
          HarambeeFlow records, organizes, and reconciles M-PESA contribution records. 
          Your money continues going directly to your own Till Number or Paybill exactly as it does today. 
          We never receive, hold, transfer, or withdraw your funds.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          {onStartFundraising && (
            <button
              onClick={onStartFundraising}
              className="px-8 py-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all duration-200 cursor-pointer w-full sm:w-auto"
            >
              Start Fundraising
            </button>
          )}
          {onNavigateToHowItWorks && (
            <button
              onClick={onNavigateToHowItWorks}
              className="px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-200 font-bold text-sm rounded-xl transition cursor-pointer w-full sm:w-auto"
            >
              How It Works
            </button>
          )}
        </motion.div>
      </section>

      {/* Section 1 - How Money Flows (Visual Diagram) */}
      <section className="border-t border-slate-900 bg-slate-950/40 py-16 px-6 relative z-10" id="money-flow">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Architectural Flow</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">How Money and Data Flow</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">See how we separate financial transactions from information logging for maximum security.</p>
          </div>

          {/* Visual Diagram */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 sm:p-10 font-mono text-xs text-slate-300 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 relative z-10">
              
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center min-h-[90px]">
                <span className="text-xl mb-1">🧑‍🤝‍🧑</span>
                <span className="font-bold text-slate-200">Supporter</span>
              </div>

              <div className="flex md:flex-col justify-center items-center py-2 text-emerald-400">
                <span className="md:hidden">⬇️</span>
                <span className="hidden md:inline">➡️</span>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-900/40 rounded-xl flex flex-col items-center justify-center min-h-[90px] text-emerald-300">
                <span className="text-xl mb-1">📲</span>
                <span className="font-bold">M-PESA Payment</span>
                <span className="text-[10px] text-emerald-500/80 mt-1">Direct Flow</span>
              </div>

              <div className="flex md:flex-col justify-center items-center py-2 text-emerald-400">
                <span className="md:hidden">⬇️</span>
                <span className="hidden md:inline">➡️</span>
              </div>

              <div className="p-4 bg-[#091b15] border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center min-h-[90px] text-white ring-2 ring-emerald-500/20">
                <span className="text-xl mb-1">🏦</span>
                <span className="font-extrabold text-emerald-400">Your Till / Paybill</span>
                <span className="text-[9px] text-slate-400 mt-1">Safaricom Direct</span>
              </div>

              <div className="flex md:flex-col justify-center items-center py-2 text-sky-400">
                <span className="md:hidden">⬇️</span>
                <span className="hidden md:inline">➡️</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center min-h-[90px]">
                <span className="text-xl mb-1">📡</span>
                <span className="font-bold text-slate-200">M-PESA SMS</span>
                <span className="text-[9px] text-slate-400 mt-1">IPN / Callback</span>
              </div>

            </div>

            {/* Downward Loop to HarambeeFlow AI */}
            <div className="my-6 flex justify-center text-slate-600 font-bold">
              <span>⬇️</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 relative z-10">
              <div className="md:col-span-1" />
              
              <div className="p-5 bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border-2 border-emerald-500/30 rounded-xl flex flex-col items-center justify-center min-h-[110px] md:col-span-3">
                <div className="flex items-center gap-2 text-white font-extrabold text-sm mb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                  HarambeeFlow AI
                </div>
                <span className="text-[11px] text-slate-300 mt-1 text-center">
                  Parses message content, cross-references with active pledges, records contribution metrics
                </span>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-950/50 border border-sky-800/30 px-2 py-0.5 rounded-full mt-3">
                  Read-Only Record Parsing
                </span>
              </div>

              <div className="md:col-span-1" />
            </div>

            <div className="my-6 flex justify-center text-slate-600 font-bold">
              <span>⬇️</span>
            </div>

            {/* Outputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
              <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg text-center">
                <span className="block text-slate-200 font-bold">📊 Dashboard</span>
                <span className="text-[9px] text-slate-500">Live Totals</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg text-center">
                <span className="block text-slate-200 font-bold">📋 Reports</span>
                <span className="text-[9px] text-slate-500">Audit Ledger</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg text-center">
                <span className="block text-slate-200 font-bold">💬 WhatsApp</span>
                <span className="text-[9px] text-slate-500">Thank-you Receipts</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg text-center">
                <span className="block text-slate-200 font-bold">📈 Live Progress</span>
                <span className="text-[9px] text-slate-500">Public Screens</span>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-6 py-4 rounded-xl max-w-2xl mx-auto inline-block">
            🛡️ &ldquo;HarambeeFlow never sits between the supporter and your money.&rdquo;
          </p>
        </div>
      </section>

      {/* Sections 2 & 3 - What HarambeeFlow CAN Do vs What it NEVER Does */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10" id="capabilities-comparison">
        
        {/* Left Column - CAN DO */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">System Operations</span>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              What HarambeeFlow CAN Do
            </h3>
            <p className="text-xs text-slate-400">Our platform coordinates fundraising data processing seamlessly and automatically.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Read M-PESA confirmation messages", desc: "Instantly extracts reference codes and amounts." },
              { title: "Automatically record contributions", desc: "No more copying numbers into manual spreadsheets." },
              { title: "Update fundraiser totals", desc: "Real-time sync to public bars and progress charts." },
              { title: "Match contributors", desc: "Intelligently reconciles names and outstanding pledges." },
              { title: "Generate reports", desc: "Produces exportable CSV logs and audit trail PDFs." },
              { title: "Send WhatsApp confirmations", desc: "Dispatches automated, polite receipts to supporters." },
              { title: "Track fundraising progress", desc: "Computes percentages, timelines, and goal targets." },
              { title: "Detect duplicate entries", desc: "Flags potential double-bookings or system anomalies." }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl flex gap-3">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 h-max">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - NEVER DOES */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">Security Restrictions</span>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              What HarambeeFlow NEVER Does
            </h3>
            <p className="text-xs text-slate-400">These hard-coded architecture boundaries ensure your funds remain isolated and protected.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Hold your money", desc: "Funds pass straight from Safaricom directly to your bank/Till." },
              { title: "Transfer your money", desc: "We have zero routing channels or access to bank accounts." },
              { title: "Withdraw your money", desc: "There is no cash-out API or permission within our system." },
              { title: "Modify your Paybill", desc: "No ability to edit rates, owners, or settings of Till accounts." },
              { title: "Charge contributors", desc: "Supporters pay only their typical M-PESA carrier rates." },
              { title: "Access your M-PESA PIN", desc: "We never prompt for or store organizational credentials or PINs." },
              { title: "Initiate transactions", desc: "No outward payments or third-party money requests can be started." }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-red-950/10 border border-red-950/40 rounded-xl flex gap-3">
                <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg shrink-0 h-max">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-red-300">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Section 4 & 5 - Data Security & Privacy */}
      <section className="bg-slate-950/30 border-y border-slate-900 py-16 px-6 relative z-10" id="data-security-privacy">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Data Security Info Grid */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Platform Integrity</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Military-Grade Data Security</h3>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">We protect database records with modern, reliable cloud infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Key, title: "Firebase Authentication", desc: "Secure multi-factor authentication protects committee accounts." },
                { icon: Server, title: "Google Cloud Hosting", desc: "Our platform runs in secure data centers with 99.99% uptime." },
                { icon: Database, title: "Firestore Encryption", desc: "All data is encrypted both at rest and in transit (SSL/TLS)." },
                { icon: ShieldCheck, title: "Secure Connections", desc: "Strict HTTPS requirements prevent eavesdropping or packet hijacking." },
                { icon: Users, title: "Role-Based Permissions", desc: "Granular access limits what team members can see or perform." },
                { icon: ClipboardList, title: "Audit Logging", desc: "Logs every action (manual entry, edits, reports export) permanently." },
                { icon: RefreshCw, title: "Automatic Backups", desc: "Database snapshots are generated daily to protect against loss." }
              ].map((sec, idx) => {
                const Icon = sec.icon;
                return (
                  <div key={idx} className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-max">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white">{sec.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{sec.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Protections */}
          <div className="p-6 sm:p-10 bg-slate-900/30 border border-slate-850 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl">
                <EyeOff className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">Guaranteed Supporter Privacy</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Only authorized committee members can see individual contributor details. We respect the trust your supporters put in your organization.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 bg-slate-950/60 rounded-xl space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">No Exposed Phones</span>
                <p className="text-[11px] text-slate-400">Public fundraiser pages mask phone numbers (e.g. 07***123) to prevent harvesting and spam.</p>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-xl space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Private Notes</span>
                <p className="text-[11px] text-slate-400">Personal remarks, prayer requests, or family dedications remain strictly visible to the treasurer.</p>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-xl space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Anonymized Dashboards</span>
                <p className="text-[11px] text-slate-400">Spectators see aggregate progress, while confidential spreadsheets are locked with committee keys.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 6 - Committee Roles */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-10 relative z-10" id="committee-roles">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Access Management</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">Granular Committee Roles</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">Delegate tasks without compromising security using explicit permission boundaries.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { role: "Administrator", color: "text-red-400 bg-red-950/20 border-red-900/30", desc: "Full ownership. Manages committee members, API keys, webhook integrations, and critical campaign parameters." },
            { role: "Treasurer", color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/30", desc: "Primary operator. Records manual cash collections, creates payment links, sends thank-you logs, and exports CSV ledgers." },
            { role: "Assistant Treasurer", color: "text-sky-400 bg-sky-950/20 border-sky-900/30", desc: "Helper node. Assists in logging manual contributions and matching pledges, but cannot modify campaign settings." },
            { role: "Auditor", color: "text-amber-400 bg-amber-950/20 border-amber-900/30", desc: "Verification node. Read-only access to all transactions, audit trails, and bank reconciliation files. Cannot write records." },
            { role: "Viewer", color: "text-slate-400 bg-slate-900/50 border-slate-800", desc: "Basic display. View live totals, public feeds, and basic report summaries. Ideal for general committee check-ins." }
          ].map((r, idx) => (
            <div key={idx} className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${r.color}`}>
                  {r.role}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7 - M-PESA Compatibility */}
      <section className="bg-slate-950/40 border-t border-slate-900 py-16 px-6 relative z-10" id="mpesa-compatibility">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          <div className="p-6 bg-slate-900/80 border border-slate-850 rounded-3xl shrink-0 text-center w-full md:w-max">
            <span className="text-4xl">🇰🇪</span>
            <h4 className="text-base font-black text-white mt-3 font-mono">100% Compatible</h4>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest font-mono">Any Till or Paybill</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white">Safaricom M-PESA Direct Compatibility</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Our system sits completely alongside your current setup. There is absolutely no need to register a new Till, alter merchant agreements, or change payment methods. Supporters keep transacting with standard Safaricom shortcuts they know and trust. We simply catch and organize the resulting records.
            </p>
          </div>
        </div>
      </section>

      {/* Section 8 - Frequently Asked Security Questions */}
      <section className="max-w-4xl mx-auto px-6 py-20 space-y-10 relative z-10" id="trust-faq">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Transparency</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">Trust & Security FAQ</h3>
          <p className="text-sm text-slate-400">Clear, definitive answers to questions from trustees, pastors, and directors.</p>
        </div>

        <div className="space-y-4">
          {[
            { q: "Does HarambeeFlow hold our money?", a: "No. Absolutely not. Your money never enters or touches any accounts controlled by HarambeeFlow. Supporters pay directly to your organization's own Till Number or Paybill. Safaricom settles your funds directly into your organization's bank account." },
            { q: "Can HarambeeFlow withdraw money from our Till?", a: "No. Safaricom Daraja Webhooks are strictly read-only informational signals. There are no technical pathways, APIs, or operations within HarambeeFlow that can trigger or authorize withdrawals, outbound transfers, or cash-outs." },
            { q: "Can contributors see each other's details?", a: "Only if explicitly authorized. By default, public pages display only the contributor name (or 'Anonymous' if requested) and the amount. Phone numbers and email addresses are always masked to protect individual privacy." },
            { q: "Can I disconnect my Till or Paybill?", a: "Yes, at any time. You can disconnect your Safaricom webhook or delete your API configuration instantly from the Settings tab. This immediately stops all records from reaching HarambeeFlow." },
            { q: "Who owns the fundraising data?", a: "Your organization owns 100% of the data. You can download your full transaction histories, pledge records, and manual ledger lists as CSV spreadsheets at any time, and request permanent erasure of your campaign records." },
            { q: "How is my data protected?", a: "We utilize Google Cloud Server nodes, robust Firebase Firestore databases with custom security roles, and strict SSL encryption in transit to guarantee system integrity." },
            { q: "Can multiple treasurers work together safely?", a: "Yes. By utilizing custom role-based permissions, you can invite helper treasurers with read-write access to log contributions, while locking system configurations behind the Administrator keys." }
          ].map((faq, index) => (
            <div key={index} className="border border-slate-850 rounded-xl bg-slate-900/20 overflow-hidden">
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full text-left p-5 flex items-center justify-between text-sm font-bold text-white hover:bg-slate-900/60 focus:outline-none transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className={`text-xs font-mono text-emerald-400 transition-transform duration-200 ${activeFaq === index ? "rotate-180" : ""}`}>
                  ▼
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

      {/* Section 9 - Security Architecture Workflow */}
      <section className="bg-slate-950/40 border-y border-slate-900 py-16 px-6 relative z-10" id="security-architecture">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest block">Verification Engine</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">System Verification Architecture</h3>
            <p className="text-sm text-slate-400">Our robust processing sequence protects ledger integrity against duplicates or failures.</p>
          </div>

          {/* Workflow Sequence */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 max-w-3xl mx-auto">
            {[
              { step: "M-PESA", desc: "Safaricom Gateway" },
              { step: "Webhook", desc: "Secure Listener" },
              { step: "Validation", desc: "Origin Check" },
              { step: "Duplicate Filter", desc: "Anti-Double Log" },
              { step: "Ledger Log", desc: "Atomic Write" },
              { step: "WhatsApp Out", desc: "Insta-Receipt" }
            ].map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl text-center flex-1 min-w-[120px] w-full">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-0.5">0{idx + 1}</span>
                  <span className="text-xs font-black text-white block">{s.step}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5 leading-none">{s.desc}</span>
                </div>
                {idx < 5 && (
                  <span className="text-slate-600 font-mono font-bold text-xs py-1 rotate-90 md:rotate-0">
                    ➔
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">Webhook validation</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every payload arriving from the Safaricom gateway is parsed, validated, and verified using cryptographic matching signatures to prevent spoofing or mock injection.
              </p>
            </div>
            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">Duplicate detection</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transactions are keyed atomically by their unique M-PESA receipt ID (e.g., RJG57FGH90). A duplicate entry attempt is instantly dropped, preventing ledger corruption.
              </p>
            </div>
            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">Atomic transactions</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Writing database contributions and updating overall campaign milestones are tied in single-run database updates. If one fails, both rollback safely.
              </p>
            </div>
            <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">Automatic reconciliation</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Incoming donations are automatically mapped to outstanding committee pledges by looking at the matched names, phones, and metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10 - Trust Indicators */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-10 relative z-10" id="trust-indicators">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Compliance Checklist</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">Trust & Compliance Indicators</h3>
          <p className="text-sm text-slate-400">Verifiable standards that govern the HarambeeFlow ecosystem.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Google Cloud Hosted", sub: "Secure VM node deployment" },
            { label: "Firebase Authentication", sub: "Confidential MFA accounts" },
            { label: "Encrypted Database", sub: "Strict Firestore protocols" },
            { label: "Role-Based Access", sub: "Explicit workspace scopes" },
            { label: "Automatic Audit Trail", sub: "Non-repudiation logging" },
            { label: "Real-Time Sync", sub: "Instant database updating" },
            { label: "M-PESA Compatible", sub: "Native Till / Paybill flow" },
            { label: "Churches, Schools & NGOs", sub: "Designed for community trust" }
          ].map((ind, idx) => (
            <div key={idx} className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
              <span className="text-emerald-400 text-sm">🛡️</span>
              <h4 className="text-xs font-black text-slate-100">{ind.label}</h4>
              <p className="text-[10px] text-slate-500 leading-tight">{ind.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 11 - Legal Disclaimer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-12 px-6 relative z-10" id="trust-disclaimer">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Legal Protocol</p>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
            &ldquo;HarambeeFlow is a fundraising management platform. It does not receive, hold, transfer, or process customer funds. All payments continue flowing directly to the organization&apos;s own Till Number or Paybill. &apos;M-PESA&apos; is a registered trademark of Safaricom PLC and is referenced solely to describe compatibility.&rdquo;
          </p>
          <p className="text-[10px] text-slate-600 font-mono pt-4">
            HarambeeFlow Protocol Version 2.06 • Secure Cloud Stack
          </p>
        </div>
      </footer>

    </div>
  );
}
