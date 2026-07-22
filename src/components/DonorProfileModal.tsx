import React, { useState } from "react";
import { X, Calendar, Phone, Mail, Award, Coins, TrendingUp, Sparkles, Receipt, ArrowUpRight } from "lucide-react";
import { Contribution, Project } from "../types";
import { getDonorProfileStats } from "../utils/donor";

interface DonorProfileModalProps {
  phone: string | null;
  isOpen: boolean;
  onClose: () => void;
  contributions: Contribution[];
  projects: Project[];
}

export default function DonorProfileModal({
  phone,
  isOpen,
  onClose,
  contributions,
  projects
}: DonorProfileModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !phone) return null;

  const stats = getDonorProfileStats(phone, contributions);

  // Filter history based on local search term
  const filteredHistory = stats.history.filter(tx => 
    tx.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCampaignName = (projectId: string) => {
    const p = projects.find(proj => proj.id === projectId);
    return p ? p.name : "Church Renovation Drive";
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
      }) + " at " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" id="donor-profile-modal-overlay">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header Block */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
              title="Close Profile"
              id="close-donor-profile-btn"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-extrabold flex items-center justify-center text-xl uppercase shadow-inner">
              {stats.fullName.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-sans font-black tracking-tight uppercase">{stats.fullName}</h3>
                {stats.totalContributions > 1 ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Returning Donor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    First Contribution
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 font-mono flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" /> {stats.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Bento Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Amount Given</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-2">
                KES {stats.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Donations</span>
              <span className="text-lg font-black text-slate-800 font-mono mt-2">
                {stats.totalContributions} times
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Average Donation</span>
              <span className="text-lg font-black text-slate-800 font-mono mt-2">
                KES {Math.round(stats.averageGift).toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Largest Contribution</span>
              <span className="text-lg font-black text-indigo-600 font-mono mt-2">
                KES {stats.largestGift.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Lifespan Stats Card */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
            <div className="pb-3 sm:pb-0">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> First Contribution Date
              </span>
              <span className="text-xs font-semibold text-slate-700 block">
                {formatDateTime(stats.firstContribution)}
              </span>
            </div>
            <div className="pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Latest Contribution Date
              </span>
              <span className="text-xs font-semibold text-slate-700 block">
                {formatDateTime(stats.latestContribution)}
              </span>
            </div>
          </div>

          {/* Supported Campaigns list */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Campaigns Supported</h4>
            <div className="flex flex-wrap gap-2">
              {stats.campaignsSupported.length > 0 ? (
                stats.campaignsSupported.map(campaignId => (
                  <span 
                    key={campaignId}
                    className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    {getCampaignName(campaignId)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-450 italic">None recorded</span>
              )}
            </div>
          </div>

          {/* History ledger with search */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Contribution History Ledger</h4>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Tx Code..."
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px]"
              />
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-150">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((tx) => (
                  <div key={tx.id} className="p-4 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 tracking-tight">{tx.transactionCode}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 max-w-[120px] truncate" title={getCampaignName(tx.projectId)}>
                          {getCampaignName(tx.projectId)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDateTime(tx.timestamp || tx.transactionTime || "")}</p>
                      {tx.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">"{tx.notes}"</p>}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-emerald-600 block">KES {tx.amount.toLocaleString()}</span>
                      <span className="text-[9px] text-emerald-500 font-bold block uppercase mt-0.5">VERIFIED OK ✓</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No contributions found matching your search.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
