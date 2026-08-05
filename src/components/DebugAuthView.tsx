import React from "react";
import { IS_SANDBOX, IS_PRODUCTION, RUNTIME_ENV_INFO } from "../utils/env";
import { REQUIRE_EMAIL_VERIFICATION } from "../config/authConfig";
import { auth } from "../firebase";
import { ShieldCheck, ShieldAlert, Terminal, RefreshCw, ArrowLeft, ExternalLink, CheckCircle2, XCircle, Info } from "lucide-react";

interface DebugAuthViewProps {
  currentUser: any;
  userProfile: any;
  activeTab: string;
  isDemoMode: boolean;
  devSettings: any;
  onReturnToDashboard: () => void;
}

export default function DebugAuthView({
  currentUser,
  userProfile,
  activeTab,
  isDemoMode,
  devSettings,
  onReturnToDashboard,
}: DebugAuthViewProps) {
  const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "unknown";
  
  const isEmailProvider = currentUser?.providerData?.some((p: any) => p.providerId === "password");
  const rawEmailVerified = currentUser?.emailVerified ?? false;
  const profileEmailVerified = userProfile?.emailVerified ?? null;
  
  const sandboxMode = IS_SANDBOX;
  const verified = !REQUIRE_EMAIL_VERIFICATION || sandboxMode ? true : (rawEmailVerified || false);
  const isEmailUnverified = REQUIRE_EMAIL_VERIFICATION && currentUser && !verified && isEmailProvider;
  const verificationRequired = isEmailUnverified && !isDemoMode;

  let activeComponent = "Main Dashboard View";
  let redirectReason = "Access Granted: Sandbox mode active (IS_SANDBOX=true) or email verified.";
  let exactFile = "src/App.tsx";
  let exactFunction = "App (Authentication Guard Render Logic)";
  let exactLine = "2271";

  if (!currentUser) {
    activeComponent = "AuthScreen";
    redirectReason = "No authenticated user session found.";
    exactLine = "2227";
  } else if (verificationRequired) {
    activeComponent = "EmailVerificationScreen";
    redirectReason = "User signed in via email/password, email is unverified, and Sandbox Mode is FALSE (Production domain harambeeflow.org).";
    exactLine = "2272";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-mono relative">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Authentication & Runtime Diagnostics
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  IS_SANDBOX ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}>
                  {RUNTIME_ENV_INFO.mode}
                </span>
              </h1>
              <p className="text-xs text-slate-400">Live inspection of environment guards, Firebase auth, and routing gates.</p>
            </div>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Application
          </button>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
          verificationRequired 
            ? "bg-red-950/40 border-red-500/40 text-red-200"
            : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
        }`}>
          {verificationRequired ? <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" /> : <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />}
          <div className="space-y-1">
            <h2 className="font-bold text-sm">
              {verificationRequired ? "EMAIL VERIFICATION GUARD IS ACTIVE (BLOCKING)" : "EMAIL VERIFICATION GUARD IS BYPASSED / SATISFIED"}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">{redirectReason}</p>
          </div>
        </div>

        {/* Grid Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment & Domain Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-sky-400" /> Environment Detection
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hostname:</span>
                <span className="text-white font-bold">{hostname}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Environment Mode:</span>
                <span className="text-emerald-400 font-bold">{RUNTIME_ENV_INFO.mode}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IS_SANDBOX:</span>
                <span className={IS_SANDBOX ? "text-amber-400 font-bold" : "text-slate-400"}>{String(IS_SANDBOX)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IS_PRODUCTION:</span>
                <span className={IS_PRODUCTION ? "text-emerald-400 font-bold" : "text-slate-400"}>{String(IS_PRODUCTION)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Detection Reason:</span>
                <span className="text-slate-300 text-[11px] max-w-[200px] text-right">{RUNTIME_ENV_INFO.reason}</span>
              </div>
            </div>
          </div>

          {/* Authentication Values Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-amber-400" /> Authentication Session
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Firebase User UID:</span>
                <span className="text-white font-mono text-[11px] truncate max-w-[180px]">{currentUser ? currentUser.uid : "None"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Firebase Email:</span>
                <span className="text-white truncate max-w-[180px]">{currentUser ? currentUser.email : "None"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Firebase emailVerified:</span>
                <span className={rawEmailVerified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {String(rawEmailVerified)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Firestore Profile Loaded:</span>
                <span className={userProfile ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  {userProfile ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Firestore emailVerified:</span>
                <span className={profileEmailVerified ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  {profileEmailVerified === null ? "N/A" : String(profileEmailVerified)}
                </span>
              </div>
            </div>
          </div>

          {/* Gate Computation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-emerald-400" /> Gate Decision & Redirect Source
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Computed `verified`</div>
                <div className={`text-base font-bold mt-1 ${verified ? "text-emerald-400" : "text-red-400"}`}>
                  {String(verified)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">`isEmailUnverified`</div>
                <div className={`text-base font-bold mt-1 ${isEmailUnverified ? "text-red-400" : "text-emerald-400"}`}>
                  {String(isEmailUnverified)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Active Component</div>
                <div className="text-sm font-bold text-sky-300 mt-1 truncate">
                  {activeComponent}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Current Route (`activeTab`)</div>
                <div className="text-sm font-bold text-amber-300 mt-1 truncate">
                  {activeTab}
                </div>
              </div>
            </div>

            {/* Exact Location Source Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Gate Location & Rule Trace:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300">
                <div><span className="text-slate-500">File:</span> <code className="text-sky-300">{exactFile}</code></div>
                <div><span className="text-slate-500">Function:</span> <code className="text-amber-300">{exactFunction}</code></div>
                <div><span className="text-slate-500">Line Number:</span> <code className="text-emerald-300">{exactLine}</code></div>
              </div>
              <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                <span className="text-slate-500 font-bold">Gate Condition: </span>
                <code className="text-amber-200">
                  {`if (isEmailUnverified && !isDemoMode) { return <EmailVerificationScreen ... /> }`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
