import React from "react";
import { AlertCircle, Target, ArrowRight, Plus } from "lucide-react";
import { Project } from "../types";

interface DuplicateCampaignPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  onContinueManaging: () => void;
  onCreateAnother: () => void;
}

export default function DuplicateCampaignPromptModal({
  isOpen,
  onClose,
  activeProject,
  onContinueManaging,
  onCreateAnother
}: DuplicateCampaignPromptModalProps) {
  if (!isOpen) return null;

  const currentAmount = Number(activeProject?.currentAmount || 0);
  const targetAmount = Number(activeProject?.targetAmount || 0);

  return (
    <div 
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
      id="duplicate-campaign-prompt-overlay"
    >
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up p-6 space-y-6 relative">
        
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-sans font-black tracking-tight text-white">
              Active Fundraiser Exists
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Confirm how you would like to proceed
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <p className="text-sm text-slate-200 font-medium">
            You already have an active fundraiser.
          </p>

          {/* Current Fundraiser Highlight Card */}
          {activeProject && (
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Current fundraiser:
              </span>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-extrabold text-white truncate">
                  {activeProject.name}
                </h4>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-mono font-bold rounded-md shrink-0">
                  {activeProject.status || "Active"}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Raised: <strong className="text-white">KES {currentAmount.toLocaleString()}</strong></span>
                <span>Goal: <strong className="text-slate-300">KES {targetAmount.toLocaleString()}</strong></span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Would you like to:
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Primary Action Button (Default Focused) */}
          <button
            onClick={() => {
              onContinueManaging();
              onClose();
            }}
            autoFocus
            className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            id="continue-managing-btn"
          >
            <ArrowRight className="w-4 h-4 text-slate-950" />
            <span>Continue Managing It (Primary)</span>
          </button>

          {/* Secondary Action Button */}
          <button
            onClick={() => {
              onCreateAnother();
              onClose();
            }}
            className="w-full py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            id="create-another-btn"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Create Another Fundraiser (Secondary)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
