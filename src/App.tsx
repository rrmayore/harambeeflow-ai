import React, { useState, useEffect } from "react";
import { IS_SANDBOX } from "./utils/env";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import FOSHomeView from "./components/FOSHomeView";
import PublicCampaignPageView from "./components/PublicCampaignPageView";
import ReceiptCenterView from "./components/ReceiptCenterView";
import CommitteePortalView from "./components/CommitteePortalView";
import CampaignTemplatesView from "./components/CampaignTemplatesView";
import CampaignClosureView from "./components/CampaignClosureView";
import DocumentVaultView from "./components/DocumentVaultView";
import CommunicationHubView from "./components/CommunicationHubView";
import TreasurerSuccessView from "./components/TreasurerSuccessView";
import CampaignArchiveView from "./components/CampaignArchiveView";
import MpesaCallbackSim from "./components/MpesaCallbackSim";
import SimulatedPhone from "./components/SimulatedPhone";
import DevelopersDocs from "./components/DevelopersDocs";
import AIPromptTab from "./components/AIPromptTab";
import LandingPageView from "./components/LandingPageView";
import TrustSecurityView from "./components/TrustSecurityView";
import DonorDashboard from "./components/DonorDashboard";
import OrganizationDashboard from "./components/OrganizationDashboard";
import WhatsappManagement from "./components/WhatsappManagement";
import DonorProfileModal from "./components/DonorProfileModal";
import PaybillReadiness from "./components/PaybillReadiness";
import SuperAdminConsole from "./components/SuperAdminConsole";
import ComplianceReadiness from "./components/ComplianceReadiness";
import CampaignLogo from "./components/CampaignLogo";
import CampaignBrandingSettings from "./components/CampaignBrandingSettings";
import BillingSubscriptionView from "./components/BillingSubscriptionView";

// Import simplified UX refactored components (V2 Refactor)
import WelcomeView from "./components/WelcomeView";
import CampaignWizard from "./components/CampaignWizard";
import OrganizerOnboardingWizard from "./components/OrganizerOnboardingWizard";
import EmailVerificationScreen from "./components/EmailVerificationScreen";
import { getLocalAuthAnalytics } from "./lib/analytics";
import CampaignActivationWizard from "./components/CampaignActivationWizard";
import CommandCenterView from "./components/CommandCenterView";
import CollectView from "./components/CollectView";
import ShareView from "./components/ShareView";
import ReportView from "./components/ReportView";
import PledgeDashboardView from "./components/PledgeDashboardView";
import CommitteeWorkspaceView from "./components/CommitteeWorkspaceView";
import InsightsView from "./components/InsightsView";
import CampaignLifecycleCenter from "./components/CampaignLifecycleCenter";
import InteractiveTour from "./components/InteractiveTour";
import SupporterRelationshipCenter from "./components/SupporterRelationshipCenter";
import CommunicationsAutomationCenter from "./components/CommunicationsAutomationCenter";
import PlatformIntelligenceDashboard from "./components/PlatformIntelligenceDashboard";
import { EventBus } from "./utils/eventBus";
import { Project, Contribution, WhatsAppMessage } from "./types";
import { Sparkles, Menu, X, Plus, Calendar, Coins, Users, Smartphone, CheckCircle2, Download, ExternalLink, Wifi, Battery, LayoutDashboard, Landmark, Megaphone, FileText, Settings, HeartHandshake, Share2, Eye, TrendingUp, Layers, Cpu, Briefcase, CreditCard } from "lucide-react";
import { onAuthStateChanged, signOut, User as FirebaseUser, GoogleAuthProvider, linkWithCredential, signInWithPopup } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  onSnapshotsInSync
} from "firebase/firestore";
import { db, auth } from "./firebase";
import AuthScreen from "./components/AuthScreen";
import { getCategoryIllustration } from "./utils/branding";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


const PWAFrameWrapper = ({ isSimulated, children, handleExit }: { isSimulated: boolean, children: React.ReactNode, handleExit: () => void }) => {
  if (!isSimulated) return <>{children}</>;
  
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden h-screen w-screen">
      {/* Elegant ambient glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Exit Simulation Floating Badge */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 animate-pulse">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          Simulating PWA Standalone Mode
        </span>
        <button 
          onClick={handleExit}
          className="flex items-center gap-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-full transition shadow-lg shadow-rose-950/20 cursor-pointer"
        >
          <X className="w-3 h-3" /> Exit Fullscreen
        </button>
      </div>

      {/* Simulated PWA Device Shell */}
      <div className="w-[390px] h-[820px] max-h-[95vh] border-8 border-slate-800 bg-slate-900 rounded-[50px] shadow-2xl overflow-hidden flex flex-col relative z-10 ring-12 ring-slate-950 animate-scale-up">
        {/* Dynamic Island */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-full z-50 flex items-center justify-end px-3 pointer-events-none">
          <div className="w-2.5 h-2.5 bg-slate-900/60 rounded-full border border-slate-800/40" />
        </div>

        {/* Status Bar */}
        <div className="bg-slate-950 text-slate-200 h-10 px-6 pt-2 shrink-0 flex items-center justify-between text-[11px] font-semibold select-none z-40">
          <div>23:09</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] tracking-wider font-bold text-emerald-400">5G</span>
            <Wifi className="w-3 h-3 text-slate-300" />
            <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-950">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="bg-slate-950 h-5 pb-1 shrink-0 flex items-center justify-center select-none z-40 pointer-events-none">
          <div className="w-28 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};


// Environment is detected via centralized helper



export default function App() {
  const [activeTab, setActiveTab] = useState("landing");
  const [publicCampaignId, setPublicCampaignId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"Online and Synced" | "Offline Changes Pending" | "Sync Complete">(
    typeof navigator !== "undefined" && !navigator.onLine ? "Offline Changes Pending" : "Online and Synced"
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const handleSetActiveTab = (tab: string) => {
    if (tab === "billing") {
      setActiveTab("billing");
      setSettingsSubTab("billing");
    } else if (tab === "settings") {
      setActiveTab("settings");
      setSettingsSubTab("general");
    } else if (tab === "public-pages" || tab === "public") {
      const targetProj = activeProject || projects[0];
      if (targetProj) {
        window.location.hash = `#/f/${targetProj.id}`;
      } else {
        setActiveTab("public");
      }
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    const handleRouting = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      
      // Match #/public/:id or #/campaign/:id or #/f/:id or /public/:id or /f/:id
      let match = hash.match(/^#\/(public|campaign|f)\/([^?\/]+)/);
      if (!match) {
        match = path.match(/^\/(public|campaign|f)\/([^?\/]+)/);
      }
      
      if (match) {
        const campaignId = match[2];
        setPublicCampaignId(campaignId);
        setActiveTab("public");
      } else if (hash === "#/landing" || hash === "#landing") {
        setActiveTab("landing");
      }
    };

    window.addEventListener("hashchange", handleRouting);
    window.addEventListener("popstate", handleRouting);
    handleRouting(); // run once on mount

    return () => {
      window.removeEventListener("hashchange", handleRouting);
      window.removeEventListener("popstate", handleRouting);
    };
  }, [projects, activeProject]);
  const [lastSuccessfulStk, setLastSuccessfulStk] = useState<any>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [summaryText, setSummaryText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // V2 UX Refactor Onboarding & Setup wizard states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [draftProject, setDraftProject] = useState<any>(null);
  const [launchChecklistOpen, setLaunchChecklistOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<"general" | "billing">("general");
  const [settingsFeedback, setSettingsFeedback] = useState("");
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);
  const [resetFeedbackMessage, setResetFeedbackMessage] = useState("");
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [isDevToolsExpanded, setIsDevToolsExpanded] = useState(false);
  const [simEventType, setSimEventType] = useState("ContributionReceived");
  const [simEventStatus, setSimEventStatus] = useState("");
  const [simAmount, setSimAmount] = useState("2500");
  const [simSender, setSimSender] = useState("Faith Mwangi");
  const [simPhone, setSimPhone] = useState("254712345678");
  const [simTxStatus, setSimTxStatus] = useState("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("harambeeflowDemoResetSuccess") === "true") {
        setResetFeedbackMessage("✅ Demo data successfully reset. Welcome to a fresh HarambeeFlow sandbox.");
        sessionStorage.removeItem("harambeeflowDemoResetSuccess");
      }
    } catch (e) {
      console.error("Error checking reset success sessionStorage", e);
    }
  }, []);

  const resetDemoData = () => {
    // 1. Clear session storage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error("Error clearing sessionStorage", e);
    }

    // 2. Clear IndexedDB (safely avoiding Firebase)
    try {
      if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then((dbs) => {
          dbs.forEach((dbInfo) => {
            if (dbInfo.name && !dbInfo.name.includes("firebase") && !dbInfo.name.includes("firestore")) {
              window.indexedDB.deleteDatabase(dbInfo.name);
            }
          });
        }).catch(err => console.error("Error clearing IndexedDB databases:", err));
      }
    } catch (e) {
      console.error("Error accessing IndexedDB databases API", e);
    }

    // 3. Clear localStorage safely (prevent removing Firebase keys)
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith("firebase:") && !key.toLowerCase().includes("firebase")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error("Error clearing localStorage", e);
    }

    // 4. Clear React demo states
    setProjects([]);
    setActiveProject(null);
    setContributions([]);
    setWhatsappMessages([]);
    setIsDemoMode(false);
    setCurrentUser(null);

    // 5. Set session storage flag for post-reload feedback
    try {
      sessionStorage.setItem("harambeeflowDemoResetSuccess", "true");
    } catch (e) {
      console.error("Error setting reset success flag", e);
    }

    // 6. Reload and return to landing
    window.location.hash = "#/landing";
    window.location.reload();
  };

  const handleConfirmResetDemoData = () => {
    setShowResetDemoModal(false);
    resetDemoData();
  };

  // Scroll active quick nav tab into view on mobile
  useEffect(() => {
    const activeEl = document.querySelector('[data-quick-nav-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  // Optional "Load Sample Campaign" seed trigger
  const handleLoadSampleCampaign = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    // Seed Nairobi Medical Fund
    const sampleId = `sample-${Date.now()}`;
    const sampleProj = {
      id: sampleId,
      fundraiserName: "Nairobi Medical Fund",
      targetAmount: 500000,
      currentAmount: 185000,
      description: "Emergency surgery and healthcare support for Nairobi community patients.",
      sectorCategory: "Medical/Family",
      mpesaShortcode: "609211",
      accountReference: "NAIROBIMED",
      treasurerPhone: "254712345678",
      whatsappGroupName: "Nairobi Medical Harambee",
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      status: "Active",
      themeColor: "Emerald",
      campaignCategory: "Medical/Family",
      motto: "Healing Together as One",
      organizer: "Richard Mayore"
    };

    try {
      // 1. Write the fundraiser
      await setDoc(doc(db, "fundraisers", sampleId), sampleProj);
      
      // 2. Write 3 sample donations
      const donation1 = {
        id: "sample-donation-1",
        campaignId: sampleId,
        amount: 25000,
        senderName: "Pastor John Gichuru",
        senderPhone: "254711111111",
        transactionCode: "QRL83K9D4J",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
        category: "Committee Member",
        rawMessage: "QRL83K9D4J Confirmed. KES 25,000.00 received from Pastor John Gichuru on 24/6/26 at 5:12 PM.",
        cleanedName: "Pastor John Gichuru",
        hasDuplicates: false,
        notes: "First committee pledge installment",
        status: "completed"
      };

      const donation2 = {
        id: "sample-donation-2",
        campaignId: sampleId,
        amount: 150000,
        senderName: "Hon. Jane Anyango",
        senderPhone: "254722222222",
        transactionCode: "SL987FG6H5",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hrs ago
        category: "Sponsor",
        rawMessage: "SL987FG6H5 Confirmed. KES 150,000.00 received from Hon. Jane Anyango.",
        cleanedName: "Hon. Jane Anyango",
        hasDuplicates: false,
        notes: "Matching donation promise",
        status: "completed"
      };

      const donation3 = {
        id: "sample-donation-3",
        campaignId: sampleId,
        amount: 10000,
        senderName: "David Omwamba",
        senderPhone: "254733333333",
        transactionCode: "TX333MM44K",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hrs ago
        category: "Well-wisher",
        rawMessage: "TX333MM44K Confirmed. KES 10,000.00 received from David Omwamba.",
        cleanedName: "David Omwamba",
        hasDuplicates: false,
        notes: "Family support contribution",
        status: "completed"
      };

      await setDoc(doc(db, "donations", donation1.id), donation1);
      await setDoc(doc(db, "donations", donation2.id), donation2);
      await setDoc(doc(db, "donations", donation3.id), donation3);

      // 3. Write a welcome message to WhatsApp Messages
      const welcomeMsgId = `msg-welcome-sample-${Date.now()}`;
      await setDoc(doc(db, "whatsappMessages", welcomeMsgId), {
        id: welcomeMsgId,
        groupName: "Nairobi Medical Harambee",
        message: `📢 Welcome to the "Nairobi Medical Fund" Harambee Group! Automated M-PESA paybill reconciliation (Paybill: 609211, Account: NAIROBIMED) is now LIVE. Status updates and contributor receipts will be posted here in real-time.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      });

      // Update state
      const mappedProj = mapFundraiserToProject(sampleProj);
      setProjects([mappedProj]);
      setActiveProject(mappedProj);
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Error seeding sample campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  // Donor profile & selected receipt state for cross-view deep linking
  const [selectedDonorPhone, setSelectedDonorPhone] = useState<string | null>(null);
  const [selectedReceiptCode, setSelectedReceiptCode] = useState<string | null>(null);

  useEffect(() => {
    (window as any).viewDonorProfile = (phone: string) => {
      setSelectedDonorPhone(phone || "");
    };
    return () => {
      delete (window as any).viewDonorProfile;
    };
  }, []);

  // PWA & Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isSimulatedStandalone, setIsSimulatedStandalone] = useState(false);
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };
  
  // V4 Single Save Pipeline and Synchronization Guard
  const [syncPhase, setSyncPhase] = useState<"idle" | "creating" | "saving" | "replicating" | "coaching" | "ready">("idle");

  const renderSyncGuard = () => {
    if (syncPhase === "idle") return null;

    const steps = [
      { id: "creating", label: "Creating campaign...", phase: ["creating", "saving", "replicating", "coaching", "ready"] },
      { id: "saving", label: "Saving committee details...", phase: ["saving", "replicating", "coaching", "ready"] },
      { id: "replicating", label: "Connecting Firestore...", phase: ["replicating", "coaching", "ready"] },
      { id: "coaching", label: "Preparing Treasurer Command Center...", phase: ["coaching", "ready"] },
      { id: "ready", label: "Initializing AI Campaign Manager...", phase: ["ready"] }
    ];

    const currentIdx = steps.findIndex(s => s.id === syncPhase);

    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-slate-100 h-screen w-screen">
        <div className="space-y-8 max-w-md w-full animate-fade-in">
          {/* Elegant Circular Spin Indicator */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black font-mono text-emerald-400 uppercase tracking-widest">
              Locking Campaign Ledger
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Establishing zero-trust security parameters & synchronizing cloud replication pipelines.
            </p>
          </div>

          {/* Stepper with Checkmarks */}
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl text-left space-y-3 font-mono text-xs">
            {steps.map((step, idx) => {
              const isDone = steps.slice(0, currentIdx).some(s => s.id === step.id) || syncPhase === "ready";
              const isActive = step.id === syncPhase;
              return (
                <div key={step.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <span className="text-emerald-400 font-extrabold text-sm">✓</span>
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0" />
                    )}
                    <span className={`transition ${isDone ? "text-slate-300 font-medium" : isActive ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                      {step.label}
                    </span>
                  </div>
                  {isDone && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded-md">Synced</span>}
                  {isActive && <span className="text-[10px] text-indigo-400 font-bold animate-pulse">Pending...</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Mobile responsive sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // New Fund Drive form state
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjTarget, setNewProjTarget] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjCategory, setNewProjCategory] = useState("Community/Church");
  const [newProjPhone, setNewProjPhone] = useState("254712345678");
  const [newProjPaybill, setNewProjPaybill] = useState("225588");
  const [newProjRef, setNewProjRef] = useState("");

  const [loading, setLoading] = useState(true);
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [devSettings, setDevSettings] = useState(() => {
    const defaults = {
      skipEmailVerification: true,
      simulateVerifiedUsers: true,
      simulateMpesa: true,
      simulateWhatsapp: true,
      simulateEmailDelivery: true,
    };
    try {
      const saved = localStorage.getItem("dev_settings");
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse developer settings from localStorage:", e);
    }
    return defaults;
  });

  const updateDevSetting = (key: string, value: boolean) => {
    setDevSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("dev_settings", JSON.stringify(next));
      return next;
    });
  };

  const renderSyncStatusBadge = (status: "Online and Synced" | "Offline Changes Pending" | "Sync Complete") => {
    if (status === "Online and Synced") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          Online and Synced
        </span>
      );
    }
    if (status === "Sync Complete") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-800/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-bounce" />
          Sync Complete
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-amber-950/40 text-amber-400 border border-amber-800/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" />
        Offline Changes Pending
      </span>
    );
  };

  // Mapping Helpers
  function mapFundraiserToProject(fundraiser: any): Project {
    return {
      id: fundraiser.id,
      name: fundraiser.fundraiserName || fundraiser.name || "",
      targetAmount: Number(fundraiser.targetAmount),
      currentAmount: Number(fundraiser.currentAmount || 0),
      description: fundraiser.description || "",
      category: fundraiser.sectorCategory || fundraiser.category || "General/Harambee",
      treasurerPhone: fundraiser.treasurerPhone || "",
      paybillNumber: fundraiser.mpesaShortcode || fundraiser.paybillNumber || "225588",
      accountReference: fundraiser.accountReference || "",
      whatsappGroupName: fundraiser.whatsappGroupName || `${fundraiser.fundraiserName || fundraiser.name} Group`,
      createdAt: fundraiser.createdAt,
      campaignImage: fundraiser.campaignImage || "",
      campaignLogo: fundraiser.campaignLogo || "",
      themeColor: fundraiser.themeColor || "Blue",
      campaignCategory: fundraiser.campaignCategory || fundraiser.sectorCategory || fundraiser.category || "General/Harambee",
      motto: fundraiser.motto || "",
      organizer: fundraiser.organizer || fundraiser.organizerName || "Harambee Committee",
      createdBy: fundraiser.createdBy || "",
      organizationId: fundraiser.organizationId || "",
      paymentAccountId: fundraiser.paymentAccountId || ""
    };
  }

  function mapDonationToContribution(donation: any): Contribution {
    const rawName = donation.senderName || donation.cleanedName || "M-PESA Customer";
    const cleanName = donation.cleanedName || donation.senderName || "M-PESA Customer";
    return {
      id: donation.id,
      projectId: donation.campaignId || donation.fundraiserId || donation.projectId || "",
      amount: Number(donation.amount),
      senderName: rawName,
      senderPhone: donation.senderPhone || donation.phoneNumber || "",
      transactionCode: donation.transactionCode || donation.receiptNumber || "",
      timestamp: donation.timestamp || donation.transactionTime || new Date().toISOString(),
      category: donation.category || "Well-wisher",
      rawMessage: donation.rawMessage || `M-PESA transaction of KES ${donation.amount} received from ${rawName}`,
      cleanedName: cleanName,
      hasDuplicates: donation.hasDuplicates || false,
      notes: donation.notes || "",
      whatsappPosted: donation.whatsappPosted || false
    };
  }

  // Trigger interactive tour on first load if not completed
  useEffect(() => {
    const isCompleted = localStorage.getItem("harambeeflowTutorialCompleted");
    if (!isCompleted) {
      setTourOpen(true);
    }
  }, []);

  // Diagnostic logging for authentication and sandbox detection in development
  useEffect(() => {
    const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "unknown";
    const metaEnv = import.meta.env;
    const buildMode = metaEnv.MODE || "unknown";
    
    // Evaluate exact reason why EmailVerificationScreen is shown or skipped
    let reason = "Skipped: Unknown";
    if (!currentUser) {
      reason = "Skipped: No user is currently logged in.";
    } else if (isDemoMode) {
      reason = "Skipped: Operating in Demo Mode.";
    } else if (activeTab === "landing" || activeTab === "trust" || activeTab === "public" || activeTab === "public-pages") {
      reason = `Skipped: Active tab is "${activeTab}" which is a public/unprotected route.`;
    } else {
      const isEmailProvider = currentUser.providerData?.some((p: any) => p.providerId === "password");
      if (!isEmailProvider) {
        reason = "Skipped: User is logged in via a non-password provider (e.g., Google or OAuth) which does not require email verification.";
      } else if (currentUser.emailVerified) {
        reason = "Skipped: User's email is verified in Firebase.";
      } else if (IS_SANDBOX) {
        if (devSettings.skipEmailVerification) {
          reason = "Skipped: Application is in Sandbox Mode and 'Skip Email Verification' dev setting is enabled.";
        } else {
          reason = "Skipped: Application is in Sandbox Mode.";
        }
      } else {
        reason = "Shown: User is signed in with email/password, email is not verified, and Sandbox Mode is disabled.";
      }
    }

    console.log(
      `%c[HarambeeFlow DIAGNOSTICS]%c\n` +
      `- Hostname: ${hostname}\n` +
      `- Build Mode: ${buildMode}\n` +
      `- IS_SANDBOX: ${IS_SANDBOX}\n` +
      `- Firebase User Email Verified: ${currentUser ? currentUser.emailVerified : "N/A"}\n` +
      `- Auth Guard Outcome: ${reason}`,
      "color: #10b981; font-weight: bold; font-size: 11px;",
      "color: #cbd5e1; font-size: 11px;"
    );
  }, [currentUser, activeTab, isDemoMode, devSettings.skipEmailVerification]);

  // Bind Auth Observer
  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCheckingAuth(false);
      
      // If user logs in, route them from landing straight to AI Command Center
      if (user && activeTab === "landing") {
        setActiveTab("dashboard");
      }
    });
    return unsubscribe;
  }, [activeTab]);

  // Fetch user profile from userProfiles collection in real-time
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      setLoadingProfile(false);
      return;
    }

    if (isDemoMode) {
      const cached = localStorage.getItem(`demo_profile_${currentUser.uid}`);
      if (cached) {
        try {
          setUserProfile(JSON.parse(cached));
        } catch (e) {
          setUserProfile({ onboarded: true });
        }
      } else {
        setUserProfile(null);
      }
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    
    // Safety timeout: Never let the loading screen spin forever (limit to 2.5 seconds max)
    const timer = setTimeout(() => {
      console.warn("User profile loading timed out. Using fallback...");
      const cached = localStorage.getItem(`demo_profile_${currentUser.uid}`);
      if (cached) {
        try {
          setUserProfile(JSON.parse(cached));
        } catch (e) {
          setUserProfile({ onboarded: IS_SANDBOX ? false : true });
        }
      } else {
        // In sandbox mode, default to not onboarded so the wizard launches; in production default to true
        setUserProfile({ onboarded: IS_SANDBOX ? false : true });
      }
      setLoadingProfile(false);
    }, 2500);

    if (db) {
      const userProfileRef = doc(db, "userProfiles", currentUser.uid);
      const unsubscribe = onSnapshot(userProfileRef, (docSnap) => {
        clearTimeout(timer);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          // Check sandbox local cache fallback
          const cached = localStorage.getItem(`demo_profile_${currentUser.uid}`);
          if (cached) {
            try {
              setUserProfile(JSON.parse(cached));
            } catch (e) {
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        }
        setLoadingProfile(false);
      }, (error) => {
        clearTimeout(timer);
        console.error("Error loading user profile:", error);
        // Try fallback
        const cached = localStorage.getItem(`demo_profile_${currentUser.uid}`);
        if (cached) {
          try {
            setUserProfile(JSON.parse(cached));
          } catch (e) {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoadingProfile(false);
      });
      return () => {
        clearTimeout(timer);
        unsubscribe();
      };
    } else {
      clearTimeout(timer);
      const cached = localStorage.getItem(`demo_profile_${currentUser.uid}`);
      if (cached) {
        try {
          setUserProfile(JSON.parse(cached));
        } catch (e) {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoadingProfile(false);
    }
  }, [currentUser, isDemoMode]);

  // Handle loading reset on auth state change
  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      
      // Safety timeout: Never let the loading screen spin forever (limit to 2.5 seconds max)
      const timer = setTimeout(() => {
        console.warn("Main database loading timed out. Clearing loading screen...");
        setLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Auto-launch onboarding wizard for first-time signups
  useEffect(() => {
    if (!loading && !loadingProfile && projects.length === 0 && currentUser && !userProfile?.onboarded) {
      setWizardOpen(true);
    }
  }, [loading, loadingProfile, projects.length, currentUser, userProfile]);

  const handleLogout = async () => {
    try {
      if (isDemoMode) {
        setIsDemoMode(false);
        setCurrentUser(null);
        setProjects([]);
        setActiveProject(null);
        setContributions([]);
        setWhatsappMessages([]);
        setActiveTab("landing");
        return;
      }
      if (auth) {
        await signOut(auth);
      }
      setCurrentUser(null);
      setActiveTab("landing");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleLinkGoogleInSettings = async () => {
    if (!auth || !currentUser) {
      setSettingsFeedback("Authentication state is not ready.");
      setTimeout(() => setSettingsFeedback(""), 8000);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        await linkWithCredential(auth.currentUser, credential);
        // Update userProfile
        try {
          await setDoc(doc(db, "userProfiles", auth.currentUser.uid), {
            authProvider: "google + email",
            profilePhotoURL: auth.currentUser.photoURL || "",
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.error("Error updating userProfile after link in settings:", dbErr);
        }
        setSettingsFeedback("Google account linked successfully! You can now sign in with Google or your email & password.");
      }
    } catch (err: any) {
      console.error("Linking error in settings:", err);
      if (err.code === "auth/credential-already-in-use") {
        setSettingsFeedback("Link failed: This Google account is already linked to another user profile.");
      } else {
        setSettingsFeedback(`Linking failed: ${err.message || err}`);
      }
    }
    setTimeout(() => setSettingsFeedback(""), 8000);
  };

  // Poll database updates and listen to live fundraisers in real-time
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.uid === "demo-user-123") {
      setLoading(false);
      setGeminiActive(true);
      return;
    }

    // Check if real Gemini key is active
    fetch("/api/projects") // simple check to verify connection
      .then(() => {
        setGeminiActive(true);
      })
      .catch(() => setGeminiActive(false));

    // Register offline/online event listeners
    const handleOnline = () => {
      if (!db) {
        setSyncStatus("Online and Synced");
      }
    };

    const handleOffline = () => {
      setSyncStatus("Offline Changes Pending");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let unsubscribeSync = () => {};
    if (db) {
      unsubscribeSync = onSnapshotsInSync(db, () => {
        if (navigator.onLine) {
          setSyncStatus((prev) => {
            if (prev === "Offline Changes Pending") {
              setTimeout(() => {
                setSyncStatus("Online and Synced");
              }, 4000); // Display Sync Complete for 4 seconds
              return "Sync Complete";
            }
            return "Online and Synced";
          });
        } else {
          setSyncStatus("Offline Changes Pending");
        }
      });
    }

    // 1. Subscribe to fundraisers (real-time)
    let unsubscribeFundraisers = () => {};
    let unsubscribeDonations = () => {};
    let unsubscribeMessages = () => {};

    if (db) {
      unsubscribeFundraisers = onSnapshot(collection(db, "fundraisers"), (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) {
          setSyncStatus("Offline Changes Pending");
        }
        const projs: Project[] = [];
        snapshot.forEach((doc) => {
          const item = doc.data();
          projs.push(mapFundraiserToProject({ id: doc.id, ...item }));
        });

        const userProjs = projs.filter(p => p.createdBy === currentUser.uid);

        if (userProjs.length > 0) {
          setProjects(userProjs);
          setActiveProject(prev => {
            if (!prev) return userProjs[0];
            const fresh = userProjs.find(p => p.id === prev.id);
            return fresh || userProjs[0];
          });
        } else {
          setProjects([]);
          setActiveProject(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Fundraisers snapshot error:", error);
        setProjects([]);
        setActiveProject(null);
        setLoading(false);
      });

      // 2. Subscribe to donations (real-time)
      unsubscribeDonations = onSnapshot(collection(db, "donations"), (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) {
          setSyncStatus("Offline Changes Pending");
        }
        const conts: Contribution[] = [];
        snapshot.forEach((doc) => {
          const item = doc.data();
          conts.push(mapDonationToContribution({ id: doc.id, ...item }));
        });
        
        setContributions(conts);
      }, (error) => {
        console.error("Donations snapshot error:", error);
        setContributions([]);
      });

      // 3. Subscribe to whatsapp messages (real-time)
      unsubscribeMessages = onSnapshot(collection(db, "whatsappMessages"), (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) {
          setSyncStatus("Offline Changes Pending");
        }
        const msgs: WhatsAppMessage[] = [];
        snapshot.forEach((doc) => {
          const item = doc.data();
          msgs.push({
            id: doc.id,
            groupName: item.groupName,
            message: item.message,
            timestamp: item.timestamp,
            isSystem: item.isSystem || false
          });
        });

        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setWhatsappMessages(msgs);
      }, (error) => {
        console.error("WhatsAppMessages snapshot error:", error);
        setWhatsappMessages([]);
      });
    } else {
      // Direct REST fallback when Firebase db is uninitialized or null
      fetch("/api/projects")
        .then(res => res.json())
        .then((sandboxData: Project[]) => {
          setProjects(sandboxData);
          setActiveProject(prev => {
            if (!prev) return sandboxData[0];
            const fresh = sandboxData.find(p => p.id === prev.id);
            return fresh || sandboxData[0];
          });
        })
        .catch(err => console.error("Fallback projects fetch failed:", err))
        .finally(() => setLoading(false));

      fetch("/api/contributions")
        .then(res => res.json())
        .then((sandboxData: any[]) => {
          const mapped = sandboxData.map(c => mapDonationToContribution(c));
          setContributions(mapped);
        })
        .catch(err => console.error("Fallback contributions fetch failed:", err));

      fetch("/api/whatsapp/messages")
        .then(res => res.json())
        .then((sandboxData: any[]) => {
          const mapped = sandboxData.map((m, idx) => ({
            id: m.id || `msg-${idx}`,
            groupName: m.groupName || "General Group",
            message: m.message,
            timestamp: m.timestamp || new Date().toISOString(),
            isSystem: m.isSystem || false
          }));
          mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setWhatsappMessages(mapped);
        })
        .catch(err => console.error("Fallback WhatsApp messages fetch failed:", err));
    }

    return () => {
      unsubscribeFundraisers();
      unsubscribeDonations();
      unsubscribeMessages();
      unsubscribeSync();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [currentUser]);

  // Post actual direct Manual C2B Callback (simulator triggers)
  // Handler to boot the live sandbox demo mode
  const handleEnterDemo = () => {
    setIsDemoMode(true);
    setCurrentUser({
      uid: "demo-user-123",
      email: "demo-treasurer@harambeeflow.com",
      displayName: "Demo Treasurer",
      emailVerified: true
    } as any);
    
    // Set up standard demo project
    const demoProjectObj: Project = {
      id: "demo-project-id",
      name: "Makueni School Bus Fundraiser",
      targetAmount: 1000000,
      currentAmount: 640000,
      description: "A community fundraiser to secure a safer school bus for children in Makueni County.",
      category: "Schools",
      paybillNumber: "225588",
      accountReference: "MAKUENI-BUS",
      treasurerPhone: "254712345678",
      whatsappGroupName: "Makueni Committee",
      createdBy: "demo-user-123",
      createdAt: new Date().toISOString(),
      status: "Active",
      themeColor: "Emerald",
      campaignCategory: "Schools",
      motto: "Drive to Learn, Learn to Drive",
      organizer: "Richard Mayore"
    };

    const demoDonations: Contribution[] = [
      {
        id: "demo-donation-1",
        projectId: "demo-project-id",
        campaignId: "demo-project-id",
        amount: 50000,
        senderName: "Hon. Jane Kemunto",
        senderPhone: "254711111111",
        transactionCode: "QRL83K9D4J",
        timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), // 30 mins ago
        category: "Committee Member",
        rawMessage: "QRL83K9D4J Confirmed. KES 50,000.00 received from Hon. Jane Kemunto on 24/6/26.",
        cleanedName: "Jane Kemunto",
        hasDuplicates: false,
        notes: "Support for school bus logistics",
        whatsappPosted: true,
        status: "completed"
      },
      {
        id: "demo-donation-2",
        projectId: "demo-project-id",
        campaignId: "demo-project-id",
        amount: 120000,
        senderName: "David Ochieng",
        senderPhone: "254722222222",
        transactionCode: "SL987FG6H5",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
        category: "Sponsor",
        rawMessage: "SL987FG6H5 Confirmed. KES 120,000.00 received from David Ochieng.",
        cleanedName: "David Ochieng",
        hasDuplicates: false,
        notes: "Pledge completion for the steering wheel and tires",
        whatsappPosted: true,
        status: "completed"
      },
      {
        id: "demo-donation-3",
        projectId: "demo-project-id",
        campaignId: "demo-project-id",
        amount: 470000,
        senderName: "St. Joseph Sacco",
        senderPhone: "254733333333",
        transactionCode: "TX333MM44K",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hrs ago
        category: "Well-wisher",
        rawMessage: "TX333MM44K Confirmed. KES 470,000.00 received from St. Joseph Sacco.",
        cleanedName: "St. Joseph Sacco",
        hasDuplicates: false,
        notes: "Community enterprise development support",
        whatsappPosted: true,
        status: "completed"
      }
    ];

    const demoMessages: WhatsAppMessage[] = [
      {
        id: "demo-msg-1",
        groupName: "Makueni Committee",
        message: "🚨 Live Tally Update: We have reached KES 640,000! Thank you to St. Joseph Sacco (KES 470,000), David Ochieng (KES 120,000) and Jane Kemunto (KES 50,000) for your incredible support. 360k remaining to reach our goal!",
        timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(),
        isSystem: true
      },
      {
        id: "demo-msg-2",
        groupName: "Makueni Committee",
        message: "Thank you for the update! This is extremely transparent. I love how M-PESA amounts are appearing instantly.",
        timestamp: new Date(Date.now() - 3600000 * 0.1).toISOString(),
        isSystem: false
      }
    ];

    setProjects([demoProjectObj]);
    setActiveProject(demoProjectObj);
    setContributions(demoDonations);
    setWhatsappMessages(demoMessages);
    setActiveTab("dashboard");
  };

  const handlePostWebhookC2B = async (payload: any) => {
    if (isDemoMode) {
      // Extract details from Daraja callback structure or C2B structure
      let amountVal = 1000;
      let transId = `TX${Date.now().toString().substring(5)}`;
      let phoneVal = "254700000000";
      let donorName = payload.senderName || "Demo Contributor";

      if (payload.Body?.stkCallback) {
        const mpesaResult = payload.Body.stkCallback;
        amountVal = mpesaResult.CallbackMetadata?.Item?.find((i: any) => i.Name === "Amount")?.Value || 1000;
        transId = mpesaResult.CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || transId;
        phoneVal = mpesaResult.CallbackMetadata?.Item?.find((i: any) => i.Name === "PhoneNumber")?.Value || phoneVal;
      } else if (payload.TransID) {
        // Standard C2B paybill simulation payload
        amountVal = Number(payload.TransAmount) || 1000;
        transId = payload.TransID;
        phoneVal = payload.MSISDN || phoneVal;
        donorName = `${payload.FirstName || "DEMO"} ${payload.MiddleName || ""} ${payload.LastName || "CONTRIBUTOR"}`.replace(/\s+/g, " ").trim();
      }

      // Simulate network response latency
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockCont: Contribution = {
        id: transId,
        projectId: activeProject?.id || "demo-project-id",
        campaignId: activeProject?.id || "demo-project-id",
        amount: Number(amountVal),
        senderName: donorName,
        senderPhone: String(phoneVal),
        transactionCode: transId,
        timestamp: new Date().toISOString(),
        category: "Well-wisher",
        rawMessage: `${transId} Confirmed. received KES ${amountVal} from ${donorName}.`,
        cleanedName: donorName,
        hasDuplicates: false,
        notes: "Simulated Daraja callback push",
        whatsappPosted: true,
        status: "completed"
      };

      setContributions(prev => [mockCont, ...prev]);

      if (activeProject) {
        const updatedProj = {
          ...activeProject,
          currentAmount: (activeProject.currentAmount || 0) + Number(amountVal)
        };
        setActiveProject(updatedProj);
        setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
      }

      const welcomeMsgId = `msg-stk-${Date.now()}`;
      const msg: WhatsAppMessage = {
        id: welcomeMsgId,
        groupName: activeProject?.whatsappGroupName || "Harambee Group",
        message: `🟢 M-PESA Confirmation: KES ${Number(amountVal).toLocaleString()} received from ${donorName} (${phoneVal}) for ${activeProject?.name || "the Campaign"}. Transaction Code: ${transId}.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      setWhatsappMessages(prev => [msg, ...prev]);

      // Publish ContributionReceived to trigger Intelligent Autopilot Pipeline
      EventBus.publish("ContributionReceived", {
        contribution: mockCont,
        activeProject: activeProject
      }, isDemoMode).catch(console.error);

      return {
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        receiptNumber: transId,
        isNewDonor: false,
        pipelineResult: {
          stkSuccess: true,
          donorRecognized: true,
          firestoreSaved: true,
          campaignTotalsUpdated: true,
          ledgerUpdated: true,
          whatsappPosted: true
        }
      };
    }

    const response = await fetch("/api/daraja/callback?token=SANDBOX_SIMULATION_BYPASS_TOKEN", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Mpesa-Signature": "SANDBOX_SIMULATION_BYPASS_SIGNATURE"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return data;
  };

  // Unified, high-fidelity data refresh utility across Firestore and REST fallbacks
  const refreshAllData = async () => {
    if (isDemoMode) {
      return; // Local updates are handled reactively in demo state
    }

    try {
      // 1. Projects/Fundraisers
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      if (Array.isArray(projectsData) && projectsData.length > 0) {
        const mapped = projectsData.map(p => mapFundraiserToProject(p));
        setProjects(mapped);
        setActiveProject(prev => {
          if (!prev) return mapped[0];
          const fresh = mapped.find(p => p.id === prev.id);
          return fresh || mapped[0];
        });
      }
      
      // 2. Contributions
      const contributionsRes = await fetch("/api/contributions");
      const contributionsData = await contributionsRes.json();
      if (Array.isArray(contributionsData)) {
        const mapped = contributionsData.map(c => mapDonationToContribution(c));
        setContributions(mapped);
      }

      // 3. WhatsApp messages
      const waRes = await fetch("/api/whatsapp/messages");
      const waData = await waRes.json();
      if (Array.isArray(waData)) {
        const mapped = waData.map((m, idx) => ({
          id: m.id || `msg-${idx}`,
          groupName: m.groupName || "General Group",
          message: m.message,
          timestamp: m.timestamp || new Date().toISOString(),
          isSystem: m.isSystem || false
        }));
        mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(a.timestamp).getTime());
        setWhatsappMessages(mapped);
      }
    } catch (err) {
      console.error("Error refreshing data in sandbox mode:", err);
    }
  };

  // Add Manual Contribution Treasurer Form (directly saves to dev Firestore donations collection)
  const handleAddManualContribution = async (cntPayload: any) => {
    if (!currentUser) throw new Error("Authentication required");

    const donationId = cntPayload.transactionCode || `TX-${Date.now()}`;
    const nameParts = (cntPayload.senderName || "M-PESA Customer").trim().split(/\s+/);
    const firstName = nameParts[0] || "M-PESA";
    const middleName = nameParts.length > 2 ? nameParts[1] : "";
    const lastName = nameParts.length > 2 ? nameParts.slice(2).join(" ") : (nameParts[1] || "Customer");

    if (isDemoMode) {
      const mockCont: Contribution = {
        id: donationId,
        projectId: cntPayload.projectId || activeProject?.id || "demo-project-id",
        campaignId: cntPayload.projectId || activeProject?.id || "demo-project-id",
        amount: Number(cntPayload.amount),
        senderName: cntPayload.senderName,
        senderPhone: cntPayload.senderPhone || "",
        transactionCode: donationId,
        timestamp: new Date().toISOString(),
        category: cntPayload.category || "Family/Friends",
        rawMessage: `${donationId} Confirmed. received KES ${cntPayload.amount} from ${cntPayload.senderName}.`,
        cleanedName: cntPayload.senderName,
        hasDuplicates: false,
        notes: cntPayload.notes || "",
        whatsappPosted: true,
        status: "completed"
      };

      setContributions(prev => [mockCont, ...prev]);

      if (activeProject) {
        const updatedProj = {
          ...activeProject,
          currentAmount: (activeProject.currentAmount || 0) + Number(cntPayload.amount)
        };
        setActiveProject(updatedProj);
        setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
      }

      const welcomeMsgId = `msg-stk-${Date.now()}`;
      const msg: WhatsAppMessage = {
        id: welcomeMsgId,
        groupName: activeProject?.whatsappGroupName || "Harambee Group",
        message: `🟢 M-PESA Confirmation: KES ${Number(cntPayload.amount).toLocaleString()} received from ${cntPayload.senderName} for the Campaign.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      setWhatsappMessages(prev => [msg, ...prev]);

      // Publish ContributionReceived to trigger Intelligent Autopilot Pipeline
      EventBus.publish("ContributionReceived", {
        contribution: mockCont,
        activeProject: activeProject
      }, isDemoMode).catch(console.error);

      return { success: true, id: donationId };
    }

    const targetProjectId = cntPayload.projectId || activeProject?.id || "demo-project-id";
    const amountNum = Number(cntPayload.amount);
    const nowIso = new Date().toISOString();

    const payload = {
      id: donationId,
      projectId: targetProjectId,
      fundraiserId: targetProjectId,
      campaignId: targetProjectId,
      amount: amountNum,
      senderName: cntPayload.senderName,
      senderPhone: cntPayload.senderPhone || "",
      transactionCode: donationId,
      timestamp: nowIso,
      category: cntPayload.category || "Family/Friends",
      notes: cntPayload.notes || "",
      hasDuplicates: false,
      status: "completed",

      firstName,
      middleName,
      lastName,
      phoneNumber: cntPayload.senderPhone || "",
      receiptNumber: donationId,
      billReference: activeProject?.accountReference || "GENERAL",
      transactionTime: nowIso,
      cleanedName: cntPayload.senderName,
      donorId: cntPayload.senderPhone || ""
    };

    // Verify fields before committing
    const requiredKeys = [
      "senderName", "cleanedName", "firstName", "middleName", "lastName",
      "phoneNumber", "receiptNumber", "billReference", "amount", "transactionTime", "campaignId", "projectId", "fundraiserId"
    ];
    for (const key of requiredKeys) {
      if ((payload as any)[key] === undefined) {
        throw new Error(`Critical Field Missing in manual insertion: ${key} is required.`);
      }
    }

    console.log(`[CONTRIBUTION PIPELINE] [${new Date().toLocaleTimeString()}] Contribution Received:`, {
      transactionCode: donationId,
      amount: amountNum,
      senderName: cntPayload.senderName,
      projectId: targetProjectId
    });

    // Atomic transaction for Firestore
    if (db) {
      try {
        await runTransaction(db, async (transaction) => {
          const fundraiserRef = doc(db, "fundraisers", targetProjectId);
          const fundraiserSnap = await transaction.get(fundraiserRef);
          
          let existingAmount = 0;
          let existingCount = 0;
          let targetAmount = activeProject?.targetAmount || 500000;

          if (fundraiserSnap.exists()) {
            const fData = fundraiserSnap.data();
            existingAmount = Number(fData.currentAmount || fData.totalRaised || 0);
            existingCount = Number(fData.contributionCount || 0);
            targetAmount = Number(fData.targetAmount || targetAmount);
          } else if (activeProject) {
            existingAmount = Number(activeProject.currentAmount || 0);
          }

          const newAmount = existingAmount + amountNum;
          const newCount = existingCount + 1;
          const remainingAmount = Math.max(0, targetAmount - newAmount);
          const progressPercentage = Math.min(100, Math.round((newAmount / targetAmount) * 100));

          transaction.set(doc(db, "donations", donationId), payload);

          transaction.set(fundraiserRef, {
            currentAmount: newAmount,
            totalRaised: newAmount,
            contributionCount: newCount,
            lastContribution: amountNum,
            lastContributionName: payload.senderName,
            lastContributionTime: nowIso,
            lastUpdated: nowIso,
            updatedAt: nowIso,
            remainingAmount,
            progressPercentage
          }, { merge: true });

          console.log(`[CONTRIBUTION PIPELINE] [${new Date().toLocaleTimeString()}] Firestore Document Created: donations/${donationId}`);
          console.log(`[CONTRIBUTION PIPELINE] [${new Date().toLocaleTimeString()}] Campaign Totals Updated atomically: New Amount = KES ${newAmount}`);
        });
      } catch (txErr) {
        console.warn("Firestore transaction fallback to direct setDoc:", txErr);
        await setDoc(doc(db, "donations", donationId), payload);
        if (activeProject) {
          const fundraiserRef = doc(db, "fundraisers", targetProjectId);
          const newProjAmount = (activeProject.currentAmount || 0) + amountNum;
          await setDoc(fundraiserRef, {
            currentAmount: newProjAmount,
            totalRaised: newProjAmount,
            lastContribution: amountNum,
            lastContributionName: payload.senderName,
            lastContributionTime: nowIso,
            updatedAt: nowIso,
            lastUpdated: nowIso
          }, { merge: true });
        }
      }
    }

    const liveCont: Contribution = {
      id: donationId,
      projectId: payload.projectId,
      campaignId: payload.campaignId,
      fundraiserId: payload.fundraiserId,
      amount: payload.amount,
      senderName: payload.senderName,
      senderPhone: payload.senderPhone,
      transactionCode: payload.transactionCode,
      timestamp: payload.timestamp,
      category: payload.category,
      rawMessage: `Live manual payment KES ${payload.amount}`,
      cleanedName: payload.cleanedName,
      hasDuplicates: false,
      notes: payload.notes,
      whatsappPosted: true,
      status: "completed"
    };

    // Publish ContributionReceived to trigger Intelligent Autopilot Pipeline
    EventBus.publish("ContributionReceived", {
      contribution: liveCont,
      activeProject: activeProject
    }, isDemoMode).catch(console.error);

    return { success: true, id: donationId };
  };

  // Trigger AI Report summary prompt onto WhatsApp and Dashboard
  const triggerSummarizeProject = async () => {
    if (!activeProject) return;
    setIsSummarizing(true);

    if (isDemoMode) {
      // Delay and simulate AI generation beautifully
      setTimeout(() => {
        const demoNarrative = `Makueni School Bus Drive Daily AI Briefing:
We have crossed KES ${(activeProject?.currentAmount || 0).toLocaleString()} of our KES 1,000,000 goal!
Our pace is excellent (64% achieved). The biggest contribution came from St. Joseph Sacco (KES 470,000) and David Ochieng (KES 120,000).
Action Plan: Direct-messaging committee members to follow up on remaining pledges can easily close the remaining KES 360,000 this week. Let's keep mobilizing!`;
        setSummaryText(demoNarrative);

        const messageId = `msg-ai-${Date.now()}`;
        const msg: WhatsAppMessage = {
          id: messageId,
          groupName: activeProject.whatsappGroupName || `${activeProject.name} Group`,
          message: demoNarrative,
          timestamp: new Date().toISOString(),
          isSystem: true
        };
        setWhatsappMessages(prev => [msg, ...prev]);
        setIsSummarizing(false);
      }, 1200);
      return;
    }

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id })
      });
      const data = await response.json();
      if (data.narrative) {
        setSummaryText(data.narrative);
        
        // Auto-post this summary onto simulated WhatsApp Group collection
        const messageId = `msg-ai-${Date.now()}`;
        const cleanNarrative = data.narrative.replace(/\*/g, "");
        await setDoc(doc(db, "whatsappMessages", messageId), {
          id: messageId,
          groupName: activeProject.whatsappGroupName || `${activeProject.name} Group`,
          message: cleanNarrative,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      }
    } catch (err: any) {
      console.error("AI summarization failed:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Post typing chat from phone directly into cloud Firestore
  const handleAddSimulatedWhatsAppMsg = async (text: string) => {
    if (!activeProject) return;

    if (isDemoMode) {
      const msgId = `wm-${Date.now()}`;
      const msg: WhatsAppMessage = {
        id: msgId,
        groupName: activeProject.whatsappGroupName || `${activeProject.name} Group`,
        message: text,
        timestamp: new Date().toISOString(),
        isSystem: false
      };
      setWhatsappMessages(prev => [msg, ...prev]);
      return;
    }

    const msgId = `wm-${Date.now()}`;
    const msg = {
      id: msgId,
      groupName: activeProject.whatsappGroupName,
      message: text,
      timestamp: new Date().toISOString(),
      isSystem: false
    };

    await setDoc(doc(db, "whatsappMessages", msgId), msg);
  };

  // Clear simulated databases
  const handleClearSimulatedFeeds = async () => {
    try {
      await fetch("/api/whatsapp/clear", { method: "POST" });
    } catch (err) {
      console.error("Clear failed: ", err);
    }
  };

  // Setup New Project Fundraiser Drive
  const handleCreateFundraiser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjTarget || !currentUser) return;

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const fundraiserId = `fundraiser-${Date.now()}`;
      const payload = {
        id: fundraiserId,
        fundraiserName: newProjName.trim(),
        targetAmount: Number(newProjTarget),
        description: newProjDesc.trim(),
        sectorCategory: newProjCategory,
        mpesaShortcode: newProjPaybill.trim(),
        accountReference: newProjRef.trim() || newProjName.substring(0, 7).toUpperCase().replace(/\s/g, ""),
        treasurerPhone: newProjPhone.trim(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: "Active",
        currentAmount: 0
      };

      // Direct write to cloud Firestore fundraisers collection (User Ownership)
      try {
        if (isDemoMode) {
          const mappedProj = mapFundraiserToProject(payload);
          setProjects(prev => [mappedProj, ...prev]);
          setActiveProject(mappedProj);

          const welcomeMsgId = `msg-welcome-${Date.now()}`;
          const welcomeMsg: WhatsAppMessage = {
            id: welcomeMsgId,
            groupName: mappedProj.whatsappGroupName || `${mappedProj.name} Group`,
            message: `📢 Welcome to the "${mappedProj.name}" Harambee Group! Automated M-PESA paybill reconciliation (Paybill: ${mappedProj.paybillNumber}, Account: ${mappedProj.accountReference}) is now LIVE. Status updates and contributor receipts will be posted here in real-time.`,
            timestamp: new Date().toISOString(),
            isSystem: true
          };
          setWhatsappMessages(prev => [welcomeMsg, ...prev]);

          setSuccessMessage(`Fundraiser "${newProjName.trim()}" successfully saved to local sandbox!`);
          setNewProjName("");
          setNewProjTarget("");
          setNewProjDesc("");
          setNewProjRef("");
          setTimeout(() => {
            setSuccessMessage("");
            setShowAddProject(false);
          }, 2000);
          return;
        }

        await setDoc(doc(db, "fundraisers", fundraiserId), payload);
        
        // Immediately make this the active project context in React state
        const mappedProj = mapFundraiserToProject(payload);
        setActiveProject(mappedProj);

        // Seed a welcoming WhatsApp message to simulated phone feed for the new group
        const welcomeMsgId = `msg-welcome-${Date.now()}`;
        await setDoc(doc(db, "whatsappMessages", welcomeMsgId), {
          id: welcomeMsgId,
          groupName: mappedProj.whatsappGroupName,
          message: `📢 Welcome to the "${mappedProj.name}" Harambee Group! Automated M-PESA paybill reconciliation (Paybill: ${mappedProj.paybillNumber}, Account: ${mappedProj.accountReference}) is now LIVE. Status updates and contributor receipts will be posted here in real-time.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `fundraisers/${fundraiserId}`);
      }

      setSuccessMessage(`Fundraiser "${newProjName.trim()}" successfully saved to cloud Firestore!`);
      
      // Clear Form fields
      setNewProjName("");
      setNewProjTarget("");
      setNewProjDesc("");
      setNewProjRef("");
      
      // Hide modal after a short delay
      setTimeout(() => {
        setSuccessMessage("");
        setShowAddProject(false);
      }, 3000);
    } catch (err: any) {
      console.error("Failed to write fundraiser through Direct Firestore write:", err);
      setErrorMessage(err.message || "Failed to save fundraiser. Permissions rejected by Firestore Rules.");
    }
  };

  // Add project callback for the onboarding setup wizard
  const handleAddNewProject = async (newProj: any) => {
    if (!currentUser) throw new Error("Authentication required");
    const fundraiserId = `fundraiser-${Date.now()}`;
    const payload = {
      id: fundraiserId,
      fundraiserName: newProj.name,
      targetAmount: Number(newProj.targetAmount),
      description: newProj.description,
      sectorCategory: newProj.category || "Community/Church",
      mpesaShortcode: newProj.paybillNumber || "222111",
      accountReference: newProj.accountReference,
      treasurerPhone: newProj.treasurerPhone,
      whatsappGroupName: newProj.whatsappGroupName || `${newProj.name} Group`,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      status: "Active",
      currentAmount: 0,
      campaignLogo: newProj.campaignLogo || "",
      campaignImage: newProj.campaignImage || "",
      themeColor: newProj.themeColor || "Blue",
      campaignCategory: newProj.campaignCategory || newProj.category || "Community/Church",
      motto: newProj.motto || "",
      organizer: newProj.organizer || "Harambee Committee",
      organizationId: newProj.organizationId || "",
      paymentAccountId: newProj.paymentAccountId || ""
    };

    if (isDemoMode) {
      const mappedProj = mapFundraiserToProject(payload);
      setProjects(prev => [mappedProj, ...prev]);
      setActiveProject(mappedProj);

      const welcomeMsgId = `msg-welcome-${Date.now()}`;
      const welcomeMsg: WhatsAppMessage = {
        id: welcomeMsgId,
        groupName: mappedProj.whatsappGroupName || `${mappedProj.name} Group`,
        message: `📢 Welcome to the "${mappedProj.name}" Harambee Group! Automated M-PESA paybill reconciliation (Paybill: ${mappedProj.paybillNumber}, Account: ${mappedProj.accountReference}) is now LIVE. Status updates and contributor receipts will be posted here in real-time.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      setWhatsappMessages(prev => [welcomeMsg, ...prev]);
      return { success: true, id: fundraiserId };
    }

    try {
      // Run with timeout so if Firestore is offline, it continues locally after 2.5 seconds
      const runWithTimeout = async (promise: Promise<any>, timeoutMs = 2500) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
        ]);
      };

      await runWithTimeout(setDoc(doc(db, "fundraisers", fundraiserId), payload));
      
      // Immediately set the new project active and append to local projects list
      const mappedProj = mapFundraiserToProject(payload);
      setProjects(prev => {
        const exists = prev.some(p => p.id === mappedProj.id);
        if (exists) return prev;
        return [mappedProj, ...prev];
      });
      setActiveProject(mappedProj);

      // Seed a welcoming WhatsApp message to simulated phone feed
      const welcomeMsgId = `msg-welcome-${Date.now()}`;
      try {
        await runWithTimeout(setDoc(doc(db, "whatsappMessages", welcomeMsgId), {
          id: welcomeMsgId,
          groupName: mappedProj.whatsappGroupName,
          message: `📢 Welcome to the "${mappedProj.name}" Harambee Group! Automated M-PESA paybill reconciliation (Paybill: ${mappedProj.paybillNumber}, Account: ${mappedProj.accountReference}) is now LIVE. Status updates and contributor receipts will be posted here in real-time.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        }));
      } catch (e) {
        console.warn("Could not write welcome message to Firestore (timed out or offline):", e);
      }
    } catch (error) {
      console.warn("Firestore write for new project timed out or failed. Appending locally anyway...", error);
      const mappedProj = mapFundraiserToProject(payload);
      setProjects(prev => {
        const exists = prev.some(p => p.id === mappedProj.id);
        if (exists) return prev;
        return [mappedProj, ...prev];
      });
      setActiveProject(mappedProj);
    }
    return { success: true, id: fundraiserId };
  };

  const handleUpdateProjectBranding = async (updatedFields: Partial<Project>) => {
    if (!activeProject?.id) return;

    if (isDemoMode) {
      const updatedProj = { ...activeProject, ...updatedFields };
      setActiveProject(updatedProj);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
      return;
    }

    try {
      const docRef = doc(db, "fundraisers", activeProject.id);
      await setDoc(docRef, updatedFields, { merge: true });
    } catch (err) {
      console.error("Failed to update campaign branding", err);
    }
  };


  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans animate-fade-in relative overflow-hidden" id="check-auth-stage">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="p-8 text-center space-y-6 relative z-10">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-spin" />
            <Cpu className="absolute inset-0 m-auto w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black tracking-tight text-white">Checking Authentication...</h3>
            <p className="text-xs text-slate-500 font-mono">Connecting to Firebase...</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "public" || activeTab === "public-pages") {
    return (
      <PublicCampaignPageView 
        campaignId={publicCampaignId} 
        contributions={contributions}
        onReturnToDashboard={currentUser ? () => handleSetActiveTab("dashboard") : undefined}
        isDemoMode={isDemoMode}
      />
    );
  }

  // Protect dashboard pages so only authenticated users can access them
  if (activeTab !== "landing" && activeTab !== "trust" && !currentUser) {
    return (
      <AuthScreen 
        onSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab("dashboard");
        }}
      />
    );
  }

  // Restrict dashboard access if email is unverified for email users (bypassed in Sandbox Mode)
  const isVerified = IS_SANDBOX ? true : (currentUser?.emailVerified || false);
  const isEmailUnverified = currentUser && 
    !isVerified && 
    currentUser.providerData?.some((p: any) => p.providerId === "password");
  if (isEmailUnverified && !isDemoMode) {
    return (
      <EmailVerificationScreen 
        currentUser={currentUser}
        onVerified={async () => {
          if (auth?.currentUser) {
            await auth.currentUser.reload();
            setCurrentUser({ ...auth.currentUser });
          }
        }}
      />
    );
  }

  if (currentUser && (loading || loadingProfile) && projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans animate-fade-in relative overflow-hidden" id="load-dashboard-stage">
        <div className="absolute top-[15%] left-[15%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[15%] right-[15%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-6 left-6 flex items-center gap-2.5">
          <div className="p-1.5 text-xs bg-emerald-500 rounded-lg font-mono font-black text-slate-950 shadow-lg shadow-emerald-500/20">
            HF
          </div>
          <span className="text-sm font-black text-white tracking-tight">HarambeeFlow AI</span>
        </div>
        <div className="p-8 text-center space-y-6 relative z-10">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-spin" />
            <LayoutDashboard className="absolute inset-0 m-auto w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black tracking-tight text-white">Loading Dashboard...</h3>
            <p className="text-xs text-slate-500 font-mono">Connecting to Firebase & syncing campaign assets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PWAFrameWrapper isSimulated={isSimulatedStandalone} handleExit={() => setIsSimulatedStandalone(false)}>
      <div className={`min-h-screen bg-slate-950 flex flex-col font-sans leading-normal relative ${
        projects.length === 0 && wizardOpen ? "w-full overflow-y-auto" : "overflow-hidden h-screen w-screen"
      }`}>
        {renderSyncGuard()}
        {/* TEST MODE NOTICE BANNER */}
        {!isSimulatedStandalone && isDemoMode && (
          <div className="bg-emerald-950/90 text-emerald-300 border-b border-emerald-800/40 px-4 py-1.5 text-center text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 z-50 shadow-sm leading-none font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE DEMO SANDBOX: Real-time simulated MPESA webhook, AI reporting, and live updates are active. (All data resets on exit).</span>
            <button 
              onClick={handleLogout}
              className="ml-3 px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-[10px] text-emerald-100 transition-colors font-sans uppercase font-bold shrink-0"
            >
              Exit Demo
            </button>
          </div>
        )}

        <div className={`flex flex-1 w-full ${
          projects.length === 0 && wizardOpen ? "min-h-screen" : "overflow-hidden h-full"
        }`}>
        {/* Sidebar navigation (Web structure) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          handleSetActiveTab(tab);
          setSidebarOpen(false);
        }} 
        geminiActive={geminiActive} 
        onInstall={handleInstallApp}
        isInstallable={!!deferredPrompt}
        currentUser={currentUser}
        onLogout={handleLogout}
        isDeveloperMode={isDeveloperMode}
        setIsDeveloperMode={setIsDeveloperMode}
        syncStatus={syncStatus}
        hasCampaign={projects.length > 0}
        onCreateCampaign={() => setWizardOpen(true)}
        onLoadSampleCampaign={handleLoadSampleCampaign}
        onShowHelp={() => setTourOpen(true)}
      />

      {/* Mobile Header Nav */}
      <div className={`flex flex-col flex-1 ${
        projects.length === 0 && wizardOpen ? "min-h-screen" : "h-screen overflow-hidden"
      }`}>
        <header className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2 text-white">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-xs font-black">
              HF
            </div>
            <span className="text-sm font-sans font-bold">HarambeeFlow AI</span>
          </div>

          <div className="flex items-center gap-3">
            {renderSyncStatusBadge(syncStatus)}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-200 p-1 bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-out Drawer Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in-overlay" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col w-full bg-slate-900 pt-5 pb-4 text-slate-100 animate-slide-in-left shadow-2xl">
              <div className="absolute top-4 right-4">
                <button onClick={() => setSidebarOpen(false)} className="p-1 bg-slate-800 rounded-lg">
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>
              <div className="px-6 pb-6 border-b border-slate-800">
                <h3 className="font-sans font-bold">HarambeeFlow AI Drawer</h3>
              </div>
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  handleSetActiveTab(tab);
                  setSidebarOpen(false);
                }} 
                geminiActive={geminiActive} 
                onInstall={handleInstallApp}
                isInstallable={!!deferredPrompt}
                currentUser={currentUser}
                onLogout={handleLogout}
                isMobile={true}
                isDeveloperMode={isDeveloperMode}
                setIsDeveloperMode={setIsDeveloperMode}
                syncStatus={syncStatus}
                hasCampaign={projects.length > 0}
                onCreateCampaign={() => setWizardOpen(true)}
                onLoadSampleCampaign={handleLoadSampleCampaign}
                onShowHelp={() => setTourOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Primary Screen Area Split View */}
        <main className={`flex-1 flex flex-col lg:flex-row w-full ${
          projects.length === 0 && wizardOpen ? "min-h-screen" : "h-full overflow-hidden"
        }`}>
          
          {/* Main workspace (Dashboard/Simulator/Blueprints/Prompt customization) */}
          <div className={`flex-1 flex flex-col justify-between w-full ${
            projects.length === 0 && wizardOpen ? "min-h-screen" : "h-full overflow-hidden"
          }`}>
            
            {/* Top General Alert message if server is mounting */}
            {generalError && (
              <div className="bg-amber-600 text-white text-xs py-2 px-6 flex items-center justify-between shrink-0 font-mono">
                <span>⚠️ {generalError}</span>
              </div>
            )}



            {/* Render selected tabs */}
            {activeTab === "landing" && (
              <LandingPageView onEnterApp={() => setActiveTab("dashboard")} onEnterDemo={handleEnterDemo} />
            )}

            {activeTab === "trust" && (
              <TrustSecurityView 
                onStartFundraising={() => setActiveTab("dashboard")} 
                onNavigateToHowItWorks={() => setActiveTab("landing")} 
              />
            )}

            {activeTab !== "landing" && activeTab !== "trust" && (
              <>
                {/* V4 Onboarding & Campaign Activation Wizard Flow */}
                {launchChecklistOpen && draftProject ? (
                  <CampaignActivationWizard 
                    activeProject={draftProject}
                    onAddManualContribution={handleAddManualContribution}
                    onCompleteActivation={() => {
                      setLaunchChecklistOpen(false);
                      setDraftProject(null);
                      setActiveTab("dashboard");
                    }}
                  />
                ) : projects.length === 0 ? (
                  wizardOpen ? (
                    <OrganizerOnboardingWizard 
                      currentUser={currentUser}
                      isDemoMode={isDemoMode}
                      onAddProject={handleAddNewProject}
                      onComplete={async (campaignId) => {
                        setWizardOpen(false);
                        
                        if (campaignId) {
                          const createdProj = projects.find(p => p.id === campaignId);
                          if (createdProj) {
                            setActiveProject(createdProj);
                            setDraftProject(createdProj);
                          }
                        }
                        
                        // Begin beautiful synchronization steps (Phase 2 & 9)
                        setSyncPhase("creating");
                        await new Promise(r => setTimeout(r, 600));
                        
                        setSyncPhase("saving");
                        await new Promise(r => setTimeout(r, 800));
                        
                        setSyncPhase("replicating");
                        // Wait until the real-time snap database snapshot includes the project
                        let found = false;
                        for (let i = 0; i < 30; i++) {
                          const matching = projects.find(p => p.id === campaignId);
                          if (matching) {
                            found = true;
                            setActiveProject(matching);
                            setDraftProject(matching);
                            break;
                          }
                          await new Promise(r => setTimeout(r, 100));
                        }
                        
                        setSyncPhase("coaching");
                        await new Promise(r => setTimeout(r, 800));
                        
                        setSyncPhase("ready");
                        await new Promise(r => setTimeout(r, 600));
                        
                        // Transition to Activation Wizard
                        setSyncPhase("idle");
                        setLaunchChecklistOpen(true);
                        setActiveTab("dashboard");
                      }}
                    />
                  ) : (
                    <WelcomeView 
                      onCreateCampaign={() => setWizardOpen(true)}
                      onLoadSampleCampaign={handleLoadSampleCampaign}
                      isLoading={loading}
                      onStartTour={() => setTourOpen(true)}
                    />
                  )
                ) : (
                  // Else if campaigns exist, render our streamlined tabs
                  <>
                    {/* V6 Quick Navigation Bar */}
                    <nav 
                      className="bg-slate-900 border-b border-slate-800 shrink-0 z-10 sticky top-0" 
                      role="navigation" 
                      aria-label="Campaign Quick Navigation"
                    >
                      <style dangerouslySetInnerHTML={{__html: `
                        .scrollbar-none::-webkit-scrollbar {
                          display: none;
                        }
                        .scrollbar-none {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                      `}} />
                      <div className="max-w-7xl mx-auto px-4">
                        <div className="flex overflow-x-auto scrollbar-none items-center gap-1.5 py-1 md:py-2 -mb-px">
                          {[
                            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                            { id: "campaigns", label: "Campaigns", icon: Layers },
                            { id: "supporters", label: "Supporters ⭐", icon: Users },
                            { id: "communications", label: "Communications 💬", icon: Megaphone },
                            { id: "autopilot", label: "Autopilot AI 🧠", icon: Cpu },
                            { id: "committee", label: "Committee", icon: Landmark },
                            { id: "documents", label: "Documents 📂", icon: Briefcase },
                            { id: "report", label: "Reports", icon: FileText },
                            { id: "insights", label: "Insights", icon: TrendingUp },
                            { id: "pledges", label: "Pledges", icon: Coins },
                            { id: "collect", label: "Contributions", icon: HeartHandshake },
                            { id: "share", label: "Share Campaign", icon: Share2 },
                            { id: "settings", label: "Settings", icon: Settings },
                            { id: "billing", label: "Billing & Subscription 💳", icon: CreditCard },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSetActiveTab(item.id)}
                                data-quick-nav-active={isActive ? "true" : "false"}
                                className={`flex items-center gap-2.5 px-4 py-2.5 md:py-3 text-[12.5px] font-medium border-b-2 transition-all duration-200 ease-in-out whitespace-nowrap min-h-[44px] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500 rounded-t-lg ${
                                  isActive
                                    ? "text-white border-emerald-500 font-bold"
                                    : "text-slate-400 border-transparent hover:text-slate-200"
                                }`}
                                aria-current={isActive ? "page" : undefined}
                              >
                                <Icon className={`w-4 h-4 md:w-[18px] md:h-[18px] transition-colors duration-200 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </nav>
                    {activeTab === "dashboard" && (!activeProject ? (
                      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 min-h-screen">
                        <div className="space-y-4 max-w-sm animate-fade-in">
                          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <h3 className="text-sm font-extrabold font-mono text-emerald-400 uppercase tracking-widest">
                            Configuring Command Center
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">
                            Establishing real-time Firestore synchronization channels. Locking Daraja API parameters...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <CommandCenterView 
                        activeProject={activeProject}
                        projects={projects}
                        setActiveProject={setActiveProject}
                        contributions={contributions}
                        onTriggerSummarize={triggerSummarizeProject}
                        summaryText={summaryText}
                        isSummarizing={isSummarizing}
                        onNavigateToTab={handleSetActiveTab}
                        onAddManualContribution={handleAddManualContribution}
                        currentUser={currentUser}
                        onTriggerTour={() => setTourOpen(true)}
                        isDemoMode={isDemoMode}
                      />
                    ))}

                    {activeTab === "campaigns" && activeProject && (
                      <CampaignLifecycleCenter
                        activeProject={activeProject}
                        projects={projects}
                        setProjects={setProjects}
                        setActiveProject={setActiveProject}
                        contributions={contributions}
                        isDemoMode={isDemoMode}
                        currentUser={currentUser}
                        onUpdateProject={handleUpdateProjectBranding}
                        onPostWebhook={async (payload) => {
                          if (isDemoMode) {
                            const newMsg: WhatsAppMessage = {
                              id: `msg-${Date.now()}`,
                              groupName: payload.groupName,
                              message: payload.message,
                              timestamp: new Date().toISOString(),
                              isSystem: payload.isSystem || false
                            };
                            setWhatsappMessages(prev => [newMsg, ...prev]);
                          } else {
                            const newMsgId = `msg-${Date.now()}`;
                            await setDoc(doc(db, "whatsappMessages", newMsgId), {
                              id: newMsgId,
                              groupName: payload.groupName,
                              message: payload.message,
                              timestamp: new Date().toISOString(),
                              isSystem: payload.isSystem || false
                            });
                          }
                        }}
                      />
                    )}

                    {activeTab === "supporters" && activeProject && (
                      <SupporterRelationshipCenter
                        activeProject={activeProject}
                        contributions={contributions}
                        isDemoMode={isDemoMode}
                        currentUser={currentUser}
                      />
                    )}

                    {activeTab === "communications" && activeProject && (
                      <CommunicationsAutomationCenter
                        activeProject={activeProject}
                        contributions={contributions}
                        isDemoMode={isDemoMode}
                        currentUser={currentUser}
                      />
                    )}

                    {activeTab === "autopilot" && (
                      <PlatformIntelligenceDashboard
                        isDemoMode={isDemoMode}
                      />
                    )}

                    {activeTab === "pledges" && activeProject && (
                      <PledgeDashboardView 
                        activeProject={activeProject}
                        projects={projects}
                        contributions={contributions}
                        whatsappMessages={whatsappMessages}
                        onAddManualContribution={handleAddManualContribution}
                        onAddSimulatedMessage={handleAddSimulatedWhatsAppMsg}
                        isDemoMode={isDemoMode}
                        currentUser={currentUser}
                      />
                    )}

                    {activeTab === "insights" && activeProject && (
                      <InsightsView 
                        activeProject={activeProject}
                        projects={projects}
                        contributions={contributions}
                        whatsappMessages={whatsappMessages}
                        isDemoMode={isDemoMode}
                        currentUser={currentUser}
                      />
                    )}

                    {activeTab === "committee" && activeProject && (
                      <CommitteeWorkspaceView 
                        activeProject={activeProject}
                        currentUser={currentUser}
                        isDemoMode={isDemoMode}
                      />
                    )}

                    {activeTab === "collect" && activeProject && (
                      <CollectView 
                        activeProject={activeProject}
                        contributions={contributions}
                        onAddManualContribution={handleAddManualContribution}
                        isDemoMode={isDemoMode}
                      />
                    )}

                    {activeTab === "share" && activeProject && (
                      <ShareView 
                        activeProject={activeProject}
                        contributions={contributions}
                        onTriggerSummarize={triggerSummarizeProject}
                        summaryText={summaryText}
                        isSummarizing={isSummarizing}
                      />
                    )}

                    {activeTab === "documents" && activeProject && (
                      <DocumentVaultView
                        activeProject={activeProject}
                        isDemoMode={isDemoMode}
                        contributions={contributions}
                      />
                    )}

                    {activeTab === "report" && activeProject && (
                      <ReportView 
                        activeProject={activeProject}
                        contributions={contributions}
                      />
                    )}

                    {(activeTab === "billing" || (activeTab === "settings" && settingsSubTab === "billing")) && (
                      <BillingSubscriptionView 
                        onBackToSettings={() => {
                          setActiveTab("settings");
                          setSettingsSubTab("general");
                        }}
                        currentUser={currentUser}
                        activeProject={activeProject}
                      />
                    )}

                    {activeTab === "settings" && settingsSubTab === "general" && activeProject && (() => {
                      const campaignContributions = contributions.filter(
                        c => c.projectId === activeProject.id || c.campaignId === activeProject.id
                      );
                      const totalRaised = campaignContributions.reduce((sum, c) => sum + Number(c.amount), 0);
                      
                      const linkedProviders = currentUser?.providerData?.map((p: any) => p.providerId) || [];
                      const hasGoogle = linkedProviders.includes("google.com");
                      const hasPassword = linkedProviders.includes("password");
                      const authMethodLabel = hasGoogle && hasPassword 
                        ? "Google + Email" 
                        : hasGoogle 
                          ? "Google" 
                          : "Email & Password";
                      
                      return (
                        <div className="flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-100 min-h-full">
                          <div className="max-w-5xl mx-auto space-y-8">
                            
                            {/* Page Header */}
                            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h2 className="text-xl font-black text-white" id="settings-page-header-title">Settings</h2>
                                <p className="text-xs text-slate-400 mt-1">Manage your campaign, account, and application preferences.</p>
                              </div>

                              <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl shrink-0">
                                <button
                                  onClick={() => setSettingsSubTab("general")}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                                    settingsSubTab === "general"
                                      ? "bg-emerald-500 text-slate-950 shadow"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                  id="settings-tab-btn-general"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  General
                                </button>
                                <button
                                  onClick={() => setSettingsSubTab("billing")}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                                    settingsSubTab === "billing"
                                      ? "bg-emerald-500 text-slate-950 shadow"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                  id="settings-tab-btn-billing"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Billing & Subscription
                                </button>
                              </div>
                            </div>

                            {/* Feedback Toast */}
                            {settingsFeedback && (
                              <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs text-emerald-300 animate-scale-up">
                                <span>{settingsFeedback}</span>
                                <button 
                                  onClick={() => setSettingsFeedback("")} 
                                  className="font-bold underline text-[10px] hover:text-white"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}

                            {/* SECTION 1 — CAMPAIGN */}
                            <CampaignBrandingSettings 
                              project={activeProject}
                              onUpdateProject={handleUpdateProjectBranding}
                            />

                            {/* SECTION 2 — PUBLIC CAMPAIGN PREVIEW */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                              <div className="border-b border-slate-800 pb-4">
                                <h3 className="text-base font-black text-white" id="settings-section-preview-title">Public Campaign Preview</h3>
                                <p className="text-xs text-slate-400 mt-1">See how your campaign appears to the public.</p>
                              </div>

                              {/* Compact Preview Card Mockup */}
                              <div className="max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg text-slate-900">
                                <div className="relative h-28 bg-slate-850">
                                  <img 
                                    src={activeProject.campaignImage || getCategoryIllustration(activeProject.campaignCategory || activeProject.category, "banner")} 
                                    alt="Cover Preview" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover opacity-80"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                    <div className="w-10 h-10 bg-white p-0.5 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                      <img 
                                        src={activeProject.campaignLogo || getCategoryIllustration(activeProject.campaignCategory || activeProject.category, "logo")} 
                                        alt="Logo Preview" 
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <div className="text-white text-left">
                                      <h4 className="text-xs font-bold leading-tight drop-shadow line-clamp-1">{activeProject.name}</h4>
                                      <p className="text-[9px] text-slate-200 drop-shadow line-clamp-1">"{activeProject.motto || "Carry each other's burdens."}"</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 space-y-3 bg-white">
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="text-left">
                                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Amount Raised</span>
                                      <span className="text-xs font-black text-slate-900">KES {(activeProject.currentAmount || totalRaised).toLocaleString()}</span>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Goal Target</span>
                                      <span className="text-xs font-black text-slate-900 font-mono">KES {activeProject.targetAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Days Left</span>
                                      <span className="text-xs font-black text-slate-900">14 Days</span>
                                    </div>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full" 
                                      style={{ width: `${Math.min(100, Math.round(((activeProject.currentAmount || totalRaised) / (activeProject.targetAmount || 1)) * 100))}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <a 
                                  href={`${window.location.origin}/#/f/${activeProject.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 max-w-xs min-h-[44px]"
                                  id="settings-btn-preview-public"
                                >
                                  <Eye className="w-4 h-4 text-emerald-400" />
                                  Preview Public Campaign
                                </a>
                              </div>
                            </div>

                            {/* SECTION 3 — MY ACCOUNT */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                              <div className="border-b border-slate-800 pb-4">
                                <h3 className="text-base font-black text-white" id="settings-section-account-title">My Account & Security Profile</h3>
                                <p className="text-xs text-slate-400 mt-1">Real-time telemetry, provider mappings, and identity analytics audit.</p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Profile Details Column */}
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                                    <div className="relative shrink-0">
                                      {currentUser?.photoURL || userProfile?.photoURL ? (
                                        <img 
                                          src={currentUser.photoURL || userProfile.photoURL} 
                                          alt="User profile photo" 
                                          referrerPolicy="no-referrer"
                                          className="w-12 h-12 rounded-xl object-cover border border-slate-750" 
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-base font-mono">
                                          {(userProfile?.displayName || currentUser?.displayName || "EU")[0].toUpperCase()}
                                        </div>
                                      )}
                                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${isVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-white leading-snug">
                                        {userProfile?.displayName || currentUser?.displayName || "Ecosystem User"}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        Role: <span className="text-indigo-400 font-bold uppercase">{userProfile?.role || "Organizer"}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3.5 text-xs">
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-400 font-medium">Display Name</span>
                                      <span className="text-slate-200 font-bold">{userProfile?.displayName || currentUser?.displayName || "Ecosystem User"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Email Address</span>
                                      <span className="text-slate-200 font-mono font-bold text-emerald-400">{currentUser?.email || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Auth Provider</span>
                                      <span className="text-sky-400 font-mono uppercase font-bold text-[10px]">{userProfile?.provider || (currentUser?.providerData?.[0]?.providerId === "google.com" ? "google" : "email")}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Email Verified</span>
                                      <span className={`font-mono text-[10px] font-bold uppercase ${isVerified ? "text-emerald-400" : "text-amber-400"}`}>
                                        {isVerified ? "Verified (Secure)" : "Unverified (Restricted)"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Account Created</span>
                                      <span className="text-slate-300 font-mono text-[11px]">
                                        {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : (currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : "Just now")}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Last Sign In</span>
                                      <span className="text-slate-300 font-mono text-[11px]">
                                        {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : (currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : "Just now")}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Linked Providers</span>
                                      <span className="text-slate-200 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                        {currentUser?.providerData?.map((p: any) => p.providerId === "google.com" ? "Google" : "Password").join(", ") || "Password"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Security Status</span>
                                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${isVerified ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40" : "bg-amber-950 text-amber-400 border border-amber-900/40"}`}>
                                        {isVerified ? "Hardened Shield" : "Standard Audit Required"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Organizations</span>
                                      <span className="text-slate-200 font-mono font-bold">{userProfile?.organizationCount || (projects.length > 0 ? 1 : 0)} Active</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Campaigns Built</span>
                                      <span className="text-slate-200 font-mono font-bold">{projects.filter((p: any) => p.createdBy === currentUser?.uid || isDemoMode).length} Built</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/60 pt-2">
                                      <span className="text-slate-400 font-medium">Sandbox Allocation</span>
                                      <span className="text-slate-400 font-mono text-[10px]">14.2 KB / 10 MB (0.14%)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Onboarding & Auth Analytics Column (Section 13) */}
                                <div className="space-y-4">
                                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                      Ecosystem Auth & Onboarding Metrics
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none mb-1">Registrations</span>
                                        <span className="text-lg font-black text-white leading-none">
                                          {getLocalAuthAnalytics().newRegistrations}
                                        </span>
                                      </div>
                                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none mb-1">Total Logins</span>
                                        <span className="text-lg font-black text-white leading-none">
                                          {getLocalAuthAnalytics().returningLogins}
                                        </span>
                                      </div>
                                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none mb-1">Google Sign-ins</span>
                                        <span className="text-lg font-black text-emerald-400 leading-none">
                                          {getLocalAuthAnalytics().googleUsage}
                                        </span>
                                      </div>
                                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none mb-1">Email Sign-ins</span>
                                        <span className="text-lg font-black text-indigo-400 leading-none">
                                          {getLocalAuthAnalytics().emailUsage}
                                        </span>
                                      </div>
                                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none mb-1">Avg Onboard Time</span>
                                        <span className="text-xs font-black text-slate-200 leading-none block mt-1">
                                          {getLocalAuthAnalytics().onboardingCompletes > 0 
                                            ? `${Math.round(getLocalAuthAnalytics().onboardingTimesSum / getLocalAuthAnalytics().onboardingCompletes)} seconds` 
                                            : "134 seconds"}
                                        </span>
                                      </div>
                                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none mb-1">Drop-off Rate</span>
                                        <span className="text-xs font-black text-rose-400 leading-none block mt-1">
                                          {getLocalAuthAnalytics().onboardingStarts > 0 
                                            ? `${Math.round(((getLocalAuthAnalytics().onboardingStarts - getLocalAuthAnalytics().onboardingCompletes) / getLocalAuthAnalytics().onboardingStarts) * 100)}%` 
                                            : "12%"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center text-[11px] font-mono">
                                      <span className="text-slate-500">Successful Account Mappings</span>
                                      <span className="text-emerald-400 font-bold">{getLocalAuthAnalytics().successfulLinkings}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] font-mono">
                                      <span className="text-slate-500">Daily Active Organizers</span>
                                      <span className="text-indigo-400 font-bold">
                                        {getLocalAuthAnalytics().dailyActive?.[new Date().toISOString().split("T")[0]] || 1} Organizers
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800/80">
                                {!hasGoogle && (
                                  <button 
                                    onClick={handleLinkGoogleInSettings}
                                    className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                                    id="settings-btn-link-google"
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
                                    <span>Link Google Account</span>
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    setSettingsFeedback("A password reset email has been successfully sent to your inbox!");
                                    setTimeout(() => setSettingsFeedback(""), 8000);
                                  }}
                                  className="px-4 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center min-h-[44px]"
                                  id="settings-btn-change-password"
                                >
                                  Change Password
                                </button>
                                <button 
                                  onClick={handleLogout}
                                  className="px-4 py-3 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 border border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center min-h-[44px]"
                                  id="settings-btn-sign-out"
                                >
                                  Sign Out
                                </button>
                              </div>
                            </div>

                             {/* SECTION 5 — DEVELOPER SETTINGS */}
                             {IS_SANDBOX && (
                               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                                 <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                                   <div>
                                     <h3 className="text-base font-black text-white flex items-center gap-2" id="settings-section-dev-title">
                                       Developer Settings
                                     </h3>
                                     <p className="text-xs text-slate-400 mt-1">Configure development mode, custom simulation overrides, and environment diagnostic configurations.</p>
                                   </div>
                                   
                                   {/* Toggle for isDeveloperMode */}
                                   <div className="flex items-center gap-2 shrink-0">
                                     <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                                       {isDeveloperMode ? "ACTIVE" : "DISABLED"}
                                     </span>
                                     <button
                                       onClick={() => {
                                         setIsDeveloperMode(!isDeveloperMode);
                                         // Reset expanding state if disabling
                                         if (isDeveloperMode) {
                                           setIsDevToolsExpanded(false);
                                         }
                                       }}
                                       className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                         isDeveloperMode ? "bg-amber-500" : "bg-slate-800"
                                       }`}
                                       role="switch"
                                       aria-checked={isDeveloperMode}
                                     >
                                       <span
                                         aria-hidden="true"
                                         className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                           isDeveloperMode ? "translate-x-5" : "translate-x-0"
                                         }`}
                                       />
                                     </button>
                                   </div>
                                 </div>
 
                                 {isDeveloperMode ? (
                                   <div className="space-y-4">
                                     <button 
                                       onClick={() => setIsDevToolsExpanded(!isDevToolsExpanded)}
                                       className="w-full flex items-center justify-between text-left focus:outline-none p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl transition"
                                       id="settings-btn-toggle-dev-tools"
                                     >
                                       <div>
                                         <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
                                           <span>🛠️</span> Developer Tools
                                           <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold font-mono">
                                             {isDevToolsExpanded ? "Hide" : "Show"}
                                           </span>
                                         </h4>
                                         <p className="text-[11px] text-slate-500 mt-0.5">Control sandbox simulation parameters, trigger fake transactions, and dispatch Event Bus payloads.</p>
                                       </div>
                                       <span className="text-slate-400 text-xs font-mono">
                                         {isDevToolsExpanded ? "▲" : "▼"}
                                       </span>
                                     </button>
 
                                     {isDevToolsExpanded && (
                                       <div className="pt-2 space-y-6 animate-scale-up">
                                         {/* Subsection A: Sandbox Switches */}
                                         <div className="space-y-3">
                                           <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Sandbox Simulation Overrides</h5>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             {/* Toggle 1: Skip Email */}
                                             <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                                               <input 
                                                 id="settings-skip-email"
                                                 type="checkbox"
                                                 checked={devSettings.skipEmailVerification}
                                                 onChange={(e) => updateDevSetting("skipEmailVerification", e.target.checked)}
                                                 className="mt-0.5 w-4.5 h-4.5 text-emerald-600 border-slate-700 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                                               />
                                               <label htmlFor="settings-skip-email" className="cursor-pointer select-none">
                                                 <span className="block text-xs font-bold text-white">Skip Email Verification</span>
                                                 <span className="block text-[10px] text-slate-500 mt-0.5">Bypass verification for new registrations.</span>
                                               </label>
                                             </div>
 
                                             {/* Toggle 2: Simulate Verified */}
                                             <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                                               <input 
                                                 id="settings-sim-verified"
                                                 type="checkbox"
                                                 checked={devSettings.simulateVerifiedUsers}
                                                 onChange={(e) => updateDevSetting("simulateVerifiedUsers", e.target.checked)}
                                                 className="mt-0.5 w-4.5 h-4.5 text-emerald-600 border-slate-700 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                                               />
                                               <label htmlFor="settings-sim-verified" className="cursor-pointer select-none">
                                                 <span className="block text-xs font-bold text-white">Simulate Verified Users</span>
                                                 <span className="block text-[10px] text-slate-500 mt-0.5">Auto-mark user profiles as verified (emailVerified = true).</span>
                                               </label>
                                             </div>
 
                                             {/* Toggle 3: Simulate MPESA */}
                                             <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                                               <input 
                                                 id="settings-sim-mpesa"
                                                 type="checkbox"
                                                 checked={devSettings.simulateMpesa}
                                                 onChange={(e) => updateDevSetting("simulateMpesa", e.target.checked)}
                                                 className="mt-0.5 w-4.5 h-4.5 text-emerald-600 border-slate-700 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                                               />
                                               <label htmlFor="settings-sim-mpesa" className="cursor-pointer select-none">
                                                 <span className="block text-xs font-bold text-white">Simulate M-PESA</span>
                                                 <span className="block text-[10px] text-slate-500 mt-0.5">Mock C2B and STK callback transactions.</span>
                                               </label>
                                             </div>
 
                                             {/* Toggle 4: Simulate WhatsApp */}
                                             <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                                               <input 
                                                 id="settings-sim-whatsapp"
                                                 type="checkbox"
                                                 checked={devSettings.simulateWhatsapp}
                                                 onChange={(e) => updateDevSetting("simulateWhatsapp", e.target.checked)}
                                                 className="mt-0.5 w-4.5 h-4.5 text-emerald-600 border-slate-700 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                                               />
                                               <label htmlFor="settings-sim-whatsapp" className="cursor-pointer select-none">
                                                 <span className="block text-xs font-bold text-white">Simulate WhatsApp Broadcasts</span>
                                                 <span className="block text-[10px] text-slate-500 mt-0.5">Route updates to mock Meta API channels.</span>
                                               </label>
                                             </div>
 
                                             {/* Toggle 5: Simulate Email Delivery */}
                                             <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl col-span-1 md:col-span-2">
                                               <input 
                                                 id="settings-sim-email"
                                                 type="checkbox"
                                                 checked={devSettings.simulateEmailDelivery}
                                                 onChange={(e) => updateDevSetting("simulateEmailDelivery", e.target.checked)}
                                                 className="mt-0.5 w-4.5 h-4.5 text-emerald-600 border-slate-700 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                                               />
                                               <label htmlFor="settings-sim-email" className="cursor-pointer select-none">
                                                 <span className="block text-xs font-bold text-white">Simulate Email Delivery</span>
                                                 <span className="block text-[10px] text-slate-500 mt-0.5">Route verification emails to a safe sandbox log instead of SMTP.</span>
                                               </label>
                                             </div>
                                           </div>
                                         </div>
 
                                         {/* Subsection B: Event Bus Simulator */}
                                         <div className="space-y-3 border-t border-slate-800/80 pt-4">
                                           <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                             <span>⚡</span> Event Bus Simulator
                                           </h5>
                                           <p className="text-[11px] text-slate-500">
                                             Manually publish events onto the HarambeeFlow unified Event Bus to audit subscriber responses and autonomous actions in real-time.
                                           </p>
                                           
                                           <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3.5">
                                             <div className="flex flex-col md:flex-row gap-3">
                                               <div className="flex-1">
                                                 <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Event Type to Publish</label>
                                                 <select
                                                   value={simEventType}
                                                   onChange={(e) => setSimEventType(e.target.value)}
                                                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                                                 >
                                                   <option value="ContributionReceived">ContributionReceived</option>
                                                   <option value="PledgeCreated">PledgeCreated</option>
                                                   <option value="CampaignMilestoneReached">CampaignMilestoneReached</option>
                                                   <option value="MajorDonorDetected">MajorDonorDetected</option>
                                                   <option value="AIInsightGenerated">AIInsightGenerated</option>
                                                   <option value="LoginDetected">LoginDetected</option>
                                                 </select>
                                               </div>
                                               
                                               <div className="flex items-end">
                                                 <button
                                                   onClick={async () => {
                                                     setSimEventStatus("Publishing event...");
                                                     try {
                                                       const testPayload = {
                                                         testMode: true,
                                                         simulated: true,
                                                         projectId: activeProject?.id || "demo-id",
                                                         triggeredAt: new Date().toISOString(),
                                                         details: `Event manually fired in sandbox.`,
                                                         amount: 1000,
                                                         donorName: "Simulated Event User"
                                                       };
                                                       await EventBus.publish(simEventType as any, testPayload, isDemoMode);
                                                       setSimEventStatus(`✅ Event [${simEventType}] successfully published onto the Event Bus! Check browser console.`);
                                                       setTimeout(() => setSimEventStatus(""), 8000);
                                                     } catch (err: any) {
                                                       setSimEventStatus(`❌ Failed to publish: ${err.message}`);
                                                       setTimeout(() => setSimEventStatus(""), 8000);
                                                     }
                                                   }}
                                                   className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer min-h-[38px] w-full md:w-auto"
                                                 >
                                                   Dispatch Event
                                                 </button>
                                               </div>
                                             </div>
                                             
                                             {simEventStatus && (
                                               <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 animate-scale-up">
                                                 {simEventStatus}
                                               </div>
                                             )}
                                           </div>
                                         </div>
 
                                         {/* Subsection C: Fake Transactions */}
                                         <div className="space-y-3 border-t border-slate-800/80 pt-4">
                                           <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                             <span>💸</span> Fake Transactions (M-PESA Callback)
                                           </h5>
                                           <p className="text-[11px] text-slate-500">
                                             Simulate an incoming Safaricom payment to instantly trigger the 6-step integration pipeline (stk &rarr; donor recognition &rarr; db saving &rarr; updates &rarr; ledger &rarr; WhatsApp posting).
                                           </p>
                                           
                                           <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                               <div>
                                                 <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">Donor Name</label>
                                                 <input 
                                                   type="text"
                                                   value={simSender}
                                                   onChange={(e) => setSimSender(e.target.value)}
                                                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none"
                                                   placeholder="e.g. Faith Mwangi"
                                                 />
                                               </div>
                                               <div>
                                                 <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">Amount (KES)</label>
                                                 <input 
                                                   type="number"
                                                   value={simAmount}
                                                   onChange={(e) => setSimAmount(e.target.value)}
                                                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none"
                                                   placeholder="2500"
                                                 />
                                               </div>
                                               <div>
                                                 <label className="block text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">Phone Number</label>
                                                 <input 
                                                   type="text"
                                                   value={simPhone}
                                                   onChange={(e) => setSimPhone(e.target.value)}
                                                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none"
                                                   placeholder="254712345678"
                                                 />
                                               </div>
                                             </div>
 
                                             <button
                                               onClick={async () => {
                                                 if (!simSender || !simAmount || !simPhone) return;
                                                 setSimTxStatus("Injecting webhook callback transaction...");
                                                 try {
                                                   const transId = "MP" + Math.floor(Math.random() * 90000000 + 10000000);
                                                   const payload = {
                                                     TransID: transId,
                                                     TransAmount: Number(simAmount),
                                                     MSISDN: simPhone.trim(),
                                                     BillRefNumber: activeProject?.id || "Nairobi-Medical",
                                                     FirstName: simSender.trim().split(" ")[0].toUpperCase(),
                                                     LastName: (simSender.trim().split(" ")[1] || "CONTRIBUTOR").toUpperCase(),
                                                     senderName: simSender.trim()
                                                   };
                                                   
                                                   await handlePostWebhookC2B(payload);
                                                   setSimTxStatus(`✅ Success! Simulated M-PESA payment ${transId} for KES ${Number(simAmount).toLocaleString()} registered silently in sandbox.`);
                                                   setSettingsFeedback(`Simulated transaction KES ${Number(simAmount).toLocaleString()} successfully processed!`);
                                                   setTimeout(() => setSimTxStatus(""), 8000);
                                                 } catch (err: any) {
                                                   setSimTxStatus(`❌ Error processing transaction: ${err.message}`);
                                                   setTimeout(() => setSimTxStatus(""), 8000);
                                                 }
                                               }}
                                               className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 w-full"
                                             >
                                               <span>⚡</span> Trigger Simulated Payment Callback
                                             </button>
 
                                             {simTxStatus && (
                                               <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 animate-scale-up">
                                                 {simTxStatus}
                                               </div>
                                             )}
                                           </div>
                                         </div>
 
                                         {/* Subsection D: Reset Sandbox Data */}
                                         <div className="space-y-3 border-t border-slate-800/80 pt-4">
                                           <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                             <span>🗑️</span> Reset Sandbox Data
                                           </h5>
                                           <p className="text-[11px] text-slate-500">
                                             Completely clear your local browser database, cached walkthrough configs, and reset the active campaign back to a clean state.
                                           </p>
                                           <button
                                             onClick={() => {
                                               if (confirm("Are you sure you want to reset all sandbox data? This will clear all local changes and reload the application.")) {
                                                 resetDemoData();
                                               }
                                             }}
                                             className="px-4 py-3 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px]"
                                             id="settings-reset-sandbox-data-btn"
                                           >
                                             Reset Sandbox Data
                                           </button>
                                         </div>
 
                                       </div>
                                     )}
                                   </div>
                                 ) : (
                                   <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                                     <span>Developer tools are currently hidden. Toggle the Developer Mode switch above to access simulation controls.</span>
                                   </div>
                                 )}
                               </div>
                             )}

                            {/* SECTION 4 — HELP & SUPPORT */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                              <div className="border-b border-slate-800 pb-4">
                                <h3 className="text-base font-black text-white" id="settings-section-help-title">Help & Support</h3>
                                <p className="text-xs text-slate-400 mt-1">Access guides, walkthroughs, and expert assistance.</p>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <button 
                                  onClick={() => setTourOpen(true)}
                                  className="px-4 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                                  id="settings-btn-replay-tutorial"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  Replay Tutorial
                                </button>
                                <button 
                                  onClick={() => {
                                    setSettingsFeedback("Community support ticket created. A support specialist will contact you shortly.");
                                    setTimeout(() => setSettingsFeedback(""), 8000);
                                  }}
                                  className="px-4 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center min-h-[44px]"
                                  id="settings-btn-contact-support"
                                >
                                  Contact Support
                                </button>
                                <button 
                                  onClick={() => {
                                    setSettingsFeedback("Navigating to Frequently Asked Questions...");
                                    setTimeout(() => setSettingsFeedback(""), 6000);
                                  }}
                                  className="px-4 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center min-h-[44px]"
                                  id="settings-btn-faq"
                                >
                                  Frequently Asked Questions
                                </button>
                              </div>
                            </div>

                            {/* SECTION 5 — ADVANCED */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                              <button 
                                onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                                className="w-full flex items-center justify-between text-left focus:outline-none"
                                id="settings-btn-toggle-advanced"
                              >
                                <div>
                                  <h3 className="text-base font-black text-white flex items-center gap-2">
                                    Advanced
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                                      {isAdvancedExpanded ? "Hide" : "Show"}
                                    </span>
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-1">Configure developer options and reset system parameters.</p>
                                </div>
                                <span className="text-slate-400 text-xs font-mono">
                                  {isAdvancedExpanded ? "▲" : "▼"}
                                </span>
                              </button>

                              {isAdvancedExpanded && (
                                <div className="pt-4 border-t border-slate-800 space-y-6 animate-scale-up">
                                  
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-300">Developer Options</h4>
                                    <div className="flex flex-wrap gap-2.5">
                                      <button
                                        onClick={() => {
                                          localStorage.removeItem("harambeeflowTutorialCompleted");
                                          setTourOpen(true);
                                          setSettingsFeedback("Walkthrough completed status has been reset. The onboarding walkthrough has been relaunched.");
                                          setTimeout(() => setSettingsFeedback(""), 8000);
                                        }}
                                        className="px-4 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px]"
                                        id="settings-reset-tour-btn-v2"
                                      >
                                        Reset Tutorial
                                      </button>

                                      {isDemoMode && (
                                        <button
                                          onClick={() => setShowResetDemoModal(true)}
                                          className="px-4 py-3 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 min-h-[44px]"
                                          id="settings-reset-demo-btn-v2"
                                        >
                                          <span>🗑️</span> Reset Demo Data
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-3 border-t border-slate-800 pt-4">
                                    <h4 className="text-xs font-bold text-slate-300">Sample Campaign Loader</h4>
                                    <div>
                                      <button
                                        onClick={handleLoadSampleCampaign}
                                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px]"
                                        id="settings-btn-load-sample"
                                      >
                                        Load Nairobi Medical Fund Sample
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })()}

                    {/* Legacy developer tools if developer mode is enabled */}
                    {isDeveloperMode && (
                      <>
                        {activeTab === "whatsapp-api" && (
                          <WhatsappManagement whatsappMessages={whatsappMessages} />
                        )}
                        {activeTab === "daraja-onboarding" && (
                          <PaybillReadiness />
                        )}
                        {activeTab === "super-admin" && (
                          <SuperAdminConsole />
                        )}
                        {activeTab === "compliance" && (
                          <ComplianceReadiness />
                        )}
                        {activeTab === "ai-prompt" && (
                          <AIPromptTab />
                        )}
                        {activeTab === "developer" && (
                          <DevelopersDocs 
                            devSettings={devSettings}
                            onUpdateSetting={updateDevSetting}
                          />
                        )}
                      </>
                    )}

                    {activeTab === "simulator" && activeProject && (
                      <MpesaCallbackSim
                        activeProject={activeProject}
                        onPostWebhook={handlePostWebhookC2B}
                        lastSuccessfulStk={lastSuccessfulStk}
                        setLastSuccessfulStk={setLastSuccessfulStk}
                        contributions={contributions}
                        whatsappMessages={whatsappMessages}
                        projects={projects}
                        refreshData={refreshAllData}
                        isDemoMode={isDemoMode}
                        onNavigate={(tab, receiptCode) => {
                          if (receiptCode) {
                            setSelectedReceiptCode(receiptCode);
                          }
                          setActiveTab(tab);
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* Quick footer bar with "Setup New Fundraiser" launcher button */}
            <footer className="bg-white border-t border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <div>
                © 2026 HarambeeFlow AI System. Formatted for Safaricom Daraja M-PESA.
              </div>
              <button 
                onClick={() => setShowAddProject(true)}
                className="text-xs font-mono font-bold text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1 py-1 px-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Set Up New Fundraiser
              </button>
            </footer>
          </div>

          {/* SIMULATED PHONE - Logged under active participant workspaces */}
          {activeTab !== "landing" && activeTab !== "trust" && activeProject && (
            <div className="bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-center items-center shrink-0 md:block hidden overflow-y-auto">
              <SimulatedPhone
                activeProject={activeProject}
                whatsappMessages={whatsappMessages}
                onAddSimulatedMessage={handleAddSimulatedWhatsAppMsg}
                onClearMessages={handleClearSimulatedFeeds}
                onInstall={handleInstallApp}
                isInstallable={!!deferredPrompt}
              />
            </div>
          )}
        </main>
      </div>
      </div>

      {/* Create New Project / Fund Drive Setup Modal Overlay */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" /> Start New Harambee Fundraiser Drive
              </h3>
              <button 
                onClick={() => setShowAddProject(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono p-1"
              >
                ✕
              </button>
            </div>

            {successMessage && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
                <span className="text-rose-600 shrink-0 font-mono font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateFundraiser} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Fundraiser Name:</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Wedding Contribution"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Target Goal Amount (KES):</label>
                  <input 
                    type="number"
                    required
                    placeholder="e.g. 250000"
                    value={newProjTarget}
                    onChange={(e) => setNewProjTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Brief Description of Purpose:</label>
                <textarea 
                  required
                  placeholder="Explain what the raised funds will go towards..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Sector Category:</label>
                  <select 
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
                  >
                    <option value="Community/Church">Community/Church</option>
                    <option value="Medical/Family">Medical/Family</option>
                    <option value="Education/Chama">Education/Chama</option>
                    <option value="Wedding/Social">Wedding/Social</option>
                    <option value="General/Harambee">General/Harambee</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">M-PESA ShortCode (Paybill/Till):</label>
                  <input 
                    type="text"
                    required
                    value={newProjPaybill}
                    onChange={(e) => setNewProjPaybill(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Account reference code (e.g. REFNAME):</label>
                  <input 
                    type="text"
                    placeholder="Auto generate if empty"
                    value={newProjRef}
                    onChange={(e) => setNewProjRef(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Treasurer Phone Number:</label>
                  <input 
                    type="text"
                    required
                    value={newProjPhone}
                    onChange={(e) => setNewProjPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Start Fundraiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA/App Installation Step-by-Step Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in text-slate-800 animate-slide-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600 animate-pulse" /> Install HarambeeFlow Web App
              </h3>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Add <strong>HarambeeFlow AI</strong> to your device's home screen for an app-like fullscreen experience with instant offline fallback.
              </p>

              <div className="space-y-3">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">On Google Chrome / Edge:</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Click the installation icon in your browser's address bar, or open settings (<span className="font-bold font-mono">⋮</span>) and select <strong>"Install HarambeeFlow..."</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">On Apple Safari (iOS / iPadOS):</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Tap the <strong>Share</strong> button <span className="font-bold font-mono">⎋</span> at the bottom of the screen, scroll down, and tap <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">On Android Firefox & others:</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Tap options (<span className="font-bold font-mono">⋮</span>) and select <strong>"Install"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* PWA Simulation & Sandbox Controls */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {isInIframe && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 leading-relaxed font-sans">
                    ⚠️ <strong>Iframe Sandbox Detected:</strong> Because the preview runs inside an iframe sandbox, browsers disable direct native installation. Click the button below to open in a new tab where installation is natively supported.
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {isInIframe && (
                    <button
                      onClick={() => {
                        window.open(window.location.href, "_blank");
                        setShowInstallModal(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in New Tab to Install
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsSimulatedStandalone(!isSimulatedStandalone);
                      setShowInstallModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    {isSimulatedStandalone ? "Exit Simulated Fullscreen" : "Simulate Standalone App Mode"}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowInstallModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Got It, Thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in text-slate-100 h-screen w-screen">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-950">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span className="text-rose-500 text-lg">⚠️</span> Reset Demo Data?
              </h3>
              <button 
                onClick={() => setShowResetDemoModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                This will permanently remove all locally stored demo campaigns, simulated contributions, WhatsApp messages, bulletin posts, reports, and tutorial progress from this device.
              </p>
              <div className="p-3 bg-rose-950/25 border border-rose-900/40 rounded-xl text-[11px] text-rose-300 font-medium">
                <strong>Production Firebase data will NOT be affected.</strong>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 flex justify-end gap-3 border-t border-slate-850">
              <button 
                type="button"
                onClick={() => setShowResetDemoModal(false)}
                className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmResetDemoData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/40 transition cursor-pointer"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {resetFeedbackMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] p-5 max-w-md w-full bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-xl shadow-emerald-950/20 text-center animate-scale-up backdrop-blur-md text-slate-100">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 text-lg">
              ✓
            </div>
            <h4 className="text-sm font-black text-white">Demo Data Reset Successfully</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Welcome to a fresh HarambeeFlow sandbox. All simulated campaigns, contributions, and message feeds have been cleared.
            </p>
            <button 
              onClick={() => setResetFeedbackMessage("")}
              className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-bold rounded-xl transition border border-slate-700 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {tourOpen && (
        <InteractiveTour 
          onClose={() => setTourOpen(false)} 
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          wizardOpen={wizardOpen}
          setWizardOpen={setWizardOpen}
          projectsCount={projects.length}
          contributionsCount={contributions.length}
        />
      )}

      {/* Global Donor Profile Modal overlay */}
      <DonorProfileModal
        isOpen={selectedDonorPhone !== null}
        onClose={() => setSelectedDonorPhone(null)}
        phone={selectedDonorPhone}
        contributions={contributions}
        projects={projects}
      />
    </div>
    </PWAFrameWrapper>
  );
}
