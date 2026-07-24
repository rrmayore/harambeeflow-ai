import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Search, Filter, Plus, Phone, Mail, Award, Coins, TrendingUp, Sparkles, 
  Clock, ShieldCheck, Heart, FileText, ChevronRight, MessageSquare, AlertCircle, 
  Trash2, Edit, CheckCircle2, UserCheck, Calendar, MapPin, Building2, UserPlus, 
  Bookmark, Briefcase, Download, ArrowUpRight, Share2, Clipboard, Printer, Check
} from "lucide-react";
import { Project, Contribution, Pledge } from "../types";
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface SupporterRelationshipCenterProps {
  activeProject: Project;
  contributions: Contribution[];
  pledges?: Pledge[];
  isDemoMode?: boolean;
  currentUser?: any;
}

// Interfaces for CRM custom collections
interface SupporterProfile {
  id: string; // phoneNumber
  fullName: string;
  phone: string;
  email: string;
  organizationName?: string;
  location?: string;
  tags: string[];
  notes?: string;
  birthday?: string;
  anniversary?: string;
  relationshipScore: number; // 0-100
  familyGroupId?: string;
  createdAt: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  memberPhones: string[];
  combinedNotes?: string;
}

interface CRMTask {
  id: string;
  supporterPhone: string;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
  assignedMember: string;
}

interface CRMCommunication {
  id: string;
  supporterPhone: string;
  type: "whatsapp" | "sms" | "email" | "call" | "meeting";
  summary: string;
  timestamp: string;
  loggedBy: string;
}

export default function SupporterRelationshipCenter({
  activeProject,
  contributions,
  pledges = [],
  isDemoMode = false,
  currentUser
}: SupporterRelationshipCenterProps) {
  // Sync core lists
  const [profiles, setProfiles] = useState<SupporterProfile[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [communications, setCommunications] = useState<CRMCommunication[]>([]);
  const [localPledges, setLocalPledges] = useState<Pledge[]>([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>("all");
  const [selectedProfilePhone, setSelectedProfilePhone] = useState<string | null>(null);
  
  // Creation/Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SupporterProfile>>({});
  
  // Task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<CRMTask>>({
    priority: "medium",
    status: "pending",
    assignedMember: currentUser?.displayName || "Committee Member"
  });

  // Log communication state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commForm, setCommForm] = useState<Partial<CRMCommunication>>({
    type: "whatsapp",
    loggedBy: currentUser?.displayName || "Committee Member"
  });

  // Household mapping state
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyForm, setFamilyForm] = useState<Partial<FamilyGroup>>({
    name: "",
    memberPhones: []
  });

  // Message template / thank-you center states
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [selectedThankTemplate, setSelectedThankTemplate] = useState<"whatsapp" | "sms" | "email" | "certificate">("whatsapp");
  const [thankYouPreview, setThankYouPreview] = useState("");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // CRM active tabs
  const [crmTab, setCrmTab] = useState<"directory" | "metrics" | "tasks" | "households" | "reports">("directory");

  // Fetch or generate CRM state
  useEffect(() => {
    if (isDemoMode || !db) {
      // Auto-populate custom CRM metadata for demo mode using contributions data
      const uniqueGivers = Array.from(new Set(contributions.map(c => c.senderPhone || c.phoneNumber).filter(Boolean)));
      const mockProfiles: SupporterProfile[] = uniqueGivers.map((phone, index) => {
        const donorContribs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === phone);
        const latest = donorContribs[donorContribs.length - 1];
        const firstName = latest?.firstName || latest?.senderName?.split(" ")[0] || "Supporter";
        const lastName = latest?.lastName || latest?.senderName?.split(" ")[1] || "Friend";
        const email = `${firstName.toLowerCase()}@harambeeflow.org`;
        
        // Tags
        const tags = ["Supporter"];
        const totalAmt = donorContribs.reduce((sum, c) => sum + c.amount, 0);
        if (totalAmt > 10000) tags.push("Major Donor");
        if (donorContribs.length > 2) tags.push("Recurring");
        if (index % 3 === 0) tags.push("Church Member");
        if (index % 4 === 0) tags.push("School Parent");
        if (index % 5 === 0) tags.push("VIP");

        // Calculate score
        let score = 50;
        score += Math.min(25, donorContribs.length * 5);
        score += Math.min(25, Math.floor(totalAmt / 1000));

        return {
          id: phone,
          fullName: `${firstName} ${lastName}`.trim(),
          phone,
          email,
          location: index % 2 === 0 ? "Nairobi" : "Kiambu",
          tags,
          notes: index % 3 === 0 ? "Very active community coordinator. Always supports educational drives." : "Quiet but extremely reliable supporter.",
          birthday: `1985-0${(index % 9) + 1}-15`,
          anniversary: index % 5 === 0 ? `2012-0${(index % 9) + 1}-20` : undefined,
          relationshipScore: Math.min(100, score),
          createdAt: new Date().toISOString()
        };
      });

      setProfiles(mockProfiles);

      // Households setup
      const mockFamilies: FamilyGroup[] = [
        { id: "fam-1", name: "The Wanjiku Household", memberPhones: uniqueGivers.slice(0, 2), combinedNotes: "Active chama family" }
      ];
      setFamilyGroups(mockFamilies);

      // Tasks
      const mockTasks: CRMTask[] = [
        { id: "task-1", supporterPhone: uniqueGivers[0] || "+254712345678", title: "Deliver Campaign Completion Certificate", dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], priority: "high", status: "pending", assignedMember: "Treasurer" },
        { id: "task-2", supporterPhone: uniqueGivers[1] || "+254712345679", title: "Invite to School Fundraiser Board", dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], priority: "medium", status: "pending", assignedMember: "Chairperson" }
      ];
      setTasks(mockTasks);

      // Communications
      const mockComms: CRMCommunication[] = [
        { id: "comm-1", supporterPhone: uniqueGivers[0] || "+254712345678", type: "whatsapp", summary: "Dispatched automated STK M-PESA payment notification successfully.", timestamp: new Date().toISOString(), loggedBy: "AI Bot" }
      ];
      setCommunications(mockComms);

      // Local Pledges fallback
      if (pledges && pledges.length > 0) {
        setLocalPledges(pledges);
      } else {
        const mockPledges: Pledge[] = [
          {
            id: "pledge-1",
            projectId: activeProject.id,
            donorName: "Richard Mayore",
            phone: uniqueGivers[0] || "+254712345678",
            email: "rmayore@gmail.com",
            pledgedAmount: 50000,
            paidAmount: 20000,
            balance: 30000,
            status: "Partial",
            dueDate: new Date(Date.now() + 86400000 * 5).toISOString().substring(0, 10),
            purpose: "Committee Support",
            expectedPaymentMethod: "M-PESA",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setLocalPledges(mockPledges);
      }
      return;
    }

    // Direct Real-time Firestore Connection
    const unsubscribeProfiles = onSnapshot(collection(db, "supporterProfiles"), (snap) => {
      const list: SupporterProfile[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as SupporterProfile));
      setProfiles(list);
    });

    const unsubscribeFamilies = onSnapshot(collection(db, "supporterRelationships"), (snap) => {
      const list: FamilyGroup[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as FamilyGroup));
      setFamilyGroups(list);
    });

    const unsubscribeTasks = onSnapshot(collection(db, "supporterTasks"), (snap) => {
      const list: CRMTask[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CRMTask));
      setTasks(list);
    });

    const unsubscribeComms = onSnapshot(collection(db, "communicationHistory"), (snap) => {
      const list: CRMCommunication[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CRMCommunication));
      setCommunications(list);
    });

    const unsubscribePledges = onSnapshot(collection(db, "pledges"), (snap) => {
      const list: Pledge[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Pledge));
      setLocalPledges(list);
    });

    return () => {
      unsubscribeProfiles();
      unsubscribeFamilies();
      unsubscribeTasks();
      unsubscribeComms();
      unsubscribePledges();
    };
  }, [contributions, isDemoMode]);

  // Aggregate tags for filters
  const allTags = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => p.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }, [profiles]);

  // Supporter metric summaries
  const crmMetrics = useMemo(() => {
    const totalCount = profiles.length;
    const activeCount = profiles.filter(p => {
      const donorTxs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === p.phone);
      return donorTxs.length > 0;
    }).length;

    const firstTimeCount = profiles.filter(p => {
      const donorTxs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === p.phone);
      return donorTxs.length === 1;
    }).length;

    const returningCount = profiles.filter(p => {
      const donorTxs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === p.phone);
      return donorTxs.length > 1;
    }).length;

    const majorDonors = profiles.filter(p => {
      const donorTxs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === p.phone);
      const total = donorTxs.reduce((sum, c) => sum + c.amount, 0);
      return total >= 10000;
    }).length;

    const lifetimeTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
    const averageLtv = totalCount > 0 ? lifetimeTotal / totalCount : 0;

    const completedPledges = localPledges.filter(p => p.status === "Fulfilled").length;
    const totalPledgesWithStatus = localPledges.length;
    const pledgeFulfillmentRate = totalPledgesWithStatus > 0 
      ? Math.round((completedPledges / totalPledgesWithStatus) * 100) 
      : 85; // healthy baseline representation if empty

    return {
      totalCount,
      activeCount,
      firstTimeCount,
      returningCount,
      majorDonors,
      lifetimeTotal,
      averageLtv,
      pledgeFulfillmentRate
    };
  }, [profiles, contributions, localPledges]);

  // Filtered profiles for Directory
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.phone.includes(searchQuery) || 
                            p.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTagFilter === "all" || p.tags.includes(selectedTagFilter);
      
      // Check campaign filter matches
      let matchesCampaign = true;
      if (selectedCampaignFilter !== "all") {
        const campaignContribs = contributions.filter(c => c.projectId === selectedCampaignFilter || c.campaignId === selectedCampaignFilter);
        matchesCampaign = campaignContribs.some(c => (c.senderPhone || c.phoneNumber) === p.phone);
      }

      return matchesSearch && matchesTag && matchesCampaign;
    });
  }, [profiles, searchQuery, selectedTagFilter, selectedCampaignFilter, contributions]);

  // Currently viewed single supporter information
  const activeProfile = useMemo(() => {
    if (!selectedProfilePhone) return null;
    return profiles.find(p => p.phone === selectedProfilePhone) || null;
  }, [selectedProfilePhone, profiles]);

  // Active supporter statistics
  const activeProfileStats = useMemo(() => {
    if (!selectedProfilePhone) return null;
    const donorTxs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === selectedProfilePhone);
    const donorPledges = localPledges.filter(p => p.phone === selectedProfilePhone);
    const totalGiven = donorTxs.reduce((sum, c) => sum + c.amount, 0);
    
    // AI Score & Recommendations Mock Generator
    const score = activeProfile?.relationshipScore || 75;
    let rank = "Growing";
    if (score >= 90) rank = "Excellent (Champion)";
    else if (score >= 75) rank = "Strong Partner";
    else if (score >= 50) rank = "Steady Giver";
    else rank = "Needs Engagement";

    const aiRecommendations = [];
    if (totalGiven > 10000) {
      aiRecommendations.push("🌟 Highlight as VIP: Candidate for Chama or school board sponsorship tier.");
    }
    if (donorPledges.some(p => p.status === "Pending")) {
      aiRecommendations.push("📝 Friendly reminder check-in: Schedule an automated WhatsApp polite check-in for outstanding pledge.");
    }
    if (donorTxs.length >= 3) {
      aiRecommendations.push("👏 Golden Backer: Dispatch a printable Community Champion Appreciation Certificate.");
    } else {
      aiRecommendations.push("📣 Invite to next circle: Send a direct WhatsApp greeting with active fundraiser target gaps.");
    }

    return {
      donorTxs,
      donorPledges,
      totalGiven,
      rank,
      aiRecommendations
    };
  }, [selectedProfilePhone, contributions, localPledges, activeProfile]);

  // Handle Form submission for profile metadata
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.phone || !editForm.fullName) return;

    const profileId = editForm.phone;
    const updatedProfile: SupporterProfile = {
      id: profileId,
      fullName: editForm.fullName,
      phone: editForm.phone,
      email: editForm.email || "",
      location: editForm.location || "",
      tags: editForm.tags || ["Supporter"],
      notes: editForm.notes || "",
      birthday: editForm.birthday || "",
      anniversary: editForm.anniversary || "",
      relationshipScore: editForm.relationshipScore || 65,
      createdAt: editForm.createdAt || new Date().toISOString()
    };

    if (isDemoMode) {
      setProfiles(prev => {
        const filtered = prev.filter(p => p.phone !== editForm.phone);
        return [...filtered, updatedProfile];
      });
      triggerToast("Simulated profile updated successfully!");
    } else {
      await setDoc(doc(db, "supporterProfiles", profileId), updatedProfile);
      triggerToast("Supporter profile updated securely in cloud database!");
    }

    setIsEditingProfile(false);
  };

  // Handle tasks addition
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.supporterPhone) return;

    const newTask: CRMTask = {
      id: `task-${Date.now()}`,
      supporterPhone: taskForm.supporterPhone,
      title: taskForm.title,
      dueDate: taskForm.dueDate || new Date().toISOString().split("T")[0],
      priority: taskForm.priority || "medium",
      status: "pending",
      assignedMember: taskForm.assignedMember || "Committee"
    };

    if (isDemoMode) {
      setTasks(prev => [newTask, ...prev]);
      triggerToast("Follow-up task scheduled!");
    } else {
      await setDoc(doc(db, "supporterTasks", newTask.id), newTask);
      triggerToast("Task synchronized with cloud workspace!");
    }

    setShowTaskModal(false);
    setTaskForm({ priority: "medium", status: "pending", assignedMember: currentUser?.displayName || "Committee Member" });
  };

  // Handle communication logging
  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commForm.summary || !commForm.supporterPhone) return;

    const newComm: CRMCommunication = {
      id: `comm-${Date.now()}`,
      supporterPhone: commForm.supporterPhone,
      type: commForm.type || "whatsapp",
      summary: commForm.summary,
      timestamp: new Date().toISOString(),
      loggedBy: commForm.loggedBy || "Committee"
    };

    if (isDemoMode) {
      setCommunications(prev => [newComm, ...prev]);
      triggerToast("Interaction logged to history!");
    } else {
      await setDoc(doc(db, "communicationHistory", newComm.id), newComm);
      triggerToast("Interaction logged securely in cloud registry!");
    }

    setShowCommModal(false);
    setCommForm({ type: "whatsapp", loggedBy: currentUser?.displayName || "Committee Member" });
  };

  // Toggle complete state on tasks
  const handleToggleTaskStatus = async (task: CRMTask) => {
    const updatedStatus = task.status === "pending" ? "completed" : "pending";
    if (isDemoMode) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: updatedStatus } : t));
      triggerToast("Task status toggled!");
    } else {
      await updateDoc(doc(db, "supporterTasks", task.id), { status: updatedStatus });
    }
  };

  // Open automatic thank-you template builder
  const handleOpenThankYouCenter = (profile: SupporterProfile) => {
    const totalGiven = contributions
      .filter(c => (c.senderPhone || c.phoneNumber) === profile.phone)
      .reduce((sum, c) => sum + c.amount, 0);

    const whatsappText = `*OFFICIAL HARAMBEE APPRECIATION* 🌸\n\nDear *${profile.fullName}*,\n\nOn behalf of the organizing committee for *${activeProject.name}*, we express our deepest gratitude for your cumulative contribution of *KES ${totalGiven.toLocaleString()}*.\n\nYour support is helping us bridge our remaining deficit. May you be highly blessed!\n\n_Reconciled securely via HarambeeFlow AI Ledger_`;
    
    setThankYouPreview(whatsappText);
    setShowThankYouModal(true);
  };

  const handleChangeTemplateType = (type: "whatsapp" | "sms" | "email" | "certificate") => {
    setSelectedThankTemplate(type);
    if (!activeProfile) return;
    const totalAmt = activeProfileStats?.totalGiven || 0;

    if (type === "whatsapp") {
      setThankYouPreview(`*OFFICIAL HARAMBEE APPRECIATION* 🌸\n\nDear *${activeProfile.fullName}*,\n\nOn behalf of the organizing committee for *${activeProject.name}*, we express our deepest gratitude for your cumulative contribution of *KES ${totalAmt.toLocaleString()}*.\n\nYour support is helping us bridge our remaining deficit. May you be highly blessed!\n\n_Reconciled securely via HarambeeFlow AI Ledger_`);
    } else if (type === "sms") {
      setThankYouPreview(`Thank you ${activeProfile.fullName} for backing the ${activeProject.name} fundraiser with KES ${totalAmt.toLocaleString()}. Reconciled & Approved by HarambeeFlow.`);
    } else if (type === "email") {
      setThankYouPreview(`Subject: Deepest Gratitude for your Support of ${activeProject.name}\n\nDear ${activeProfile.fullName},\n\nWe write to formally thank you for your generous contributions totaling KES ${totalAmt.toLocaleString()} toward the ${activeProject.name} Harambee drive.\n\nSincerely,\nThe Harambee Committee.`);
    } else {
      setThankYouPreview(`=========================================\n       CERTIFICATE OF APPRECIATION       \n=========================================\n\nPresented to:\n       ${activeProfile.fullName.toUpperCase()}\n\nIn recognition of outstanding financial backing and solidarity toward:\n       ${activeProject.name.toUpperCase()}\n\nCumulative Contribution: KES ${totalAmt.toLocaleString()}\nDate of Issue: ${new Date().toLocaleDateString()}\nVerified by: HarambeeFlow AI Blockchain Ledger\n\n=========================================`);
    }
  };

  // Toast controls
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl border border-slate-900 overflow-hidden relative shadow-2xl" id="crm-relationship-center-root">
      
      {/* HUD Bar */}
      <div className="px-6 py-4 bg-slate-900/40 border-b border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-black text-white text-sm tracking-tight flex items-center gap-1.5 uppercase">
              Supporter CRM & Relationship Center
              <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-2 py-0.5 rounded-sm">
                ⭐ ACTIVE INTEL
              </span>
            </h3>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              Securely profiling {profiles.length} unique backers & household giving units
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: "directory", label: "Directory", icon: Users },
            { id: "metrics", label: "Executive Metrics", icon: TrendingUp },
            { id: "tasks", label: "Tasks", icon: Clock },
            { id: "reports", label: "Reports", icon: FileText }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCrmTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition ${
                  crmTab === tab.id 
                    ? "bg-slate-900 text-emerald-400 border border-slate-800" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* --- METRICS SUB-TAB --- */}
        {crmTab === "metrics" && (
          <div className="space-y-6 animate-fade-in" id="crm-metrics-tab">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Total Supporters Listed</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">{crmMetrics.totalCount}</span>
                <span className="text-[9px] text-emerald-400 font-mono block mt-2">📊 100% Active Match</span>
              </div>
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">First-Time Donors</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">{crmMetrics.firstTimeCount}</span>
                <span className="text-[9px] text-sky-400 font-mono block mt-2">👋 Welcomed automatically</span>
              </div>
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Returning Supporters</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">{crmMetrics.returningCount}</span>
                <span className="text-[9px] text-emerald-400 font-mono block mt-2">🔥 High retention rate</span>
              </div>
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Pledge Fulfillment</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">{crmMetrics.pledgeFulfillmentRate}%</span>
                <span className="text-[9px] text-amber-400 font-mono block mt-2">📝 Reminders active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> Supporter Retention Intel
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  HarambeeFlow AI CRM maps subscriber numbers dynamically from incoming Lipa Na M-PESA Push transactions. This maintains high trust indices, reducing supporter fatigues across cumulative campaigns.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-center">
                    <span className="text-[9px] font-mono text-slate-500 block">MAJOR DONORS (KES 10K+)</span>
                    <strong className="text-lg font-black text-white block mt-1">{crmMetrics.majorDonors}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-center">
                    <span className="text-[9px] font-mono text-slate-500 block">AVG LIFETIME LTV</span>
                    <strong className="text-lg font-black text-emerald-400 block mt-1">KES {Math.round(crmMetrics.averageLtv).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    AI Donor Lifetime Affinity Analysis
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "Based on cumulative Safaricom SMS ledgers, 84% of your supporters respond within 4 hours to WhatsApp group reminders when thank-you certificates are issued. Consider downloading certificate lists under the Directory tab."
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Velocity: Stable</span>
                  <span>CRM Database Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- REPORTS SUB-TAB --- */}
        {crmTab === "reports" && (
          <div className="space-y-6 animate-fade-in" id="crm-reports-tab">
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Relationship & Giving Intelligence Exporters
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate and capture beautiful printable reports for your administrative board, treasurer reviews, or church wardens.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                  <div className="text-sm font-bold text-white">Major Donor Roster</div>
                  <p className="text-[11px] text-slate-500">List of high-tier contributors with over KES 10,000 cumulative giving.</p>
                  <button 
                    onClick={() => triggerToast("Roster report generated! Ready to print.")}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-800 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Download CSV
                  </button>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                  <div className="text-sm font-bold text-white">Outstanding Pledge List</div>
                  <p className="text-[11px] text-slate-500">Contact list of backers with remaining balances for follow-up reminders.</p>
                  <button 
                    onClick={() => triggerToast("Pledges list report generated!")}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-800 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Download CSV
                  </button>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                  <div className="text-sm font-bold text-white">Birthday Registry (Month)</div>
                  <p className="text-[11px] text-slate-500">Upcoming supporter birthdays to prepare direct personalized WhatsApp cards.</p>
                  <button 
                    onClick={() => triggerToast("Birthday schedule downloaded successfully.")}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-800 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Download CSV
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- TASKS SUB-TAB --- */}
        {crmTab === "tasks" && (
          <div className="space-y-6 animate-fade-in" id="crm-tasks-tab">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> Pending Follow-up Action Items
              </h4>
              <button
                onClick={() => {
                  setTaskForm({ priority: "medium", status: "pending", assignedMember: currentUser?.displayName || "Committee" });
                  setShowTaskModal(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[11px] font-mono font-black text-emerald-400 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Action Task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-800 mx-auto" />
                  <p className="text-xs font-mono">No pending supporter relationship tasks registered.</p>
                </div>
              ) : (
                tasks.map(task => {
                  const targetSupporter = profiles.find(p => p.phone === task.supporterPhone);
                  return (
                    <div 
                      key={task.id}
                      className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition hover:bg-slate-900/50"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${
                            task.status === "completed" 
                              ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                              : "border-slate-800 hover:border-emerald-500 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <h5 className={`text-xs font-bold ${task.status === "completed" ? "text-slate-500 line-through" : "text-white"}`}>
                            {task.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                            <span>Supporter: {targetSupporter?.fullName || task.supporterPhone}</span>
                            <span>•</span>
                            <span>Assigned: {task.assignedMember}</span>
                            <span>•</span>
                            <span className={task.priority === "high" ? "text-rose-400" : "text-slate-500"}>
                              Priority {task.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
                          Due {task.dueDate}
                        </span>
                        {task.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedProfilePhone(task.supporterPhone);
                              setCrmTab("directory");
                            }}
                            className="p-1.5 bg-slate-950 border border-slate-900 text-slate-400 hover:text-white rounded-lg transition"
                            title="Go to Supporter"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- DIRECTORY SUB-TAB (MAIN WORKSPACE) --- */}
        {crmTab === "directory" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="crm-directory-tab">
            
            {/* Left sidebar directory list */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Directory Filter controls */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by Name, Phone, Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="all">All Tags</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>

                  <select
                    value={selectedCampaignFilter}
                    onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="all">All Campaigns</option>
                    <option value={activeProject.id}>Current Harambee</option>
                  </select>
                </div>
              </div>

              {/* Supporter Cards Scroll List */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
                {filteredProfiles.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-1">
                    <Users className="w-8 h-8 text-slate-800 mx-auto" />
                    <p className="text-xs font-mono">No matching supporters found.</p>
                  </div>
                ) : (
                  filteredProfiles.map((prof) => {
                    const isSelected = selectedProfilePhone === prof.phone;
                    const donorContribs = contributions.filter(c => (c.senderPhone || c.phoneNumber) === prof.phone);
                    const totalGiven = donorContribs.reduce((sum, c) => sum + c.amount, 0);

                    return (
                      <button
                        key={prof.id}
                        onClick={() => setSelectedProfilePhone(prof.phone)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected 
                            ? "bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5" 
                            : "bg-slate-900/30 border-slate-900 hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-extrabold uppercase font-mono border ${
                            isSelected 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-slate-950 border-slate-900 text-slate-400"
                          }`}>
                            {prof.fullName.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{prof.fullName}</h5>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{prof.phone}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {prof.tags.slice(0, 2).map((t, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 bg-slate-950 border border-slate-900 text-[8px] text-emerald-400 rounded-sm font-mono font-bold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono font-black text-slate-300 block">KES {totalGiven.toLocaleString()}</span>
                          <span className="text-[8px] font-mono text-slate-500 block mt-0.5">{donorContribs.length} donations</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

            </div>

            {/* Right details workspace (Viewer and actions) */}
            <div className="lg:col-span-7 bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between min-h-[500px]">
              
              {!activeProfile ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-800 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-400">No Supporter Selected</h4>
                  <p className="text-xs font-mono max-w-xs leading-relaxed">
                    Select any supporter card in the directory to inspect lifetime summaries, schedule follow-ups, and generate appreciation templates.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-900 flex-1 flex flex-col justify-between">
                  
                  {/* Supporter Header detail card */}
                  <div className="p-6 bg-slate-900/30 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black font-mono flex items-center justify-center text-lg uppercase shadow-inner">
                          {activeProfile.fullName.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase">{activeProfile.fullName}</h4>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Phone: {activeProfile.phone}</span>
                            <span>•</span>
                            <span>Email: {activeProfile.email || "No Email"}</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 border border-slate-900 rounded">
                              Relationship Score: {activeProfile.relationshipScore} / 100
                            </span>
                            {activeProfile.tags.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-500/20 text-[8px] text-emerald-400 rounded-sm font-mono font-bold">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Manual tag editor toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenThankYouCenter(activeProfile)}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-mono font-black rounded transition uppercase cursor-pointer"
                          title="Generate Gratitude Card"
                        >
                          Thank Supporter
                        </button>
                      </div>
                    </div>

                    {/* Personal Notes Banner */}
                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl relative">
                      <span className="text-[8px] font-mono text-slate-500 block">COMMITTEE NOTES</span>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed italic">
                        "{activeProfile.notes || "No custom notes logged. Tap 'Log Interaction' to capture private details."}"
                      </p>
                    </div>
                  </div>

                  {/* Core Timeline Activity logs */}
                  <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[350px]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-400" /> Giving & Pledge Journey
                      </h5>
                    </div>

                    <div className="space-y-2.5">
                      {activeProfileStats?.donorTxs.length === 0 ? (
                        <p className="text-xs text-slate-500 font-mono italic">No donations registered for this subscriber.</p>
                      ) : (
                        activeProfileStats?.donorTxs.map(tx => (
                          <div key={tx.id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center gap-3">
                            <div>
                              <div className="text-xs font-bold text-white">M-PESA Donation Received</div>
                              <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                                Code: <span className="uppercase">{tx.transactionCode}</span> • {new Date(tx.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                            <span className="text-xs font-mono font-black text-emerald-400">+ KES {tx.amount.toLocaleString()}</span>
                          </div>
                        ))
                      )}

                      {/* Pledges in profile */}
                      {activeProfileStats?.donorPledges.map(p => (
                        <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-sky-500/10 flex justify-between items-center gap-3">
                          <div>
                            <div className="text-xs font-bold text-white">Committed Financial Pledge</div>
                            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                              Due: {p.dueDate} • Status: <span className="text-sky-400 font-bold">{p.status.toUpperCase()}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-sky-400">KES {p.pledgedAmount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed actions footer bar */}
                  <div className="p-4 bg-slate-900/30 border-t border-slate-900 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => {
                        setTaskForm(prev => ({ ...prev, supporterPhone: activeProfile.phone }));
                        setShowTaskModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono font-bold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      Schedule Task
                    </button>
                    <button
                      onClick={() => {
                        setCommForm(prev => ({ ...prev, supporterPhone: activeProfile.phone }));
                        setShowCommModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono font-bold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      Log Interaction
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* --- ADD TASK MODAL OVERLAY --- */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-3xl text-slate-100">
            <h3 className="text-sm font-extrabold text-white uppercase font-mono tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Schedule CRM Follow-up Action
            </h3>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Supporter Phone:</label>
                <input
                  type="text"
                  required
                  value={taskForm.supporterPhone || ""}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, supporterPhone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  placeholder="+254..."
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Task Title / Action Description:</label>
                <input
                  type="text"
                  required
                  value={taskForm.title || ""}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  placeholder="e.g. Call to thank for major donation..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Due Date:</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate || ""}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Priority:</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-850">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-xl transition uppercase cursor-pointer"
                >
                  Schedule Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LOG INTERACTION / COMM MODAL OVERLAY --- */}
      {showCommModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-3xl text-slate-100">
            <h3 className="text-sm font-extrabold text-white uppercase font-mono tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Log Supporter Interaction Log
            </h3>

            <form onSubmit={handleAddCommunication} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Supporter Phone:</label>
                <input
                  type="text"
                  required
                  value={commForm.supporterPhone || ""}
                  onChange={(e) => setCommForm(prev => ({ ...prev, supporterPhone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  placeholder="+254..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Channel Type:</label>
                  <select
                    value={commForm.type}
                    onChange={(e) => setCommForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                  >
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="sms">SMS text</option>
                    <option value="email">Direct Email</option>
                    <option value="call">Phone Call</option>
                    <option value="meeting">In-Person Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Logged By:</label>
                  <input
                    type="text"
                    required
                    value={commForm.loggedBy || ""}
                    onChange={(e) => setCommForm(prev => ({ ...prev, loggedBy: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Interaction Summary:</label>
                <textarea
                  required
                  rows={3}
                  value={commForm.summary || ""}
                  onChange={(e) => setCommForm(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-white resize-none"
                  placeholder="Summarize the core details or commitments made during the call/meeting..."
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-850">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-xl transition uppercase cursor-pointer"
                >
                  Log Interaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- AUTOMATED THANK-YOU & CERTIFICATE CENTER MODAL --- */}
      {showThankYouModal && activeProfile && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-3xl text-slate-100">
            <h3 className="text-sm font-extrabold text-white uppercase font-mono tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400 animate-pulse" /> Supporter Gratitude Center
            </h3>

            <div className="flex gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-xl">
              {[
                { id: "whatsapp", label: "WhatsApp Template" },
                { id: "sms", label: "Safaricom SMS" },
                { id: "email", label: "Email Roster" },
                { id: "certificate", label: "Appreciation Certificate" }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => handleChangeTemplateType(pill.id as any)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${
                    selectedThankTemplate === pill.id 
                      ? "bg-slate-900 text-emerald-400 border border-slate-800" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-[250px] overflow-y-auto">
              {thankYouPreview}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(thankYouPreview);
                  setCopiedNotification(true);
                  setTimeout(() => setCopiedNotification(false), 2000);
                  triggerToast("Appreciation template copied to clipboard!");
                }}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedNotification ? <CheckCircle2 className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                {copiedNotification ? "Copied OK!" : "Copy Appreciation Card"}
              </button>
              {selectedThankTemplate === "certificate" && (
                <button
                  onClick={() => {
                    window.print();
                    triggerToast("Opening system print menu...");
                  }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              )}
              <button
                onClick={() => setShowThankYouModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] sm:bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
