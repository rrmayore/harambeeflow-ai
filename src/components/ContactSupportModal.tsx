import React, { useState } from "react";
import { 
  X, Building2, Mail, Globe, Clock, Copy, ExternalLink, Check, Headphones, MessageSquareText
} from "lucide-react";

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@harambeeflow.org");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWebsite = () => {
    window.open("https://harambeeflow.org", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative shadow-2xl animate-scale-up space-y-6"
        id="contact-support-modal-container"
      >
        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          id="btn-close-contact-support-x"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Headphones className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase tracking-wider">
                24/7 Harambee Assistance
              </span>
              <h2 className="text-xl font-black text-white" id="contact-support-modal-title">
                Contact Support
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reach out to our dedicated HarambeeFlow support team for help with campaigns, M-PESA integrations, or account questions.
          </p>
        </div>

        {/* Details Card Grid */}
        <div className="space-y-3 text-xs">
          {/* Organization */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-emerald-400 border border-slate-800 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Organization</span>
              <p className="font-bold text-white text-xs truncate">HarambeeFlow Support</p>
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-indigo-400 border border-slate-800 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Email</span>
              <p className="font-mono text-emerald-300 font-bold text-xs truncate">support@harambeeflow.org</p>
            </div>
          </div>

          {/* Website */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-blue-400 border border-slate-800 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Website</span>
              <a 
                href="https://harambeeflow.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-blue-400 hover:underline font-bold text-xs truncate block"
              >
                https://harambeeflow.org
              </a>
            </div>
          </div>

          {/* Support Hours */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-amber-400 border border-slate-800 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Support Hours</span>
              <p className="text-slate-200 font-semibold text-xs">
                Monday–Friday
              </p>
              <p className="text-slate-400 text-[11px] font-mono">
                8:00 AM – 5:00 PM (Africa/Nairobi)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyEmail}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            id="btn-copy-support-email"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Copied Email!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Email</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenWebsite}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
            id="btn-open-support-website"
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span>Open Website</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl border border-slate-800 transition cursor-pointer"
            id="btn-close-support-modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
