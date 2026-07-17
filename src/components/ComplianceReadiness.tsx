import React, { useState } from "react";
import { ShieldCheck, Scale, FileText, CheckCircle, HelpCircle, Lock, BookOpen } from "lucide-react";

export default function ComplianceReadiness() {
  const [activeDoc, setActiveDoc] = useState<"KDPA" | "TERMS" | "PRIVACY" | "ACCEPTABLE">("KDPA");

  const docLibrary = {
    KDPA: {
      title: "Kenya Data Protection Act Alignment Plan",
      updated: "Last Audited: May 2026",
      content: `
HarambeeFlow processes atomic personal identifiers (Phone numbers, original sender names, financial ledger totals) during direct M-PESA Daraja callback events. Under Section 25 of the Kenya Data Protection Act (KDPA), we operate fully within these primary tenets:

1. LAWFULNESS, FAIRNESS, AND TRANSPARENCY:
Each donor must explicitly toggle the 'SMS / WhatsApp Notification' Opt-in checkbox inside the payment stage prior to Lipa Na M-PESA STK Push validation, establishing clear, recorded consent.

2. PURPOSE LIMITATION:
Personal numbers harvested are utilized strictly to dispatch confirmation receipts and dynamic milestone progress updates related to the targeted campaign. We do not package or sell data to third-party ad brokers.

3. ACCURACY & DATA RETENTION:
Donors can access, modify, or purge their personal profile directories instantly through our verified Donor Portals desk. Financial audit ledgers are archived for 7 tax years matching CBK regulations.
      `
    },
    TERMS: {
      title: "Terms of Service Agreement",
      updated: "Amended: June 2026",
      content: `
By deploying or donating over the HarambeeFlow network, you agree to these fundamental financial covenants:

1. RELATIONSHIP OF PARTIES:
HarambeeFlow is an autonomous software utility linking Safaricom API parameters with community databases. We do not act as trustees, custodians, or holders of parish donation balances.

2. CHARGES & COMMISSION ACCURACY:
Free-tier projects agree to 1.5% technical brokerage commissions captured as processing maintenance. Premium parish plans are exempt from individual transaction cuts, billed on clean MRR flat rates.

3. FRAUDULENT HARAMBEES:
Any project found masquerading under medical emergencies or church renovations to divert retail balances with zero public accounting metrics will be immediately barred, with transaction logs escalated to the Central Bank of Kenya.
      `
    },
    PRIVACY: {
      title: "Privacy and Cookie Declarations",
      updated: "In Effect: June 2026",
      content: `
Our privacy systems maintain complete client encryption protocols:

1. RETENTION EXEMPTIONS:
While givers can edit name aliases, transaction histories containing Safaricom validation hashes (MpesaReceiptNumber codes) constitute formal tax legibility proofs and remain permanently committed to our append-only ledger databases.

2. LOCAL STORAGE AND COOKIES:
Our system avoids invasive tracking tags. We deploy standard functional cookies solely to cache selected local profile preferences, active fundraiser selection states, and dashboard sessions.
      `
    },
    ACCEPTABLE: {
      title: "Community Acceptable Use Policies",
      updated: "Audited: June 2026",
      content: `
To maintain a safe, trusted financial ecosystem across Kenya, HarambeeFlow raises balances exclusively for verified public development projects:

1. PERMITTED CHANNELS:
Parish sanctuary construction, educational tuition harambees, documented family medical billing, athletics talent gear, and disaster mobilization campaigns.

2. STRICTLY PROHIBITED SERVICES:
Political action committee (PAC) funding, speculative micro-equity investments, cryptocurrency trading pools, multi-level marketing (MLM) programs, and high-frequency peer-to-peer cash lending circles.
      `
    }
  };

  const selectedDoc = docLibrary[activeDoc];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in" id="compliance-readiness-root">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase font-bold">Regulatory & Legal Compliance</span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            Compliance Reading Room <Scale className="w-6 h-6 text-indigo-650" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">Read strict guidance and alignment plans matching the Kenya Data Protection Commissioner Office requirements.</p>
        </div>
      </div>

      {/* Split documents panel: Left Document switcher, Right detailed viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Document selector */}
        <div className="lg:col-span-1 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono pl-2">Select Compliance Document</p>
          
          <button
            onClick={() => setActiveDoc("KDPA")}
            className={`w-full text-left p-4.5 rounded-2xl border transition duration-155 cursor-pointer flex flex-col gap-1 ${
              activeDoc === "KDPA" 
                ? "bg-slate-900 text-white border-slate-950 shadow-md" 
                : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-50"
            }`}
          >
            <span className="text-xs font-bold block">1. Kenya Data Protection Act</span>
            <span className="text-[10px] text-slate-400 font-mono">KDPA Consent Vetting</span>
          </button>

          <button
            onClick={() => setActiveDoc("TERMS")}
            className={`w-full text-left p-4.5 rounded-2xl border transition duration-155 cursor-pointer flex flex-col gap-1 ${
              activeDoc === "TERMS" 
                ? "bg-slate-900 text-white border-slate-950 shadow-md" 
                : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-50"
            }`}
          >
            <span className="text-xs font-bold block">2. General Terms of Service</span>
            <span className="text-[10px] text-slate-400 font-mono font-mono">Financial Agreement covenants</span>
          </button>

          <button
            onClick={() => setActiveDoc("PRIVACY")}
            className={`w-full text-left p-4.5 rounded-2xl border transition duration-155 cursor-pointer flex flex-col gap-1 ${
              activeDoc === "PRIVACY" 
                ? "bg-slate-900 text-white border-slate-950 shadow-md" 
                : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-50"
            }`}
          >
            <span className="text-xs font-bold block">3. Privacy & Cookie Policy</span>
            <span className="text-[10px] text-slate-400 font-mono">Tax Retention exemptions</span>
          </button>

          <button
            onClick={() => setActiveDoc("ACCEPTABLE")}
            className={`w-full text-left p-4.5 rounded-2xl border transition duration-155 cursor-pointer flex flex-col gap-1 ${
              activeDoc === "ACCEPTABLE" 
                ? "bg-slate-900 text-white border-slate-950 shadow-md" 
                : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-50"
            }`}
          >
            <span className="text-xs font-bold block">4. Acceptable Use Policies</span>
            <span className="text-[10px] text-slate-400 font-mono">Campaign Vetting guidelines</span>
          </button>
        </div>

        {/* Right Side: Detailed Document viewer */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 bg-white border border-slate-200 rounded-3xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono text-indigo-600 block uppercase font-mono tracking-wider">{selectedDoc.updated}</span>
                <h3 className="text-xl font-sans font-black text-slate-900 mt-1 uppercase">{selectedDoc.title}</h3>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            </div>

            {/* Content rendering */}
            <div className="text-xs text-slate-650 leading-relaxed space-y-4 font-sans font-medium whitespace-pre-line">
              {selectedDoc.content.trim()}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
              <Lock className="w-4 h-4 text-slate-350" /> System secured under complete AES-256 Cloud Run databases.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
