import React, { useState, useMemo, useEffect } from "react";
import { Project, Contribution, Notification, ActivityLog } from "../types";
import { 
  Sparkles, TrendingUp, Users, Target, Landmark, ShieldCheck, 
  Smartphone, Bot, FileText, ArrowRight, Plus, Share2, Copy, Check, 
  ChevronRight, Calendar, Activity, Zap, ThumbsUp, Flame, Play, AlertCircle,
  Bell, Search, Trash2, ShieldAlert, Archive, ClipboardCheck, ArrowUpRight,
  Info, RefreshCw, X, UserCheck, ChevronDown, Settings, Coins, ArrowLeft, Building2, CheckCircle2
} from "lucide-react";
import { getTheme, getCampaignLogo, getCampaignMotto, getCampaignBanner } from "../utils/branding";
import { collection, onSnapshot, doc, setDoc, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import CampaignLaunchView from "./CampaignLaunchView";
import CampaignLogo from "./CampaignLogo";
import LiveFundraisingCommandCenter from "./LiveFundraisingCommandCenter";

export type SimulatedRole = "Chairperson" | "Treasurer" | "Secretary" | "Auditor" | "Viewer";

interface CommandCenterViewProps {
  activeProject: Project;
  projects: Project[];
  setActiveProject: (proj: Project | null) => void;
  contributions: Contribution[];
  onTriggerSummarize: () => void;
  summaryText: string;
  isSummarizing: boolean;
  onNavigateToTab: (tab: string) => void;
  onAddManualContribution: (cnt: any) => Promise<any>;
  currentUser?: any;
  onTriggerTour?: () => void;
  isDemoMode?: boolean;
  onOpenCampaignSwitcher?: () => void;
}

export default function CommandCenterView({
  activeProject,
  projects,
  setActiveProject,
  contributions,
  onTriggerSummarize,
  summaryText,
  isSummarizing,
  onNavigateToTab,
  onAddManualContribution,
  currentUser,
  onTriggerTour,
  isDemoMode = false,
  onOpenCampaignSwitcher
}: CommandCenterViewProps) {
  // Global States
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [contributionMethod, setContributionMethod] = useState<"stk" | "mpesa_existing" | "cash" | "bank" | null>(null);
  const [showInviteCommitteeModal, setShowInviteCommitteeModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteRole, setInviteRole] = useState("Co-Treasurer");
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<SimulatedRole>("Treasurer");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Firestore Synced States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Manual contribution form state
  const [formAmount, setFormAmount] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCategory, setFormCategory] = useState("Well-wisher");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Archive Wizard Form State
  const [archiveStep, setArchiveStep] = useState(1);
  const [chairpersonSignOff, setChairpersonSignOff] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  // Filter contributions for this project
  const projectContributions = useMemo(() => {
    return contributions.filter(c => c.projectId === activeProject.id || c.campaignId === activeProject.id || c.fundraiserId === activeProject.id);
  }, [contributions, activeProject.id]);

  // Live Feed Smart Filtering & Pagination States
  const [liveFilter, setLiveFilter] = useState<"All" | "Today" | "M-PESA" | "Cash" | "Bank">("All");
  const [visibleContributionsCount, setVisibleContributionsCount] = useState(12);

  const todayContributionsCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return projectContributions.filter(c => new Date(c.timestamp).toDateString() === todayStr).length;
  }, [projectContributions]);

  const filteredLiveContributions = useMemo(() => {
    let list = [...projectContributions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (liveFilter === "Today") {
      const todayStr = new Date().toDateString();
      list = list.filter(c => new Date(c.timestamp).toDateString() === todayStr);
    } else if (liveFilter === "M-PESA") {
      list = list.filter(c => 
        (c.category && c.category.toUpperCase().includes("MPESA")) ||
        (c.transactionCode && !c.transactionCode.startsWith("CASH") && !c.transactionCode.startsWith("BANK")) ||
        (c.rawMessage && c.rawMessage.includes("M-PESA"))
      );
    } else if (liveFilter === "Cash") {
      list = list.filter(c => 
        c.category?.toLowerCase() === "cash" || 
        c.transactionCode?.startsWith("CASH") ||
        c.notes?.toLowerCase().includes("cash")
      );
    } else if (liveFilter === "Bank") {
      list = list.filter(c => 
        c.category?.toLowerCase() === "bank" || 
        c.transactionCode?.startsWith("BANK") ||
        c.notes?.toLowerCase().includes("bank")
      );
    }
    
    return list;
  }, [projectContributions, liveFilter]);

  const getRelativeTimeLabel = (timestamp: string): string => {
    if (!timestamp) return "🟢 Just Now";
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return "🟢 Just Now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const [showWelcomeDashboard, setShowWelcomeDashboard] = useState(() => projectContributions.length === 0);

  // If contributions change, check if we should keep or reset the welcome dashboard
  useEffect(() => {
    if (projectContributions.length > 0) {
      setShowWelcomeDashboard(false);
    }
  }, [projectContributions.length]);

  const totalRaised = useMemo(() => {
    const sumFromConts = projectContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    return Math.max(sumFromConts, Number(activeProject.currentAmount || 0));
  }, [projectContributions, activeProject.currentAmount]);

  const percentComplete = useMemo(() => {
    return Math.min(100, Math.round((totalRaised / activeProject.targetAmount) * 100));
  }, [totalRaised, activeProject.targetAmount]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, activeProject.targetAmount - totalRaised);
  }, [activeProject.targetAmount, totalRaised]);

  // Today's Raised Calculations (Simulating within the last 24h)
  const todayRaised = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return projectContributions
      .filter(c => new Date(c.timestamp).getTime() > oneDayAgo)
      .reduce((sum, c) => sum + Number(c.amount), 0);
  }, [projectContributions]);

  const todayGoal = useMemo(() => {
    return Math.round(activeProject.targetAmount / 30); // 30 day velocity baseline goal
  }, [activeProject.targetAmount]);

  // Dynamic calculations for health score and success probability
  const healthScore = useMemo(() => {
    const donorCount = projectContributions.length;
    let score = 70; // baseline
    if (donorCount > 0) score += 10;
    if (donorCount >= 5) score += 10;
    if (donorCount >= 20) score += 10;
    if (percentComplete > 20) score += 5;
    if (percentComplete > 50) score += 5;
    return Math.min(100, score);
  }, [projectContributions.length, percentComplete]);

  const riskStatus = useMemo(() => {
    if (healthScore >= 90) return { label: "Excellent", color: "text-emerald-400" };
    if (healthScore >= 75) return { label: "Good/Active", color: "text-sky-400" };
    return { label: "Stable Baseline", color: "text-amber-400" };
  }, [healthScore]);

  const successProbability = useMemo(() => {
    let prob = 50; // baseline
    prob += Math.round(percentComplete * 0.4);
    if (projectContributions.length > 5) prob += 10;
    return Math.min(99, prob);
  }, [percentComplete, projectContributions.length]);

  // Intelligent progressive recommendation logic
  const todayPriority = useMemo(() => {
    const donationCount = projectContributions.length;
    if (donationCount === 0) {
      return {
        task: "Invite co-treasurers and committee chairs",
        reason: "Adding committee members can improve accountability, transparency, and collaboration when managing your campaign."
      };
    }
    if (donationCount < 5) {
      return {
        task: "Invite co-treasurers and committee chairs",
        reason: "Adding committee members can improve accountability, transparency, and collaboration when managing your campaign."
      };
    }
    return {
      task: "Schedule mid-campaign summary update report",
      reason: "Givers are 3x more likely to top-up when progress is active on WhatsApp groups."
    };
  }, [projectContributions.length]);

  // Days Remaining Calculations
  const daysRemaining = useMemo(() => {
    const start = new Date(activeProject.createdAt).getTime();
    const end = start + 30 * 24 * 60 * 60 * 1000; // 30 days default
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 12;
  }, [activeProject.createdAt]);

  const nextMilestone = useMemo(() => {
    if (totalRaised === 0) return "Gather KES 10,000 (Receive first contributions)";
    if (percentComplete < 50) return `Reach 50% Milestone (KES ${Math.round(activeProject.targetAmount * 0.5).toLocaleString()})`;
    return `Reach 100% Goal (KES ${activeProject.targetAmount.toLocaleString()})`;
  }, [totalRaised, percentComplete, activeProject.targetAmount]);

  const publicLink = `${window.location.origin}/#/campaign/${activeProject.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Local Storage Shared Flags
  const [hasSharedLink, setHasSharedLink] = useState(() => {
    return localStorage.getItem(`shared_${activeProject.id}`) === "true";
  });
  const [hasGeneratedReport, setHasGeneratedReport] = useState(() => {
    return localStorage.getItem(`report_${activeProject.id}`) === "true";
  });
  const [hasPrintedQr, setHasPrintedQr] = useState(() => {
    return localStorage.getItem(`printed_${activeProject.id}`) === "true";
  });
  const [hasThankedDonor, setHasThankedDonor] = useState(() => {
    return localStorage.getItem(`thanked_${activeProject.id}`) === "true" || projectContributions.some(c => c.notes?.includes("Thanked") || c.notes?.includes("Receipted") || c.notes?.includes("Thank"));
  });
  const [hasReviewedDashboard, setHasReviewedDashboard] = useState(() => {
    return localStorage.getItem(`reviewed_${activeProject.id}`) === "true";
  });

  useEffect(() => {
    if (!hasReviewedDashboard) {
      setHasReviewedDashboard(true);
      localStorage.setItem(`reviewed_${activeProject.id}`, "true");
    }
  }, [activeProject.id]);

  const handleToggleChecklistItem = (id: string) => {
    let newStatus = false;
    if (id === "share") {
      newStatus = !hasSharedLink;
      setHasSharedLink(newStatus);
      localStorage.setItem(`shared_${activeProject.id}`, newStatus ? "true" : "false");
    } else if (id === "print") {
      newStatus = !hasPrintedQr;
      setHasPrintedQr(newStatus);
      localStorage.setItem(`printed_${activeProject.id}`, newStatus ? "true" : "false");
    } else if (id === "thank") {
      newStatus = !hasThankedDonor;
      setHasThankedDonor(newStatus);
      localStorage.setItem(`thanked_${activeProject.id}`, newStatus ? "true" : "false");
    } else if (id === "review") {
      newStatus = !hasReviewedDashboard;
      setHasReviewedDashboard(newStatus);
      localStorage.setItem(`reviewed_${activeProject.id}`, newStatus ? "true" : "false");
    } else if (id === "publish") {
      showToast("Campaign is active and live!", "success");
      return;
    } else {
      newStatus = projectContributions.length > 0;
      if (!newStatus) {
        showToast("To complete this, trigger an STK push in the Lipa Na M-PESA Simulator (Collect tab)!", "info");
        return;
      }
    }

    if (newStatus) {
      showToast("🎉 Task completed! Outstanding job!", "success");
    } else {
      showToast("Task updated.", "info");
    }
  };

  // Checklist Completion Checkers
  const checklist = useMemo(() => {
    return [
      { id: "publish", label: "Campaign Published", status: true, desc: "Your fundraising campaign was verified and successfully published to Firestore." },
      { id: "share", label: "Share Campaign", status: hasSharedLink, desc: "Invite supporters via WhatsApp copy-paste or direct link." },
      { id: "print", label: "Print QR Flyer", status: hasPrintedQr, desc: "Download and print QR-code flyer for physical placement." },
      { id: "test", label: "Test STK Push", status: projectContributions.length > 0, desc: "Send a simulation transaction to verify Daraja APIs." },
      { id: "donation", label: "Receive First Donation", status: projectContributions.length > 0, desc: "Verify live balance tracks incoming contributions." },
      { id: "thank", label: "Send Thank You", status: hasThankedDonor, desc: "Send an automated thank-you broadcast to WhatsApp." },
      { id: "review", label: "Review Dashboard", status: hasReviewedDashboard, desc: "Inspect Campaign Summary, Progress Bar, and AI Daily Briefing." }
    ];
  }, [activeProject, projectContributions, hasSharedLink, hasPrintedQr, hasThankedDonor, hasReviewedDashboard]);

  // Setup Live Firestore listeners for logs and notifications
  useEffect(() => {
    if (currentUser?.uid === "demo-user-123") {
      setNotifications([
        {
          id: "demo-notif-1",
          campaignId: activeProject.id,
          type: "ai_recommendation",
          title: "Complete Target Forecasting",
          message: "Based on current trends, your fundraiser is highly likely to reach its goal in 4 days. Try sending a tally announcement.",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          read: false,
          dismissed: false
        },
        {
          id: "demo-notif-2",
          campaignId: activeProject.id,
          type: "milestone",
          title: "Milestone: KES 600,000 Crossed!",
          message: "Your campaign has successfully surpassed 60% of its target. Fantastic momentum!",
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          read: false,
          dismissed: false
        }
      ]);

      setActivityLogs([
        {
          id: "demo-log-1",
          campaignId: activeProject.id,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          user: "Richard Mayore (Treasurer)",
          action: "Generated Professional PDF Financial Report",
          details: "Report successfully compiled with 3 verified transactions."
        },
        {
          id: "demo-log-2",
          campaignId: activeProject.id,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          user: "M-PESA Daraja",
          action: "Reconciled Contribution KES 120,000",
          details: "Sender: David Ochieng (TX SL987FG6H5)"
        },
        {
          id: "demo-log-3",
          campaignId: activeProject.id,
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          user: "M-PESA Daraja",
          action: "Reconciled Contribution KES 470,000",
          details: "Sender: St. Joseph Sacco (TX TX333MM44K)"
        },
        {
          id: "demo-log-4",
          campaignId: activeProject.id,
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          user: "System Admin",
          action: "Campaign Provisioned Successfully",
          details: "Sandbox ledger environment initialized."
        }
      ]);
      return;
    }

    if (!db) return;

    // Listen to Activity Logs
    const unsubscribeLogs = onSnapshot(collection(db, "activityLogs"), (snapshot) => {
      const logsList: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      // Sort logs descending by timestamp
      logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(logsList.filter(l => l.campaignId === activeProject.id));
    }, (error) => {
      console.error("Activity logs snapshot error:", error);
    });

    // Listen to Notifications
    const unsubscribeNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const notifsList: Notification[] = [];
      snapshot.forEach((doc) => {
        notifsList.push({ id: doc.id, ...doc.data() } as Notification);
      });
      notifsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(notifsList.filter(n => n.campaignId === activeProject.id && !n.dismissed));
    }, (error) => {
      console.error("Notifications snapshot error:", error);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeNotifications();
    };
  }, [activeProject.id]);

  // Seed Notifications and Logs if newly created
  useEffect(() => {
    const seedInitialNotifs = async () => {
      if (!db || !currentUser || currentUser?.uid === "demo-user-123") return;
      
      const querySnapshot = await getDocs(collection(db, "notifications"));
      const existing = querySnapshot.docs.map(d => d.data());
      const hasInit = existing.some(n => n.campaignId === activeProject.id);

      if (!hasInit) {
        // Create initial notifications
        const initNotifs = [
          {
            campaignId: activeProject.id,
            type: "ai_recommendation",
            title: "Configure Paybill Automation",
            message: "Tap the Collect Desk and simulate an STK push to establish your live M-PESA ledger link.",
            timestamp: new Date().toISOString(),
            read: false,
            dismissed: false
          },
          {
            campaignId: activeProject.id,
            type: "milestone",
            title: "Welcome to HarambeeFlow V3",
            message: `Your campaign "${activeProject.name}" has been deployed securely in the sandbox.`,
            timestamp: new Date(Date.now() - 5000).toISOString(),
            read: false,
            dismissed: false
          }
        ];

        for (const notif of initNotifs) {
          const newId = `notif-${Date.now()}-${Math.random().toString(36).substring(4)}`;
          await setDoc(doc(db, "notifications", newId), { id: newId, ...notif });
        }

        // Create initial Activity Log
        const logId = `log-${Date.now()}`;
        await setDoc(doc(db, "activityLogs", logId), {
          id: logId,
          campaignId: activeProject.id,
          timestamp: new Date().toISOString(),
          user: activeProject.organizer || "System Administrator",
          action: `Published campaign "${activeProject.name}" with KES ${activeProject.targetAmount.toLocaleString()} target.`,
          campaignName: activeProject.name,
          device: "Safaricom Dev Portal"
        });
      }
    };

    seedInitialNotifs();
  }, [activeProject.id]);

  // Generate Suggested WhatsApp Message
  const suggestedMsg = useMemo(() => {
    return `📢 UPDATE: *${activeProject.name}* progress update! 
We have raised *KES ${totalRaised.toLocaleString()}* (*${percentComplete}%* of target KES ${activeProject.targetAmount.toLocaleString()}) from ${projectContributions.length} supporters. 

Support this cause:
Paybill: *${activeProject.paybillNumber}*
Account: *${activeProject.accountReference}*

Thank you for your generous support!`;
  }, [activeProject, totalRaised, percentComplete, projectContributions]);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper for action permission checking
  const checkPermission = (action: string, permittedRoles: SimulatedRole[]): boolean => {
    if (!permittedRoles.includes(simulatedRole)) {
      showToast(
        `Role Restricted: Only ${permittedRoles.join(" or ")} can perform this action. Switch simulated roles in the top-right.`,
        "error"
      );
      return false;
    }
    return true;
  };

  const handleCopyLinkAction = () => {
    if (!checkPermission("Copy public link", ["Chairperson", "Treasurer", "Secretary", "Auditor", "Viewer"])) return;
    handleCopyLink();
    setHasSharedLink(true);
    localStorage.setItem(`shared_${activeProject.id}`, "true");
    showToast("Public campaign link copied to clipboard!");
    
    // Log Activity
    const logId = `log-${Date.now()}`;
    setDoc(doc(db, "activityLogs", logId), {
      id: logId,
      campaignId: activeProject.id,
      timestamp: new Date().toISOString(),
      user: `${simulatedRole} (Simulated)`,
      action: "Copied public payment portal URL for promotion distribution.",
      campaignName: activeProject.name,
      device: "Web Browser (Simulator)"
    });
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!checkPermission("Log manual payments", ["Treasurer"])) return;

    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      setFormError("Enter a valid positive contribution amount.");
      return;
    }
    if (!formName.trim()) {
      setFormError("Contributor name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentUser?.uid === "demo-user-123") {
        await onAddManualContribution({
          projectId: activeProject.id,
          amount: Number(formAmount),
          senderName: formName.trim(),
          senderPhone: formPhone.trim() || "254712345678",
          transactionCode: `MAN-${Date.now().toString().substring(7)}`,
          category: formCategory,
          notes: formNotes.trim()
        });

        const logId = `log-${Date.now()}`;
        const newLog = {
          id: logId,
          campaignId: activeProject.id,
          timestamp: new Date().toISOString(),
          user: `${simulatedRole} (Simulated)`,
          action: `Manually logged KES ${Number(formAmount).toLocaleString()} from ${formName.trim()}.`,
          campaignName: activeProject.name,
          device: "Treasurer Desk Tool"
        };
        setActivityLogs(prev => [newLog, ...prev]);

        if (Number(formAmount) >= 20000) {
          const notifId = `notif-${Date.now()}`;
          const newNotif = {
            id: notifId,
            campaignId: activeProject.id,
            type: "large_donation",
            title: "Large Donation Alert!",
            message: `KES ${Number(formAmount).toLocaleString()} received from ${formName.trim()}. Prepare thank-you brief.`,
            timestamp: new Date().toISOString(),
            read: false,
            dismissed: false
          };
          setNotifications(prev => [newNotif, ...prev]);
        }

        setShowAddContribution(false);
        setFormAmount("");
        setFormName("");
        setFormPhone("");
        setFormNotes("");
        showToast("Ledger contribution recorded successfully!");
        setIsSubmitting(false);
        return;
      }

      await onAddManualContribution({
        projectId: activeProject.id,
        amount: Number(formAmount),
        senderName: formName.trim(),
        senderPhone: formPhone.trim() || "254712345678",
        transactionCode: `MAN-${Date.now().toString().substring(7)}`,
        category: formCategory,
        notes: formNotes.trim()
      });

      // Log Activity
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        campaignId: activeProject.id,
        timestamp: new Date().toISOString(),
        user: `${simulatedRole} (Simulated)`,
        action: `Manually logged KES ${Number(formAmount).toLocaleString()} from ${formName.trim()}.`,
        campaignName: activeProject.name,
        device: "Treasurer Desk Tool"
      });

      // Dispatch Large Donation notification if amount > 20,000
      if (Number(formAmount) >= 20000) {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          campaignId: activeProject.id,
          type: "large_donation",
          title: "Large Donation Alert!",
          message: `KES ${Number(formAmount).toLocaleString()} received from ${formName.trim()}. Prepare thank-you brief.`,
          timestamp: new Date().toISOString(),
          read: false,
          dismissed: false
        });
      }

      setShowAddContribution(false);
      setFormAmount("");
      setFormName("");
      setFormPhone("");
      setFormNotes("");
      showToast("Ledger contribution recorded successfully!");
    } catch (err: any) {
      setFormError(err.message || "Failed to log manual payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Campaign Settings Cloning Action
  const handleCloneCampaign = async () => {
    if (!checkPermission("Clone Campaign", ["Treasurer", "Chairperson"])) return;

    try {
      showToast("Cloning campaign templates & settings...", "info");
      const cloneId = `clone-${Date.now()}`;
      const cloneProj = {
        ...activeProject,
        id: cloneId,
        name: `${activeProject.name} (Clone)`,
        currentAmount: 0,
        createdAt: new Date().toISOString()
      };

      if (currentUser?.uid === "demo-user-123") {
        const logIdSource = `log-${Date.now()}-src`;
        const newLog = {
          id: logIdSource,
          campaignId: activeProject.id,
          timestamp: new Date().toISOString(),
          user: `${simulatedRole} (Simulated)`,
          action: `Cloned settings to new project "${cloneProj.name}".`,
          campaignName: activeProject.name,
          device: "Treasurer Workspace"
        };
        setActivityLogs(prev => [newLog, ...prev]);

        showToast("Cloned successfully! Redirecting to the cloned campaign dashboard.");
        setActiveProject(cloneProj);
        return;
      }

      // Write fundraiser
      await setDoc(doc(db, "fundraisers", cloneId), cloneProj);

      // Log activity in the source campaign
      const logIdSource = `log-${Date.now()}-src`;
      await setDoc(doc(db, "activityLogs", logIdSource), {
        id: logIdSource,
        campaignId: activeProject.id,
        timestamp: new Date().toISOString(),
        user: `${simulatedRole} (Simulated)`,
        action: `Cloned settings to new project "${cloneProj.name}".`,
        campaignName: activeProject.name,
        device: "Treasurer Workspace"
      });

      // Log activity in cloned campaign
      const logIdClone = `log-${Date.now()}-cln`;
      await setDoc(doc(db, "activityLogs", logIdClone), {
        id: logIdClone,
        campaignId: cloneId,
        timestamp: new Date().toISOString(),
        user: "System Cloner",
        action: `Campaign initialized via clone from parent "${activeProject.name}".`,
        campaignName: cloneProj.name,
        device: "Cloud Run Container"
      });

      showToast("Cloned successfully! Redirecting to the cloned campaign dashboard.");
      // Instantly direct active tab to cloned instance
      setActiveProject(cloneProj);
    } catch (err: any) {
      showToast(err.message || "Failed to clone campaign settings.", "error");
    }
  };

  // Campaign Archive Actions
  const handleArchiveSubmit = async () => {
    if (!chairpersonSignOff.trim()) {
      showToast("Chairperson signature authorization is required to archive.", "error");
      return;
    }

    setIsArchiving(true);
    try {
      if (currentUser?.uid === "demo-user-123") {
        const logId = `log-${Date.now()}`;
        const newLog = {
          id: logId,
          campaignId: activeProject.id,
          timestamp: new Date().toISOString(),
          user: chairpersonSignOff.trim() + " (Chairperson Sign-off)",
          action: "Executed final ledger reconciliation, thank-you blast, and archived campaign.",
          campaignName: activeProject.name,
          device: "Committee Chairperson Vault"
        };
        setActivityLogs(prev => [newLog, ...prev]);

        showToast(`Campaign archived successfully! Chairperson signature: ${chairpersonSignOff.trim()}`);
        setIsArchiveModalOpen(false);
        setArchiveStep(1);
        setChairpersonSignOff("");
        return;
      }

      // 1. Update project in Firestore
      await setDoc(doc(db, "fundraisers", activeProject.id), {
        ...activeProject,
        category: "Archived",
        status: "Archived"
      }, { merge: true });

      // 2. Log final activity
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        campaignId: activeProject.id,
        timestamp: new Date().toISOString(),
        user: chairpersonSignOff.trim() + " (Chairperson Sign-off)",
        action: "Executed final ledger reconciliation, thank-you blast, and archived campaign.",
        campaignName: activeProject.name,
        device: "Committee Chairperson Vault"
      });

      showToast(`Campaign archived successfully! Chairperson signature: ${chairpersonSignOff.trim()}`);
      setIsArchiveModalOpen(false);
      setArchiveStep(1);
      setChairpersonSignOff("");
    } catch (err: any) {
      showToast(err.message || "Failed to archive campaign.", "error");
    } finally {
      setIsArchiving(false);
    }
  };

  // Dismiss / Mark as Read Notification Actions
  const handleNotificationRead = async (id: string) => {
    try {
      await setDoc(doc(db, "notifications", id), { read: true }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationDismiss = async (id: string) => {
    try {
      await setDoc(doc(db, "notifications", id), { dismissed: true }, { merge: true });
      showToast("Notification cleared.");
    } catch (err) {
      console.error(err);
    }
  };

  // Global search autocomplete filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();

    // 1. Search Campaigns
    const matchingCampaigns = projects.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category?.toLowerCase().includes(query)
    );

    // 2. Search Donors
    const matchingDonors: any[] = [];
    const processedDonors = new Set<string>();
    projectContributions.forEach(c => {
      const dName = c.senderName.toLowerCase();
      const dPhone = c.senderPhone.toLowerCase();
      if ((dName.includes(query) || dPhone.includes(query)) && !processedDonors.has(c.senderPhone)) {
        processedDonors.add(c.senderPhone);
        matchingDonors.push({
          name: c.senderName,
          phone: c.senderPhone,
          total: projectContributions.filter(pc => pc.senderPhone === c.senderPhone).reduce((sum, pc) => sum + Number(pc.amount), 0)
        });
      }
    });

    // 3. Search Receipts/M-PESA Codes
    const matchingReceipts = projectContributions.filter(c => 
      c.transactionCode.toLowerCase().includes(query) || 
      c.senderName.toLowerCase().includes(query) ||
      c.senderPhone.toLowerCase().includes(query)
    );

    // 4. Search Committee Members
    const members = ["Richard Mayore", "Sarah Wanjiku", "Pastor John Gichuru", "Mary Wangare", "James Kilonzo"];
    const matchingMembers = members.filter(m => m.toLowerCase().includes(query));

    return {
      campaigns: matchingCampaigns.slice(0, 3),
      donors: matchingDonors.slice(0, 3),
      receipts: matchingReceipts.slice(0, 4),
      members: matchingMembers.slice(0, 3)
    };
  }, [searchQuery, projects, projectContributions]);

  if (showWelcomeDashboard) {
    return (
      <CampaignLaunchView 
        activeProject={activeProject}
        contributions={contributions}
        lastSuccessfulStk={null}
        onNavigateToTab={(tab) => {
          if (tab === "dashboard") {
            setShowWelcomeDashboard(false);
          } else {
            onNavigateToTab(tab);
          }
        }}
      />
    );
  }

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 pb-28 sm:pb-32 md:pb-6 text-slate-100 min-h-full font-sans select-none relative">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`fixed bottom-[calc(80px+env(safe-area-inset-bottom))] sm:bottom-24 md:bottom-6 right-4 sm:right-6 px-5 py-3 rounded-xl border shadow-2xl z-50 flex items-center gap-3 animate-slide-in-right ${
          toastMessage.type === "error" 
            ? "bg-rose-950 border-rose-500/30 text-rose-300" 
            : toastMessage.type === "info"
            ? "bg-indigo-950 border-indigo-500/30 text-indigo-300"
            : "bg-emerald-950 border-emerald-500/30 text-emerald-300"
        }`}>
          {toastMessage.type === "error" ? <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" /> : <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
          <span className="text-xs font-bold leading-none">{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- EXPANDABLE SEARCH OVERLAY MODAL --- */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 flex flex-col items-center justify-start pt-12 animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                  <Search className="w-4 h-4" />
                  <span>Search Workspace</span>
                </div>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                autoFocus
                placeholder="Search campaigns, donors, receipts, M-PESA codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
              />

              {searchResults && (
                <div className="max-h-[360px] overflow-y-auto space-y-3 pt-2">
                  {searchResults.campaigns.length === 0 && searchResults.donors.length === 0 && searchResults.receipts.length === 0 && searchResults.members.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-500 font-mono">No matching records found.</p>
                  ) : (
                    <>
                      {searchResults.campaigns.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProject(p);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl flex items-center justify-between text-left transition"
                        >
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          <span className="text-[10px] font-mono text-emerald-400">KES {p.targetAmount.toLocaleString()} target</span>
                        </button>
                      ))}

                      {searchResults.donors.map((d, i) => (
                        <div key={i} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">{d.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">{d.phone}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 font-mono">KES {d.total.toLocaleString()}</span>
                        </div>
                      ))}

                      {searchResults.receipts.map(r => (
                        <div key={r.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between font-mono">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">{r.transactionCode}</span>
                            <span className="text-[10px] text-slate-500">{r.senderName}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400">+ KES {r.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            1. HERO CARD (Clean & Streamlined)
            ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Top Row: Campaign Name & Status Badge */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {activeProject.name}
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono shrink-0">
              Active
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400">Progress</span>
              <span className="text-emerald-400 font-extrabold">{percentComplete}% Raised</span>
            </div>

            <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_12px_#10b981]"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Metrics Line: Amount Raised | Target | Days Remaining */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Amount Raised</span>
              <p className="text-lg sm:text-2xl font-black font-mono text-emerald-400">
                KES {totalRaised.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Target</span>
              <p className="text-lg sm:text-2xl font-black font-mono text-slate-200">
                KES {activeProject.targetAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Days Remaining</span>
              <p className="text-lg sm:text-2xl font-black font-mono text-indigo-300">
                {daysRemaining} Days
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                if (checkPermission("Log manual payments", ["Treasurer"])) {
                  setContributionMethod(null);
                  setShowAddContribution(true);
                }
              }}
              className="w-full min-h-[48px] px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/15 cursor-pointer active:scale-98"
              id="hero-receive-contribution-btn"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Receive Contribution</span>
            </button>

            <button
              onClick={handleCopyLinkAction}
              className="w-full min-h-[48px] px-6 py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              id="hero-share-campaign-btn"
            >
              {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              <span>{copiedLink ? "Link Copied!" : "Share Campaign"}</span>
            </button>
          </div>
        </div>

        {/* ====================================================
            2. FUNDRAISING SUMMARY (4 KPI Cards)
            ==================================================== */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Fundraising Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Today's Raised */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Today's Raised</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                KES {todayRaised.toLocaleString()}
              </p>
            </div>

            {/* Total Raised */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Raised</span>
                <Coins className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                KES {totalRaised.toLocaleString()}
              </p>
            </div>

            {/* Supporters */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Supporters</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-100">
                {projectContributions.length}
              </p>
            </div>

            {/* Remaining Target */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Remaining Target</span>
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                KES {remainingAmount.toLocaleString()}
              </p>
            </div>

          </div>
        </div>

        {/* ====================================================
            3. QUICK ACTIONS
            ==================================================== */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Quick Actions</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. Receive Contribution */}
            <button
              onClick={() => {
                if (checkPermission("Log manual payments", ["Treasurer"])) {
                  setContributionMethod(null);
                  setShowAddContribution(true);
                }
              }}
              className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer active:scale-98 group"
            >
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Receive Contribution</span>
            </button>

            {/* 2. Manual Cash Entry */}
            <button
              onClick={() => {
                if (checkPermission("Log manual payments", ["Treasurer"])) {
                  setContributionMethod("cash");
                  setShowAddContribution(true);
                }
              }}
              className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer active:scale-98 group"
            >
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Manual Cash Entry</span>
            </button>

            {/* 3. Share Campaign */}
            <button
              onClick={handleCopyLinkAction}
              className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer active:scale-98 group"
            >
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">Share Campaign</span>
            </button>

            {/* 4. Reports */}
            <button
              onClick={() => onNavigateToTab("report")}
              className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer active:scale-98 group"
            >
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">Reports</span>
            </button>

            {/* 5. Supporters */}
            <button
              onClick={() => onNavigateToTab("supporters")}
              className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer active:scale-98 group"
            >
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">Supporters</span>
            </button>

            {/* 6. Settings */}
            <button
              onClick={() => onNavigateToTab("settings")}
              className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center text-center gap-2 transition cursor-pointer active:scale-98 group"
            >
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Settings</span>
            </button>

          </div>
        </div>

        {/* ====================================================
            4. DAILY BRIEFING
            ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bot className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">Daily AI Briefing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Today's Recommendation */}
            <div className="md:col-span-7 p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 font-mono block uppercase tracking-wider">TODAY'S RECOMMENDATION</span>
                  <h3 className="text-sm font-black text-white tracking-tight">Invite your committee</h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Adding committee members can improve accountability, transparency, and collaboration when managing your campaign.
                  </p>
                </div>
              </div>

              <div className="pl-7 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInviteName("");
                    setInviteContact("");
                    setInviteRole("Co-Treasurer");
                    setShowInviteCommitteeModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
                  id="invite-committee-cta-btn"
                >
                  <span>Invite Committee Members</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* WhatsApp Message & Copy Button */}
            <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Suggested WhatsApp Message</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Ready to Share
                  </span>
                </div>
                
                {/* Scrollable Message Box */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 max-h-28 overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {suggestedMsg}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(suggestedMsg);
                  setCopiedWhatsApp(true);
                  showToast("WhatsApp message copied to clipboard!", "success");
                  setTimeout(() => setCopiedWhatsApp(false), 2500);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-800 cursor-pointer transition active:scale-98"
                id="copy-whatsapp-msg-btn"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-extrabold">✓ Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy WhatsApp Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            5. LIVE CONTRIBUTIONS
            ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4" id="live-contributions-feed">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3.5 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Contributions
              </h2>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0 no-scrollbar">
              {(["All", "Today", "M-PESA", "Cash", "Bank"] as const).map((filter) => {
                const isActive = liveFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => {
                      setLiveFilter(filter);
                      setVisibleContributionsCount(12);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-black"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {filter === "All" ? `All (${projectContributions.length})` : filter === "Today" ? `Today (${todayContributionsCount})` : filter}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredLiveContributions.length === 0 ? (
            <div className="py-10 text-center space-y-3 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40 p-6">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <Coins className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200">No contributions recorded yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Incoming M-PESA payments, bank transfers, or cash deposits will appear here in real time.
                </p>
              </div>
              <button
                onClick={() => {
                  if (checkPermission("Log manual payments", ["Treasurer"])) {
                    setContributionMethod(null);
                    setShowAddContribution(true);
                  }
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-md"
              >
                Receive First Contribution
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredLiveContributions.slice(0, visibleContributionsCount).map((c, index) => {
                const method = c.category?.toUpperCase().includes("CASH") || c.transactionCode?.startsWith("CASH")
                  ? "Cash"
                  : c.category?.toUpperCase().includes("BANK") || c.transactionCode?.startsWith("BANK")
                  ? "Bank"
                  : "M-PESA";

                return (
                  <div
                    key={c.id || `cont-${index}`}
                    className="bg-slate-950 border border-slate-850 hover:border-slate-750 rounded-2xl p-3.5 space-y-2 transition shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold">
                          {getRelativeTimeLabel(c.timestamp)}
                        </span>
                        <span className="text-slate-300 font-bold">
                          {c.transactionCode || "MPESA-DIRECT"}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {c.senderName || c.cleanedName || "Anonymous Well-wisher"}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {c.senderPhone || "M-PESA Registered Number"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono text-emerald-400 block">
                          KES {Number(c.amount).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">
                          {method}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {visibleContributionsCount < filteredLiveContributions.length && (
                <button
                  onClick={() => setVisibleContributionsCount(prev => prev + 12)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>Load More ({filteredLiveContributions.length - visibleContributionsCount} remaining)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ====================================================
            6. ADVANCED CAMPAIGN MANAGEMENT & AUDIT LOGS (Collapsible)
            ==================================================== */}
        <details className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group">
          <summary className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none text-xs font-bold text-slate-400 hover:text-white transition">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Advanced Campaign Management & Audit Trail</span>
            </span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-5 pt-0 border-t border-slate-800/60 space-y-6 mt-3">
            {/* Committee Activity Logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-200">Committee Activity Logs</h3>
                <span className="text-[10px] font-mono text-slate-500">Immutable Audit Trail</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activityLogs.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500 font-mono">No audit trail logs recorded yet.</p>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="text-emerald-400 font-bold">{log.user}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{log.action}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Campaign Lifecycle Controls */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <h4 className="text-xs font-bold text-slate-200">Advanced Campaign Controls</h4>
                <p className="text-[11px] text-slate-500">Clone presets or begin the multi-step Reconciliation Archive protocol.</p>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleCloneCampaign}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  id="clone-campaign-settings-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Clone Campaign</span>
                </button>

                <button
                  onClick={() => {
                    if (checkPermission("Archive Campaign", ["Chairperson"])) {
                      setArchiveStep(1);
                      setIsArchiveModalOpen(true);
                    }
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  id="archive-protocol-trigger-btn"
                >
                  <Archive className="w-3.5 h-3.5 text-rose-400" />
                  <span>Archive Protocol</span>
                </button>
              </div>
            </div>
          </div>
        </details>

      </div>

      {/* --- ADD/RECEIVE CONTRIBUTION WORKFLOW MODAL --- */}
      {showAddContribution && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          {contributionMethod === null ? (
            /* --- STEP 1: CONTRIBUTION METHOD SELECTION MODAL --- */
            <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 relative shadow-2xl animate-scale-up space-y-5">
              <button
                onClick={() => setShowAddContribution(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                id="close-method-selection-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight">Receive Contribution</h3>
                <p className="text-xs text-slate-400 font-medium">How was this contribution received?</p>
              </div>

              {/* 4 Large Clickable Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Option 1: M-PESA STK Push */}
                <div 
                  onClick={() => {
                    setContributionMethod("stk");
                    setFormCategory("Well-wisher");
                  }}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col justify-between gap-3 transition cursor-pointer group active:scale-98 shadow-sm"
                  id="method-card-stk-push"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Smartphone className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Live Prompt
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">📱 M-PESA STK Push</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Initiate an STK Push directly to the contributor's phone.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="w-full py-2 bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-slate-950 text-xs font-bold rounded-xl transition-colors border border-emerald-500/20 cursor-pointer"
                  >
                    Start STK Push
                  </button>
                </div>

                {/* Option 2: Existing M-PESA Payment */}
                <div 
                  onClick={() => {
                    setContributionMethod("mpesa_existing");
                    setFormCategory("Well-wisher");
                  }}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 rounded-2xl flex flex-col justify-between gap-3 transition cursor-pointer group active:scale-98 shadow-sm"
                  id="method-card-existing-mpesa"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                        Paybill / Till
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-sky-400 transition-colors">✅ Existing M-PESA Payment</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Record a payment already completed through Paybill or Till Number.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="w-full py-2 bg-sky-500/10 group-hover:bg-sky-500 text-sky-400 group-hover:text-slate-950 text-xs font-bold rounded-xl transition-colors border border-sky-500/20 cursor-pointer"
                  >
                    Record M-PESA Payment
                  </button>
                </div>

                {/* Option 3: Cash Contribution */}
                <div 
                  onClick={() => {
                    setContributionMethod("cash");
                    setFormCategory("Well-wisher");
                  }}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col justify-between gap-3 transition cursor-pointer group active:scale-98 shadow-sm"
                  id="method-card-cash"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <Coins className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Physical Cash
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">💵 Cash Contribution</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Record cash received during church service, fundraiser or community event.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="w-full py-2 bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 text-xs font-bold rounded-xl transition-colors border border-amber-500/20 cursor-pointer"
                  >
                    Record Cash
                  </button>
                </div>

                {/* Option 4: Bank Deposit */}
                <div 
                  onClick={() => {
                    setContributionMethod("bank");
                    setFormCategory("Well-wisher");
                  }}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl flex flex-col justify-between gap-3 transition cursor-pointer group active:scale-98 shadow-sm"
                  id="method-card-bank-deposit"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                        <Building2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Direct Transfer
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">🏦 Bank Deposit</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Record funds deposited directly into the campaign bank account.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="w-full py-2 bg-indigo-500/10 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-slate-950 text-xs font-bold rounded-xl transition-colors border border-indigo-500/20 cursor-pointer"
                  >
                    Record Bank Deposit
                  </button>
                </div>

              </div>

              {/* Future Expansion Placeholder Note */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center">
                Future Expansion Ready: QR Payments • Card • USSD • Agency Banking • International Transfers
              </div>

              <button
                type="button"
                onClick={() => setShowAddContribution(false)}
                className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* --- STEP 2: CONTRIBUTION DATA ENTRY FORM --- */
            <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 relative shadow-2xl animate-scale-up space-y-4">
              
              {/* Navigation Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setContributionMethod(null)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Methods</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddContribution(false);
                    setContributionMethod(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-black text-white">
                {contributionMethod === "cash" && "Record Cash Contribution"}
                {contributionMethod === "stk" && "Initiate M-PESA STK Push"}
                {contributionMethod === "mpesa_existing" && "Record M-PESA Payment"}
                {contributionMethod === "bank" && "Record Bank Deposit"}
              </h3>

              {/* Campaign Display Badge */}
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Campaign</span>
                <span className="font-extrabold text-emerald-400 font-mono text-xs">{activeProject.name}</span>
              </div>
              
              {formError && (
                <div className="p-2.5 bg-rose-950/25 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">Contributor Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alice Atieno"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">Phone Number (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. 254711223344"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">Amount (KES):</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden font-mono font-bold text-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">Category:</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden cursor-pointer"
                    >
                      <option value="Well-wisher">Well-wisher</option>
                      <option value="Church Member">Church Member</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Committee Member">Committee Member</option>
                      <option value="Corporate Sponsor">Corporate Sponsor</option>
                      <option value="Anonymous">Anonymous</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">Notes (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Reconciled cash from physical envelope"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContribution(false);
                      setContributionMethod(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? "Processing..." : (contributionMethod === "stk" ? "Start STK Push" : "Record Contribution")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- GUIDED 5-STEP CAMPAIGN RECONCILIATION ARCHIVE PROTOCOL MODAL --- */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 relative shadow-2xl animate-scale-up flex flex-col">
            <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />

            <button
              onClick={() => setIsArchiveModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-5 pt-1">
              {/* Header Step indicators */}
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="w-4.5 h-4.5 text-rose-400" />
                  <span className="text-xs font-mono font-bold uppercase text-rose-400">Reconciliation Archive Protocol</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">Step {archiveStep} of 5</span>
              </div>

              {/* Wizard Content Body based on Active Step */}
              {archiveStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-200">Step 1: Ledger Reconciliation Verification</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Confirming that all recorded STK pushes, manual deposits, and M-PESA callback records tally.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Total Raised</span>
                      <p className="text-sm font-bold font-mono text-emerald-400">KES {totalRaised.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Deposits Audited</span>
                      <p className="text-sm font-bold font-mono text-slate-300">{projectContributions.length} Transactions</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">✓ No un-reconciled exceptions detected.</p>
                </div>
              )}

              {archiveStep === 2 && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-200">Step 2: Thank-you Message Broadcast</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Prepare and finalize the appreciations text that will be distributed back to the committee group and donors.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Draft Gratitude message:</label>
                    <textarea
                      readOnly
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-hidden h-24"
                      value={`We have successfully reconciled the Nairobi Medical fundraiser ledger with KES ${totalRaised.toLocaleString()} raised! Deepest thanks to our ${projectContributions.length} well-wishers and organizers. May you be blessed.`}
                    />
                  </div>
                </div>
              )}

              {archiveStep === 3 && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-200">Step 3: Final Financial Audit Report</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Compile ledger records into a secure vault statement. This locks the active campaign ledger from any future ledger additions.
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 font-medium">
                    Compiling statement... File will be secured inside the document vault.
                  </div>
                </div>
              )}

              {archiveStep === 4 && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-200">Step 4: PDF Export Audit Brief</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Download and inspect the generated print-ready financial report.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setHasGeneratedReport(true);
                      localStorage.setItem(`report_${activeProject.id}`, "true");
                      showToast("PDF report generated successfully!");
                    }}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Generate Financial PDF Report</span>
                  </button>
                </div>
              )}

              {archiveStep === 5 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-rose-400">Step 5: Chairperson Sign-off Authorization</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      To lock, reconcile and archive this campaign, enter the Chairperson's sign-off signature below to authorize.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Chairperson Sign-off Signature Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="Type e.g. Sarah Wanjiku to authorize"
                      value={chairpersonSignOff}
                      onChange={(e) => setChairpersonSignOff(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-hidden font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Navigation controls for Wizard */}
              <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-2">
                <button
                  disabled={archiveStep === 1}
                  onClick={() => setArchiveStep(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Previous
                </button>

                {archiveStep < 5 ? (
                  <button
                    onClick={() => setArchiveStep(prev => prev + 1)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleArchiveSubmit}
                    disabled={isArchiving}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isArchiving ? "Locking..." : "Lock & Archive Campaign"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- INVITE COMMITTEE MEMBERS MODAL --- */}
      {showInviteCommitteeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 relative shadow-2xl animate-scale-up space-y-4">
            
            <button
              type="button"
              onClick={() => setShowInviteCommitteeModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              id="close-invite-committee-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">Invite Committee Members</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed pt-1">
                Invite trusted people to help manage this campaign.
              </p>
            </div>

            {/* Campaign info badge */}
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Campaign</span>
              <span className="font-extrabold text-emerald-400 font-mono text-xs">{activeProject.name}</span>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                showToast(`Invitation created for ${inviteName || "committee member"} as ${inviteRole}!`, "success");
                setShowInviteCommitteeModal(false);
              }} 
              className="space-y-3.5 text-xs font-sans"
            >
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elder James Omondi"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">Phone or Email:</label>
                  <input
                    type="text"
                    required
                    placeholder="2547... or email"
                    value={inviteContact}
                    onChange={(e) => setInviteContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">Role:</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Co-Treasurer">Co-Treasurer</option>
                    <option value="Committee Member">Committee Member</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Campaign Manager">Campaign Manager</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons for Copying Link & WhatsApp Sharing */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}?invite=${activeProject.id}&role=${encodeURIComponent(inviteRole)}`;
                      navigator.clipboard.writeText(link);
                      setCopiedInviteLink(true);
                      showToast("Invitation link copied to clipboard!", "success");
                      setTimeout(() => setCopiedInviteLink(false), 2500);
                    }}
                    className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                    id="copy-invite-link-btn"
                  >
                    {copiedInviteLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Hello ${inviteName.trim() || "there"}! You have been invited to join the ${activeProject.name} campaign on HarambeeFlow as a ${inviteRole}. Join the campaign team here: ${window.location.origin}?invite=${activeProject.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                    id="share-whatsapp-invite-btn"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share WhatsApp</span>
                  </button>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteCommitteeModal(false)}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer active:scale-98"
                  >
                    Record Invitation
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
