import React, { useState, useEffect, useMemo } from "react";
import { 
  Project, 
  Contribution, 
  CampaignTask, 
  CampaignTimelineEvent, 
  CampaignAsset, 
  CampaignCalendarEvent, 
  CampaignArchiveRecord 
} from "../types";
import { 
  Target, Bot, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight, 
  Plus, Trash2, Calendar as CalendarIcon, FileText, Share2, MessageSquare, 
  Download, RefreshCw, BarChart3, Clock, Check, Info, ShieldCheck, 
  ChevronRight, CalendarRange, FolderOpen, Archive, HelpCircle, AlertTriangle,
  Flame, Lock, Settings, Layers, Star, PlusCircle, Globe, Award, Copy, Send,
  Search, Filter, ChevronLeft, ExternalLink, Users, ArrowUpRight, CheckCircle,
  Play, Pause, Flag, Building2, Smartphone, DollarSign, PieChart, Activity, RotateCcw, X
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, addDoc, getDocs, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

interface CampaignLifecycleCenterProps {
  activeProject: Project | null;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setActiveProject: (p: Project | null) => void;
  contributions: Contribution[];
  isDemoMode: boolean;
  currentUser?: any;
  onUpdateProject?: (updatedFields: Partial<Project>) => Promise<void>;
  onCreateCampaign?: () => void;
  onPostWebhook?: (payload: any) => Promise<any>;
}

// Seeded completed historical campaigns for Archive Comparative Desk
const SEEDED_ARCHIVES = [
  { id: "arc-1", name: "Sanctuary Construction Phase 1", category: "Community/Church", goal: 800000, raised: 825000, contributors: 145, year: "2025", health: 96, description: "Phase 1 construction of structural columns and roofing frames for the new local church building project." },
  { id: "arc-2", name: "Medical Appeal - Mama Mary", category: "Medical/Family", goal: 400000, raised: 412000, contributors: 98, year: "2025", health: 92, description: "Emergency fund drive to support Mama Mary with open-heart surgery bill clearance and treatment." },
  { id: "arc-3", name: "Regional Pathfinder Rally Fund", category: "Community/Church", goal: 200000, raised: 185000, contributors: 65, year: "2024", health: 88, description: "Sponsorship of camp registrations, caravan transport, and gear allocations for our church youth." },
  { id: "arc-4", name: "Chama Welfare - Education Seed", category: "Education/Chama", goal: 150000, raised: 150000, contributors: 35, year: "2024", health: 94, description: "Seasonal rotary micro-credit seed funds for school fees and tuition support." },
  { id: "arc-5", name: "Local Area Relief Harambee", category: "General/Harambee", goal: 300000, raised: 310000, contributors: 110, year: "2023", health: 90, description: "General community welfare pooling for drought and flood response log support." }
];

export default function CampaignLifecycleCenter({
  activeProject,
  projects,
  setProjects,
  setActiveProject,
  contributions,
  isDemoMode,
  currentUser,
  onUpdateProject,
  onCreateCampaign,
  onPostWebhook
}: CampaignLifecycleCenterProps) {

  // View Navigation: "portfolio" (table list) or "detail" (workspace)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    activeProject?.id || (projects.length > 0 ? projects[0].id : null)
  );
  const [currentView, setCurrentView] = useState<"portfolio" | "detail">("portfolio");

  // Portfolio Filters
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Draft" | "Paused" | "Target Reached" | "Closed">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Types");

  // Campaign Workspace Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "tasks" | "timeline" | "calendar" | "assets" | "ai" | "archive">("overview");

  // State Management for sub-collections
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [timeline, setTimeline] = useState<CampaignTimelineEvent[]>([]);
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [calendar, setCalendar] = useState<CampaignCalendarEvent[]>([]);
  const [archive, setArchive] = useState<CampaignArchiveRecord[]>([]);

  // UI States
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  // Form States
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCat, setNewTaskCat] = useState("Committee");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const [newTimelineDesc, setNewTimelineDesc] = useState("");
  const [newTimelineType, setNewTimelineType] = useState<"system" | "manual" | "milestone">("manual");

  const [newCalendarTitle, setNewCalendarTitle] = useState("");
  const [newCalendarDesc, setNewCalendarDesc] = useState("");
  const [newCalendarDate, setNewCalendarDate] = useState("");
  const [newCalendarTime, setNewCalendarTime] = useState("");
  const [newCalendarType, setNewCalendarType] = useState<"meeting" | "milestone" | "broadcast" | "deadline">("meeting");

  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState<"image" | "document" | "copywriting" | "qr_code">("copywriting");
  const [newAssetContent, setNewAssetContent] = useState("");

  // AI Assistant States
  const [aiDraftType, setAiDraftType] = useState<"update" | "appeal" | "thankyou">("update");
  const [aiCustomContext, setAiCustomContext] = useState("");
  const [aiResult, setAiResult] = useState<string>("");

  // Comparative Archives Desk States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Closure state
  const [closureStep, setClosureStep] = useState<"idle" | "verifying" | "sealed">("idle");
  const [isSealing, setIsSealing] = useState(false);

  // Campaign Lifecycle Undo Window State
  const [undoState, setUndoState] = useState<{
    campaignId: string;
    previousStage: Project["status"];
    newStage: Project["status"];
    expiresAt: number;
  } | null>(null);

  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number>(0);

  // Confirmation modal state before advancing
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    nextStage: Project["status"];
    customReason?: string;
  } | null>(null);

  // 10-Second Undo Timer
  useEffect(() => {
    if (!undoState) {
      setUndoSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((undoState.expiresAt - Date.now()) / 1000));
      setUndoSecondsLeft(remaining);
      if (remaining <= 0) {
        setUndoState(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [undoState]);

  // Trigger toast helper
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Resolve currently focused campaign object
  const focusedCampaign = useMemo(() => {
    if (!selectedCampaignId) return activeProject || (projects.length > 0 ? projects[0] : null);
    return projects.find(p => p.id === selectedCampaignId) || activeProject || (projects.length > 0 ? projects[0] : null);
  }, [selectedCampaignId, projects, activeProject]);

  const currentProjectId = focusedCampaign?.id || "";

  // Dynamic calculations for focused campaign
  const focusedContributions = useMemo(() => {
    if (!currentProjectId) return [];
    return contributions.filter(c => (c.projectId === currentProjectId || c.campaignId === currentProjectId) && !c.hasDuplicates);
  }, [contributions, currentProjectId]);

  const focusedRaised = useMemo(() => {
    return focusedContributions.reduce((sum, c) => sum + c.amount, 0);
  }, [focusedContributions]);

  const focusedTarget = focusedCampaign?.targetAmount || 0;

  const focusedPct = useMemo(() => {
    if (!focusedTarget || focusedTarget <= 0) return 0;
    return Math.min(100, Math.round((focusedRaised / focusedTarget) * 100));
  }, [focusedRaised, focusedTarget]);

  const currentStage = focusedCampaign?.status || "Active";

  // Firestore & Demo Sync for sub-collections
  useEffect(() => {
    if (!currentProjectId) return;

    if (isDemoMode) {
      const localTasks = localStorage.getItem(`tasks_${currentProjectId}`);
      const localTimeline = localStorage.getItem(`timeline_${currentProjectId}`);
      const localAssets = localStorage.getItem(`assets_${currentProjectId}`);
      const localCalendar = localStorage.getItem(`calendar_${currentProjectId}`);
      const localArchive = localStorage.getItem(`archive_${currentProjectId}`);

      if (!localTasks) {
        const defaultTasks: CampaignTask[] = [
          { id: "t-1", projectId: currentProjectId, text: "Assemble the central Harambee executive committee", completed: true, dueDate: new Date(Date.now() - 5*86400000).toISOString().split('T')[0], category: "Committee", assignedTo: "Chairperson" },
          { id: "t-2", projectId: currentProjectId, text: "Prepare public narrative appeal & financial target sheet", completed: true, dueDate: new Date(Date.now() - 2*86400000).toISOString().split('T')[0], category: "Marketing", assignedTo: "Secretary" },
          { id: "t-3", projectId: currentProjectId, text: "Configure Safaricom Daraja API or PayBill gateway", completed: false, dueDate: new Date(Date.now() + 2*86400000).toISOString().split('T')[0], category: "Audit", assignedTo: "Treasurer" },
          { id: "t-4", projectId: currentProjectId, text: "Draft launch promotional update for WhatsApp group", completed: false, dueDate: new Date(Date.now() + 1*86400000).toISOString().split('T')[0], category: "Communication", assignedTo: "Mobilizer" }
        ];
        setTasks(defaultTasks);
        localStorage.setItem(`tasks_${currentProjectId}`, JSON.stringify(defaultTasks));
      } else {
        setTasks(JSON.parse(localTasks));
      }

      if (!localTimeline) {
        const defaultTimeline: CampaignTimelineEvent[] = [
          { id: "tl-1", projectId: currentProjectId, title: "Campaign Initialized", description: `Campaign configuration created for "${focusedCampaign?.name}"`, timestamp: focusedCampaign?.createdAt || new Date().toISOString(), status: "Draft", type: "system" },
          { id: "tl-2", projectId: currentProjectId, title: "Motto and Target Saved", description: `Target set to KES ${focusedTarget.toLocaleString()}`, timestamp: new Date(Date.now() - 1*86400000).toISOString(), status: "Planning", type: "system" }
        ];
        setTimeline(defaultTimeline);
        localStorage.setItem(`timeline_${currentProjectId}`, JSON.stringify(defaultTimeline));
      } else {
        setTimeline(JSON.parse(localTimeline));
      }

      if (!localAssets) {
        const defaultAssets: CampaignAsset[] = [
          { id: "as-1", projectId: currentProjectId, name: "WhatsApp Mobilization Copy", type: "copywriting", content: `📢 *HARAMBEE APPEAL* 📢\n\nSupport *${focusedCampaign?.name}*\n🎯 Target Goal: KES ${focusedTarget.toLocaleString()}\n🔑 Account: ${focusedCampaign?.accountReference}\n📌 Paybill: ${focusedCampaign?.paybillNumber || "225588"}`, createdAt: new Date().toISOString(), size: "1 KB" }
        ];
        setAssets(defaultAssets);
        localStorage.setItem(`assets_${currentProjectId}`, JSON.stringify(defaultAssets));
      } else {
        setAssets(JSON.parse(localAssets));
      }

      if (!localCalendar) {
        const defaultCalendar: CampaignCalendarEvent[] = [
          { id: "cl-1", projectId: currentProjectId, title: "Launch Mobilization Committee Meeting", description: "Finalize roles & audit parameters", date: new Date(Date.now() + 1*86400000).toISOString().split('T')[0], time: "17:00", type: "meeting", completed: false }
        ];
        setCalendar(defaultCalendar);
        localStorage.setItem(`calendar_${currentProjectId}`, JSON.stringify(defaultCalendar));
      } else {
        setCalendar(JSON.parse(localCalendar));
      }

      if (localArchive) setArchive(JSON.parse(localArchive));

    } else {
      setLoading(true);

      const unsubTasks = onSnapshot(
        query(collection(db, "campaignTasks"), where("projectId", "==", currentProjectId), orderBy("dueDate", "asc")),
        (snap) => {
          const list: CampaignTask[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CampaignTask));
          setTasks(list);
        }
      );

      const unsubTimeline = onSnapshot(
        query(collection(db, "campaignTimeline"), where("projectId", "==", currentProjectId), orderBy("timestamp", "desc")),
        (snap) => {
          const list: CampaignTimelineEvent[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CampaignTimelineEvent));
          setTimeline(list);
        }
      );

      const unsubAssets = onSnapshot(
        query(collection(db, "campaignAssets"), where("projectId", "==", currentProjectId), orderBy("createdAt", "desc")),
        (snap) => {
          const list: CampaignAsset[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CampaignAsset));
          setAssets(list);
        }
      );

      const unsubCalendar = onSnapshot(
        query(collection(db, "campaignCalendar"), where("projectId", "==", currentProjectId), orderBy("date", "asc")),
        (snap) => {
          const list: CampaignCalendarEvent[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CampaignCalendarEvent));
          setCalendar(list);
        }
      );

      setLoading(false);

      return () => {
        unsubTasks();
        unsubTimeline();
        unsubAssets();
        unsubCalendar();
      };
    }
  }, [currentProjectId, isDemoMode]);

  // Open confirmation modal for stage advancement
  const handleInitiateAdvanceStage = (nextStage: Project["status"], customReason?: string) => {
    if (!focusedCampaign) return;
    setConfirmModal({
      isOpen: true,
      nextStage,
      customReason
    });
  };

  // Perform actual stage advancement
  const executeStageAdvance = async (nextStage: Project["status"], customReason?: string) => {
    if (!focusedCampaign) return;

    const previousStage = focusedCampaign.status;
    const reason = customReason || `Campaign status advanced to "${nextStage}".`;
    
    const newTimelineEvent: CampaignTimelineEvent = {
      id: "sys-" + Date.now(),
      projectId: focusedCampaign.id,
      title: `Stage Advanced: ${nextStage}`,
      description: reason,
      timestamp: new Date().toISOString(),
      status: nextStage as any,
      type: "system"
    };

    if (isDemoMode) {
      const updatedProj = { ...focusedCampaign, status: nextStage };
      setProjects(prev => prev.map(p => p.id === focusedCampaign.id ? updatedProj : p));
      if (activeProject?.id === focusedCampaign.id) setActiveProject(updatedProj);
      
      const updatedTimeline = [newTimelineEvent, ...timeline];
      setTimeline(updatedTimeline);
      localStorage.setItem(`timeline_${focusedCampaign.id}`, JSON.stringify(updatedTimeline));
    } else {
      try {
        if (onUpdateProject && activeProject?.id === focusedCampaign.id) {
          await onUpdateProject({ status: nextStage });
        } else {
          await setDoc(doc(db, "fundraisers", focusedCampaign.id), { status: nextStage }, { merge: true });
          setProjects(prev => prev.map(p => p.id === focusedCampaign.id ? { ...p, status: nextStage } : p));
        }
        await addDoc(collection(db, "campaignTimeline"), newTimelineEvent);
      } catch (err) {
        triggerToast("Failed to advance campaign stage", "error");
        return;
      }
    }

    // Activate 10-second Undo window
    setUndoState({
      campaignId: focusedCampaign.id,
      previousStage: previousStage,
      newStage: nextStage,
      expiresAt: Date.now() + 10000
    });

    // Close confirmation modal
    setConfirmModal(null);

    triggerToast(`Campaign status updated to ${nextStage}`, "success");
  };

  // Revert stage advancement (Undo)
  const handleUndoStageAdvance = async () => {
    if (!undoState || !focusedCampaign) return;

    const targetStage = undoState.previousStage;
    const revertedStage = undoState.newStage;

    const revertTimelineEvent: CampaignTimelineEvent = {
      id: "sys-undo-" + Date.now(),
      projectId: focusedCampaign.id,
      title: `Stage Reverted: ${targetStage}`,
      description: `Lifecycle change reverted from "${revertedStage}" back to "${targetStage}".`,
      timestamp: new Date().toISOString(),
      status: targetStage as any,
      type: "system"
    };

    if (isDemoMode) {
      const restoredProj = { ...focusedCampaign, status: targetStage };
      setProjects(prev => prev.map(p => p.id === focusedCampaign.id ? restoredProj : p));
      if (activeProject?.id === focusedCampaign.id) setActiveProject(restoredProj);

      const updatedTimeline = [revertTimelineEvent, ...timeline];
      setTimeline(updatedTimeline);
      localStorage.setItem(`timeline_${focusedCampaign.id}`, JSON.stringify(updatedTimeline));
    } else {
      try {
        if (onUpdateProject && activeProject?.id === focusedCampaign.id) {
          await onUpdateProject({ status: targetStage });
        } else {
          await setDoc(doc(db, "fundraisers", focusedCampaign.id), { status: targetStage }, { merge: true });
          setProjects(prev => prev.map(p => p.id === focusedCampaign.id ? { ...p, status: targetStage } : p));
        }
        await addDoc(collection(db, "campaignTimeline"), revertTimelineEvent);
      } catch (err) {
        triggerToast("Failed to undo stage change", "error");
        return;
      }
    }

    // Clear Undo window
    setUndoState(null);
    triggerToast(`✓ Campaign status reverted back to ${targetStage}`, "info");
  };

  // Helper CRUD Operators
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !focusedCampaign) return;

    const task: CampaignTask = {
      id: "task-" + Date.now(),
      projectId: focusedCampaign.id,
      text: newTaskText.trim(),
      completed: false,
      dueDate: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
      category: newTaskCat,
      assignedTo: newTaskAssignee.trim() || "Unassigned"
    };

    if (isDemoMode) {
      const updated = [task, ...tasks];
      setTasks(updated);
      localStorage.setItem(`tasks_${focusedCampaign.id}`, JSON.stringify(updated));
      setNewTaskText("");
      setNewTaskAssignee("");
      triggerToast("Task added to campaign planner");
    } else {
      try {
        await addDoc(collection(db, "campaignTasks"), task);
        setNewTaskText("");
        setNewTaskAssignee("");
        triggerToast("Task saved");
      } catch (err) {
        triggerToast("Error saving task", "error");
      }
    }
  };

  const handleToggleTask = async (task: CampaignTask) => {
    if (isDemoMode) {
      const updated = tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t);
      setTasks(updated);
      localStorage.setItem(`tasks_${currentProjectId}`, JSON.stringify(updated));
      triggerToast(task.completed ? "Task reopened" : "Task completed!", "info");
    } else {
      try {
        const docRef = doc(db, "campaignTasks", task.id);
        await setDoc(docRef, { completed: !task.completed }, { merge: true });
        triggerToast("Task updated");
      } catch (err) {
        triggerToast("Error updating task", "error");
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isDemoMode) {
      const updated = tasks.filter(t => t.id !== taskId);
      setTasks(updated);
      localStorage.setItem(`tasks_${currentProjectId}`, JSON.stringify(updated));
      triggerToast("Task removed");
    } else {
      try {
        await deleteDoc(doc(db, "campaignTasks", taskId));
        triggerToast("Task deleted");
      } catch (err) {
        triggerToast("Error deleting task", "error");
      }
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineTitle.trim() || !newTimelineDesc.trim() || !focusedCampaign) return;

    const event: CampaignTimelineEvent = {
      id: "tl-" + Date.now(),
      projectId: focusedCampaign.id,
      title: newTimelineTitle.trim(),
      description: newTimelineDesc.trim(),
      timestamp: new Date().toISOString(),
      status: currentStage as any,
      type: newTimelineType
    };

    if (isDemoMode) {
      const updated = [event, ...timeline];
      setTimeline(updated);
      localStorage.setItem(`timeline_${focusedCampaign.id}`, JSON.stringify(updated));
      setNewTimelineTitle("");
      setNewTimelineDesc("");
      triggerToast("Timeline event added");
    } else {
      try {
        await addDoc(collection(db, "campaignTimeline"), event);
        setNewTimelineTitle("");
        setNewTimelineDesc("");
        triggerToast("Timeline event saved");
      } catch (err) {
        triggerToast("Error saving event", "error");
      }
    }
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarTitle.trim() || !newCalendarDate || !focusedCampaign) return;

    const event: CampaignCalendarEvent = {
      id: "cl-" + Date.now(),
      projectId: focusedCampaign.id,
      title: newCalendarTitle.trim(),
      description: newCalendarDesc.trim() || "No description.",
      date: newCalendarDate,
      time: newCalendarTime || "12:00",
      type: newCalendarType,
      completed: false
    };

    if (isDemoMode) {
      const updated = [...calendar, event].sort((a, b) => a.date.localeCompare(b.date));
      setCalendar(updated);
      localStorage.setItem(`calendar_${focusedCampaign.id}`, JSON.stringify(updated));
      setNewCalendarTitle("");
      setNewCalendarDesc("");
      setNewCalendarDate("");
      triggerToast("Schedule event added");
    } else {
      try {
        await addDoc(collection(db, "campaignCalendar"), event);
        setNewCalendarTitle("");
        setNewCalendarDesc("");
        triggerToast("Schedule event saved");
      } catch (err) {
        triggerToast("Error saving schedule event", "error");
      }
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !focusedCampaign) return;

    const asset: CampaignAsset = {
      id: "as-" + Date.now(),
      projectId: focusedCampaign.id,
      name: newAssetName.trim(),
      type: newAssetType,
      content: newAssetContent.trim() || undefined,
      createdAt: new Date().toISOString(),
      size: `${Math.round(1 + Math.random() * 9)} KB`
    };

    if (isDemoMode) {
      const updated = [asset, ...assets];
      setAssets(updated);
      localStorage.setItem(`assets_${focusedCampaign.id}`, JSON.stringify(updated));
      setNewAssetName("");
      setNewAssetContent("");
      triggerToast("Asset saved into Vault");
    } else {
      try {
        await addDoc(collection(db, "campaignAssets"), asset);
        setNewAssetName("");
        setNewAssetContent("");
        triggerToast("Asset saved");
      } catch (err) {
        triggerToast("Error saving asset", "error");
      }
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`${label} copied!`, "success");
  };

  const generateAIAssistance = async () => {
    if (!focusedCampaign) return;
    setAiGenerating(true);
    setAiResult("");

    try {
      const response = await fetch("/api/ai/campaign-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: focusedCampaign.id })
      });

      const data = await response.json();
      
      if (response.ok && data) {
        let textResult = "";
        if (aiDraftType === "update") {
          textResult = data.communications?.whatsapp || `📊 *${focusedCampaign.name} Update* 📊\n\nWe've raised KES ${focusedRaised.toLocaleString()} (${focusedPct}%). Let's push together!`;
          if (aiCustomContext) textResult += `\n\n*Note:* ${aiCustomContext}`;
        } else if (aiDraftType === "appeal") {
          textResult = `📢 *URGENT HARAMBEE APPEAL* 📢\n\nDear Friends,\nOur target of KES ${focusedTarget.toLocaleString()} is vital for "${focusedCampaign.name}".\n\nPayBill: ${focusedCampaign.paybillNumber || "225588"}\nAccount: ${focusedCampaign.accountReference}`;
          if (aiCustomContext) textResult += `\n\n*Context:* ${aiCustomContext}`;
        } else {
          textResult = `✨ *Gratitude Receipt & Certification* ✨\n\nThank you for supporting "${focusedCampaign.name}". Your contribution has been safely logged in our verified ledger.`;
        }
        setAiResult(textResult);
        triggerToast("AI draft generated!");
      } else {
        throw new Error(data.error || "Generation error");
      }
    } catch (err) {
      let textResult = "";
      if (aiDraftType === "update") {
        textResult = `📢 *Progress Narrative Update: ${focusedCampaign.name}* 📢\n\nWe have raised KES *${focusedRaised.toLocaleString()}* (${focusedPct}% of goal). Remaining gap: KES *${Math.max(0, focusedTarget - focusedRaised).toLocaleString()}*.`;
      } else if (aiDraftType === "appeal") {
        textResult = `🔔 *Official Mobilization Drive: ${focusedCampaign.name}* 🔔\n\nSend contributions to Paybill *${focusedCampaign.paybillNumber || "225588"}*, Account *${focusedCampaign.accountReference}*.`;
      } else {
        textResult = `✨ *Gratitude Receipt* ✨\n\nDear Friends, thank you for backing "${focusedCampaign.name}". Your support makes a big difference!`;
      }
      if (aiCustomContext) textResult += `\n\n*Note:* ${aiCustomContext}`;
      setAiResult(textResult);
      triggerToast("Offline helper completed draft", "info");
    } finally {
      setAiGenerating(false);
    }
  };

  // Export Portfolio to CSV
  const handleExportCampaignsCSV = () => {
    if (projects.length === 0) {
      triggerToast("No campaign data available to export.", "info");
      return;
    }
    const headers = ["Campaign Name", "Organization", "Category", "Target (KES)", "Raised (KES)", "Progress (%)", "Contributors", "PayBill", "Account Ref", "WhatsApp Group", "Status"];
    const rows = projects.map(p => {
      const pContribs = contributions.filter(c => (c.projectId === p.id || c.campaignId === p.id) && !c.hasDuplicates);
      const pRaised = pContribs.reduce((sum, c) => sum + c.amount, 0);
      const pPct = p.targetAmount > 0 ? Math.round((pRaised / p.targetAmount) * 100) : 0;
      const pCount = new Set(pContribs.map(c => c.senderPhone || c.phoneNumber || c.senderName)).size || pContribs.length;
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.organizer || "Harambee Committee").replace(/"/g, '""')}"`,
        `"${(p.category || p.campaignCategory || "Harambee").replace(/"/g, '""')}"`,
        p.targetAmount || 0,
        pRaised,
        `${pPct}%`,
        pCount,
        p.paybillNumber || "225588",
        p.accountReference || "REF",
        `"${(p.whatsappGroupName || "Connected").replace(/"/g, '""')}"`,
        p.status || "Active"
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HarambeeFlow_Campaigns_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Campaign portfolio exported to CSV", "success");
  };

  // Filtered List of Projects for Portfolio View
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const pContribs = contributions.filter(c => (c.projectId === p.id || c.campaignId === p.id) && !c.hasDuplicates);
      const pRaised = pContribs.reduce((sum, c) => sum + c.amount, 0);
      const isTargetReached = p.targetAmount > 0 && pRaised >= p.targetAmount;
      const pStatus = p.status || "Active";

      // Status tab filter
      if (statusFilter === "Active" && pStatus !== "Active") return false;
      if (statusFilter === "Draft" && pStatus !== "Draft") return false;
      if (statusFilter === "Paused" && pStatus !== "Paused") return false;
      if (statusFilter === "Target Reached" && (!isTargetReached && pStatus !== "Goal Achieved")) return false;
      if (statusFilter === "Closed" && (pStatus !== "Completed" && pStatus !== "Archived")) return false;

      // Category filter
      if (categoryFilter !== "All Types") {
        const cat = (p.category || p.campaignCategory || "Harambee").toLowerCase();
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesOrg = (p.organizer || "").toLowerCase().includes(q);
        const matchesRef = (p.accountReference || "").toLowerCase().includes(q);
        const matchesPaybill = (p.paybillNumber || "").toLowerCase().includes(q);
        if (!matchesName && !matchesOrg && !matchesRef && !matchesPaybill) return false;
      }

      return true;
    });
  }, [projects, contributions, statusFilter, categoryFilter, searchQuery]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    let active = 0, draft = 0, paused = 0, targetReached = 0, closed = 0;
    projects.forEach(p => {
      const pContribs = contributions.filter(c => (c.projectId === p.id || c.campaignId === p.id) && !c.hasDuplicates);
      const pRaised = pContribs.reduce((sum, c) => sum + c.amount, 0);
      const st = p.status || "Active";

      if (st === "Active") active++;
      if (st === "Draft") draft++;
      if (st === "Paused") paused++;
      if ((p.targetAmount > 0 && pRaised >= p.targetAmount) || st === "Goal Achieved") targetReached++;
      if (st === "Completed" || st === "Archived") closed++;
    });

    return { all: projects.length, active, draft, paused, targetReached, closed };
  }, [projects, contributions]);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen text-slate-900 font-sans p-3 sm:p-6 lg:p-8 overflow-y-auto" id="campaign-workspace-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold ${
              toast.type === "success" 
                ? "bg-emerald-600 text-white" 
                : toast.type === "error" 
                ? "bg-rose-600 text-white" 
                : "bg-slate-800 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* VIEW SELECTOR HEADER (PORTFOLIO VS DETAIL WORKSPACE) */}
        {currentView === "detail" && focusedCampaign ? (
          /* WORKSPACE VIEW TOP BAR */
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView("portfolio")}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
                aria-label="Back to Campaigns"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>All Campaigns</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{focusedCampaign.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                    focusedCampaign.status === "Active" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : focusedCampaign.status === "Goal Achieved" 
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {focusedCampaign.status || "Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {focusedCampaign.organizer || "Harambee Committee"} • Ref: <span className="font-mono font-bold text-slate-700">{focusedCampaign.accountReference}</span> • PayBill: <span className="font-mono font-bold text-slate-700">{focusedCampaign.paybillNumber || "225588"}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
              {activeProject?.id !== focusedCampaign.id && (
                <button
                  onClick={() => {
                    setActiveProject(focusedCampaign);
                    triggerToast(`Set "${focusedCampaign.name}" as active campaign`, "success");
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                  <span>Set as Active</span>
                </button>
              )}

              <button
                onClick={() => handleCopy(`PayBill: ${focusedCampaign.paybillNumber || "225588"}\nAccount: ${focusedCampaign.accountReference}\nCampaign: ${focusedCampaign.name}`, "Campaign PayBill Details")}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share PayBill</span>
              </button>

              <button
                onClick={() => setCurrentView("portfolio")}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Portfolio Desk</span>
              </button>
            </div>
          </div>
        ) : (
          /* PORTFOLIO HEADER */
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>CAMPAIGNS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Fundraising Campaigns
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
                Manage all fundraising campaigns across your organizations, monitor real-time M-PESA progress, and coordinate committee workflows.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleExportCampaignsCSV}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Report</span>
              </button>

              <button
                onClick={() => {
                  if (onCreateCampaign) {
                    onCreateCampaign();
                  } else {
                    triggerToast("Launching campaign creation wizard...", "info");
                  }
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: PORTFOLIO VIEW (TABLE + FILTERING + CONTROLS) */}
        {/* ========================================================= */}
        {currentView === "portfolio" && (
          <div className="space-y-6">

            {/* STATUS FILTER TABS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center gap-1">
              {[
                { id: "All", label: "All", count: statusCounts.all },
                { id: "Active", label: "Active", count: statusCounts.active },
                { id: "Draft", label: "Draft", count: statusCounts.draft },
                { id: "Paused", label: "Paused", count: statusCounts.paused },
                { id: "Target Reached", label: "Target Reached", count: statusCounts.targetReached },
                { id: "Closed", label: "Closed", count: statusCounts.closed },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEARCH & SECONDARY CONTROLS BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns or organizations..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Type Category Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="All Types">All Types</option>
                  <option value="Harambee">Harambee</option>
                  <option value="School Fees">School Fees</option>
                  <option value="Medical Appeal">Medical Appeal</option>
                  <option value="Church Project">Church Project</option>
                  <option value="Welfare">Welfare</option>
                  <option value="Funeral">Funeral</option>
                  <option value="Community">Community</option>
                </select>
              </div>
            </div>

            {/* CAMPAIGN TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Campaign</th>
                      <th className="py-3.5 px-3 font-bold">Type</th>
                      <th className="py-3.5 px-3 font-bold text-right">Target</th>
                      <th className="py-3.5 px-3 font-bold text-right">Collected</th>
                      <th className="py-3.5 px-3 font-bold">Progress</th>
                      <th className="py-3.5 px-3 font-bold text-center">Contributors</th>
                      <th className="py-3.5 px-3 font-bold">PayBill / Ref</th>
                      <th className="py-3.5 px-3 font-bold text-center">WhatsApp</th>
                      <th className="py-3.5 px-3 font-bold">Ends</th>
                      <th className="py-3.5 px-3 font-bold text-center">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 px-4 text-center text-slate-500">
                          <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-700">No campaigns found</p>
                          <p className="text-xs text-slate-400 mt-1">Try resetting your search query or filter criteria.</p>
                          <button
                            onClick={() => {
                              setStatusFilter("All");
                              setSearchQuery("");
                              setCategoryFilter("All Types");
                            }}
                            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((p) => {
                        const pContribs = contributions.filter(c => (c.projectId === p.id || c.campaignId === p.id) && !c.hasDuplicates);
                        const pRaised = pContribs.reduce((sum, c) => sum + c.amount, 0);
                        const pTarget = p.targetAmount || 0;
                        const pPct = pTarget > 0 ? Math.min(100, Math.round((pRaised / pTarget) * 100)) : 0;
                        const pContributors = new Set(pContribs.map(c => c.senderPhone || c.phoneNumber || c.senderName)).size || pContribs.length;
                        const isCurrentActive = activeProject?.id === p.id;
                        const pStatus = p.status || "Active";
                        const pCategory = p.category || p.campaignCategory || "Harambee";
                        const pWhatsApp = Boolean(p.whatsappGroupName);

                        return (
                          <tr 
                            key={p.id}
                            className={`hover:bg-slate-50/80 transition cursor-pointer ${
                              isCurrentActive ? "bg-emerald-50/30" : ""
                            }`}
                            onClick={() => {
                              setSelectedCampaignId(p.id);
                              setCurrentView("detail");
                            }}
                          >
                            {/* Campaign Name & Organization */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-black font-mono text-xs flex items-center justify-center shrink-0">
                                  {p.accountReference ? p.accountReference.substring(0, 2).toUpperCase() : "HF"}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-[200px] flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {isCurrentActive && (
                                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md uppercase shrink-0">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                    {p.organizer || "Harambee Committee"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-bold">
                                {pCategory}
                              </span>
                            </td>

                            {/* Target */}
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                              KES {(pTarget / 1000000).toFixed(1)}M
                            </td>

                            {/* Collected */}
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                              KES {pRaised >= 1000000 ? `${(pRaised / 1000000).toFixed(1)}M` : pRaised.toLocaleString()}
                            </td>

                            {/* Progress */}
                            <td className="py-3.5 px-3 min-w-[120px]">
                              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                <span className="text-slate-700">{pPct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    pPct >= 100 ? "bg-indigo-600" : pPct >= 50 ? "bg-emerald-500" : "bg-amber-500"
                                  }`} 
                                  style={{ width: `${Math.min(100, pPct)}%` }} 
                                />
                              </div>
                            </td>

                            {/* Contributors */}
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                {pContributors}
                              </span>
                            </td>

                            {/* PayBill & Account Reference */}
                            <td className="py-3.5 px-3 font-mono text-[11px]">
                              <div className="font-bold text-slate-800">{p.paybillNumber || "225588"}</div>
                              <div className="text-slate-500 text-[10px]">{p.accountReference}</div>
                            </td>

                            {/* WhatsApp */}
                            <td className="py-3.5 px-3 text-center">
                              {pWhatsApp ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Connected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium">
                                  Not Linked
                                </span>
                              )}
                            </td>

                            {/* Ends */}
                            <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                              <div className="font-semibold text-slate-800">{p.closingDate || "31/12/2026"}</div>
                              <span className="inline-block mt-0.5 text-[10px] font-mono text-emerald-700 font-bold">
                                Active Drive
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                pStatus === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : pStatus === "Goal Achieved"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : pStatus === "Draft"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {pStatus}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCampaignId(p.id);
                                  setCurrentView("detail");
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CAMPAIGN WORKSPACE / DETAIL VIEW */}
        {/* ========================================================= */}
        {currentView === "detail" && focusedCampaign && (
          <div className="space-y-6">

            {/* 6-STAGE HORIZONTAL PIPELINE STEPPER (CLEAN LIGHT THEME) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Campaign Lifecycle Stage
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { stage: "Draft", desc: "Formulation & Slogan" },
                  { stage: "Planning", desc: "Task Assignment" },
                  { stage: "Active", desc: "M-PESA Contributions" },
                  { stage: "Goal Achieved", desc: "100% Target Met" },
                  { stage: "Completed", desc: "Reconciled & Audited" },
                  { stage: "Archived", desc: "Sealed Memory" }
                ].map((item, idx) => {
                  const isCurrent = currentStage === item.stage;
                  const isDone = ["Draft", "Planning", "Active", "Goal Achieved", "Completed", "Archived"].indexOf(currentStage) >= idx;

                  return (
                    <div 
                      key={item.stage}
                      className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                        isCurrent 
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs" 
                          : isDone 
                          ? "bg-slate-50 border-slate-200 text-slate-700" 
                          : "bg-slate-50/40 border-slate-100 text-slate-400"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400">0{idx + 1}</span>
                          {isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          ) : isDone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <h4 className={`text-xs font-bold ${isCurrent ? "text-emerald-900" : isDone ? "text-slate-900" : "text-slate-400"}`}>
                          {item.stage}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CURRENT STAGE & NEXT STEP CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-md uppercase tracking-wider">
                    Current Stage: {currentStage}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Accepting M-PESA Contributions</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Recommended Next Step:</h3>
                <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                  Monitor incoming contributions, review committee task checklist, send weekly WhatsApp updates to supporters, and perform daily financial reconciliation.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentStage === "Active" && (
                  <button
                    onClick={() => handleInitiateAdvanceStage("Goal Achieved", "Manually verified goal milestone reached.")}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Advance to Goal Achieved</span>
                  </button>
                )}
                {currentStage === "Goal Achieved" && (
                  <button
                    onClick={() => handleInitiateAdvanceStage("Completed", "Reconciliations & audits verified.")}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Complete Campaign</span>
                  </button>
                )}
                {currentStage === "Completed" && (
                  <button
                    onClick={() => handleInitiateAdvanceStage("Archived", "Campaign archived into institutional memory.")}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Campaign</span>
                  </button>
                )}
              </div>
            </div>

            {/* FINANCIAL SNAPSHOT GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Target */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-slate-500 text-xs font-semibold block">Target Goal</span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 block mt-1">
                  KES {focusedTarget.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Approved Committee Target</span>
              </div>

              {/* Raised */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-slate-500 text-xs font-semibold block">Total Raised</span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 block mt-1">
                  KES {focusedRaised.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                  {focusedPct}% of Target
                </span>
              </div>

              {/* Remaining */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-slate-500 text-xs font-semibold block">Remaining Gap</span>
                <span className="text-lg sm:text-xl font-black font-mono text-amber-600 block mt-1">
                  KES {Math.max(0, focusedTarget - focusedRaised).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">To complete campaign</span>
              </div>

              {/* Progress */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-slate-500 text-xs font-semibold block">Overall Progress</span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 block mt-1">
                  {focusedPct}%
                </span>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, focusedPct)}%` }} />
                </div>
              </div>

              {/* Contributors */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-xs font-semibold block">Total Contributors</span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 block mt-1">
                  {new Set(focusedContributions.map(c => c.senderPhone || c.phoneNumber || c.senderName)).size || focusedContributions.length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Verified donor records</span>
              </div>
            </div>

            {/* CAMPAIGN IDENTITY DETAILS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Campaign Identity & Payment Parameters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Organization</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{focusedCampaign.organizer || "Harambee Committee"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{focusedCampaign.category || focusedCampaign.campaignCategory || "Harambee"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">PayBill Shortcode</span>
                  <span className="font-bold font-mono text-slate-900 block mt-0.5">{focusedCampaign.paybillNumber || "225588"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Account Reference</span>
                  <span className="font-bold font-mono text-slate-900 block mt-0.5">{focusedCampaign.accountReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">WhatsApp Group</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">{focusedCampaign.whatsappGroupName || "Harambee Community Group"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Start Date</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{focusedCampaign.startDate || "15/01/2026"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">End Date</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{focusedCampaign.closingDate || "31/12/2026"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Treasurer Contact</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{focusedCampaign.treasurerPhone || "+254 700 000000"}</span>
                </div>
              </div>
            </div>

            {/* SUB-TABS NAVIGATION FOR CAMPAIGN MANAGEMENT TOOLS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "tasks", label: "Tasks Planner", icon: CheckCircle2 },
                { id: "timeline", label: "Timeline Feed", icon: Clock },
                { id: "calendar", label: "Calendar Schedule", icon: CalendarRange },
                { id: "assets", label: "Asset Vault", icon: FolderOpen },
                { id: "ai", label: "AI Copywriter", icon: Bot },
                { id: "archive", label: "Institutional Archive", icon: Archive }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT AREAS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">

              {/* SUB TAB 1: OVERVIEW */}
              {activeSubTab === "overview" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Campaign Summary & Committee Brief</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    This workspace organizes all tasks, media assets, marketing copy, and historical ledger audit records for <span className="font-bold text-slate-900">{focusedCampaign.name}</span>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">Pending Tasks</span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {tasks.filter(t => !t.completed).length} open
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Coordinate roles and check off completed committee duties.</p>
                      <button
                        onClick={() => setActiveSubTab("tasks")}
                        className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                      >
                        Open Planner <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">AI Copywriter Assistant</span>
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">Draft WhatsApp mobilization broadcasts and gratitude messages instantly.</p>
                      <button
                        onClick={() => setActiveSubTab("ai")}
                        className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                      >
                        Draft Copy <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB TAB 2: TASKS PLANNER */}
              {activeSubTab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Committee Tasks Planner</h3>
                      <p className="text-xs text-slate-500 font-medium">Assign and track committee duties for this campaign.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {tasks.filter(t => t.completed).length} / {tasks.length} Completed
                    </span>
                  </div>

                  {/* Add Task Form */}
                  <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Add new committee task..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="Assignee (e.g. Treasurer)"
                      className="w-full sm:w-40 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </form>

                  {/* Tasks List */}
                  <div className="space-y-2 pt-2">
                    {tasks.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No tasks added yet.</p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition ${
                                task.completed ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <span className={`font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                              {task.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                              {task.assignedTo}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 3: TIMELINE FEED */}
              {activeSubTab === "timeline" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Campaign Activity Timeline</h3>
                  <div className="space-y-3">
                    {timeline.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No activity recorded yet.</p>
                    ) : (
                      timeline.map((ev) => (
                        <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{ev.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(ev.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium">{ev.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 4: CALENDAR SCHEDULE */}
              {activeSubTab === "calendar" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Campaign Schedule</h3>
                  <div className="space-y-2">
                    {calendar.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No scheduled events.</p>
                    ) : (
                      calendar.map((ev) => (
                        <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{ev.title}</span>
                            <span className="text-slate-500 font-medium">{ev.description}</span>
                          </div>
                          <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                            {ev.date} @ {ev.time}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 5: ASSET VAULT */}
              {activeSubTab === "assets" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Campaign Asset Vault</h3>
                  <div className="space-y-2">
                    {assets.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No assets uploaded.</p>
                    ) : (
                      assets.map((asset) => (
                        <div key={asset.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{asset.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{asset.type} • {asset.size}</span>
                          </div>
                          {asset.content && (
                            <button
                              onClick={() => handleCopy(asset.content!, asset.name)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-bold text-[11px] cursor-pointer"
                            >
                              Copy Content
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 6: AI COPYWRITER */}
              {activeSubTab === "ai" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      HarambeeFlow AI Campaign Copywriter
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(["update", "appeal", "thankyou"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setAiDraftType(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                            aiDraftType === type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {type === "update" ? "Progress Update" : type === "appeal" ? "Urgent Appeal" : "Gratitude Receipt"}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={aiCustomContext}
                      onChange={(e) => setAiCustomContext(e.target.value)}
                      placeholder="Add custom context (e.g. Next Sunday is the main rally deadline...)"
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />

                    <button
                      onClick={generateAIAssistance}
                      disabled={aiGenerating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                      <span>Generate Campaign Copy</span>
                    </button>

                    {aiResult && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap">{aiResult}</pre>
                        <button
                          onClick={() => handleCopy(aiResult, "AI Campaign Copy")}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Copy Draft
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 7: INSTITUTIONAL ARCHIVE */}
              {activeSubTab === "archive" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Institutional Memory & Benchmark Archives</h3>
                  <p className="text-xs text-slate-600 font-medium">Compare current performance against past completed drives.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {SEEDED_ARCHIVES.map((arc) => (
                      <div key={arc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{arc.name}</span>
                          <span className="font-mono font-bold text-emerald-700">{arc.year}</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{arc.description}</p>
                        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-700 font-bold border-t border-slate-200/60 mt-2">
                          <span>Raised: KES {arc.raised.toLocaleString()}</span>
                          <span>Contributors: {arc.contributors}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* CONFIRMATION MODAL FOR STAGE ADVANCEMENT */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && focusedCampaign && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Advance Campaign Stage?</h3>
                    <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{focusedCampaign.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Current Stage:</span>
                  <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-200 rounded-md">
                    {focusedCampaign.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Target Next Stage:</span>
                  <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-100 rounded-md">
                    {confirmModal.nextStage}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-relaxed border-t border-slate-200/60">
                  You are about to move this campaign from <strong>{focusedCampaign.status}</strong> to <strong>{confirmModal.nextStage}</strong>. This indicates that the campaign stage milestone has been reached.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeStageAdvance(confirmModal.nextStage, confirmModal.customReason)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Advancement</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING 10-SECOND UNDO BANNER */}
      <AnimatePresence>
        {undoState && undoState.campaignId === focusedCampaign?.id && undoSecondsLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-500/30">
                {undoSecondsLeft}s
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Campaign advanced to <strong>{undoState.newStage}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Tap Undo within {undoSecondsLeft}s to revert back to <strong>{undoState.previousStage}</strong>
                </div>
              </div>
            </div>
            <button
              onClick={handleUndoStageAdvance}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md min-h-[44px] shrink-0 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>UNDO CHANGE</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
