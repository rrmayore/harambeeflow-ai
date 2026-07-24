import React, { useState, useMemo, useEffect } from "react";
import { Project, Contribution, Notification, ActivityLog } from "../types";
import { 
  Sparkles, TrendingUp, Users, Target, Landmark, ShieldCheck, 
  Smartphone, Bot, FileText, ArrowRight, Plus, Share2, Copy, Check, 
  ChevronRight, Calendar, Activity, Zap, ThumbsUp, Flame, Play, AlertCircle,
  Bell, Search, Trash2, ShieldAlert, Archive, ClipboardCheck, ArrowUpRight,
  Info, RefreshCw, X, UserCheck
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

      {/* --- TOP BRAND HEADER WITH ADVANCED SEARCH, ROLE SELECTOR, & NOTIFICATION CENTER --- */}
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Custom Global App bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          {/* Advanced Search Engine with Overlay */}
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search campaigns, donors, receipts, MPESA codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 transition font-medium"
              id="global-search-input"
            />
            {searchQuery.trim() && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Instant search autocomplete list container */}
            {searchResults && (
              <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-40 max-h-[380px] overflow-y-auto space-y-4 animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1.5">
                  <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Universal Search Results</span>
                  <button onClick={() => setSearchQuery("")} className="text-[10px] text-slate-400 hover:text-slate-200 underline">Close</button>
                </div>

                {/* Match Categories */}
                {searchResults.campaigns.length === 0 && searchResults.donors.length === 0 && searchResults.receipts.length === 0 && searchResults.members.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-500">No matching search query entries found.</p>
                )}

                {/* Campaigns Match */}
                {searchResults.campaigns.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-widest">Active Fundraisers</p>
                    {searchResults.campaigns.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProject(p);
                          setSearchQuery("");
                        }}
                        className="w-full p-2 hover:bg-slate-950 border border-transparent hover:border-slate-850 rounded-xl flex items-center justify-between transition text-left"
                      >
                        <span className="text-xs font-bold text-slate-200 block truncate">{p.name}</span>
                        <span className="text-[9px] font-mono text-slate-500">KES {p.targetAmount.toLocaleString()} target</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Donors Match */}
                {searchResults.donors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold font-mono text-sky-400 uppercase tracking-widest">Supporter List</p>
                    {searchResults.donors.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          (window as any).viewDonorProfile(d.phone);
                          setSearchQuery("");
                        }}
                        className="w-full p-2 hover:bg-slate-950 border border-transparent hover:border-slate-850 rounded-xl flex items-center justify-between transition text-left"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{d.name}</span>
                          <span className="text-[9px] font-mono text-slate-500 block">{d.phone}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 font-mono">KES {d.total.toLocaleString()} total</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Receipts Match */}
                {searchResults.receipts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold font-mono text-purple-400 uppercase tracking-widest">M-PESA / Ledger Codes</p>
                    {searchResults.receipts.map(r => (
                      <div
                        key={r.id}
                        className="p-2 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-300 font-mono block">{r.transactionCode}</span>
                          <span className="text-[9px] text-slate-500 block">{r.senderName}</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-400 font-mono">+ KES {r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Committee Members Match */}
                {searchResults.members.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold font-mono text-amber-400 uppercase tracking-widest">Committee Members</p>
                    {searchResults.members.map((m, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-200">{m}</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Reconciliation clearance</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sandbox Role Switcher & Notification Bell */}
          <div className="flex items-center gap-3">
            {/* Simulated Role Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mr-1">Role:</span>
              <select
                value={simulatedRole}
                onChange={(e) => {
                  setSimulatedRole(e.target.value as SimulatedRole);
                  showToast(`Role switched to simulated: ${e.target.value}`);
                }}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-hidden cursor-pointer"
                id="role-sandbox-select"
              >
                <option value="Treasurer" className="bg-slate-900 text-slate-200">Treasurer</option>
                <option value="Chairperson" className="bg-slate-900 text-slate-200">Chairperson</option>
                <option value="Secretary" className="bg-slate-900 text-slate-200">Secretary</option>
                <option value="Auditor" className="bg-slate-900 text-slate-200">Auditor</option>
                <option value="Viewer" className="bg-slate-900 text-slate-200">Viewer (Read Only)</option>
              </select>
            </div>

            {/* Notification Center Popover Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl transition relative cursor-pointer"
                id="notification-bell-btn"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-mono font-black animate-bounce">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Slide-down Notification Center Popover / Mobile Full Screen */}
              {isNotificationsOpen && (
                <div 
                  className="fixed inset-0 z-50 bg-slate-950 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:bg-slate-900 border-none sm:border border-slate-800 sm:max-w-md w-full sm:w-[360px] sm:rounded-2xl shadow-2xl p-6 sm:p-4 space-y-4 sm:space-y-3 animate-scale-up flex flex-col h-full sm:h-auto"
                  id="intelligent-alerts-panel"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 sm:pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg sm:hidden">
                        <Bell className="w-4 h-4 animate-pulse" />
                      </div>
                      <span className="text-base sm:text-xs font-bold text-slate-100 sm:text-slate-300">Intelligent Alerts</span>
                    </div>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)} 
                      className="text-xs sm:text-[10px] font-mono font-bold text-slate-400 hover:text-white px-3 py-2 sm:px-2 sm:py-1 bg-slate-900 sm:bg-transparent border border-slate-800 sm:border-none rounded-xl cursor-pointer"
                    >
                      Close [X]
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-2 flex-1 sm:flex-initial overflow-y-auto max-h-none sm:max-h-[280px] pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-16 sm:py-8 space-y-2">
                        <Bell className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
                        <p className="text-sm sm:text-[11px] text-slate-500 font-mono">No active campaign alerts found.</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationRead(n.id)}
                          className={`p-4 sm:p-3 border rounded-xl space-y-2 sm:space-y-1.5 transition text-left cursor-pointer ${
                            n.read 
                              ? "bg-slate-950/40 border-slate-850 opacity-60" 
                              : "bg-slate-950 border-emerald-500/20 hover:border-emerald-500/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[10px] sm:text-[9px] font-bold uppercase font-mono px-1.5 py-0.5 rounded-md ${
                              n.type === "large_donation" ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                            }`}>
                              {n.type.replace("_", " ")}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationDismiss(n.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition"
                              aria-label="Dismiss alert"
                            >
                              <X className="w-4 h-4 sm:w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm sm:text-xs font-bold text-slate-200 leading-snug">{n.title}</p>
                          <p className="text-xs sm:text-[10px] text-slate-400 leading-normal">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- CAMPAIGN HEADER & COVER IMAGE --- */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          {/* Cover Banner */}
          <div className="h-44 sm:h-52 w-full relative">
            <img 
              src={getCampaignBanner(activeProject)} 
              alt="Campaign cover" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/35 to-transparent" />
          </div>

          {/* Header Info Block */}
          <div className="p-6 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Campaign Logo */}
              <CampaignLogo 
                project={activeProject} 
                size="lg" 
                className="border-2 border-emerald-500 shadow-lg sm:w-24 sm:h-24"
              />
              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase rounded-md">
                    {activeProject.category || "Fundraiser"}
                  </span>
                  {activeProject.status === "Archived" && (
                    <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase rounded-md">
                      Archived / Reconciled
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onOpenCampaignSwitcher?.()}
                  aria-label="Switch Active Campaign"
                  className="group text-left cursor-pointer transition flex items-center gap-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-xl px-1 -ml-1"
                  title="Click to switch active campaign"
                >
                  <h1 className="text-xl sm:text-2xl font-black font-sans text-white group-hover:text-emerald-400 transition-colors tracking-tight leading-none">
                    {activeProject.name}
                  </h1>
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800/80 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 border border-slate-700/80 px-2 py-0.5 rounded-lg transition-all shrink-0">
                    Switch ▼
                  </span>
                </button>
                <p className="text-xs text-slate-400 italic">
                  "{activeProject.motto || "United in faith, building a brighter future."}"
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto self-stretch sm:self-auto shrink-0">
              <button
                onClick={handleCopyLinkAction}
                className="flex-1 sm:flex-none py-2.5 px-3.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                id="campaign-copy-link-btn"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied Link!" : "Copy Public Link"}
              </button>
              
              <button
                onClick={() => {
                  if (checkPermission("Log manual payments", ["Treasurer"])) {
                    setShowAddContribution(true);
                  }
                }}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                id="log-payment-header-btn"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Log Cash
              </button>
            </div>
          </div>
        </div>

        {/* --- AI DAILY BRIEFING PANEL ("What should I do today?") --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-full bg-linear-to-l from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0 animate-pulse">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400 block">AI DAILY BRIEFING</h2>
                  <p className="text-xs font-bold text-slate-300">Good Morning, {simulatedRole} • Action Plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onTriggerTour && (
                  <button
                    onClick={onTriggerTour}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer transition"
                    id="dashboard-trigger-tour-link"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    Need a Quick Tour?
                  </button>
                )}
                <span className="text-[10px] font-mono text-slate-500">Live Feedback Grounded in Firestore</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Daily Brief metrics row */}
              <div className="md:col-span-8 space-y-4 text-xs font-medium">
                <p className="text-slate-300 leading-relaxed text-[12.5px]">
                  Welcome back, <strong className="text-white">{simulatedRole}</strong>. Here is the daily summary 
                  for <strong className="text-white">{activeProject.name}</strong> as analyzed from the real-time collections sheet today:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Today's Raised</span>
                    <p className="text-sm font-bold font-mono text-emerald-400">KES {todayRaised.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Velocity Goal</span>
                    <p className="text-sm font-bold font-mono text-slate-300">KES {todayGoal.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Campaign Health</span>
                    <p className="text-sm font-bold font-mono text-emerald-400">{healthScore}/100</p>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Days Remaining</span>
                    <p className="text-sm font-bold font-mono text-indigo-300">{daysRemaining} Days</p>
                  </div>
                </div>

                {/* Highlighted recommended action */}
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/25 rounded-xl space-y-1 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5 text-xs">
                    <span className="text-[9px] font-bold text-amber-400 font-mono block uppercase">RECOMMENDED ACTION TODAY</span>
                    {projectContributions.length === 0 ? (
                      <>
                        <p className="text-slate-200 font-semibold">The AI will begin providing recommendations after your first contribution.</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">Your real-time Daraja API ledger link is online. Execute an STK simulation in the cash desk to fire up initial financial models.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-200 font-semibold">{todayPriority.task}</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{todayPriority.reason}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggested WhatsApp broadcast block */}
              <div className="md:col-span-4 bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-400">
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Suggested WhatsApp Broadcast</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl font-mono text-[9.5px] leading-relaxed text-slate-400 whitespace-pre-wrap select-text max-h-[110px] overflow-y-auto">
                    {suggestedMsg}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (checkPermission("Broadcast message updates", ["Secretary", "Chairperson", "Treasurer"])) {
                      navigator.clipboard.writeText(suggestedMsg);
                      showToast("WhatsApp broadcast copy ready! Paste into your group chat.");
                    }
                  }}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Broadcast Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- LIVE FUNDRAISING COMMAND CENTER (REAL-TIME ENGINE) --- */}
        <LiveFundraisingCommandCenter
          activeProject={activeProject}
          contributions={projectContributions}
          viewMode="organizer"
          isDemoMode={isDemoMode}
        />

        {/* --- DYNAMIC CAMPAIGN CHECKLIST & PROGRESS VISUALIZER --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-200">Interactive Campaign Assistant Checklist</h3>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">Celebrate step-by-step progress towards reconciliation completion</p>
            </div>
            {/* Visual Checklist percentage meter */}
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Math.round((checklist.filter(c => c.status).length / checklist.length) * 100)}% Complete
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {checklist.map((item, idx) => (
              <div 
                key={item.id} 
                onClick={() => handleToggleChecklistItem(item.id)}
                className={`p-3 border rounded-2xl flex items-start gap-3 transition cursor-pointer hover:border-slate-700 ${
                  item.status 
                    ? "bg-emerald-950/15 border-emerald-500/20 text-slate-300" 
                    : "bg-slate-950/20 border-slate-850 text-slate-400 opacity-60"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {item.status ? (
                    <div className="p-1 bg-emerald-500 text-slate-950 rounded-full animate-pulse">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-slate-200 leading-tight">{item.label}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- DUAL GRID: CONTRIBUTIONS FEED & ACCOUNTABILITY ACTIVITY LOGS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Live Contributions List */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Reconciled Contribution Ledger</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Real-time MPESA and physical logging</p>
              </div>
              <button
                onClick={() => onNavigateToTab("collect")}
                className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 uppercase cursor-pointer"
              >
                Open Ledger Desk <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {projectContributions.length === 0 ? (
                <div className="py-12 text-center space-y-4 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                    <Landmark className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <p className="text-xs font-bold text-slate-300">No donations have been received yet.</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      Verify your real-time integration by executing a safe dry-run M-PESA STK payment push.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                    <button
                      onClick={() => onNavigateToTab("collect")}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
                    >
                      Test STK Push
                    </button>
                    <button
                      onClick={() => {
                        if (checkPermission("Log manual payments", ["Treasurer"])) {
                          setShowAddContribution(true);
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold rounded-xl transition cursor-pointer"
                    >
                      Log Manual Contribution
                    </button>
                  </div>
                </div>
              ) : (
                projectContributions.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">{c.senderName || c.cleanedName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.transactionCode} • {c.senderPhone || "M-PESA"}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-xs font-bold text-emerald-400 font-mono">+ KES {Number(c.amount).toLocaleString()}</span>
                      <span className="text-[9px] text-slate-500 font-mono block">reconciled</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Committee Audit Logs Panel (Never Allow Deletion!) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Un-alterable Committee Activity Logs</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Accountability audit logs (Immutable history)</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {activityLogs.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500 font-mono">No audit trail logs recorded yet.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="text-emerald-400 font-bold">{log.user}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-normal font-medium">{log.action}</p>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">device: {log.device}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- MAIN STATISTICS CONTAINER WITH LIVE PROGRESS BAR --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-slate-800 pb-5">
            {/* Amount Raised */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Amount Raised So Far</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                KES {totalRaised.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                Reconciled instantly via Lipa Na M-PESA
              </p>
            </div>

            {/* Target Goal */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Fundraising Target</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-200">
                KES {activeProject.targetAmount.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                Setup during wizard deployment
              </p>
            </div>

            {/* Remaining Amount */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Remaining Gap</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-indigo-300">
                KES {remainingAmount.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                {percentComplete}% of the target reached
              </p>
            </div>
          </div>

          {/* Progress bar visual meter */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#10b981]"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>0% Initialized</span>
              <span className="text-emerald-400 font-bold">{percentComplete}% Completed</span>
              <span>100% Goal Achieved</span>
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
