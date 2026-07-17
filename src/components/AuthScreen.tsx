import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Sparkles, Coins, ShieldCheck, Mail, Lock, User, ArrowRight } from "lucide-react";

interface AuthScreenProps {
  onSuccess: (user: any) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!auth) {
      setError("Firebase Authentication is currently unavailable. This is usually caused by browser security settings restricting IndexedDB or third-party cookies in the preview panel. Try opening the application in a new tab.");
      setLoading(false);
      return;
    }

    try {
      // Set persistence to LOCAL so session survives browser refreshes
      await setPersistence(auth, browserLocalPersistence);

      if (isRegister) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Save doc to Firestore database users collection
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email || email.trim(),
            displayName: displayName.trim() || user.displayName || "Ecosystem User",
            createdAt: new Date().toISOString()
          });
        } catch (dbErr: any) {
          console.error("Database user profile creation error:", dbErr);
        }

        onSuccess(user);
      } else {
        // Login user
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        onSuccess(userCredential.user);
      }
    } catch (err: any) {
      console.error("Auth helper error:", err);
      let localizedError = err.message;
      if (err.code === "auth/email-already-in-use") {
        localizedError = "This email is already registered. Please login instead.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        localizedError = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/weak-password") {
        localizedError = "Password should be at least 6 characters long.";
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 w-full relative overflow-y-auto font-sans">
      {/* Soft Background Accents */}
      <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-scale-up">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg text-white mb-2">
            <Coins className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Harambee<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Flow</span> AI
          </h2>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-mono font-bold">
            {isRegister ? "Create secure account" : "Authorized fintech desk login"}
          </p>
        </div>

        {/* Error Alert Panel */}
        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-mono animate-fade-in">
            <span className="text-rose-400 font-bold">⚠️</span>
            <span className="flex-1 shrink-0">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Full Name (Treasurer/Admin)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Kipchoge Keino"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Official Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="e.g. treasurer@harambeeflow.or.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Secure Account Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition cursor-pointer text-xs mt-3 select-none"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Complete Account Registration" : "Sign In to Ecosystem"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col gap-3 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono transition inline-flex items-center justify-center gap-1 cursor-pointer bg-transparent border-0"
          >
            {isRegister ? "Already registered? Sign In" : "Need an official portal account? Register"}
          </button>
        </div>

        {/* Local Verification Guidelines for email/password */}
        <div className="mt-8 p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-500 leading-normal">
            <strong>M-PESA sandbox security guidelines:</strong> Ensure your project has Email/Password authentication enabled in the Firebase Console.
          </div>
        </div>
      </div>
    </div>
  );
}
