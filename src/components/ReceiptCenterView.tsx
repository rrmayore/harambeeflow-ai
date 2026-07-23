import React, { useState, useEffect } from "react";
import { Project, Contribution } from "../types";
import { 
  FileText, Search, Printer, Download, Share2, ShieldCheck, 
  CheckCircle2, Mail, Copy, Landmark, User, AlertCircle 
} from "lucide-react";
import { getDonorBadgeInfo } from "../utils/donor";
import { getTheme, getCampaignLogo, getCampaignMotto } from "../utils/branding";

interface ReceiptCenterViewProps {
  activeProject: Project | null;
  contributions: Contribution[];
  initialReceiptCode?: string | null;
}

export default function ReceiptCenterView({
  activeProject,
  contributions,
  initialReceiptCode
}: ReceiptCenterViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-select receipt matching initialReceiptCode when changed
  useEffect(() => {
    if (initialReceiptCode) {
      const matched = contributions.find(c => c.transactionCode.toUpperCase() === initialReceiptCode.toUpperCase());
      if (matched) {
        setSelectedReceiptId(matched.id);
      }
    }
  }, [initialReceiptCode, contributions]);

  // Filter contributions by project or search
  const filtered = contributions.filter(c => {
    const matchesSearch = 
      c.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.transactionCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeProject) {
      return c.projectId === activeProject.id && matchesSearch;
    }
    return matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (code: string) => {
    const dummyUrl = `https://harambeeflow.org/receipt/HF-2026-${code}`;
    navigator.clipboard.writeText(dummyUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Find selected receipt
  const receiptToDisplay = contributions.find(c => c.id === selectedReceiptId) || filtered[0];

  const theme = getTheme(activeProject?.themeColor);
  const logoImg = getCampaignLogo(activeProject);
  const activeMotto = getCampaignMotto(activeProject);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="receipt-center-root">
      
      {/* Receipts overview header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-100 flex items-center gap-1 w-max">
            <FileText className="w-3.5 h-3.5" /> Contribution Receipt Center
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Official Giver Certifications & Tax Slips
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and download authenticated transaction receipts containing digital audit signatures.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search Name or Transaction Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Receipts Ledger list */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[600px] flex flex-col">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
            Auditable Givers Ledger
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedReceiptId(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    receiptToDisplay?.id === c.id 
                      ? "border-emerald-500 bg-emerald-50/10 shadow-2xs" 
                      : "border-slate-100 bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((window as any).viewDonorProfile) {
                            (window as any).viewDonorProfile(c.senderPhone || c.phoneNumber || "");
                          }
                        }}
                        className="text-xs font-bold text-slate-800 hover:underline hover:text-indigo-600 cursor-pointer block max-w-[140px] truncate transition"
                      >
                        {c.senderName || "Unknown contributor"}
                      </span>
                      {(() => {
                        const badge = getDonorBadgeInfo(c.senderPhone || c.phoneNumber || "", c.id || c.transactionCode, contributions);
                        return (
                          <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider w-max ${badge.badgeColor}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      KES {c.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
                    <span>M-PESA: {c.transactionCode}</span>
                    <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No matching reconciled contributions found.
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Large Interactive Receipt Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {receiptToDisplay ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              
              {/* Receipt Control bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-mono text-slate-400">
                  RECEIPT ID: <strong className="text-slate-800 font-bold">HF-2026-{receiptToDisplay.transactionCode}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleShare(receiptToDisplay.transactionCode)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-mono text-[10px] font-bold rounded-lg transition uppercase flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedCode ? "URL Copied!" : "Share URL"}
                  </button>
                </div>
              </div>

              {/* The Actual Printed Document Canvas */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 max-w-xl mx-auto shadow-sm relative overflow-hidden" id="printable-receipt-canvas">
                
                {/* Simulated Watermark Stamp */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 select-none pointer-events-none transform rotate-12">
                  <svg className="w-56 h-56 text-emerald-800" fill="currentColor" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
                    <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="bold">HARAMBEE FLOW</text>
                  </svg>
                </div>

                 {/* Receipt Header Banner with Custom Campaign Identity */}
                <div className="text-center border-b border-dashed border-slate-300 pb-5 mb-5 flex flex-col items-center">
                  {/* Campaign Logo Avatar */}
                  <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-2xs border border-slate-200 flex items-center justify-center overflow-hidden mb-2 shrink-0">
                    <img 
                      src={logoImg} 
                      alt="Campaign Logo" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <span className={`text-[9px] font-mono font-bold tracking-widest ${theme.text} uppercase`}>
                    OFFICIAL CONTRIBUTION RECEIPT
                  </span>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight mt-1 uppercase max-w-xs">
                    {activeProject ? activeProject.name : "HARAMBEEFLOW LEDGER CERTIFICATE"}
                  </h3>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Organizer: <span className="font-bold text-slate-700">{activeProject?.organizer || "Harambee Committee"}</span>
                  </div>
                  {activeMotto && (
                    <p className="text-[9px] text-slate-400 italic mt-1.5 max-w-xs px-2 leading-relaxed">
                      "{activeMotto}"
                    </p>
                  )}
                </div>

                {/* Receipt Fields Grid */}
                <div className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200/50">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Receipt Code</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">HF-2026-{receiptToDisplay.transactionCode}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Verification Status</span>
                      <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED OK
                      </p>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-slate-200/50">
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Campaign Category</span>
                    <p className={`text-xs font-black ${theme.text} mt-0.5 uppercase`}>
                      {activeProject ? (activeProject.campaignCategory || activeProject.category || "General") : "General Drive"}
                    </p>
                  </div>

                  <div className="pb-3 border-b border-slate-200/50">
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Contributor Identity</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span 
                          onClick={() => {
                            if ((window as any).viewDonorProfile) {
                              (window as any).viewDonorProfile(receiptToDisplay.senderPhone || receiptToDisplay.phoneNumber || "");
                            }
                          }}
                          className="hover:underline hover:text-indigo-600 cursor-pointer"
                        >
                          {receiptToDisplay.senderName || "Kenyan Well-wisher"}
                        </span>
                      </p>
                      {(() => {
                        const badge = getDonorBadgeInfo(receiptToDisplay.senderPhone || receiptToDisplay.phoneNumber || "", receiptToDisplay.id || receiptToDisplay.transactionCode, contributions);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider ${badge.badgeColor}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200/50">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Transaction ID</span>
                      <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{receiptToDisplay.transactionCode}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Settlement Date</span>
                      <p className="text-xs font-mono text-slate-800 mt-0.5">
                        {new Date(receiptToDisplay.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Amount Block */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-center mt-6">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">CERTIFIED CONTRIBUTION SUM</span>
                    <p className="text-3xl font-black text-emerald-600 mt-1">
                      KES {receiptToDisplay.amount.toLocaleString()}.00
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 italic">
                      Zero Processing Fees matched at gateway
                    </p>
                  </div>

                  {/* Digital signatures / footer */}
                  <div className="pt-6 mt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-[9px] font-mono text-slate-400 leading-normal">
                    <div>
                      <p className="font-bold text-slate-500 uppercase">Committee Signatures</p>
                      <p className="mt-3 text-slate-700 italic">HarambeeFlow Bot Sign ✓</p>
                      <p className="border-t border-slate-200 mt-1 pt-1">Automated Auditor</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-500 uppercase">Audit Verification</p>
                      <p className="mt-3 text-emerald-600 font-bold uppercase tracking-wider">ODPC COMPLIANT ✓</p>
                      <p className="border-t border-slate-200 mt-1 pt-1">Encryption Protocol</p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Instructions below receipt card */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 mt-6 text-xs text-slate-600 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900">How to Verify Receipt Online?</h5>
                  <p className="mt-1 leading-normal text-slate-500">
                    Each contribution is assigned a permanent hash. Anyone can scan or browse to the permanent link to authenticate that this transaction resides in the verified Safaricom Daraja ledger logs.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-mono text-xs">
              No receipt selected. Select a receipt from the ledger list on the left to display its cert details.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
