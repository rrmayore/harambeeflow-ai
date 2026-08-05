import React, { useState } from "react";
import { IS_SANDBOX, RUNTIME_ENV_INFO } from "../utils/env";
import { REQUIRE_EMAIL_VERIFICATION } from "../config/authConfig";
import { Shield, ShieldAlert, ShieldCheck, Terminal, ChevronDown, ChevronUp, RefreshCw, X } from "lucide-react";

interface DebugHUDProps {
  currentUser: any;
  userProfile: any;
  activeTab: string;
  isDemoMode: boolean;
  devSettings: any;
  onOpenDebugPage?: () => void;
}

export default function DebugHUD({
  currentUser,
  userProfile,
  activeTab,
  isDemoMode,
  devSettings,
  onOpenDebugPage,
}: DebugHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "unknown";
  
  // Calculate verification necessity
  const isEmailProvider = currentUser?.providerData?.some((p: any) => p.providerId === "password");
  const rawEmailVerified = currentUser?.emailVerified ?? false;
  const profileEmailVerified = userProfile?.emailVerified ?? null;
  const isBypassed = !REQUIRE_EMAIL_VERIFICATION || IS_SANDBOX || devSettings?.skipEmailVerification || isDemoMode;
  
  const verificationRequired = currentUser && isEmailProvider && !rawEmailVerified && !isBypassed;
  
  let DecisionComponent = "Dashboard / Main View";
  let DecisionReason = "Access Granted: Sandbox mode active or user email verified.";

  if (!currentUser) {
    DecisionComponent = "AuthScreen";
    DecisionReason = "No authenticated user.";
  } else if (verificationRequired) {
    DecisionComponent = "EmailVerificationScreen";
    DecisionReason = "User signed in via email, email is unverified, and Sandbox mode is FALSE.";
  } else if (activeTab === "public" || activeTab === "public-pages") {
    DecisionComponent = "PublicCampaignPageView";
    DecisionReason = "Public route active.";
  }

  return (
    <div className="fixed top-3 right-3 z-[9999] font-sans text-xs select-none">
      {/* HUD Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all hover:scale-105 ${
            IS_SANDBOX
              ? "bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-amber-950/40"
              : "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40"
          }`}
          title="Click to toggle Runtime Diagnostics HUD"
        >
          <span className={`w-2 h-2 rounded-full ${IS_SANDBOX ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="font-mono font-bold tracking-wide">
            {IS_SANDBOX ? "SANDBOX" : "PRODUCTION"} HUD
          </span>
          <Terminal className="w-3.5 h-3.5 opacity-70" />
        </button>
      )}

      {/* Expanded HUD Panel */}
      {isOpen && (
        <div className="w-80 md:w-96 bg-slate-900/95 text-slate-200 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-xs text-white">Runtime Environment HUD</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                {minimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="p-3.5 space-y-3 font-mono text-[11px] max-h-[80vh] overflow-y-auto">
              {/* Domain & Mode */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Host & Mode</div>
                <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-semibold truncate max-w-[180px]" title={hostname}>
                    {hostname}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      IS_SANDBOX
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {IS_SANDBOX ? "SANDBOX MODE" : "PRODUCTION"}
                  </span>
                </div>
              </div>

              {/* Authentication Status */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Auth Status</div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">User:</span>
                    <span className="text-white font-medium truncate max-w-[200px]">
                      {currentUser ? currentUser.email || currentUser.uid : "Not Authenticated"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Auth Email Verified:</span>
                    <span className={rawEmailVerified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {rawEmailVerified ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Profile Firestore Verified:</span>
                    <span className={profileEmailVerified ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {profileEmailVerified === null ? "N/A" : profileEmailVerified ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guard Outcome */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Verification Requirement</div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Required?:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        verificationRequired
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {verificationRequired ? "YES (BLOCKING)" : "NO (BYPASSED)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Active Component:</span>
                    <span className="text-sky-300 font-bold truncate max-w-[180px]">{DecisionComponent}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed">
                    <span className="text-slate-500">Reason: </span>
                    {DecisionReason}
                  </div>
                </div>
              </div>

              {/* Active Tab & Full Page Link */}
              <div className="flex items-center justify-between text-[10px] bg-slate-950/40 px-2 py-1.5 rounded border border-slate-800/50">
                <span className="text-slate-400">Active View/Tab:</span>
                <span className="text-amber-300 font-mono font-bold">{activeTab}</span>
              </div>
              {onOpenDebugPage && (
                <button
                  onClick={onOpenDebugPage}
                  className="w-full py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg font-bold text-[10px] tracking-wide transition-all"
                >
                  Open Full Diagnostics Dashboard (/debug/auth)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
