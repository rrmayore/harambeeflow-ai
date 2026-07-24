import React, { useState } from "react";
import { IS_SANDBOX } from "../utils/env";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth, ensureAuthPersistence } from "../firebase";
import { Sparkles, Coins, ShieldCheck, Mail, Lock, User, ArrowRight } from "lucide-react";
import { trackAuthEvent } from "../lib/analytics";

interface AuthScreenProps {
  onSuccess: (user: any) => void;
}


const mapAuthErrorToFriendlyMessage = (err: any): string => {
  if (!err || !err.code) return err?.message || "An unexpected error occurred.";
  switch (err.code) {
    case "auth/network-request-failed":
      return "Network unavailable. Please verify your internet connection and try again.";
    case "auth/popup-blocked":
      return "The sign-in window was blocked by your browser's popup blocker. Please allow popups for HarambeeFlow AI or try again.";
    case "auth/popup-closed-by-user":
      return "The Google authentication popup was closed before logging in. Please click 'Continue with Google' again.";
    case "auth/user-disabled":
      return "This account has been deactivated by security administrators. Please reach out to support@harambeeflow.org for assistance.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Access is temporarily locked. You may reset your password or try again in a few minutes.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect credentials. If you have forgotten your password, please check for typos or initiate a password reset.";
    case "auth/invalid-email":
      return "The email format is invalid. Ensure it follows name@domain.com and contains no trailing spaces.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a password with at least 6 characters (including numbers or letters) to harden your security.";
    case "auth/email-already-in-use":
      return "An account with this email is already registered. Please sign in with your email & password, or use Google linking.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email address. Please enter your existing account's password below to link Google Sign-In securely.";
    case "auth/requires-recent-login":
      return "Your session has expired. Please sign out and sign back in to complete this sensitive security modification.";
    default:
      return err.message || "An authentication error occurred. Please try again.";
  }
};

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your official email address above to receive a password reset link.");
      return;
    }
    setError("");
    setResetSuccess("");
    setLoading(true);
    try {
      await ensureAuthPersistence(auth);
      await sendPasswordResetEmail(auth, email.trim());
      setResetSuccess(`Password reset email sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setError(mapAuthErrorToFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Dynamic state for Google popup flow account linking 
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [linkPassword, setLinkPassword] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    if (!auth) {
      setError("Firebase Authentication is currently unavailable.");
      setLoading(false);
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await ensureAuthPersistence(auth);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Automatically create or update the userProfiles document in Firestore
      try {
        const userProfileRef = doc(db, "userProfiles", user.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        const now = new Date().toISOString();

        if (!userProfileSnap.exists()) {
          // First login: Create user profile document
          const verifiedStatus = IS_SANDBOX ? true : user.emailVerified;

          const profileData = {
            id: user.uid,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Ecosystem User",
            photoURL: user.photoURL || "",
            createdAt: now,
            lastLogin: now,
            authProvider: "google",
            provider: "google",
            emailVerified: verifiedStatus,
            hasCompletedWelcomeTour: false,
            activeCampaignId: null,
            role: "organizer",
            language: "en",
            country: "KE",
            timezone: "Africa/Nairobi",
            organizationCount: 0,
            campaignCount: 0,
            onboarded: false,
            onboardingComplete: false,
            updatedAt: now
          };

          await setDoc(userProfileRef, profileData);

          // Save doc to legacy users collection
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Ecosystem User",
            photoURL: user.photoURL || "",
            createdAt: now,
            lastLogin: now,
            provider: "google",
            emailVerified: verifiedStatus,
            role: "organizer",
            language: "en",
            country: "KE",
            timezone: "Africa/Nairobi",
            organizationCount: 0,
            campaignCount: 0
          });

          await trackAuthEvent("registration", "google", user.uid, user.email || "");
        } else {
          // Returning Google user: Only update specific lastLogin, photoURL, displayName, and provider metadata
          const existingData = userProfileSnap.data();
          const verifiedStatus = IS_SANDBOX ? true : user.emailVerified;

          await setDoc(userProfileRef, {
            lastLogin: now,
            photoURL: user.photoURL || existingData.photoURL || "",
            displayName: user.displayName || existingData.displayName || "Ecosystem User",
            provider: "google",
            emailVerified: verifiedStatus,
            updatedAt: now
          }, { merge: true });

          // Also update 'users' collection
          await setDoc(doc(db, "users", user.uid), {
            lastLogin: now,
            photoURL: user.photoURL || "",
            displayName: user.displayName || "Ecosystem User",
            provider: "google",
            emailVerified: verifiedStatus
          }, { merge: true });

          await trackAuthEvent("login", "google", user.uid, user.email || "");
        }
      } catch (dbErr: any) {
        console.error("Database user profile creation error:", dbErr);
      }

      onSuccess(user);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/account-exists-with-different-credential") {
        setPendingCredential(err);
        setError("An account already exists with this email address. Please enter your existing account's password below to link Google Sign-In securely.");
      } else {
        setError(mapAuthErrorToFriendlyMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!linkPassword) {
      setError("Please enter your existing password.");
      setLoading(false);
      return;
    }

    try {
      const emailToLink = pendingCredential.customData?.email;
      if (!emailToLink) {
        throw new Error("No pending email detected.");
      }

      // 1. Sign in with the existing email and password
      const userCredential = await signInWithEmailAndPassword(auth, emailToLink, linkPassword);
      const user = userCredential.user;

      // 2. Link the google credential
      const googleCredential = GoogleAuthProvider.credentialFromError(pendingCredential);
      if (googleCredential) {
        await linkWithCredential(user, googleCredential);

        // Update the userProfile with authProvider = "google + email"
        try {
          await setDoc(doc(db, "userProfiles", user.uid), {
            authProvider: "google + email",
            profilePhotoURL: auth.currentUser?.photoURL || "",
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.error("Error updating userProfile after link:", dbErr);
        }

        await trackAuthEvent("link", "google + email", user.uid, user.email || "");
      }

      onSuccess(user);
    } catch (err: any) {
      console.error("Account linking error:", err);
      setError(mapAuthErrorToFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
      // Set persistence with cascading fallback so session survives browser refreshes or storage limits
      await ensureAuthPersistence(auth);

      if (isRegister) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        const now = new Date().toISOString();

        // Save doc to legacy users collection
        try {
          const verifiedStatus = IS_SANDBOX ? true : user.emailVerified;

          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email || email.trim(),
            displayName: displayName.trim() || user.displayName || "Ecosystem User",
            photoURL: "",
            createdAt: now,
            lastLogin: now,
            provider: "email",
            emailVerified: verifiedStatus,
            role: "organizer",
            language: "en",
            country: "KE",
            timezone: "Africa/Nairobi",
            organizationCount: IS_SANDBOX ? 1 : 0,
            campaignCount: 0
          });

          if (IS_SANDBOX) {
            const orgId = `org_${user.uid}_default`;
            const payAccountId = `pay_${user.uid}_default`;
            const userDisplayName = displayName.trim() || "Ecosystem User";

            await setDoc(doc(db, "organizations", orgId), {
              id: orgId,
              name: `${userDisplayName} Association`,
              country: "KE",
              currency: "KES",
              contactEmail: user.email || email.trim(),
              contactPhone: "254712345678",
              category: "Community/Church",
              createdAt: now
            });

            await setDoc(doc(db, "paymentAccounts", payAccountId), {
              id: payAccountId,
              organizationId: orgId,
              tillNumber: "174379",
              paybillNumber: "",
              accountName: "HarambeeFlow Demo Sandbox",
              businessName: "HarambeeFlow Demo Sandbox",
              accountReferenceFormat: "FIRST_NAME",
              createdBy: user.uid,
              createdAt: now
            });

            await setDoc(doc(db, "userProfiles", user.uid), {
              uid: user.uid,
              id: user.uid,
              displayName: userDisplayName,
              email: user.email || email.trim(),
              profilePhotoURL: "",
              authProvider: "email",
              onboardingComplete: false,
              onboarded: false,
              createdAt: now,
              lastLogin: now,
              provider: "email",
              emailVerified: true,
              role: "organizer",
              language: "en",
              country: "KE",
              timezone: "Africa/Nairobi",
              organizationCount: 1,
              campaignCount: 0,
              updatedAt: now
            }, { merge: true });

            const defaultFormState = {
              orgName: `${userDisplayName} Association`,
              orgType: "Church",
              orgLogo: "",
              orgDescription: "A modern sandbox outreach and fundraising group created automatically in Test Mode.",
              orgCounty: "Nairobi",
              orgPhone: "254712345678",
              orgEmail: user.email || email.trim(),
              orgWebsite: "",
              tillNumber: "174379",
              paybillNumber: "",
              accountName: "HarambeeFlow Demo Sandbox",
              accountReferenceFormat: "FIRST_NAME",
              trustAccepted: true,
              fundraiserTitle: "Community Sandbox Fundraiser",
              fundraiserGoal: "500000",
              fundraiserDesc: "A default sandbox campaign built to explore real-time MPESA triggers, custom ledgers, and automated reconciliation.",
              fundraiserCategory: "Community/Church",
              fundraiserEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              fundraiserSlug: "sandbox-drive"
            };

            localStorage.setItem(`onboarding_form_${user.uid}`, JSON.stringify(defaultFormState));
            localStorage.setItem(`onboarding_step_${user.uid}`, "5");
            localStorage.setItem(`demo_profile_${user.uid}`, JSON.stringify({
              uid: user.uid,
              id: user.uid,
              displayName: userDisplayName,
              email: user.email || email.trim(),
              profilePhotoURL: "",
              authProvider: "email",
              onboardingComplete: false,
              onboarded: false,
              createdAt: now,
              lastLogin: now,
              provider: "email",
              emailVerified: true,
              role: "organizer",
              language: "en",
              country: "KE",
              timezone: "Africa/Nairobi",
              organizationCount: 1,
              campaignCount: 0,
              updatedAt: now
            }));
          } else {
            // Also set userProfiles doc for new registrations
            await setDoc(doc(db, "userProfiles", user.uid), {
              uid: user.uid,
              id: user.uid,
              displayName: displayName.trim() || user.displayName || "Ecosystem User",
              email: user.email || email.trim(),
              profilePhotoURL: "",
              authProvider: "email",
              onboardingComplete: false,
              onboarded: false,
              hasCompletedWelcomeTour: false,
              activeCampaignId: null,
              createdAt: now,
              lastLogin: now,
              provider: "email",
              emailVerified: user.emailVerified,
              role: "organizer",
              language: "en",
              country: "KE",
              timezone: "Africa/Nairobi",
              organizationCount: 0,
              campaignCount: 0,
              updatedAt: now
            }, { merge: true });

            // Send verification email
            await sendEmailVerification(user);
          }

          await trackAuthEvent("registration", "email", user.uid, user.email || "");
        } catch (dbErr: any) {
          console.error("Database user profile creation error:", dbErr);
        }

        onSuccess(user);
      } else {
        // Login user
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        
        // Update last login
        try {
          const verifiedStatus = IS_SANDBOX ? true : user.emailVerified;

          await setDoc(doc(db, "userProfiles", user.uid), {
            lastLogin: new Date().toISOString(),
            emailVerified: verifiedStatus,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          await setDoc(doc(db, "users", user.uid), {
            lastLogin: new Date().toISOString(),
            emailVerified: verifiedStatus
          }, { merge: true });

          await trackAuthEvent("login", "email", user.uid, user.email || "");
        } catch (err) {
          console.error("Failed to update lastLogin status on login:", err);
        }

        onSuccess(user);
      }
    } catch (err: any) {
      console.error("Auth helper error:", err);
      setError(mapAuthErrorToFriendlyMessage(err));
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
          <div className="flex flex-col items-center justify-center leading-tight">
            <h2 className="text-3xl font-sans font-black tracking-tight text-white">
              HarambeeFlow
            </h2>
            <span className="text-sm font-mono font-medium text-emerald-400 tracking-wide mt-1">
              AI Treasurer
            </span>
          </div>
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

        {/* Reset Success Alert Panel */}
        {resetSuccess && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed font-mono animate-fade-in">
            <span className="text-emerald-400 font-bold">✓</span>
            <span className="flex-1 shrink-0">{resetSuccess}</span>
          </div>
        )}

        {pendingCredential ? (
          <form onSubmit={handleLinkAccount} className="space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed font-sans">
              <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="text-emerald-400">🔗</span> Existing Account Detected
              </p>
              An account with the email <strong className="text-white">{pendingCredential.customData?.email}</strong> already exists on this platform. 
              Please enter your existing password below to link Google Sign-In and log in securely.
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Enter your password to link
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
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
                  <span>Link & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingCredential(null);
                setLinkPassword("");
                setError("");
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white mt-2 transition cursor-pointer font-mono"
            >
              Cancel & Use Different Account
            </button>
          </form>
        ) : (
          <>
            {/* Continue with Google button */}
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-900 border border-slate-200 font-bold rounded-xl shadow-sm transition cursor-pointer text-xs select-none"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-800"></div>
                <span className="px-4 text-[9px] uppercase font-mono font-bold text-slate-500 tracking-widest">
                  OR CONTINUE WITH EMAIL
                </span>
                <div className="flex-1 border-t border-slate-800"></div>
              </div>
            </div>

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
                    placeholder="e.g. info@harambeeflow.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Secure Account Password
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-mono text-emerald-400 hover:underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
          </>
        )}

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
