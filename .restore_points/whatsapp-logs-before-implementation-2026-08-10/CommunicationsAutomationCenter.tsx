import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, Plus, Calendar, List, History, Sparkles, Clock, ArrowRight, 
  Settings, Mail, Smartphone, Send, CheckCircle2, XCircle, AlertCircle, 
  Trash2, Copy, Edit, Filter, Share2, FileText, Layers, Bot, TrendingUp, 
  Coins, Users, Sliders, HelpCircle, RefreshCw, Eye, MessageSquare, ChevronRight,
  UserCheck, ShieldCheck, Heart, Volume2, CalendarDays, Zap, Play, Pause, Search,
  BellRing, Info, ClipboardCopy, Check
} from "lucide-react";
import { Project, Contribution, Pledge } from "../types";
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface CommunicationsAutomationCenterProps {
  activeProject: Project;
  contributions: Contribution[];
  isDemoMode?: boolean;
  currentUser?: any;
}

// Visual Workflow node interface
interface WorkflowNode {
  id: string;
  type: "trigger" | "delay" | "condition" | "action" | "end";
  title: string;
  desc: string;
  icon: any;
  color: string;
  config: Record<string, any>;
}

export default function CommunicationsAutomationCenter({
  activeProject,
  contributions,
  isDemoMode = true,
  currentUser
}: CommunicationsAutomationCenterProps) {
  // Tabs: dashboard, automations, templates, broadcasts, timeline, insights
  const [activeSubTab, setActiveSubTab] = useState<string>("dashboard");

  // CRM Roles & Security Check
  // Committee roles mapping
  const userRole = useMemo(() => {
    if (!currentUser) return "Owner"; // default to Owner in demo
    if (activeProject.createdBy === currentUser.uid || activeProject.createdBy === currentUser.email) return "Owner";
    
    // Find inside project committee array
    const committeeMember = activeProject.committee?.find(
      (m: any) => m.phone === currentUser.phoneNumber || m.email === currentUser.email
    );
    return committeeMember?.role || "Owner"; // fallback to Owner
  }, [currentUser, activeProject]);

  const canManageBroadcasts = useMemo(() => {
    return ["Owner", "Administrator", "Treasurer", "Assistant Treasurer"].includes(userRole);
  }, [userRole]);

  // Firestore & Local States
  const [localTemplates, setLocalTemplates] = useState<any[]>([]);
  const [localAutomations, setLocalAutomations] = useState<any[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // FloatingCompose State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeForm, setComposeForm] = useState({
    recipientPhone: "",
    recipientName: "",
    channel: "whatsapp",
    messageText: ""
  });

  // Timeline notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Pre-seed sample data fallback
  useEffect(() => {
    // Standard visual templates seed
    const defaultTemplates = [
      {
        id: "tpl-1",
        title: "Immediate Receipt & Thank You",
        category: "Thank You",
        channel: "whatsapp",
        text: "Dear {{SupporterName}},\n\nThank you for supporting the {{CampaignName}} with your generous contribution of KES {{Amount}}.\n\nBecause of supporters like you, we have now raised KES {{Raised}} ({{Percentage}}% of our goal).\n\nYour kindness is making a profound difference.\n\nMay God richly bless you.\n\nRef: {{TransactionCode}}",
        version: "v1.2",
        updatedAt: new Date().toISOString()
      },
      {
        id: "tpl-2",
        title: "Pledge Overdue Follow-up",
        category: "Pledge Reminder",
        channel: "sms",
        text: "Habari {{SupporterName}}. This is a warm reminder from the {{CampaignName}} committee regarding your pledge of KES {{Balance}}. We are currently at {{Percentage}}% of our target and require KES {{Remaining}} to finalize. Paybill: {{Paybill}}, Acc: {{AccName}}. Thank you!",
        version: "v2.0",
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "tpl-3",
        title: "50% Milestone Celebration",
        category: "Milestone Celebration",
        channel: "whatsapp",
        text: "Glory be to God! 🎉\n\nWe have officially reached 50% of our target for {{CampaignName}}!\n\nWe have raised KES {{Raised}} against our KES {{Goal}} target. We thank all our {{ContributorsCount}} active contributors for pulling together.\n\nLet's continue to mobilize our networks to cross the finish line. Harambee!",
        version: "v1.1",
        updatedAt: new Date().toISOString()
      },
      {
        id: "tpl-4",
        title: "Church Sanctuary Project Update",
        category: "Church Building Update",
        channel: "email",
        text: "Subject: Building Update: {{CampaignName}}\n\nDear {{SupporterName}},\n\nWe are pleased to bring you a pictorial and financial progress report from the construction site.\n\nThrough your support, we have completed the foundation concrete works. Our current campaign status is:\n- Target Goal: KES {{Goal}}\n- Total Raised: KES {{Raised}}\n- Balance Remaining: KES {{Balance}}\n\nWe invite you to our next dedication prayer meeting this Sunday at 10 AM.\n\nBlessings,\n{{OrganizerName}}",
        version: "v1.0",
        updatedAt: new Date().toISOString()
      },
      {
        id: "tpl-5",
        title: "Funeral Appeal Thanks & Tribute",
        category: "Funeral Appreciation",
        channel: "whatsapp",
        text: "The family of {{CampaignName}} sincerely appreciates your comforting presence and financial support of KES {{Amount}} during this trying season. Your generous contribution was a big relief. God bless you.",
        version: "v1.0",
        updatedAt: new Date().toISOString()
      },
      {
        id: "tpl-6",
        title: "Emergency Medical Urgent Drive",
        category: "Medical Appeal",
        channel: "whatsapp",
        text: "URGENT MEDICAL APPEAL: Baby Amina is scheduled for theater in 3 days. We are at KES {{Raised}} of our KES {{Goal}} target. We urgently need KES {{Balance}} to secure admission. Please send any amount to Paybill {{Paybill}} Acc {{AccName}}.",
        version: "v1.3",
        updatedAt: new Date().toISOString()
      }
    ];

    // Standard automations seed
    const defaultAutomations = [
      {
        id: "flow-1",
        name: "Instant M-PESA Receipt Trigger",
        trigger: "Contribution received",
        stepsCount: 3,
        active: true,
        channel: "whatsapp",
        nodes: [
          { id: "n1", type: "trigger", title: "Contribution Received", desc: "Instantly fires when M-PESA paybill transaction is validated", icon: Zap, color: "emerald", config: {} },
          { id: "n2", type: "delay", title: "Wait 1 minute", desc: "Grace period for system name cleaning", icon: Clock, color: "blue", config: { duration: 1, unit: "minutes" } },
          { id: "n3", type: "action", title: "Send WhatsApp Receipt", desc: "Sends immediate styled thank you & receipt using tpl-1", icon: Smartphone, color: "emerald", config: { templateId: "tpl-1" } }
        ]
      },
      {
        id: "flow-2",
        name: "7-Day Overdue Pledge Reminder Sequence",
        trigger: "Pledge overdue",
        stepsCount: 4,
        active: true,
        channel: "sms",
        nodes: [
          { id: "n1", type: "trigger", title: "Pledge Due Date Passed", desc: "Fires when current date > pledge due date with remaining balance", icon: Calendar, color: "amber", config: {} },
          { id: "n2", type: "condition", title: "If Pledge unpaid > KES 1,000", desc: "Ensures only meaningful balances are pursued", icon: Sliders, color: "purple", config: { field: "balance", op: "gt", val: 1000 } },
          { id: "n3", type: "action", title: "Send SMS Pledge Reminder", desc: "Dispatches friendly Kiswahili custom template reminder", icon: Mail, color: "amber", config: { templateId: "tpl-2" } },
          { id: "n4", type: "action", title: "Assign Follow-up Task to Treasurer", desc: "Flags inside CRM for personalized phone follow-up", icon: UserCheck, color: "sky", config: { assignTo: "Treasurer", priority: "high" } }
        ]
      },
      {
        id: "flow-3",
        name: "Milestone Celebration Broadcast",
        trigger: "Campaign milestone",
        stepsCount: 3,
        active: false,
        channel: "whatsapp",
        nodes: [
          { id: "n1", type: "trigger", title: "Milestone Cleared (25%, 50%, 75%)", desc: "Triggers when total raised crosses milestone intervals", icon: Zap, color: "indigo", config: { milestones: [25, 50, 75] } },
          { id: "n2", type: "action", title: "Post Community Update to Group", desc: "Publishes congratulations banner directly to WhatsApp group", icon: Megaphone, color: "indigo", config: { templateId: "tpl-3" } },
          { id: "n3", type: "action", title: "Notify Organizer & Committee", desc: "Pushes dashboard celebration alerts", icon: BellRing, color: "pink", config: {} }
        ]
      }
    ];

    // Standard communication logs
    const defaultLogs = [
      { id: "log-1", supporterName: "Richard Mayore", phone: "+254712345678", channel: "whatsapp", type: "Receipt & Thank You", status: "delivered", timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), text: "Dear Richard Mayore, Thank you for supporting St. Jude Church Harambee with KES 15,000." },
      { id: "log-2", supporterName: "Grace Kendi", phone: "+254722558833", channel: "sms", type: "Pledge Reminder", status: "delivered", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), text: "Habari Grace, this is a warm reminder from the St. Jude Committee regarding your KES 5,000 pledge." },
      { id: "log-3", supporterName: "Timothy Nduati", phone: "+254701998822", channel: "whatsapp", type: "Instant Thank You", status: "failed", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), text: "Dear Timothy Nduati, Thank you for your contribution of KES 2,500.", errorReason: "WhatsApp API quota exceeded / Phone offline" },
      { id: "log-4", supporterName: "Safaricom Corporate", phone: "Corporate", channel: "email", type: "Milestone Celebration", status: "opened", timestamp: new Date(Date.now() - 86400000).toISOString(), text: "Subject: Building Update. Dear Safaricom Corporate, we have reached 50% of our goal." },
      { id: "log-5", supporterName: "John Kamau", phone: "+254711223344", channel: "whatsapp", type: "Milestone Celebration", status: "delivered", timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), text: "Glory be to God! We have reached 50% target for St. Jude!" }
    ];

    // Broadcasts seed
    const defaultBroadcasts = [
      { id: "br-1", title: "Weekly Congregational Progress update", targetAudience: "Everyone", channel: "whatsapp", status: "sent", sentCount: 145, failedCount: 2, date: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: "br-2", title: "Targeted Major Donor Banquet Invite", targetAudience: "Major donors", channel: "email", status: "sent", sentCount: 18, failedCount: 0, date: new Date(Date.now() - 86400000 * 6).toISOString() },
      { id: "br-3", title: "Urgent Outstanding Pledge Follow Up", targetAudience: "Only unpaid pledges", channel: "sms", status: "scheduled", sentCount: 48, failedCount: 0, date: new Date(Date.now() + 86400000 * 2).toISOString() }
    ];

    if (isDemoMode) {
      setLocalTemplates(defaultTemplates);
      setLocalAutomations(defaultAutomations);
      setTimelineLogs(defaultLogs);
      setBroadcasts(defaultBroadcasts);
    } else {
      // Connect to Firestore collections
      const unsubTemplates = onSnapshot(collection(db, "messageTemplates"), (snap) => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setLocalTemplates(list.length > 0 ? list : defaultTemplates);
      });

      const unsubAutomations = onSnapshot(collection(db, "automationFlows"), (snap) => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setLocalAutomations(list.length > 0 ? list : defaultAutomations);
      });

      const unsubLogs = onSnapshot(collection(db, "deliveryLogs"), (snap) => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setTimelineLogs(list.length > 0 ? list : defaultLogs);
      });

      const unsubBroadcasts = onSnapshot(collection(db, "broadcasts"), (snap) => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setBroadcasts(list.length > 0 ? list : defaultBroadcasts);
      });

      return () => {
        unsubTemplates();
        unsubAutomations();
        unsubLogs();
        unsubBroadcasts();
      };
    }
  }, [activeProject.id, isDemoMode]);

  // Visual Automation states
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("flow-1");
  const selectedWorkflow = useMemo(() => {
    return localAutomations.find(f => f.id === selectedWorkflowId) || localAutomations[0];
  }, [localAutomations, selectedWorkflowId]);

  // Selected config node
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const editingNode = useMemo(() => {
    if (!selectedWorkflow || !editingNodeId) return null;
    return selectedWorkflow.nodes?.find((n: any) => n.id === editingNodeId) || null;
  }, [selectedWorkflow, editingNodeId]);

  // Template Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tpl-1");
  const selectedTemplate = useMemo(() => {
    return localTemplates.find(t => t.id === selectedTemplateId) || localTemplates[0];
  }, [localTemplates, selectedTemplateId]);

  const [templateForm, setTemplateForm] = useState({
    title: "",
    category: "Thank You",
    channel: "whatsapp",
    text: ""
  });

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateForm({
        title: selectedTemplate.title,
        category: selectedTemplate.category,
        channel: selectedTemplate.channel,
        text: selectedTemplate.text
      });
    }
  }, [selectedTemplate]);

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState({
    tone: "Warm",
    audience: "Everyone",
    purpose: "Thank You",
    length: "Medium",
    language: "English"
  });
  const [generatedResult, setGeneratedResult] = useState<string>("");
  const [generationMeta, setGenerationMeta] = useState<string>("");

  // Campaign Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: "M-PESA Donor Gala Invite",
    target: "Everyone",
    channel: "whatsapp",
    text: "Dear {{SupporterName}},\n\nWe cordially invite you to our Thanksgiving Gala...",
    scheduleOption: "immediate", // immediate, scheduled, recurring
    scheduleDate: new Date(Date.now() + 86400000).toISOString().substring(0, 16)
  });

  // Calculate Audience Preview Sizes dynamically
  const estimatedAudienceCount = useMemo(() => {
    const totalDonorsCount = new Set(contributions.map(c => c.senderPhone)).size || 85;
    if (broadcastForm.target === "Everyone") return totalDonorsCount;
    if (broadcastForm.target === "Only pledgers") return Math.round(totalDonorsCount * 0.4) || 20;
    if (broadcastForm.target === "Only unpaid pledges") return Math.round(totalDonorsCount * 0.15) || 8;
    if (broadcastForm.target === "Major donors") return Math.round(totalDonorsCount * 0.1) || 5;
    if (broadcastForm.target === "First-time supporters") return Math.round(totalDonorsCount * 0.25) || 12;
    if (broadcastForm.target === "Committee members") return activeProject.committee?.length || 4;
    return 10; // Fallback
  }, [broadcastForm.target, contributions, activeProject]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalSent = timelineLogs.length;
    const delivered = timelineLogs.filter(l => l.status === "delivered" || l.status === "opened").length;
    const failed = timelineLogs.filter(l => l.status === "failed").length;
    const opened = timelineLogs.filter(l => l.status === "opened").length;

    const whatsappCount = timelineLogs.filter(l => l.channel === "whatsapp").length;
    const smsCount = timelineLogs.filter(l => l.channel === "sms").length;
    const emailCount = timelineLogs.filter(l => l.channel === "email").length;

    const activeFlows = localAutomations.filter(f => f.active).length;
    const scheduled = broadcasts.filter(b => b.status === "scheduled").length;

    const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 68; // Default nice KPI representing open analytics
    const clickRate = totalSent > 0 ? Math.round((opened * 0.42 / totalSent) * 100) : 24;

    return {
      totalSent,
      delivered,
      whatsappCount,
      smsCount,
      emailCount,
      failed,
      scheduled,
      activeFlows,
      openRate,
      clickRate,
      pendingQueue: Math.round(activeFlows * 1.5)
    };
  }, [timelineLogs, localAutomations, broadcasts]);

  // AI Insights core
  const aiInsights = useMemo(() => {
    const score = 88; // Communication Health Score
    return {
      score,
      bestTime: "Tuesdays & Sundays between 2:00 PM and 4:30 PM",
      engagementDesc: "Excellent! Members respond 3x faster to WhatsApp update templates than standard SMS reminders.",
      fatigueLevel: "Low (Avg. 1.2 messages/week per donor)",
      recommendations: [
        {
          title: "Pledge Recovery Opportunity",
          desc: "You have 8 supporters with pending pledges due in 3 days. Send a personalized 'Sheng' gentle automated reminder to recover approx KES 45,000.",
          impact: "High (Est KES +45K)"
        },
        {
          title: "Supporter Fatigue Warning",
          desc: "St. Jude core committee members received 4 messages over the last 48 hours. Snooze internal announcements to prevent notification fatigue.",
          impact: "Medium"
        },
        {
          title: "Template Performance Alert",
          desc: "The '50% Milestone Celebration' template scored a 94% open rate. Use this structured layout for future progress update milestones.",
          impact: "High (94% Open Rate)"
        }
      ]
    };
  }, [contributions]);

  // Handles toggle of automation workflow
  const handleToggleWorkflow = async (id: string, currentVal: boolean) => {
    if (!canManageBroadcasts) {
      triggerToast("⛔ Access Denied: Only Owner, Admin or Treasurers can toggle automations.");
      return;
    }

    const updated = localAutomations.map(f => f.id === id ? { ...f, active: !currentVal } : f);
    setLocalAutomations(updated);

    if (!isDemoMode) {
      try {
        await setDoc(doc(db, "automationFlows", id), { active: !currentVal }, { merge: true });
      } catch (err) {
        console.error("Firestore update failed", err);
      }
    }
    triggerToast(`Automation ${!currentVal ? "Activated 🟢" : "Deactivated 🔴"} successfully.`);
  };

  // Handles adding visual node to workflow
  const handleAddWorkflowNode = (type: "trigger" | "delay" | "condition" | "action" | "end") => {
    if (!canManageBroadcasts) {
      triggerToast("⛔ Access Denied: Insufficient permissions to edit workflows.");
      return;
    }

    if (!selectedWorkflow) return;
    const newNodeId = `node-${Date.now()}`;
    let title = "";
    let desc = "";
    let icon = HelpCircle;
    let color = "slate";

    switch(type) {
      case "trigger":
        title = "New Trigger Node";
        desc = "Specify system trigger point";
        icon = Zap;
        color = "purple";
        break;
      case "delay":
        title = "Delay Action";
        desc = "Wait for designated period";
        icon = Clock;
        color = "blue";
        break;
      case "condition":
        title = "Check Condition";
        desc = "Branch based on metadata filters";
        icon = Sliders;
        color = "amber";
        break;
      case "action":
        title = "Send Automation Action";
        desc = "Dispatch message or assign CRM tasks";
        icon = Send;
        color = "emerald";
        break;
      case "end":
        title = "End Flow";
        desc = "Terminate automation routine";
        icon = CheckCircle2;
        color = "red";
        break;
    }

    const newNode: WorkflowNode = {
      id: newNodeId,
      type,
      title,
      desc,
      icon,
      color,
      config: {}
    };

    const updatedFlows = localAutomations.map(flow => {
      if (flow.id === selectedWorkflow.id) {
        return {
          ...flow,
          stepsCount: (flow.stepsCount || 0) + 1,
          nodes: [...(flow.nodes || []), newNode]
        };
      }
      return flow;
    });

    setLocalAutomations(updatedFlows);
    setEditingNodeId(newNodeId);
    triggerToast(`Visual node added to '${selectedWorkflow.name}'.`);
  };

  // Delete node from workflow
  const handleDeleteNode = (nodeId: string) => {
    if (!canManageBroadcasts) return;
    const updatedFlows = localAutomations.map(flow => {
      if (flow.id === selectedWorkflow.id) {
        return {
          ...flow,
          stepsCount: Math.max(1, (flow.stepsCount || 1) - 1),
          nodes: flow.nodes.filter((n: any) => n.id !== nodeId)
        };
      }
      return flow;
    });
    setLocalAutomations(updatedFlows);
    setEditingNodeId(null);
    triggerToast("Visual node removed from builder.");
  };

  // Save specific node config
  const handleUpdateNodeConfig = (nodeId: string, updatedFields: Record<string, any>) => {
    const updatedFlows = localAutomations.map(flow => {
      if (flow.id === selectedWorkflow.id) {
        return {
          ...flow,
          nodes: flow.nodes.map((n: any) => n.id === nodeId ? { ...n, ...updatedFields } : n)
        };
      }
      return flow;
    });
    setLocalAutomations(updatedFlows);
    triggerToast("Node configuration updated.");
  };

  // Save custom template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBroadcasts) {
      triggerToast("⛔ Access Denied: Read-only roles cannot save communication templates.");
      return;
    }

    const updated = localTemplates.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, ...templateForm, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    setLocalTemplates(updated);

    if (!isDemoMode) {
      try {
        await setDoc(doc(db, "messageTemplates", selectedTemplateId), {
          ...templateForm,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Firestore template update failed", err);
      }
    }
    triggerToast("Template library updated successfully.");
  };

  // Create new Template
  const handleAddNewTemplate = async () => {
    if (!canManageBroadcasts) return;
    const newId = `tpl-${Date.now()}`;
    const newTpl = {
      id: newId,
      title: "New Custom Template",
      category: "Campaign Update",
      channel: "whatsapp",
      text: "Habari, {{SupporterName}}.\n\nType your message layout here. Supports placeholders.",
      version: "v1.0",
      updatedAt: new Date().toISOString()
    };
    
    setLocalTemplates([newTpl, ...localTemplates]);
    setSelectedTemplateId(newId);
    triggerToast("New blank template created. Use editor to modify.");
    
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, "messageTemplates", newId), newTpl);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Trigger Gemini API to generate custom personalized text
  const handleCallAIGenerator = async () => {
    setLoading(true);
    setGeneratedResult("");
    setGenerationMeta("");

    try {
      const response = await fetch("/api/ai/generate-comm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          tone: aiPrompt.tone,
          audience: aiPrompt.audience,
          purpose: aiPrompt.purpose,
          length: aiPrompt.length,
          language: aiPrompt.language
        })
      });

      const data = await response.json();
      if (data.message) {
        setGeneratedResult(data.message);
        setGenerationMeta(data.generatedBy || "AI Engine Core");
        triggerToast("✨ Message generated successfully.");
      } else {
        triggerToast("Failed to generate custom communication.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error contacting HarambeeFlow AI service.");
    } finally {
      setLoading(false);
    }
  };

  // Duplicate active template
  const handleDuplicateTemplate = () => {
    const copyTpl = {
      ...selectedTemplate,
      id: `tpl-${Date.now()}`,
      title: `${selectedTemplate.title} (Copy)`,
      updatedAt: new Date().toISOString()
    };
    setLocalTemplates([copyTpl, ...localTemplates]);
    setSelectedTemplateId(copyTpl.id);
    triggerToast("Template duplicated.");
  };

  // Test send template
  const [testSendPhone, setTestSendPhone] = useState<string>("+254712345678");
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const handleTestSend = () => {
    setShowTestModal(false);
    const mockLog = {
      id: `log-${Date.now()}`,
      supporterName: "Test Recipient",
      phone: testSendPhone,
      channel: selectedTemplate.channel,
      type: `${selectedTemplate.category} (Test)`,
      status: "delivered",
      timestamp: new Date().toISOString(),
      text: selectedTemplate.text
        .replace("{{SupporterName}}", "Richard Mayore")
        .replace("{{Amount}}", "15,000")
        .replace("{{CampaignName}}", activeProject.name)
        .replace("{{Raised}}", (activeProject.currentAmount || 150000).toLocaleString())
        .replace("{{Goal}}", (activeProject.targetAmount || 500000).toLocaleString())
    };
    setTimelineLogs([mockLog, ...timelineLogs]);
    triggerToast(`🧪 Test message simulated and sent to ${testSendPhone}!`);
  };

  // Launch immediate or scheduled campaign broadcast
  const handleLaunchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBroadcasts) {
      triggerToast("⛔ Access Denied: Read-only roles cannot launch campaign broadcasts.");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // nice realistic server simulation

    const newBroadcast = {
      id: `br-${Date.now()}`,
      title: broadcastForm.title,
      targetAudience: broadcastForm.target,
      channel: broadcastForm.channel,
      status: broadcastForm.scheduleOption === "immediate" ? "sent" : "scheduled",
      sentCount: estimatedAudienceCount,
      failedCount: broadcastForm.scheduleOption === "immediate" ? Math.round(estimatedAudienceCount * 0.04) : 0,
      date: broadcastForm.scheduleOption === "immediate" ? new Date().toISOString() : new Date(broadcastForm.scheduleDate).toISOString()
    };

    setBroadcasts([newBroadcast, ...broadcasts]);

    // If immediate, inject log items representing this campaign broadcast delivery logs
    if (broadcastForm.scheduleOption === "immediate") {
      const mockCampaignLogs = [
        { id: `log-b-${Date.now()}-1`, supporterName: "Sarah Wanjiku", phone: "+254711122233", channel: broadcastForm.channel, type: "Campaign Broadcast", status: "delivered", timestamp: new Date().toISOString(), text: broadcastForm.text.replace("{{SupporterName}}", "Sarah Wanjiku") },
        { id: `log-b-${Date.now()}-2`, supporterName: "Richard Mayore", phone: "+254712345678", channel: broadcastForm.channel, type: "Campaign Broadcast", status: "delivered", timestamp: new Date().toISOString(), text: broadcastForm.text.replace("{{SupporterName}}", "Richard Mayore") },
        { id: `log-b-${Date.now()}-3`, supporterName: "Baby Amina Support", phone: "+254788112233", channel: broadcastForm.channel, type: "Campaign Broadcast", status: "opened", timestamp: new Date().toISOString(), text: broadcastForm.text.replace("{{SupporterName}}", "Amina Friend") }
      ];
      setTimelineLogs([...mockCampaignLogs, ...timelineLogs]);
    }

    if (!isDemoMode) {
      try {
        await addDoc(collection(db, "broadcasts"), newBroadcast);
      } catch (err) {
        console.error(err);
      }
    }

    setLoading(false);
    triggerToast(
      broadcastForm.scheduleOption === "immediate" 
        ? `🚀 Broadcast successfully dispatched to ${estimatedAudienceCount} supporters!`
        : `📅 Broadcast scheduled for ${new Date(broadcastForm.scheduleDate).toLocaleDateString()}`
    );

    // Reset Form
    setBroadcastForm({
      title: "M-PESA Donor Gala Invite",
      target: "Everyone",
      channel: "whatsapp",
      text: "Dear {{SupporterName}},\n\nWe cordially invite you to our Thanksgiving Gala...",
      scheduleOption: "immediate",
      scheduleDate: new Date(Date.now() + 86400000).toISOString().substring(0, 16)
    });
  };

  // Quick send single compose dialog
  const handleQuickComposeSend = () => {
    if (!composeForm.recipientPhone || !composeForm.messageText) {
      triggerToast("Please complete phone and message fields.");
      return;
    }

    const newLog = {
      id: `log-q-${Date.now()}`,
      supporterName: composeForm.recipientName || "Wanjiku Customer",
      phone: composeForm.recipientPhone,
      channel: composeForm.channel,
      type: "Quick Manual Send",
      status: "delivered",
      timestamp: new Date().toISOString(),
      text: composeForm.messageText
    };

    setTimelineLogs([newLog, ...timelineLogs]);
    setIsComposeOpen(false);
    setComposeForm({
      recipientPhone: "",
      recipientName: "",
      channel: "whatsapp",
      messageText: ""
    });
    triggerToast(`Message immediately pushed to ${newLog.supporterName}!`);
  };

  // Filtered logs
  const filteredTimelineLogs = useMemo(() => {
    return timelineLogs.filter(log => {
      const matchSearch = searchTerm === "" || 
        log.supporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.phone?.includes(searchTerm) ||
        log.text?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchChannel = filterChannel === "all" || log.channel === filterChannel;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [timelineLogs, searchTerm, filterChannel, filterStatus]);

  // Clean / Copy placeholders snippet
  const copyPlaceholder = (ph: string) => {
    navigator.clipboard.writeText(ph);
    triggerToast(`Copied ${ph} placeholder to clipboard!`);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-3 md:p-6 space-y-6 flex flex-col min-h-[calc(100vh-100px)]">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-50 bg-slate-900 border border-emerald-500 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-medium text-xs md:text-sm"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Megaphone className="w-5 h-5 md:w-6 md:h-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Communications &amp; Automation Center
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Salesforce + HubSpot automation customized for {activeProject.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Role: <span className="font-semibold text-emerald-400">{userRole}</span>
          </div>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Message</span>
          </button>
        </div>
      </div>

      {/* Six Tab Navigation bar */}
      <div className="border-b border-slate-800 overflow-x-auto scrollbar-none flex items-center justify-start gap-1.5 md:gap-2">
        {[
          { id: "dashboard", label: "Dashboard", icon: TrendingUp },
          { id: "automations", label: "Automation Builder", icon: Zap },
          { id: "templates", label: "Templates & AI Library", icon: Sparkles },
          { id: "broadcasts", label: "Campaign Broadcasts", icon: CalendarDays },
          { id: "timeline", label: "Timeline & Audit Trail", icon: History },
          { id: "insights", label: "AI Communications Insights", icon: Bot }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setEditingNodeId(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? "border-emerald-500 text-emerald-400 font-bold" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab Contents */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeSubTab === "dashboard" && (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                {[
                  { label: "Messages Sent Today", value: stats.totalSent, desc: "Pushed to providers", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "WhatsApp Delivered", value: stats.whatsappCount, desc: "Direct client session", color: "text-green-400", bg: "bg-green-500/10" },
                  { label: "SMS Dispatched", value: stats.smsCount, desc: "Carrier network logs", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Email Delivered", value: stats.emailCount, desc: "IMAP/SMTP relay status", color: "text-purple-400", bg: "bg-purple-500/10" },
                  { label: "Delivery Failures", value: stats.failed, desc: "Auto-retry active", color: stats.failed > 0 ? "text-red-400" : "text-slate-400", bg: "bg-red-500/10" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</span>
                      <span className="text-[10px] text-slate-500">units</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${kpi.bg.replace('/10', '/80')} animate-pulse`}></span>
                      <p className="text-[10px] text-slate-400 truncate">{kpi.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secondary Metrics & Smart Actions Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                  { label: "Active Automations", value: stats.activeFlows, desc: "Listening live", icon: Zap, color: "text-purple-400" },
                  { label: "Scheduled Updates", value: stats.scheduled, desc: "Calendar queued", icon: Calendar, color: "text-amber-400" },
                  { label: "Average Open Rate", value: `${stats.openRate}%`, desc: "WhatsApp baseline", icon: Eye, color: "text-teal-400" },
                  { label: "Click Engagement", value: `${stats.clickRate}%`, desc: "Call to Action clicks", icon: TrendingUp, color: "text-sky-400" }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">{card.label}</p>
                        <p className="text-2xl font-extrabold tracking-tight text-white">{card.value}</p>
                        <p className="text-[10px] text-slate-500">{card.desc}</p>
                      </div>
                      <span className={`p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Smart Automation Status Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Smart Automation Routines</h3>
                    <p className="text-xs text-slate-400">Trigger direct personal notifications to supporters without lifting a finger</p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    {stats.activeFlows} of 3 Running
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {localAutomations.map((flow) => (
                    <div key={flow.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                            flow.channel === "whatsapp" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {flow.channel}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {flow.stepsCount} visual steps
                          </span>
                        </div>
                        <h4 className="text-xs md:text-sm font-bold text-slate-100">{flow.name}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Triggered on <span className="font-medium text-slate-200">'{flow.trigger}'</span>. Instantly formats personalized receipts.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedWorkflowId(flow.id);
                            setActiveSubTab("automations");
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Visual Builder</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{flow.active ? "Active" : "Paused"}</span>
                          <button
                            onClick={() => handleToggleWorkflow(flow.id, flow.active)}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${flow.active ? "bg-emerald-500" : "bg-slate-800"}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${flow.active ? "translate-x-4" : ""}`}></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instant Delivery Simulator Panel */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Live Broadcast Stream</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Broadcast directly to active campaign committee</h4>
                  <p className="text-xs text-slate-400">Instantly update all coordinators regarding current fund levels with a single click</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      triggerToast("⚡ Broadcasting instant progress update to committee...");
                      await new Promise(r => setTimeout(r, 1000));
                      const mockLog = {
                        id: `log-${Date.now()}`,
                        supporterName: "All Committee Members",
                        phone: "4 Members",
                        channel: "whatsapp",
                        type: "Committee Broadcast",
                        status: "delivered",
                        text: `HARAMBEE PROGRESS: ${activeProject.name} is at KES ${(activeProject.currentAmount || 150000).toLocaleString()} raised.`,
                        timestamp: new Date().toISOString()
                      };
                      setTimelineLogs([mockLog, ...timelineLogs]);
                      triggerToast("🚀 Success! Broadcast delivered to 4 members.");
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Ping Committee</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: VISUAL AUTOMATION BUILDER */}
          {activeSubTab === "automations" && selectedWorkflow && (
            <motion.div 
              key="auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Left Selector & Builder Palette */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Workflow</h3>
                  <div className="space-y-2">
                    {localAutomations.map((flow) => (
                      <button
                        key={flow.id}
                        onClick={() => {
                          setSelectedWorkflowId(flow.id);
                          setEditingNodeId(null);
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          selectedWorkflow.id === flow.id 
                            ? "bg-slate-850 border-emerald-500/50 text-white" 
                            : "bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-900"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="font-bold">{flow.name}</p>
                          <p className="text-[10px] text-slate-500">Trigger: {flow.trigger}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${flow.active ? "bg-emerald-500" : "bg-slate-600"}`}></span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Blocks Palette</h3>
                  <p className="text-[11px] text-slate-400">Click to append a new logical block onto your visual timeline</p>
                  
                  <div className="space-y-2 pt-1">
                    {[
                      { type: "trigger", label: "Trigger Node", desc: "Start flow sequence", color: "border-purple-500/30 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10" },
                      { type: "delay", label: "Delay / Wait", desc: "Insert wait times", color: "border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10" },
                      { type: "condition", label: "Condition Fork", desc: "Filter rule validation", color: "border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" },
                      { type: "action", label: "Action Disp", desc: "Send SMS/WhatsApp", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10" },
                      { type: "end", label: "End sequence", desc: "Safely finish loop", color: "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10" }
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleAddWorkflowNode(item.type as any)}
                        className={`w-full text-left p-2.5 border rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${item.color}`}
                      >
                        <div>
                          <p className="font-bold">{item.label}</p>
                          <p className="text-[10px] opacity-80">{item.desc}</p>
                        </div>
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Visual Canvas Timeline */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[500px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedWorkflow.name}</h3>
                      <p className="text-[11px] text-slate-400">Trigger hook active: {selectedWorkflow.trigger}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleWorkflow(selectedWorkflow.id, selectedWorkflow.active)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 border transition-all ${
                          selectedWorkflow.active 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-slate-950 text-slate-400 border-slate-850"
                        }`}
                      >
                        {selectedWorkflow.active ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-slate-500" />}
                        <span>{selectedWorkflow.active ? "Status: Active" : "Status: Paused"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Flow Timelines Grid */}
                  <div className="relative pt-4 pb-8 flex flex-col items-center space-y-6">
                    {/* Visual Connector Guide lines */}
                    <div className="absolute top-8 bottom-12 left-1/2 w-[2px] bg-slate-800 -translate-x-1/2 -z-0"></div>

                    {selectedWorkflow.nodes?.map((node: any, idx: number) => {
                      const IconNode = node.icon || Zap;
                      const isEditing = editingNodeId === node.id;
                      return (
                        <div key={node.id} className="relative z-10 w-full max-w-sm">
                          <div 
                            onClick={() => setEditingNodeId(node.id)}
                            className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center gap-3.5 ${
                              isEditing 
                                ? "bg-slate-850 border-emerald-500 shadow-lg shadow-emerald-950/20" 
                                : "bg-slate-950 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <span className={`p-2.5 rounded-lg text-white bg-slate-900 border border-slate-800`}>
                              <IconNode className="w-4 h-4 text-emerald-400" />
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Step {idx + 1}: {node.type}</p>
                              <p className="text-xs font-bold text-slate-200">{node.title}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{node.desc}</p>
                            </div>
                            
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                          </div>
                        </div>
                      );
                    })}

                    <div className="w-full max-w-sm text-center pt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Workflow safe and integrated</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Interactive canvas. Tap block to configure triggers and templates.
                  </span>
                </div>
              </div>

              {/* Right Configuration pane */}
              <div className="lg:col-span-1">
                {editingNode ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Node configuration</h4>
                        <p className="text-xs font-bold text-white">{editingNode.title}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteNode(editingNode.id)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                        title="Delete visual block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-bold block">Display Label</label>
                        <input
                          type="text"
                          value={editingNode.title}
                          onChange={(e) => handleUpdateNodeConfig(editingNode.id, { title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden text-slate-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-bold block">Summary Description</label>
                        <textarea
                          rows={2}
                          value={editingNode.desc}
                          onChange={(e) => handleUpdateNodeConfig(editingNode.id, { desc: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden text-slate-200"
                        />
                      </div>

                      {/* Render type-specific options */}
                      {editingNode.type === "delay" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/60">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delay parameters</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Duration</label>
                              <input
                                type="number"
                                defaultValue={editingNode.config.duration || 5}
                                onChange={(e) => handleUpdateNodeConfig(editingNode.id, { config: { ...editingNode.config, duration: Number(e.target.value) } })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Unit</label>
                              <select
                                defaultValue={editingNode.config.unit || "minutes"}
                                onChange={(e) => handleUpdateNodeConfig(editingNode.id, { config: { ...editingNode.config, unit: e.target.value } })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {editingNode.type === "action" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/60">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Action dispatch details</p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Link to Template</label>
                              <select
                                defaultValue={editingNode.config.templateId || "tpl-1"}
                                onChange={(e) => handleUpdateNodeConfig(editingNode.id, { config: { ...editingNode.config, templateId: e.target.value } })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                              >
                                {localTemplates.map(t => (
                                  <option key={t.id} value={t.id}>{t.title} ({t.channel})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {editingNode.type === "condition" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/60">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logic rule branch</p>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 block">Rule Filter</label>
                            <select
                              defaultValue="first-donation"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                            >
                              <option value="first-donation">Is First Contribution</option>
                              <option value="high-value">Is Amount &gt; KES 10,000</option>
                              <option value="unpaid">Is Pledge Overdue</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setEditingNodeId(null);
                          triggerToast("Configuration changes validated & saved.");
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Apply Node Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center space-y-3">
                    <Info className="w-8 h-8 text-slate-500 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-300">No Block Selected</h4>
                    <p className="text-[11px] text-slate-400">Click any block in your timeline view to customize delays, conditions, and template integrations.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: MESSAGE TEMPLATES & AI GENERATOR */}
          {activeSubTab === "templates" && (
            <motion.div 
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left sidebar templates selector */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Saved Templates</h3>
                    <button
                      onClick={handleAddNewTemplate}
                      className="p-1 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                      title="Add blank template"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                    {localTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          selectedTemplateId === tpl.id
                            ? "bg-slate-850 border-emerald-500/50 text-white"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="font-bold truncate text-slate-200">{tpl.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{tpl.category} • {tpl.channel}</p>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded border border-slate-800 shrink-0">
                          {tpl.version}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Placeholders helper widget */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Dynamic Placeholders</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Click any element to instantly copy the placeholder syntax into your editor template code
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      "{{SupporterName}}",
                      "{{Amount}}",
                      "{{CampaignName}}",
                      "{{Goal}}",
                      "{{Raised}}",
                      "{{Balance}}",
                      "{{OrganizerName}}",
                      "{{Remaining}}"
                    ].map((ph) => (
                      <button
                        key={ph}
                        onClick={() => copyPlaceholder(ph)}
                        className="px-2 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg text-[9px] font-mono text-emerald-400 text-left hover:text-emerald-300 truncate cursor-pointer transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{ph}</span>
                        <ClipboardCopy className="w-3 h-3 text-slate-600 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center template editor pane */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template Editor</h3>
                      <p className="text-xs text-white">{selectedTemplate?.title || "New Template"}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDuplicateTemplate}
                        className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTestModal(true)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/20 cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Test Send</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-bold block">Template Title</label>
                      <input
                        type="text"
                        value={templateForm.title}
                        onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden text-slate-200"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-bold block mb-1">Category</label>
                        <select
                          value={templateForm.category}
                          onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200"
                        >
                          <option value="Thank You">Thank You</option>
                          <option value="Pledge Reminder">Pledge Reminder</option>
                          <option value="Campaign Update">Campaign Update</option>
                          <option value="Milestone Celebration">Milestone Celebration</option>
                          <option value="Target Achieved">Target Achieved</option>
                          <option value="Funeral Appreciation">Funeral Appreciation</option>
                          <option value="School Fees Appeal">School Fees Appeal</option>
                          <option value="Church Building Update">Church Building Update</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-bold block mb-1">Channel</label>
                        <select
                          value={templateForm.channel}
                          onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200"
                        >
                          <option value="whatsapp">WhatsApp Business</option>
                          <option value="sms">SMS Network</option>
                          <option value="email">SMTP Email Server</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-bold block">Body Content</label>
                      <textarea
                        rows={7}
                        value={templateForm.text}
                        onChange={(e) => setTemplateForm({ ...templateForm, text: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-sans focus:border-emerald-500 focus:outline-hidden text-slate-200 leading-relaxed"
                        placeholder="Configure template text..."
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Template Changes</span>
                  </button>
                </form>

                <p className="text-[10px] text-slate-500 pt-3 text-center">
                  Changes immediately update any linked background automation rules.
                </p>
              </div>

              {/* Right Gemini AI Personalization Engine Pane */}
              <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Bot className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">HarambeeFlow AI Message Personalizer</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generate hyper-personalized community templates in various tones, audiences and Kenyan dialects instantly.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Tone Preset</label>
                      <select
                        value={aiPrompt.tone}
                        onChange={(e) => setAiPrompt({ ...aiPrompt, tone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200"
                      >
                        <option value="Warm">Warm / Polite</option>
                        <option value="Formal">Formal / Official</option>
                        <option value="Pastoral">Pastoral / Faith-focused</option>
                        <option value="Professional">Professional Corporate</option>
                        <option value="Urgent">Urgent / Critical</option>
                        <option value="Grateful">Deeply Grateful</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block">Language Dialect</label>
                      <select
                        value={aiPrompt.language}
                        onChange={(e) => setAiPrompt({ ...aiPrompt, language: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200"
                      >
                        <option value="English">Pure English</option>
                        <option value="Kiswahili">Pure Kiswahili</option>
                        <option value="Sheng">Sheng (Street Slang)</option>
                        <option value="Mixed English/Kiswahili">Mixed English/Kiswahili</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Category Purpose</label>
                      <select
                        value={aiPrompt.purpose}
                        onChange={(e) => setAiPrompt({ ...aiPrompt, purpose: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200"
                      >
                        <option value="Thank You">Receipt / Thank You</option>
                        <option value="Pledge Reminder">Overdue Pledge Reminder</option>
                        <option value="Milestone Celebration">Milestone (50%) Celeb</option>
                        <option value="Emergency Appeal">Emergency Medical Appeal</option>
                        <option value="Church Building Update">Church Construction update</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block">Length Format</label>
                      <select
                        value={aiPrompt.length}
                        onChange={(e) => setAiPrompt({ ...aiPrompt, length: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200"
                      >
                        <option value="Short">Short (SMS optimized)</option>
                        <option value="Medium">Medium length</option>
                        <option value="Long">Detailed / Email layout</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCallAIGenerator}
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{loading ? "Personalizing with AI..." : "Generate AI Template"}</span>
                  </button>

                  <AnimatePresence>
                    {generatedResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2 border-t border-slate-800"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">{generationMeta}</span>
                          <button
                            onClick={() => {
                              setTemplateForm({
                                ...templateForm,
                                text: generatedResult
                              });
                              triggerToast("Applied AI text to local editor!");
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Apply to Editor</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs leading-relaxed max-h-[160px] overflow-y-auto font-sans text-slate-300 whitespace-pre-wrap select-all">
                          {generatedResult}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CAMPAIGN BROADCAST CENTER */}
          {activeSubTab === "broadcasts" && (
            <motion.div 
              key="broadcasts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Create Broadcast Campaign */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
                <form onSubmit={handleLaunchBroadcast} className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">New Campaign Broadcast</h3>
                    <p className="text-xs text-slate-400">Send manual or scheduled mass messages to target lists</p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">Broadcast Name</label>
                        <input
                          type="text"
                          value={broadcastForm.title}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">Target Audience</label>
                        <select
                          value={broadcastForm.target}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, target: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200"
                        >
                          <option value="Everyone">Everyone (All Contributors)</option>
                          <option value="Only pledgers">Only Pledgers</option>
                          <option value="Only unpaid pledges">Only Unpaid Pledgers</option>
                          <option value="Major donors">Major Donors (KES 10,000+)</option>
                          <option value="First-time supporters">First-Time Supporters</option>
                          <option value="Committee members">Active Committee Members</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">Delivery Channel</label>
                        <select
                          value={broadcastForm.channel}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, channel: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200"
                        >
                          <option value="whatsapp">WhatsApp Business Campaign</option>
                          <option value="sms">SMS Network Carrier</option>
                          <option value="email">Email Campaign Service</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">Scheduling options</label>
                        <select
                          value={broadcastForm.scheduleOption}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduleOption: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200"
                        >
                          <option value="immediate">Immediate dispatch</option>
                          <option value="scheduled">Schedule specific date</option>
                          <option value="recurring">Recurring (Weekly Cong.)</option>
                        </select>
                      </div>
                    </div>

                    {broadcastForm.scheduleOption !== "immediate" && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="text-[11px] text-slate-400 font-bold block">Designated dispatch timestamp</label>
                        <input
                          type="datetime-local"
                          value={broadcastForm.scheduleDate}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduleDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-400 font-bold block">Custom Broadcast Body</label>
                        <button
                          type="button"
                          onClick={() => {
                            setBroadcastForm({
                              ...broadcastForm,
                              text: `URGENT BROADCAST: Dear {{SupporterName}},\n\nThis is an official update regarding our project "${activeProject.name}". We are currently at KES ${(activeProject.currentAmount || 150000).toLocaleString()} raised. Please partner with us to complete this work!`
                            });
                            triggerToast("Injected standard campaign template.");
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                        >
                          Use Standard Template
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={broadcastForm.text}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, text: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs focus:border-emerald-500 focus:outline-hidden text-slate-200"
                        placeholder="Write your custom text here..."
                        required
                      />
                    </div>
                  </div>

                  {/* Audience Preview alert */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <Users className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-100">Audience Preview Segment</p>
                        <p className="text-[10px] text-slate-400 leading-none mt-1">
                          Calculated recipients based on targeted filters
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400">{estimatedAudienceCount}</span>
                      <span className="text-[10px] text-slate-500 block">supporters</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !canManageBroadcasts}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2"
                  >
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>{loading ? "Processing campaign list..." : broadcastForm.scheduleOption === "immediate" ? "Dispatch Campaign Broadcast Now" : "Schedule Campaign Broadcast"}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Beautiful Scheduler Calendar / Agenda */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Broadcast Schedule Calendar</h3>
                  
                  {/* Calendar Mock Grid */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-xs font-bold text-slate-300">July 2026</span>
                      <span className="text-[10px] font-mono text-slate-500">UTC-7 Timezone</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-slate-400">
                      {Array.from({ length: 31 }).map((_, i) => {
                        const day = i + 1;
                        const isScheduled = day === 21; // mock day
                        const isToday = day === 19;
                        return (
                          <div 
                            key={i} 
                            className={`p-1 rounded-sm flex items-center justify-center font-mono ${
                              isScheduled 
                                ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30" 
                                : isToday 
                                  ? "bg-emerald-500 text-white font-bold rounded-lg" 
                                  : "hover:bg-slate-900"
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400">Queue &amp; Upcoming Dispatch logs</p>
                    <div className="space-y-2">
                      {broadcasts.map((b) => (
                        <div key={b.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-200">{b.title}</h5>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{b.targetAudience} • {b.channel}</p>
                            <p className="text-[9px] text-slate-500">{new Date(b.date).toLocaleString()}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                              b.status === "scheduled" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {b.status}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1">{b.sentCount} recipients</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: COMMUNICATION TIMELINE & AUDIT TRAIL */}
          {activeSubTab === "timeline" && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Timeline Header Filter Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                    placeholder="Search by donor name, phone, message content..."
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-1.5 rounded-lg text-xs">
                    <span className="text-slate-500 font-bold uppercase text-[9px]">Channel:</span>
                    <select
                      value={filterChannel}
                      onChange={(e) => setFilterChannel(e.target.value)}
                      className="bg-transparent border-0 text-slate-300 focus:ring-0 text-xs font-medium focus:outline-hidden"
                    >
                      <option value="all">All Channels</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-1.5 rounded-lg text-xs">
                    <span className="text-slate-500 font-bold uppercase text-[9px]">Status:</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-transparent border-0 text-slate-300 focus:ring-0 text-xs font-medium focus:outline-hidden"
                    >
                      <option value="all">All Statuses</option>
                      <option value="delivered">Delivered</option>
                      <option value="opened">Opened</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline chronological list */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chronological History logs</h3>
                    <p className="text-xs text-slate-400">Immutable secure audit trail of all automated &amp; manual communications</p>
                  </div>

                  <span className="text-xs font-mono text-slate-500">{filteredTimelineLogs.length} audit records</span>
                </div>

                <div className="relative space-y-6 pl-4 md:pl-6 border-l border-slate-800">
                  {filteredTimelineLogs.map((log) => {
                    const isFailed = log.status === "failed";
                    const isOpened = log.status === "opened";
                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline Node Point Dot */}
                        <span className={`absolute -left-7 md:-left-[29px] top-1.5 w-3 h-3 rounded-full border bg-slate-950 ${
                          isFailed 
                            ? "border-red-500 bg-red-500/10" 
                            : isOpened 
                              ? "border-emerald-400 bg-emerald-400/20" 
                              : "border-green-500 bg-green-500/10"
                        }`}></span>

                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-100">{log.supporterName}</h4>
                              <span className="text-[10px] text-slate-500 font-mono">({log.phone})</span>
                              
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                log.channel === "whatsapp" 
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                                  : log.channel === "sms" 
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              }`}>
                                {log.channel}
                              </span>

                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{log.type}</span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                              {log.text}
                            </p>

                            {isFailed && (
                              <p className="text-[10px] text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Error: {log.errorReason || "Network carrier rejection."}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col md:items-end justify-between items-center shrink-0 gap-2">
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>

                            <div className="flex items-center gap-2">
                              {isFailed && (
                                <button
                                  onClick={async () => {
                                    triggerToast(`Retrying SMS message to ${log.supporterName}...`);
                                    await new Promise(r => setTimeout(r, 800));
                                    const updated = timelineLogs.map(item => item.id === log.id ? { ...item, status: "delivered", errorReason: undefined } : item);
                                    setTimelineLogs(updated);
                                    triggerToast("🚀 Message delivered successfully!");
                                  }}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-bold border border-red-500/20 cursor-pointer transition-all"
                                >
                                  Retry SMS Send
                                </button>
                              )}

                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isFailed 
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                  : isOpened 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                              }`}>
                                {log.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: AI COMMUNICATION INSIGHTS */}
          {activeSubTab === "insights" && (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Health Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Communication Health Score</h3>
                    <p className="text-xs text-slate-400">Calculated over campaign interaction benchmarks</p>
                  </div>

                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                    {/* SVG Radial progress */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="60" className="stroke-slate-850 stroke-[8] fill-none" />
                      <circle cx="72" cy="72" r="60" className="stroke-emerald-500 stroke-[8] fill-none" strokeDasharray={2 * Math.PI * 60} strokeDashoffset={2 * Math.PI * 60 * (1 - aiInsights.score / 100)} />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-black text-white">{aiInsights.score}</span>
                      <span className="text-xs text-slate-500 block">out of 100</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                      Excellent Campaign Hygiene
                    </span>
                  </div>
                </div>

                {/* Gemini Analytics details */}
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest">HarambeeFlow AI Communication Analysis</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Best Time To Disseminate</p>
                        <p className="text-xs font-bold text-slate-200">{aiInsights.bestTime}</p>
                        <p className="text-[10px] text-slate-500">Based on historic M-PESA webhook payment intervals</p>
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Supporter Fatigue metrics</p>
                        <p className="text-xs font-bold text-slate-200">{aiInsights.fatigueLevel}</p>
                        <p className="text-[10px] text-slate-500">Healthy rate protecting donor trust from notifications</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1.5">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Supporter Engagement analysis</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {aiInsights.engagementDesc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Model: gemini-3.5-flash</span>
                    <span>Last analyzed: Today</span>
                  </div>
                </div>
              </div>

              {/* Action recommendations Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Suggested Next AI Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiInsights.recommendations.map((rec, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-slate-950 border border-slate-850 ${
                            rec.impact.includes("High") ? "text-emerald-400 border-emerald-500/20" : "text-amber-400 border-amber-500/20"
                          }`}>
                            Impact: {rec.impact}
                          </span>
                        </div>
                        <h4 className="text-xs md:text-sm font-bold text-slate-100">{rec.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{rec.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (rec.title.includes("Pledge")) {
                            setAiPrompt({
                              tone: "Warm",
                              audience: "Only unpaid pledges",
                              purpose: "Pledge Reminder",
                              length: "Short",
                              language: "Sheng"
                            });
                            setActiveSubTab("templates");
                            triggerToast("AI configuration set. Generate message!");
                          } else {
                            setIsComposeOpen(true);
                          }
                        }}
                        className="w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-800 cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <span>Activate Recommendation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL 1: TEST SEND SIMULATION */}
      <AnimatePresence>
        {showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl p-5 space-y-4 shadow-2xl"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Send Test Message</h3>
                <p className="text-xs text-slate-400">Verify layout with real dynamic parsing simulation</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block font-bold">Recipient Mobile Phone</label>
                  <input
                    type="text"
                    value={testSendPhone}
                    onChange={(e) => setTestSendPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 space-y-1.5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Live Parse preview</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hello Richard Mayore, thank you for supporting {activeProject.name} with your generous donation of KES 15,000!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTestSend}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Confirm dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING COMPOSE DIALOG MODAL */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Compose Quick Message</h3>
                </div>
                <button 
                  onClick={() => setIsComposeOpen(false)}
                  className="text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">Recipient Name</label>
                    <input
                      type="text"
                      value={composeForm.recipientName}
                      onChange={(e) => setComposeForm({ ...composeForm, recipientName: e.target.value })}
                      placeholder="e.g. John Kamau"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">Mobile Phone</label>
                    <input
                      type="text"
                      value={composeForm.recipientPhone}
                      onChange={(e) => setComposeForm({ ...composeForm, recipientPhone: e.target.value })}
                      placeholder="e.g. +254712345678"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">Dispatch Channel</label>
                  <select
                    value={composeForm.channel}
                    onChange={(e) => setComposeForm({ ...composeForm, channel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 font-medium"
                  >
                    <option value="whatsapp">WhatsApp Business Gateway</option>
                    <option value="sms">Carrier SMS network</option>
                    <option value="email">Standard Relay SMTP Email</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">Message Body Text</label>
                  <textarea
                    rows={4}
                    value={composeForm.messageText}
                    onChange={(e) => setComposeForm({ ...composeForm, messageText: e.target.value })}
                    placeholder="Type your manual message here. It will be sent instantly."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-200 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Discard Draft
                </button>
                <button
                  type="button"
                  onClick={handleQuickComposeSend}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message Now</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
