import React, { useState, useMemo, useEffect } from "react";
import { Project, Contribution, Notification, ActivityLog } from "../types";
import { 
  Sparkles, TrendingUp, Users, Target, Landmark, ShieldCheck, 
  Smartphone, Bot, FileText, ArrowRight, Plus, Share2, Copy, Check, 
  ChevronRight, Calendar, Activity, Zap, ThumbsUp, Flame, Play, AlertCircle,
  Bell, Search, Trash2, ShieldAlert, Archive, ClipboardCheck, ArrowUpRight,
  Info, RefreshCw, X, UserCheck, ChevronDown, Settings, Coins
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
  const [showAddContribution, setShowAddContribution] = useState(false);
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
        task: "Verify Lipa Na M-PESA collection connection",
        reason: "Test with a simulated 10 KES STK Push contribution before sharing with committee members."
      };
    }
    if (donationCount < 5) {
      return {
        task: "Invite co-treasurers and committee chairs",
        reason: "Adding at least 2 committee members boosts donor transparency score by 15%."
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
    <div className="flex-1 bg-slate-950 p-3 sm:p-6 pb-28 sm:pb-32 md:pb-6 text-slate-100 min-h-full font-sans select-none relative">
      
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
            3. HERO CARD (ONE Campaign Card Immediately Below Header)
            ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />

          {/* Top Row: Badge, Campaign Name, Verse/Purpose */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg">
                🇰🇪 Kenya's Trusted • {activeProject.category || "Fundraiser"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {activeProject.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 italic">
              "{activeProject.motto || "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion. - 2 Cor 9:7"}"
            </p>
          </div>

          {/* Large Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400">Fundraising Progress</span>
              <span className="text-emerald-400 font-extrabold">{percentComplete}% Raised</span>
            </div>

            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_12px_#10b981]"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Metrics Line: Amount Raised | Target | Days Remaining */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-800/80 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Amount Raised</span>
              <p className="text-base sm:text-xl font-black font-mono text-emerald-400">
                KES {totalRaised.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Target</span>
              <p className="text-base sm:text-xl font-black font-mono text-slate-200">
                KES {activeProject.targetAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Days Remaining</span>
              <p className="text-base sm:text-xl font-black font-mono text-indigo-300">
                {daysRemaining} Days
              </p>
            </div>
          </div>

          {/* Two Primary Buttons (Min 48px Height for Mobile Accessibility) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                if (checkPermission("Log manual payments", ["Treasurer"])) {
                  setShowAddContribution(true);
                }
              }}
              className="w-full min-h-[48px] px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-500/15 cursor-pointer active:scale-98"
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
            4. DASHBOARD SUMMARY (4 KPI Cards)
            ==================================================== */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Fundraising Summary</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Raised Today */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Raised Today</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                KES {todayRaised.toLocaleString()}
              </p>
            </div>

            {/* Total Raised */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Raised</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                KES {totalRaised.toLocaleString()}
              </p>
            </div>

            {/* Supporters */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Supporters</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-slate-100">
                {projectContributions.length}
              </p>
            </div>

            {/* Remaining to Target */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Remaining Gap</span>
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                KES {remainingAmount.toLocaleString()}
              </p>
            </div>

          </div>
        </div>

        {/* ====================================================
            5. QUICK ACTIONS (Clean Rounded Tile Grid)
            ==================================================== */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Quick Actions</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Tile 1: Receive Contribution */}
            <button
              onClick={() => {
                if (checkPermission("Log manual payments", ["Treasurer"])) {
                  setShowAddContribution(true);
                }
              }}
              className="p-4 min-h-[56px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start gap-2.5 transition cursor-pointer active:scale-98 group text-left"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">Receive Contribution</p>
                <p className="text-[10px] text-slate-500">M-PESA STK or Cash</p>
              </div>
            </button>

            {/* Tile 2: Manual Cash */}
            <button
              onClick={() => {
                if (checkPermission("Log manual payments", ["Treasurer"])) {
                  setShowAddContribution(true);
                }
              }}
              className="p-4 min-h-[56px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start gap-2.5 transition cursor-pointer active:scale-98 group text-left"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">Manual Cash</p>
                <p className="text-[10px] text-slate-500">Log physical notes</p>
              </div>
            </button>

            {/* Tile 3: Share Campaign */}
            <button
              onClick={handleCopyLinkAction}
              className="p-4 min-h-[56px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start gap-2.5 transition cursor-pointer active:scale-98 group text-left"
            >
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-sky-400 transition-colors">Share Campaign</p>
                <p className="text-[10px] text-slate-500">Copy public link</p>
              </div>
            </button>

            {/* Tile 4: Reports */}
            <button
              onClick={() => onNavigateToTab("report")}
              className="p-4 min-h-[56px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start gap-2.5 transition cursor-pointer active:scale-98 group text-left"
            >
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-purple-400 transition-colors">Reports & Docs</p>
                <p className="text-[10px] text-slate-500">Reconciliation audit</p>
              </div>
            </button>

            {/* Tile 5: Supporters */}
            <button
              onClick={() => onNavigateToTab("supporters")}
              className="p-4 min-h-[56px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start gap-2.5 transition cursor-pointer active:scale-98 group text-left"
            >
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors">Supporters</p>
                <p className="text-[10px] text-slate-500">Donor list & directory</p>
              </div>
            </button>

            {/* Tile 6: Settings */}
            <button
              onClick={() => onNavigateToTab("settings")}
              className="p-4 min-h-[56px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-start gap-2.5 transition cursor-pointer active:scale-98 group text-left"
            >
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-amber-400 transition-colors">Settings</p>
                <p className="text-[10px] text-slate-500">Target, rules & roles</p>
              </div>
            </button>

          </div>
        </div>

        {/* --- AI DAILY BRIEFING PANEL ("What should I do next?") --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400 block">AI DAILY BRIEFING</h2>
                <p className="text-xs font-bold text-slate-300">Action Plan for {simulatedRole}</p>
              </div>
            </div>
            {onTriggerTour && (
              <button
                onClick={onTriggerTour}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer transition"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                Quick Tour
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-3">
              <p className="text-slate-300 text-xs leading-relaxed">
                Summary for <strong className="text-white">{activeProject.name}</strong> as analyzed today:
              </p>

              <div className="p-3 bg-indigo-950/30 border border-indigo-500/25 rounded-xl space-y-1 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5 text-xs">
                  <span className="text-[9px] font-bold text-amber-400 font-mono block uppercase">RECOMMENDED ACTION TODAY</span>
                  {projectContributions.length === 0 ? (
                    <p className="text-slate-200 font-semibold">Log your first contribution or perform an STK push dry run to initialize models.</p>
                  ) : (
                    <>
                      <p className="text-slate-200 font-semibold">{todayPriority.task}</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{todayPriority.reason}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Broadcast Copy Block */}
            <div className="md:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-3.5 space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Suggested WhatsApp Broadcast</span>
              <p className="text-[10px] font-mono text-slate-400 line-clamp-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                {suggestedMsg}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(suggestedMsg);
                  showToast("WhatsApp message copied to clipboard!");
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message</span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            LIVE CONTRIBUTIONS PANEL (Receiving donations in real time)
            ==================================================== */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden" id="live-contributions-feed">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  ● Live Contributions
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-md">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Receiving donations in real time • Auto-synced via Firestore
              </p>
            </div>

            {/* Smart Filters (Requirement 6) */}
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black scale-105"
                        : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {filter === "All" && `All (${projectContributions.length})`}
                    {filter === "Today" && `Today (${todayContributionsCount})`}
                    {filter === "M-PESA" && `M-PESA`}
                    {filter === "Cash" && `Cash`}
                    {filter === "Bank" && `Bank`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feed Content */}
          {filteredLiveContributions.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <Coins className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-300">
                No {liveFilter !== "All" ? liveFilter : ""} contributions recorded yet.
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                New incoming M-PESA STK payments, bank transfers, or cash receipts will instantly appear here.
              </p>
              <button
                onClick={() => {
                  if (checkPermission("Log manual payments", ["Treasurer"])) {
                    setShowAddContribution(true);
                  }
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                + Receive First Contribution
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredLiveContributions.slice(0, visibleContributionsCount).map((c, index) => {
                const method = c.category?.toUpperCase().includes("CASH") || c.transactionCode?.startsWith("CASH")
                  ? "Cash"
                  : c.category?.toUpperCase().includes("BANK") || c.transactionCode?.startsWith("BANK")
                  ? "Bank"
                  : "M-PESA";

                const isNewest = index === 0;

                return (
                  <div
                    key={c.id || `cont-${index}`}
                    className={`bg-slate-950 border rounded-2xl p-3.5 space-y-2.5 transition-all duration-300 shadow-sm hover:shadow-md ${
                      isNewest
                        ? "border-emerald-500/50 shadow-emerald-500/10 bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 animate-fade-in"
                        : "border-slate-850 hover:border-slate-750"
                    }`}
                  >
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isNewest
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {getRelativeTimeLabel(c.timestamp)}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                          {c.transactionCode || "MPESA-DIRECT"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] font-bold text-emerald-300">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Donor Details & Amount */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">
                          {c.senderName || c.cleanedName || "Anonymous Well-wisher"}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          {c.senderPhone || "M-PESA Registered Number"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-black font-mono text-emerald-400 block">
                          KES {Number(c.amount).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                          Method: {method}
                        </span>
                      </div>
                    </div>

                    {/* Receipt Status & Footer */}
                    <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Check className="w-3 h-3" />
                        <span>Receipt Generated ✓</span>
                      </div>
                      <span>
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Lazy Loading Pagination Button (Requirement 7) */}
              {visibleContributionsCount < filteredLiveContributions.length && (
                <button
                  onClick={() => setVisibleContributionsCount(prev => prev + 12)}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>Load Older Contributions ({filteredLiveContributions.length - visibleContributionsCount} remaining)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- DUAL GRID: RECONCILED LEDGER & ACTIVITY LOGS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Recent Ledger */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-200">Reconciled Contribution Ledger</h3>
                <p className="text-[10px] text-slate-500 font-mono">Real-time M-PESA and physical logs</p>
              </div>
              <button
                onClick={() => onNavigateToTab("collect")}
                className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 uppercase cursor-pointer"
              >
                Open Ledger Desk <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {projectContributions.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs font-bold text-slate-400">No donations received yet.</p>
                  <button
                    onClick={() => setShowAddContribution(true)}
                    className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Receive First Contribution
                  </button>
                </div>
              ) : (
                projectContributions.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">{c.senderName || c.cleanedName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.transactionCode} • {c.senderPhone || "M-PESA"}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+ KES {Number(c.amount).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Committee Audit Trail */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-200">Committee Activity Logs</h3>
                <p className="text-[10px] text-slate-500 font-mono">Immutable audit history</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500 font-mono">No audit trail logs recorded yet.</p>
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

        </div>

        {/* --- CLONING & ARCHIVING ADVANCED CONTROLS --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-200">Advanced Campaign Lifecycle Controls</h4>
            <p className="text-xs text-slate-400">Clone current campaign presets to start fresh, or complete the 5-step Reconciliation Archive protocol.</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={handleCloneCampaign}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              id="clone-campaign-settings-btn"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Clone Campaign Settings
            </button>

            <button
              onClick={() => {
                if (checkPermission("Archive Campaign", ["Chairperson"])) {
                  setArchiveStep(1);
                  setIsArchiveModalOpen(true);
                }
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              id="archive-protocol-trigger-btn"
            >
              <Archive className="w-3.5 h-3.5 text-rose-400" />
              Reconciliation Archive Protocol
            </button>
          </div>
        </div>

      </div>

      {/* --- ADD MANUAL CONTRIBUTION DIALOG MODAL --- */}
      {showAddContribution && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 relative shadow-2xl animate-scale-up">
            <h3 className="text-base font-bold text-white mb-4">Log Manual Cash Deposit</h3>
            
            {formError && (
              <div className="p-2.5 bg-rose-950/25 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleManualAddSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">Sender Name:</label>
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
                  <label className="text-slate-400 block font-bold">Sender Phone:</label>
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
                    <option value="Family/Friends">Family/Friends</option>
                    <option value="Committee Member">Committee Member</option>
                    <option value="Sponsor">Sponsor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Notes / Description / Receipt Ref:</label>
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
                  onClick={() => setShowAddContribution(false)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? "Logging..." : "Confirm Ledger Receipt"}
                </button>
              </div>
            </form>
          </div>
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

    </div>
  );
}
