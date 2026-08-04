import React, { useState, useEffect } from "react";
import { IS_SANDBOX } from "../utils/env";
import { motion } from "motion/react";
import { sendEmailVerification, updateEmail, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Mail, ShieldCheck, ArrowRight, RefreshCw, LogOut, Edit2, Check } from "lucide-react";

interface EmailVerificationScreenProps {
  currentUser: any;
  onVerified: () => void;
}


export default function EmailVerificationScreen({ currentUser, onVerified }: EmailVerificationScreenProps) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(currentUser?.email || "");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [checking, setChecking] = useState(false);

  const sandboxMode = IS_SANDBOX;

  // Unified computed verification value
  const verified = sandboxMode ? true : (currentUser?.emailVerified || auth?.currentUser?.emailVerified || false);

  // Immediately skip if already verified or in Sandbox Mode
  useEffect(() => {
    if (verified) {
      onVerified();
    }
  }, [verified, onVerified]);

  // Poll for verification status
  useEffect(() => {
    if (!currentUser || verified) return;

    const intervalId = setInterval(async () => {
      try {
        setChecking(true);
        await currentUser.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(intervalId);
          onVerified();
        }
      } catch (err) {
        console.error("Error checking verification status:", err);
      } finally {
        setChecking(false);
      }
    }, 4000); // Check every 4 seconds

    return () => clearInterval(intervalId);
  }, [currentUser, onVerified]);

  const handleResend = async () => {
    if (!currentUser) return;
    setError("");
    setResending(true);
    setResendSuccess(false);
    try {
      if (IS_SANDBOX) {
        setResendSuccess(true);
        setSuccessMsg("Verification email sent successfully!");
        setTimeout(() => setResendSuccess(false), 8000);
        return;
      }
      await sendEmailVerification(currentUser);
      setResendSuccess(true);
      setSuccessMsg("Verification link sent! Please check your spam folder if you do not see it shortly.");
      setTimeout(() => setResendSuccess(false), 8000);
    } catch (err: any) {
      console.error("Failed to resend verification:", err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few moments before trying again.");
      } else {
        setError(err.message || "Failed to send verification email.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newEmail || newEmail.trim() === currentUser.email) {
      setIsChangingEmail(false);
      return;
    }
    setError("");
    setUpdating(true);
    setSuccessMsg("");
    try {
      await updateEmail(currentUser, newEmail.trim());
      await sendEmailVerification(currentUser);
      setSuccessMsg("Email successfully updated, and a new verification link has been dispatched!");
      setIsChangingEmail(false);
    } catch (err: any) {
      console.error("Failed to update email:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("This action requires a recent login. Please sign out and sign back in to modify your email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format. Please check for typos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use by another account.");
      } else {
        setError(err.message || "Failed to update email address.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const triggerManualCheck = async () => {
    setError("");
    setChecking(true);
    try {
      if (IS_SANDBOX) {
        onVerified();
        return;
      }
      await currentUser.reload();
      if (auth.currentUser?.emailVerified) {
        onVerified();
      } else {
        setError("Email is still unverified. Please check your inbox and click the link in the email.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (verified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 w-full relative overflow-y-auto font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-sky-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg text-white mb-2">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Verify Your Workspace Email
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            We sent a secure verification email to <strong className="text-white font-mono">{currentUser?.email}</strong>. 
            Please check your inbox and confirm your email to activate your desk.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-mono">
            <span className="text-rose-400 font-bold">⚠️</span>
            <span className="flex-1 shrink-0">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-sans">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1 shrink-0">{successMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {isChangingEmail ? (
            <form onSubmit={handleChangeEmail} className="space-y-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl animate-fade-in">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Update Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="submit"
                  disabled={updating}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center min-h-[38px] disabled:bg-emerald-800"
                >
                  {updating ? "Saving..." : "Update"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingEmail(false)}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono transition bg-transparent border-0"
              >
                Cancel Changes
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={triggerManualCheck}
                disabled={checking}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs select-none min-h-[44px]"
              >
                {checking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>I've Verified My Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold rounded-xl transition cursor-pointer text-xs select-none min-h-[44px]"
              >
                {resending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Resend Verification Email</span>
                )}
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-850 text-[11px] font-mono">
            <button
              onClick={() => {
                setIsChangingEmail(true);
                setNewEmail(currentUser?.email || "");
                setError("");
                setSuccessMsg("");
              }}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Change Email
            </button>

            <button
              onClick={handleSignOut}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="mt-8 p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[10px] text-slate-500 leading-normal">
            <strong>Security Protection:</strong> Unverified accounts cannot create fundraisers or access organization committee reports to prevent platform spoofing.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
