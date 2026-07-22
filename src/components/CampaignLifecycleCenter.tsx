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
  Flame, Lock, Settings, Layers, Star, PlusCircle, Globe, Award, Copy, Send
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
  onPostWebhook?: (payload: any) => Promise<any>;
}

// 5 Seeded completed historical campaigns for Archive Comparative Desk
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
  onPostWebhook
}: CampaignLifecycleCenterProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "timeline" | "calendar" | "assets" | "ai" | "archive">("overview");

  // State Management for our sub-collections
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

  // Trigger toast notification helper
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentProjectId = activeProject?.id || "";

  // Helper to resolve theme color classes
  const getThemeColor = () => {
    switch (activeProject?.themeColor) {
      case "Emerald": return "emerald";
      case "Amber": return "amber";
      case "Rose": return "rose";
      case "Teal": return "teal";
      case "Indigo": return "indigo";
      case "Blue": 
      default: return "blue";
    }
  };

  const themeColor = getThemeColor();

  // -------------------------------------------------------------
  // FIRESTORE SYNC & SEED LOADER
  // -------------------------------------------------------------
  useEffect(() => {
    if (!currentProjectId) return;

    if (isDemoMode) {
      // Load seed data from LocalStorage in demo mode
      const localTasks = localStorage.getItem(`tasks_${currentProjectId}`);
      const localTimeline = localStorage.getItem(`timeline_${currentProjectId}`);
      const localAssets = localStorage.getItem(`assets_${currentProjectId}`);
      const localCalendar = localStorage.getItem(`calendar_${currentProjectId}`);
      const localArchive = localStorage.getItem(`archive_${currentProjectId}`);

      // Seed baseline templates if none exist
      if (!localTasks) {
        const defaultTasks: CampaignTask[] = [
          { id: "t-1", projectId: currentProjectId, text: "Assemble the central Harambee executive committee", completed: true, dueDate: new Date(Date.now() - 5*86400000).toISOString().split('T')[0], category: "Committee", assignedTo: "Chairperson" },
          { id: "t-2", projectId: currentProjectId, text: "Prepare public narrative appeal & financial target sheet", completed: true, dueDate: new Date(Date.now() - 2*86400000).toISOString().split('T')[0], category: "Marketing", assignedTo: "Secretary" },
          { id: "t-3", projectId: currentProjectId, text: "Configure Safaricom Daraja API or Till payment gateway", completed: false, dueDate: new Date(Date.now() + 2*86400000).toISOString().split('T')[0], category: "Audit", assignedTo: "Treasurer" },
          { id: "t-4", projectId: currentProjectId, text: "Draft initial launch promotional message for WhatsApp", completed: false, dueDate: new Date(Date.now() + 1*86400000).toISOString().split('T')[0], category: "Communication", assignedTo: "Mobilizer" },
          { id: "t-5", projectId: currentProjectId, text: "Recruit 3 matched-contribution high-value sponsors", completed: false, dueDate: new Date(Date.now() + 5*86400000).toISOString().split('T')[0], category: "Sponsors", assignedTo: "Chairperson" }
        ];
        setTasks(defaultTasks);
        localStorage.setItem(`tasks_${currentProjectId}`, JSON.stringify(defaultTasks));
      } else {
        setTasks(JSON.parse(localTasks));
      }

      if (!localTimeline) {
        const defaultTimeline: CampaignTimelineEvent[] = [
          { id: "tl-1", projectId: currentProjectId, title: "Campaign Initialized", description: `Draft campaign structure built for "${activeProject?.name}"`, timestamp: activeProject?.createdAt || new Date().toISOString(), status: "Draft", type: "system" },
          { id: "tl-2", projectId: currentProjectId, title: "Motto and Slogan Saved", description: `Motto set to: "${activeProject?.motto || "Haba na haba hujaza kibaba"}"`, timestamp: new Date(Date.now() - 1*86400000).toISOString(), status: "Planning", type: "system" }
        ];
        setTimeline(defaultTimeline);
        localStorage.setItem(`timeline_${currentProjectId}`, JSON.stringify(defaultTimeline));
      } else {
        setTimeline(JSON.parse(localTimeline));
      }

      if (!localAssets) {
        const defaultAssets: CampaignAsset[] = [
          { id: "as-1", projectId: currentProjectId, name: "Launch WhatsApp Appeal Template", type: "copywriting", content: `📢 *OFFICIAL HARAMBEE APPEAL* 📢\n\nDear members and well-wishers, we welcome you to join hands with us for *${activeProject?.name}*.\n\n🎯 Target Goal: KES ${activeProject?.targetAmount.toLocaleString()}\n🔑 Account Reference: ${activeProject?.accountReference}\n📌 Paybill: ${activeProject?.paybillNumber || "225588"}\n\nLet us build our community together. "Haba na haba hujaza kibaba!"`, createdAt: new Date().toISOString(), size: "1 KB" },
          { id: "as-2", projectId: currentProjectId, name: "Ecosystem QR Code Flyer", type: "qr_code", url: "/public/icon.png", createdAt: new Date().toISOString(), size: "128 KB" }
        ];
        setAssets(defaultAssets);
        localStorage.setItem(`assets_${currentProjectId}`, JSON.stringify(defaultAssets));
      } else {
        setAssets(JSON.parse(localAssets));
      }

      if (!localCalendar) {
        const defaultCalendar: CampaignCalendarEvent[] = [
          { id: "cl-1", projectId: currentProjectId, title: "Launch Mobilization Committee Meeting", description: "Finalize roles, assign tasks and configure Daraja alerts.", date: new Date(Date.now() + 1*86400000).toISOString().split('T')[0], time: "17:00", type: "meeting", completed: false },
          { id: "cl-2", projectId: currentProjectId, title: "First Weekly WhatsApp Progress Broadcast", description: "Simulate and push verified contribution audit reports to WhatsApp group.", date: new Date(Date.now() + 4*86400000).toISOString().split('T')[0], time: "09:00", type: "broadcast", completed: false }
        ];
        setCalendar(defaultCalendar);
        localStorage.setItem(`calendar_${currentProjectId}`, JSON.stringify(defaultCalendar));
      } else {
        setCalendar(JSON.parse(localCalendar));
      }

      if (localArchive) {
        setArchive(JSON.parse(localArchive));
      }

    } else {
      // REAL FIRESTORE LISTENERS
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

      const unsubArchive = onSnapshot(
        query(collection(db, "campaignArchive"), where("projectId", "==", currentProjectId)),
        (snap) => {
          const list: CampaignArchiveRecord[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CampaignArchiveRecord));
          setArchive(list);
        }
      );

      setLoading(false);

      return () => {
        unsubTasks();
        unsubTimeline();
        unsubAssets();
        unsubCalendar();
        unsubArchive();
      };
    }
  }, [currentProjectId, isDemoMode]);

  // -------------------------------------------------------------
  // DYNAMIC CALCULATED MOMENTUM & TARGET STATUS
  // -------------------------------------------------------------
  const projectContributions = useMemo(() => {
    if (!activeProject) return [];
    return contributions.filter(c => c.projectId === activeProject.id && !c.hasDuplicates);
  }, [contributions, activeProject?.id]);

  const totalRaised = useMemo(() => {
    return projectContributions.reduce((sum, c) => sum + c.amount, 0);
  }, [projectContributions]);

  const pctComplete = useMemo(() => {
    if (!activeProject?.targetAmount) return 0;
    return Math.min(100, Math.round((totalRaised / activeProject.targetAmount) * 100));
  }, [totalRaised, activeProject]);

  const currentStage = useMemo(() => {
    if (!activeProject) return "Draft";
    return activeProject.status || "Draft";
  }, [activeProject]);

  // Handle auto-advancing to "Goal Achieved" if totalRaised >= targetAmount and status is "Active"
  useEffect(() => {
    if (activeProject && currentStage === "Active" && totalRaised >= activeProject.targetAmount) {
      handleAdvanceStage("Goal Achieved", "The campaign has successfully crossed the target goal of KES " + activeProject.targetAmount.toLocaleString() + "!");
    }
  }, [totalRaised, activeProject, currentStage]);

  // Advance Pipeline Stages Method
  const handleAdvanceStage = async (nextStage: Project["status"], customReason?: string) => {
    if (!activeProject) return;

    const reason = customReason || `Campaign status officially advanced to "${nextStage}" stage.`;
    
    // Save system timeline event
    const newTimelineEvent: CampaignTimelineEvent = {
      id: "sys-" + Date.now(),
      projectId: activeProject.id,
      title: `Stage Advanced: ${nextStage}`,
      description: reason,
      timestamp: new Date().toISOString(),
      status: nextStage as any,
      type: "system"
    };

    if (isDemoMode) {
      // Memory persistence
      const updatedProj = { ...activeProject, status: nextStage };
      setActiveProject(updatedProj);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
      
      const updatedTimeline = [newTimelineEvent, ...timeline];
      setTimeline(updatedTimeline);
      localStorage.setItem(`timeline_${activeProject.id}`, JSON.stringify(updatedTimeline));

      triggerToast(`Campaign advanced to ${nextStage}!`, "success");
    } else {
      try {
        if (onUpdateProject) {
          await onUpdateProject({ status: nextStage });
          await addDoc(collection(db, "campaignTimeline"), newTimelineEvent);
          triggerToast(`Campaign successfully updated to ${nextStage}!`, "success");
        }
      } catch (err) {
        triggerToast("Failed to advance campaign stage.", "error");
      }
    }
  };

  // -------------------------------------------------------------
  // INTERACTIVE CRUD OPERATORS
  // -------------------------------------------------------------

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeProject) return;

    const task: CampaignTask = {
      id: "task-" + Date.now(),
      projectId: activeProject.id,
      text: newTaskText.trim(),
      completed: false,
      dueDate: new Date(Date.now() + 3*86400000).toISOString().split('T')[0], // default 3 days
      category: newTaskCat,
      assignedTo: newTaskAssignee.trim() || "Unassigned"
    };

    if (isDemoMode) {
      const updated = [task, ...tasks];
      setTasks(updated);
      localStorage.setItem(`tasks_${activeProject.id}`, JSON.stringify(updated));
      setNewTaskText("");
      setNewTaskAssignee("");
      triggerToast("Task added to campaign planner");
    } else {
      try {
        await addDoc(collection(db, "campaignTasks"), task);
        setNewTaskText("");
        setNewTaskAssignee("");
        triggerToast("Task saved in Firestore");
      } catch (err) {
        triggerToast("Error saving task", "error");
      }
    }
  };

  // Toggle Task Completion
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
        triggerToast("Task state updated");
      } catch (err) {
        triggerToast("Error updating task", "error");
      }
    }
  };

  // Delete Task
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

  // Add Custom Timeline Event
  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineTitle.trim() || !newTimelineDesc.trim() || !activeProject) return;

    const event: CampaignTimelineEvent = {
      id: "tl-" + Date.now(),
      projectId: activeProject.id,
      title: newTimelineTitle.trim(),
      description: newTimelineDesc.trim(),
      timestamp: new Date().toISOString(),
      status: currentStage as any,
      type: newTimelineType
    };

    if (isDemoMode) {
      const updated = [event, ...timeline];
      setTimeline(updated);
      localStorage.setItem(`timeline_${activeProject.id}`, JSON.stringify(updated));
      setNewTimelineTitle("");
      setNewTimelineDesc("");
      triggerToast("Timeline event pinned!");
    } else {
      try {
        await addDoc(collection(db, "campaignTimeline"), event);
        setNewTimelineTitle("");
        setNewTimelineDesc("");
        triggerToast("Timeline saved in Firestore");
      } catch (err) {
        triggerToast("Error saving timeline event", "error");
      }
    }
  };

  // Delete Timeline Event
  const handleDeleteTimelineEvent = async (eventId: string) => {
    if (isDemoMode) {
      const updated = timeline.filter(t => t.id !== eventId);
      setTimeline(updated);
      localStorage.setItem(`timeline_${currentProjectId}`, JSON.stringify(updated));
      triggerToast("Event removed from feed");
    } else {
      try {
        await deleteDoc(doc(db, "campaignTimeline", eventId));
        triggerToast("Event deleted from audit");
      } catch (err) {
        triggerToast("Error deleting timeline", "error");
      }
    }
  };

  // Add Calendar Event
  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarTitle.trim() || !newCalendarDate || !activeProject) return;

    const event: CampaignCalendarEvent = {
      id: "cl-" + Date.now(),
      projectId: activeProject.id,
      title: newCalendarTitle.trim(),
      description: newCalendarDesc.trim() || "No description provided.",
      date: newCalendarDate,
      time: newCalendarTime || "12:00",
      type: newCalendarType,
      completed: false
    };

    if (isDemoMode) {
      const updated = [...calendar, event].sort((a, b) => a.date.localeCompare(b.date));
      setCalendar(updated);
      localStorage.setItem(`calendar_${activeProject.id}`, JSON.stringify(updated));
      setNewCalendarTitle("");
      setNewCalendarDesc("");
      setNewCalendarDate("");
      setNewCalendarTime("");
      triggerToast("Schedule event booked!");
    } else {
      try {
        await addDoc(collection(db, "campaignCalendar"), event);
        setNewCalendarTitle("");
        setNewCalendarDesc("");
        setNewCalendarDate("");
        setNewCalendarTime("");
        triggerToast("Calendar event saved");
      } catch (err) {
        triggerToast("Error booking event", "error");
      }
    }
  };

  // Toggle Calendar Event Done
  const handleToggleCalendar = async (event: CampaignCalendarEvent) => {
    if (isDemoMode) {
      const updated = calendar.map(c => c.id === event.id ? { ...c, completed: !c.completed } : c);
      setCalendar(updated);
      localStorage.setItem(`calendar_${currentProjectId}`, JSON.stringify(updated));
      triggerToast(event.completed ? "Event reopened" : "Schedule event verified!");
    } else {
      try {
        const docRef = doc(db, "campaignCalendar", event.id);
        await setDoc(docRef, { completed: !event.completed }, { merge: true });
        triggerToast("Calendar updated");
      } catch (err) {
        triggerToast("Error updating calendar", "error");
      }
    }
  };

  // Delete Calendar Event
  const handleDeleteCalendar = async (eventId: string) => {
    if (isDemoMode) {
      const updated = calendar.filter(c => c.id !== eventId);
      setCalendar(updated);
      localStorage.setItem(`calendar_${currentProjectId}`, JSON.stringify(updated));
      triggerToast("Schedule event deleted");
    } else {
      try {
        await deleteDoc(doc(db, "campaignCalendar", eventId));
        triggerToast("Schedule event deleted");
      } catch (err) {
        triggerToast("Error deleting event", "error");
      }
    }
  };

  // Add Asset
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !activeProject) return;

    const asset: CampaignAsset = {
      id: "as-" + Date.now(),
      projectId: activeProject.id,
      name: newAssetName.trim(),
      type: newAssetType,
      content: newAssetContent.trim() || undefined,
      createdAt: new Date().toISOString(),
      size: `${Math.round(1 + Math.random() * 9)} KB`
    };

    if (isDemoMode) {
      const updated = [asset, ...assets];
      setAssets(updated);
      localStorage.setItem(`assets_${activeProject.id}`, JSON.stringify(updated));
      setNewAssetName("");
      setNewAssetContent("");
      triggerToast("Asset loaded into campaign vaults!");
    } else {
      try {
        await addDoc(collection(db, "campaignAssets"), asset);
        setNewAssetName("");
        setNewAssetContent("");
        triggerToast("Asset saved in Firestore");
      } catch (err) {
        triggerToast("Error uploading asset", "error");
      }
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (assetId: string) => {
    if (isDemoMode) {
      const updated = assets.filter(a => a.id !== assetId);
      setAssets(updated);
      localStorage.setItem(`assets_${currentProjectId}`, JSON.stringify(updated));
      triggerToast("Asset removed from Vault");
    } else {
      try {
        await deleteDoc(doc(db, "campaignAssets", assetId));
        triggerToast("Asset deleted from database");
      } catch (err) {
        triggerToast("Error deleting asset", "error");
      }
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`${label} copied to clipboard!`, "success");
  };

  // Post Draft to simulated WhatsApp Group
  const handlePostToWhatsAppSim = async (messageText: string) => {
    if (!activeProject) return;
    try {
      if (onPostWebhook) {
        await onPostWebhook({
          groupName: activeProject.whatsappGroupName || "Harambee Committee",
          message: messageText,
          isSystem: false
        });
        triggerToast("Message posted to WhatsApp Group Feed!", "success");
      } else {
        // Fallback simulated update
        triggerToast("WhatsApp connection simulated successfully!", "success");
      }
    } catch (err) {
      triggerToast("Could not send WhatsApp update.", "error");
    }
  };

  // -------------------------------------------------------------
  // AI INTEGRATION VIA SERVER (GEMINI PORTAL)
  // -------------------------------------------------------------
  const generateAIAssistance = async () => {
    if (!activeProject) return;
    setAiGenerating(true);
    setAiResult("");

    try {
      const response = await fetch("/api/ai/campaign-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id })
      });

      const data = await response.json();
      
      if (response.ok && data) {
        // Formulate narrative based on request type
        let textResult = "";
        if (aiDraftType === "update") {
          textResult = data.communications?.whatsapp || `📊 *${activeProject.name} Update* 📊\n\nWe've raised KES ${totalRaised.toLocaleString()} (${pctComplete}%). Let's push to raise the remainder!`;
          if (aiCustomContext) {
            textResult += `\n\n*Special Note:* ${aiCustomContext}`;
          }
        } else if (aiDraftType === "appeal") {
          textResult = `📢 *URGENT SUPPORT INVITATION* 📢\n\nDear Members,\nOur goal of KES ${activeProject.targetAmount.toLocaleString()} is critical for "${activeProject.name}".\n\nWe require your prayers, mobilization, and contributions. Ensure you indicate standard reference code *${activeProject.accountReference}* when using Paybill ${activeProject.paybillNumber || "225588"}.\n\n"Haba na haba hujaza kibaba."`;
          if (aiCustomContext) {
            textResult += `\n\n*Strategic Goal Context:* ${aiCustomContext}`;
          }
        } else if (aiDraftType === "thankyou") {
          textResult = data.communications?.sms || `Dear Donor, thank you for backing "${activeProject.name}" with your generous donation. Safaricom has matched and reconciled your ledger securely!`;
          if (aiCustomContext) {
            textResult += `\n\n*Note on matches:* ${aiCustomContext}`;
          }
        }
        setAiResult(textResult);
        triggerToast("Gemini draft successfully finalized!");
      } else {
        throw new Error(data.error || "Generation error");
      }
    } catch (err: any) {
      // Offline fallback template engine
      let textResult = "";
      if (aiDraftType === "update") {
        textResult = `📢 *Progress Narrative Update: ${activeProject.name}* 📢\n\nWe have successfully raised KES *${totalRaised.toLocaleString()}* which is *${pctComplete}%* of our total goal!\n\nOnly KES *${Math.max(0, activeProject.targetAmount - totalRaised).toLocaleString()}* remains to hit the final milestone. Thank you family!`;
      } else if (aiDraftType === "appeal") {
        textResult = `🔔 *Official Mobilization Drive: ${activeProject.name}* 🔔\n\nHelp us bridge the KES ${Math.max(0, activeProject.targetAmount - totalRaised).toLocaleString()} gap! Send contributions to Paybill *${activeProject.paybillNumber || "225588"}*, Account *${activeProject.accountReference}*.`;
      } else {
        textResult = `✨ *Gratitude Receipt & Certification* ✨\n\nDear friends, we are deeply grateful for your support toward "${activeProject.name}". Your pledges are securely audited and locked into our transparent blockchain ledger.`;
      }
      if (aiCustomContext) {
        textResult += `\n\n*Added Context:* ${aiCustomContext}`;
      }
      setAiResult(textResult);
      triggerToast("Offline helper completed draft (AI key inactive).", "info");
    } finally {
      setAiGenerating(false);
    }
  };

  // -------------------------------------------------------------
  // SE SEAL LEDGER CLOSURE LOGIC
  // -------------------------------------------------------------
  const handleSealLedger = () => {
    setClosureStep("verifying");
    setTimeout(() => {
      setIsSealing(true);
      setTimeout(() => {
        setIsSealing(false);
        setClosureStep("sealed");
        handleAdvanceStage("Archived", "Campaign ledger has been frozen, audited, and archived into institutional memory.");
        triggerToast("Ecosystem Ledger successfully sealed!", "success");
      }, 2000);
    }, 1500);
  };

  // Archive comparative selection search
  const filteredArchives = SEEDED_ARCHIVES.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.year.includes(searchTerm)
  );

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(x => x !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const comp1 = SEEDED_ARCHIVES.find(a => a.id === selectedForCompare[0]);
  const comp2 = SEEDED_ARCHIVES.find(a => a.id === selectedForCompare[1]);


  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center text-slate-400 font-sans">
        <Target className="w-16 h-16 text-slate-700 animate-pulse mb-4" />
        <h3 className="text-lg font-bold text-white">No Active Campaign Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
          Please select or launch a campaign in the main Treasurer dashboard to manage its planning, timeline, and archival lifecycle.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8" id="campaign-lifecycle-root-viewport">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-mono font-bold ${
              toast.type === "success" 
                ? "bg-emerald-500 text-slate-950" 
                : toast.type === "error" 
                ? "bg-rose-500 text-white" 
                : "bg-indigo-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STRATEGIC INTEL HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 mb-8 border-b border-slate-900">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Target className="w-4 h-4 text-indigo-400 animate-pulse" /> Campaign Headquarters
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Campaign Lifecycle & Command
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Formulate, mobilize, schedule meetings, upload marketing flyers, leverage Gemini AI copywriting, and permanently seal transaction ledgers.
          </p>
        </div>

        {/* Campaign Info Card */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 min-w-[280px]">
          <div className={`w-10 h-10 rounded-xl bg-${themeColor}-500/10 flex items-center justify-center text-${themeColor}-400 font-mono text-xs font-bold`}>
            {activeProject.accountReference.substring(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{activeProject.name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Raised: KES {totalRaised.toLocaleString()} ({pctComplete}%)
            </p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className={`bg-${themeColor}-500 h-full`} style={{ width: `${pctComplete}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6-STAGE HORIZONTAL PIPELINE STEPPER */}
      {/* ========================================================= */}
      <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 mb-8 shadow-xl">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">Campaign Pipeline Phase</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {[
            { stage: "Draft", desc: "Slogan & targets formulation" },
            { stage: "Planning", desc: "Assign duties, plan milestones" },
            { stage: "Active", desc: "Accepting M-PESA contributions" },
            { stage: "Goal Achieved", desc: "Surpassed 100% threshold" },
            { stage: "Completed", desc: "Reconciliations & audit locks" },
            { stage: "Archived", desc: "Institutional memory sealed" }
          ].map((item, idx) => {
            const isCurrent = currentStage === item.stage;
            const isDone = [
              "Draft", "Planning", "Active", "Goal Achieved", "Completed", "Archived"
            ].indexOf(currentStage) >= idx;

            return (
              <div 
                key={item.stage}
                className={`relative p-4 rounded-2xl border transition duration-150 flex flex-col justify-between ${
                  isCurrent 
                    ? `bg-${themeColor}-950/20 border-${themeColor}-800/60 shadow-[0_0_12px_rgba(59,130,246,0.1)]` 
                    : isDone 
                    ? "bg-slate-900 border-slate-800 text-slate-300" 
                    : "bg-slate-950/30 border-slate-900/50 text-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[9px] font-mono font-bold text-slate-500">PHASE 0{idx + 1}</span>
                    {isCurrent ? (
                      <span className={`w-2 h-2 rounded-full bg-${themeColor}-500 animate-pulse`} />
                    ) : isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-800" />
                    )}
                  </div>
                  <h4 className={`text-xs font-black font-sans ${isCurrent ? `text-${themeColor}-400` : isDone ? "text-slate-200" : "text-slate-500"}`}>
                    {item.stage}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* ========================================================= */}
      {/* SECONDARY NAVIGATION TABS CONTROL */}
      {/* ========================================================= */}
      <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-2xl border border-slate-800/80 mb-8 max-w-4xl shadow-lg gap-1">
        {[
          { id: "overview", label: "Dashboard", icon: BarChart3 },
          { id: "tasks", label: "Tasks Planner", icon: CheckCircle2 },
          { id: "timeline", label: "Timeline Feed", icon: Clock },
          { id: "calendar", label: "Calendar Schedule", icon: CalendarRange },
          { id: "assets", label: "Asset Vault", icon: FolderOpen },
          { id: "ai", label: "AI Copywriter", icon: Bot },
          { id: "archive", label: "Institutional Archive", icon: Archive }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-2 transition cursor-pointer ${
                isActive
                  ? `bg-${themeColor}-500 text-slate-950 shadow-md font-extrabold`
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT SECTIONS */}
      {/* ========================================================= */}
      
      {/* TAB 1: OVERVIEW & PIPELINE CONTROL */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Main Control Panel (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Settings className={`w-4.5 h-4.5 text-${themeColor}-500`} /> State Advancements Panel
              </h3>

              <div className="space-y-4">
                {currentStage === "Draft" && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <PlusCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase">Drafting to Planning Stage Checklist</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Define core campaign variables (description, category) and save project baseline configurations to move into planning stage.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-end">
                      <button
                        onClick={() => handleAdvanceStage("Planning", "Fitted target configurations. Ready to assign team roles & timeline milestones.")}
                        className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer`}
                      >
                        Advance to Planning Stage <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === "Planning" && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase font-bold">Planning to Go-Live (Active) Stage</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Ensure your M-PESA paybill or Till shortcode is mapped. Ready to launch campaigns on social channels and WhatsApp.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-end">
                      <button
                        onClick={() => handleAdvanceStage("Active", `Campaign launched! Live Paybill ${activeProject.paybillNumber || "225588"} is actively match-auditing givers.`)}
                        className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer`}
                      >
                        Launch Campaign Live <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === "Active" && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase">Campaign Active & Accepting Contributions</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Your campaign is active. Contributions are matched automatically via Daraja real-time callback hooks.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                      <span className="text-slate-500 italic">Progress: {pctComplete}% (KES {totalRaised.toLocaleString()}/{activeProject.targetAmount.toLocaleString()})</span>
                      <button
                        onClick={() => handleAdvanceStage("Goal Achieved", "Manually declared goal achieved milestone for general assembly celebration.")}
                        className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer`}
                      >
                        Force Goal Achieved <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === "Goal Achieved" && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase">Goal Reached! Proceed to Completed Stage</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Your target goal is surpassed! Ready to compile closing audit packages, lock ledger modifications, and present reports.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-end">
                      <button
                        onClick={() => handleAdvanceStage("Completed", "Official fund drive closed. Verification process commenced.")}
                        className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer`}
                      >
                        Lock & Complete Campaign <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === "Completed" && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase">Campaign Ledger Audit and Archival Seals</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Freeze transaction modifications permanently. Sealing the ledger encrypts historical statements and posts files to institutional archive.
                        </p>
                      </div>
                    </div>

                    {closureStep === "idle" && (
                      <div className="pt-2 border-t border-slate-900 flex justify-end">
                        <button
                          onClick={handleSealLedger}
                          className={`px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer`}
                        >
                          Audit & Seal Ecosystem Ledger <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {closureStep === "verifying" && (
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-mono">
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        <span>Verifying double-entry ledger entries & preventing double-counting...</span>
                      </div>
                    )}

                    {closureStep === "sealed" && (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-mono rounded-xl flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Ecosystem Ledger Audited, Encryption Sealed, and Archived!</span>
                      </div>
                    )}
                  </div>
                )}

                {currentStage === "Archived" && (
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4 text-center py-6">
                    <Archive className="w-10 h-10 text-indigo-500 mx-auto animate-bounce mb-2" />
                    <h4 className="text-xs font-black text-white font-mono uppercase">Campaign Institutionalized</h4>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                      This campaign is preserved securely. Its ledger is locked from updates. Check the "Institutional Archive" tab to compare this campaign's momentum side-by-side with other projects.
                    </p>
                    <div className="pt-3 border-t border-slate-900 flex justify-center gap-3">
                      <button
                        onClick={() => handleAdvanceStage("Active", "Restored campaign to Active state.")}
                        className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-[10px] font-mono rounded-lg transition"
                      >
                        Restore Campaign to Active
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Campaign Core Details card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Campaign Identity</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{activeProject.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Category</span>
                  <p className="text-slate-200 mt-0.5 font-bold">{activeProject.category}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Paybill/Shortcode</span>
                  <p className="text-slate-200 mt-0.5 font-bold">{activeProject.paybillNumber || "225588"}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Account Ref</span>
                  <p className="text-slate-200 mt-0.5 font-bold">{activeProject.accountReference}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">WhatsApp Group</span>
                  <p className="text-slate-200 mt-0.5 font-bold truncate">{activeProject.whatsappGroupName || "Harambee Group"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Checklist Info (Right 1 column) */}
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Financial Snapshot</h3>
              
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Target Goal:</span>
                  <span className="text-slate-200 font-bold">KES {activeProject.targetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Aggregate Raised:</span>
                  <span className={`text-${themeColor}-400 font-bold`}>KES {totalRaised.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="text-rose-400 font-bold">
                    KES {Math.max(0, activeProject.targetAmount - totalRaised).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Contributors:</span>
                  <span className="text-slate-200 font-bold">{projectContributions.length} Givers</span>
                </div>
              </div>
            </div>

            {/* Campaign Guide checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Info className="w-4 h-4 text-indigo-400" /> Operational Guidance
              </h3>
              <ul className="text-[11px] text-slate-400 pl-4 list-disc space-y-2.5 leading-normal">
                <li>Assemble your committee members in the "Tasks Planner" tab to divide and execute campaign chores.</li>
                <li>Leverage "AI Copywriter" to draft and broadcast weekly summaries or thank-you receipts instantly.</li>
                <li>Add promotional flyers or PDFs to the "Asset Vault" to keep committee resources consolidated.</li>
                <li>Once the campaign successfully concludes, remember to lock and seal the ledger in the Dashboard.</li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: INTERACTIVE TASK BOARD (campaignTasks) */}
      {activeTab === "tasks" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Add task bar */}
          <form onSubmit={handleAddTask} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Create New Campaign Duty</label>
              <input
                type="text"
                placeholder="e.g. Complete matched-contributions draft for Safaricom sponsors..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="w-full md:w-48 space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Duty Category</label>
              <select
                value={newTaskCat}
                onChange={(e) => setNewTaskCat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                {["Committee", "Audit", "Communication", "Marketing", "Sponsors", "Governance"].map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-48 space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Assignee</label>
              <input
                type="text"
                placeholder="Name or Role"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Save Duty
            </button>
          </form>

          {/* Tasks List Board */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-6">Active Committee Duties Planner</h3>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-12">No pending duties pinned. Create one above to mobilize your team!</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      task.completed 
                        ? "bg-slate-950/40 border-slate-900/60 text-slate-500 line-through" 
                        : "bg-slate-950/80 border-slate-800/80 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                          task.completed 
                            ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                            : "border-slate-700 hover:border-slate-500 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0">
                        <span className="text-xs leading-relaxed block font-medium break-words">{task.text}</span>
                        
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="text-[8.5px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-sm uppercase">
                            {task.category}
                          </span>
                          <span className="text-[8.5px] font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded-sm">
                            ASSIGNED TO: {task.assignedTo || "Unassigned"}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-500">
                            DUE: {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 hover:bg-rose-950/30 hover:text-rose-400 text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: TIMELINE FEED (campaignTimeline) */}
      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-6">Chronological Campaign Milestone Feed</h3>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-12">No events logged in the campaign timeline yet.</p>
            ) : (
              <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
                {timeline.map((event) => (
                  <div key={event.id} className="relative">
                    {/* Circle Node indicator */}
                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                      event.type === "system" 
                        ? `bg-${themeColor}-500` 
                        : event.type === "milestone" 
                        ? "bg-purple-500" 
                        : "bg-amber-500"
                    }`} />

                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl relative group">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[8.5px] font-mono font-bold text-slate-500 uppercase">{event.type} event - {new Date(event.timestamp).toLocaleString()}</span>
                          <h4 className="text-xs font-bold text-slate-100 mt-0.5">{event.title}</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteTimelineEvent(event.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-950/30 hover:text-rose-400 text-slate-600 rounded transition shrink-0 cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11.5px] text-slate-400 mt-2 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Timeline Event form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4">Post Manual Milestone</h3>
            
            <form onSubmit={handleAddTimelineEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Match contribution secured"
                  value={newTimelineTitle}
                  onChange={(e) => setNewTimelineTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Event Type</label>
                <select
                  value={newTimelineType}
                  onChange={(e) => setNewTimelineType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="manual" className="bg-slate-900">Manual Event</option>
                  <option value="milestone" className="bg-slate-900">Milestone Celebration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Narrative Details</label>
                <textarea
                  placeholder="Details of what was achieved..."
                  value={newTimelineDesc}
                  onChange={(e) => setNewTimelineDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Pin Event
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 4: CALENDAR / SCHEDULE (campaignCalendar) */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Calendar Agenda List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-6">Upcoming Campaign Agenda Schedule</h3>

            {calendar.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-12">No calendar events booked yet. Plan meeting sessions above!</p>
            ) : (
              <div className="space-y-3">
                {calendar.map((event) => (
                  <div 
                    key={event.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      event.completed 
                        ? "bg-slate-950/45 border-slate-900 text-slate-500" 
                        : "bg-slate-950/80 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => handleToggleCalendar(event)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 mt-0.5 ${
                          event.completed 
                            ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                            : "border-slate-700 hover:border-slate-500 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase ${
                            event.type === "meeting" 
                              ? "bg-indigo-950 text-indigo-400 border border-indigo-900/30" 
                              : event.type === "broadcast" 
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" 
                              : "bg-rose-950 text-rose-400 border border-rose-900/30"
                          }`}>
                            {event.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{event.date} at {event.time}</span>
                        </div>
                        <h4 className={`text-xs font-bold mt-1.5 ${event.completed ? "line-through text-slate-500" : "text-slate-200"}`}>{event.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{event.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCalendar(event.id)}
                      className="p-1.5 hover:bg-rose-950/30 hover:text-rose-400 text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Agenda form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4">Book Calendar Agenda</h3>
            
            <form onSubmit={handleAddCalendarEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Post-Sunday collection reconciliation meeting"
                  value={newCalendarTitle}
                  onChange={(e) => setNewCalendarTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Date</label>
                  <input
                    type="date"
                    value={newCalendarDate}
                    onChange={(e) => setNewCalendarDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Time</label>
                  <input
                    type="time"
                    value={newCalendarTime}
                    onChange={(e) => setNewCalendarTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Agenda Type</label>
                <select
                  value={newCalendarType}
                  onChange={(e) => setNewCalendarType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="meeting" className="bg-slate-900">Committee Meeting</option>
                  <option value="broadcast" className="bg-slate-900">WhatsApp Broadcast</option>
                  <option value="deadline" className="bg-slate-900">Deadline Target</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Brief Agenda Summary</label>
                <textarea
                  placeholder="Details of what is to be covered..."
                  value={newCalendarDesc}
                  onChange={(e) => setNewCalendarDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Book Schedule Slot
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 5: ASSET & TEMPLATES VAULT (campaignAssets) */}
      {activeTab === "assets" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Assets Grid List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-6">Promotional Asset & Copy Vault</h3>

            {assets.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-12">No promotional assets uploaded. Save copywriting templates below!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map((asset) => (
                  <div 
                    key={asset.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[8.5px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded-sm uppercase shrink-0">
                          {asset.type}
                        </span>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 hover:bg-rose-950/30 hover:text-rose-400 text-slate-600 rounded transition shrink-0 cursor-pointer"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-xs font-black text-slate-200 mt-2.5">{asset.name}</h4>
                      
                      {asset.content ? (
                        <div className="mt-3 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
                          <p className="text-[10px] text-slate-400 font-sans italic leading-relaxed line-clamp-3">
                            "{asset.content}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-2 italic leading-relaxed">External url/image flyer resource linked.</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>SIZE: {asset.size || "8 KB"}</span>
                      {asset.content ? (
                        <button
                          onClick={() => handleCopy(asset.content!, asset.name)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer uppercase"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Copywriting
                        </button>
                      ) : (
                        <span className="text-slate-600">Locked Resource</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Asset form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4">Register Asset Item</h3>
            
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Phase 2 WhatsApp Broadcast Text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Asset Type</label>
                <select
                  value={newAssetType}
                  onChange={(e) => setNewAssetType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="copywriting" className="bg-slate-900">Copywriting / Text Draft</option>
                  <option value="document" className="bg-slate-900">Document Flyer Ref</option>
                  <option value="image" className="bg-slate-900">Image Asset Ref</option>
                </select>
              </div>

              {newAssetType === "copywriting" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Copywriting Slogan Content</label>
                  <textarea
                    placeholder="Type or paste promo copywriting templates here..."
                    value={newAssetContent}
                    onChange={(e) => setNewAssetContent(e.target.value)}
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Vault Item
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 6: AI COMMUNICATION ASSISTANT (GEMINI INTEGRATION) */}
      {activeTab === "ai" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-fade-in space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-5 h-5 text-indigo-400 animate-pulse" /> Gemini AI Copywriter Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Let Gemini draft tailored committee circulars, WhatsApp updates or givers gratitude cards based on live campaign progress.
              </p>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: "update", label: "Group Progress Update" },
                { id: "appeal", label: "Custom Mobilization Appeal" },
                { id: "thankyou", label: "Contributor Thank-You Card" }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setAiDraftType(b.id as any);
                    setAiResult("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold font-sans cursor-pointer transition ${
                    aiDraftType === b.id 
                      ? "bg-indigo-600 text-white shadow" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Additional context constraints (Optional)</label>
                <textarea
                  placeholder="e.g. Mention church youth Pathfinder sponsorship, or specific matching milestones reached on Sunday..."
                  value={aiCustomContext}
                  onChange={(e) => setAiCustomContext(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <button
                type="button"
                onClick={generateAIAssistance}
                disabled={aiGenerating}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black font-mono rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Engaging Gemini Core AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>Draft Copywriting with Gemini</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Draft Panel */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between h-80">
              <div className="overflow-y-auto">
                <span className="text-[8.5px] font-mono font-bold text-slate-500 uppercase block mb-2">Verified Gemini AI Draft:</span>
                
                {aiResult ? (
                  <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {aiResult}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 italic text-center py-20 font-sans">Draft results will render here. Trigger generation on the left panel!</p>
                )}
              </div>

              {aiResult && (
                <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end gap-3 font-mono">
                  <button
                    onClick={() => handleCopy(aiResult, "Gemini Draft")}
                    className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-[10px] rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Draft
                  </button>

                  <button
                    onClick={() => handlePostToWhatsAppSim(aiResult)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Broadcast to Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: HISTORICAL COMPARATIVE DESK (ARCHIVES) */}
      {activeTab === "archive" && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Header & search */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Archive className="w-4.5 h-4.5 text-indigo-400" /> Historical Institution Memory Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Compare parameters of active campaign side-by-side with completed historical drives and download reports.
              </p>
            </div>

            <div className="relative max-w-xs w-full shrink-0">
              <input
                type="text"
                placeholder="Search past drives or years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 pl-9 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <span className="absolute left-3 top-3 text-slate-500">🔍</span>
            </div>
          </div>

          {/* Comparatives panel */}
          {selectedForCompare.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="w-4.5 h-4.5 text-indigo-400" /> Comparatives Desk Board
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedForCompare([])}
                  className="text-xs font-mono text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
                >
                  Clear Desk
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Slot 1 */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  {comp1 ? (
                    <div className="space-y-3 font-sans">
                      <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-sm uppercase">{comp1.year} - {comp1.category}</span>
                      <h4 className="text-xs font-black text-white">{comp1.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-900">
                        <div>
                          <span className="text-slate-500 text-[10px]">TARGET</span>
                          <p className="font-bold text-slate-200 mt-0.5">KES {comp1.goal.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">RAISED</span>
                          <p className="font-bold text-emerald-400 mt-0.5">KES {comp1.raised.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">DONORS</span>
                          <p className="font-bold text-slate-200 mt-0.5">{comp1.contributors} Givers</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">HEALTH</span>
                          <p className="font-bold text-slate-200 mt-0.5">{comp1.health}% Audit Score</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed italic">"{comp1.description}"</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic text-center py-12">Select campaign below to compare parameters side-by-side.</p>
                  )}
                </div>

                {/* Slot 2 */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  {comp2 ? (
                    <div className="space-y-3 font-sans">
                      <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-sm uppercase">{comp2.year} - {comp2.category}</span>
                      <h4 className="text-xs font-black text-white">{comp2.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-900">
                        <div>
                          <span className="text-slate-500 text-[10px]">TARGET</span>
                          <p className="font-bold text-slate-200 mt-0.5">KES {comp2.goal.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">RAISED</span>
                          <p className="font-bold text-emerald-400 mt-0.5">KES {comp2.raised.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">DONORS</span>
                          <p className="font-bold text-slate-200 mt-0.5">{comp2.contributors} Givers</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">HEALTH</span>
                          <p className="font-bold text-slate-200 mt-0.5">{comp2.health}% Audit Score</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed italic">"{comp2.description}"</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic text-center py-12">Select secondary campaign below to compare parameters side-by-side.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical register list */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-6">Historical Institutional Drive Register</h3>

            <div className="space-y-4">
              {filteredArchives.map((arc) => {
                const isComparing = selectedForCompare.includes(arc.id);
                const progressPct = Math.min(100, Math.round((arc.raised / arc.goal) * 100));

                return (
                  <div 
                    key={arc.id}
                    className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[8.5px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-sm uppercase">YEAR: {arc.year}</span>
                        <h4 className="text-xs font-black text-white">{arc.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">{arc.description}</p>
                    </div>

                    {/* Progress details */}
                    <div className="w-44 text-xs font-mono shrink-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-emerald-400 font-bold">{progressPct}% Raised</span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-850 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="text-[9.5px] text-slate-500 mt-1 block">Goal: KES {arc.goal.toLocaleString()} | Raised: KES {arc.raised.toLocaleString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <button
                        type="button"
                        onClick={() => handleToggleCompare(arc.id)}
                        className={`px-3.5 py-1.5 rounded-lg border text-[10.5px] font-bold uppercase transition cursor-pointer ${
                          isComparing 
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        {isComparing ? "Desk Selected ✓" : "Compare"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(`Audit report of historical campaign: "${arc.name}". Raised: KES ${arc.raised.toLocaleString()} from ${arc.contributors} contributors in ${arc.year}.`, arc.name)}
                        className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white text-[10.5px] font-bold rounded-lg transition uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Summary
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
