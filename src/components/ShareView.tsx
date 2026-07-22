import React, { useState, useMemo } from "react";
import { Project, Contribution } from "../types";
import { 
  Share2, Copy, Check, Printer, QrCode, Sparkles, MessageSquare, HeartHandshake, ExternalLink
} from "lucide-react";

interface ShareViewProps {
  activeProject: Project;
  contributions: Contribution[];
  onTriggerSummarize: () => void;
  summaryText: string;
  isSummarizing: boolean;
}

export default function ShareView({
  activeProject,
  contributions,
  onTriggerSummarize,
  summaryText,
  isSummarizing
}: ShareViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [flyerSize, setFlyerSize] = useState<"A4" | "A5">("A4");

  const campaignContributions = useMemo(() => {
    return contributions.filter(c => c.projectId === activeProject.id || c.campaignId === activeProject.id);
  }, [contributions, activeProject.id]);

  const totalRaised = useMemo(() => {
    return campaignContributions.reduce((sum, c) => sum + Number(c.amount), 0);
  }, [campaignContributions]);

  const percentComplete = Math.min(100, Math.round((totalRaised / (activeProject.targetAmount || 1)) * 100));

  const publicLink = `${window.location.origin}/#/campaign/${activeProject.id}`;

  const defaultMessage = `📢 *${activeProject.name} Update* 📢\n\nWe have successfully raised *KES ${totalRaised.toLocaleString()}* against our target of *KES ${(activeProject.targetAmount || 0).toLocaleString()}* (${percentComplete}% accomplished).\n\nThank you to our amazing contributors!\n\n*How to Support:*\nPaybill Number: *${activeProject.paybillNumber || "N/A"}*\nAccount Name: *${activeProject.accountReference || "N/A"}*\n\nDonate online here: ${publicLink}`;

  const displayMessage = summaryText || defaultMessage;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyWhatsAppMsg = () => {
    navigator.clipboard.writeText(displayMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleShareWhatsAppDirect = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(displayMessage)}`, "_blank");
  };

  const handlePrint = (size: "A4" | "A5") => {
    setFlyerSize(size);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100 min-h-full">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black font-sans text-white tracking-tight" id="share-view-title">
            Share Campaign
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Share your fundraiser through WhatsApp, posters, and your public campaign page.
          </p>
        </div>

        {/* Campaign Summary Widget at top */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="share-view-summary-banner">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-bold block">Campaign</span>
            <span className="text-sm sm:text-base font-extrabold text-white leading-tight">{activeProject.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-12 shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-bold block">Goal</span>
              <span className="text-sm font-extrabold text-slate-200 font-mono">KES {activeProject.targetAmount.toLocaleString()}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 font-bold block">Raised</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">KES {totalRaised.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1 — WHATSAPP */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-6" id="share-section-whatsapp">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white">WhatsApp</h2>
            </div>
            <p className="text-xs text-slate-400">
              Generate a ready-to-send fundraising message and share it with your church members, family, friends, or community groups.
            </p>
          </div>

          {/* Interactive Message Content Area */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 font-sans text-xs relative overflow-hidden">
            <div className="max-h-[180px] overflow-y-auto pr-1">
              <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{displayMessage}</p>
            </div>
          </div>

          {/* Large Touch-friendly Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onTriggerSummarize}
              disabled={isSummarizing}
              className="flex-1 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50"
              id="whatsapp-btn-generate"
            >
              <Sparkles className="w-4 h-4" />
              {isSummarizing ? "Generating..." : "Generate Message"}
            </button>
            
            <button
              onClick={handleCopyWhatsAppMsg}
              className="flex-1 min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
              id="whatsapp-btn-copy"
            >
              {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedMessage ? "Copied!" : "Copy Message"}
            </button>

            <button
              onClick={handleShareWhatsAppDirect}
              className="flex-1 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
              id="whatsapp-btn-share"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </button>
          </div>
        </div>

        {/* SECTION 2 — PRINTABLE FLYER */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-6" id="share-section-flyer">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold text-white">Printable Flyer</h2>
            </div>
            <p className="text-xs text-slate-400">
              Print a professional fundraising poster with your campaign QR code and payment details.
            </p>
          </div>

          {/* Size Format Selector & Mockup Panel */}
          <div className="flex flex-col md:flex-row gap-6 items-center">
            
            {/* Flyer Size Selector Preview Layout */}
            <div className="flex flex-col gap-3 w-full md:w-44 shrink-0">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Select Size:</span>
              <div className="flex md:flex-col bg-slate-950 p-1.5 rounded-2xl border border-slate-850 gap-1.5">
                {(["A4", "A5"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFlyerSize(sz)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-wider transition-all duration-200 ${
                      flyerSize === sz 
                        ? "bg-emerald-500 text-slate-950" 
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {sz} format
                  </button>
                ))}
              </div>
            </div>

            {/* Flyer Artwork Card (Keep details highly visible) */}
            <div className="flex-1 w-full flex justify-center">
              <div className="w-full max-w-sm p-6 bg-white text-slate-900 rounded-3xl border-[6px] border-slate-200 flex flex-col items-center justify-center space-y-5 font-sans text-center relative shadow-2xl">
                <div className="absolute top-3 right-3 bg-slate-100 text-slate-500 font-mono text-[9px] font-black px-2 py-1 rounded border border-slate-200">
                  {flyerSize} format
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl">
                  <HeartHandshake className="w-8 h-8 text-emerald-600" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {activeProject.name}
                  </h3>
                  <p className="text-xs italic text-slate-500 leading-normal">
                    "{activeProject.motto || "United we stand, building together."}"
                  </p>
                </div>

                {/* QR Symbol Box */}
                <div className="p-4 bg-slate-950 rounded-2xl">
                  <QrCode className="w-20 h-20 text-white" />
                </div>

                {/* Clear Payment Details */}
                <div className="p-4 bg-emerald-50 rounded-2xl space-y-1.5 w-full text-xs border border-emerald-100">
                  <p className="font-extrabold text-[10px] tracking-wider uppercase text-emerald-800">Lipa Na M-PESA Paybill</p>
                  <p className="font-mono font-black text-slate-800 text-lg leading-none">
                    Paybill: {activeProject.paybillNumber || "N/A"}
                  </p>
                  <p className="font-mono font-black text-slate-700 text-xs">
                    Account: {activeProject.accountReference || "N/A"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons as requested: Print A4 Flyer, Print A5 Flyer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-850">
            <button
              onClick={() => handlePrint("A4")}
              className="flex-1 min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
              id="flyer-btn-print-a4"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Print A4 Flyer
            </button>
            <button
              onClick={() => handlePrint("A5")}
              className="flex-1 min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
              id="flyer-btn-print-a5"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Print A5 Flyer
            </button>
          </div>
        </div>

        {/* SECTION 3 — PUBLIC CAMPAIGN PAGE */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-6" id="share-section-public-page">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white">Public Campaign Page</h2>
            </div>
            <p className="text-xs text-slate-400">
              Share your live fundraising page so supporters can follow progress and contribute confidently.
            </p>
          </div>

          {/* Large touch friendly Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
              id="public-page-btn-copy"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? "Link Copied!" : "Copy Link"}
            </button>
            
            <a
              href={publicLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
              id="public-page-btn-open"
            >
              <ExternalLink className="w-4 h-4" />
              Open Campaign Page
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
