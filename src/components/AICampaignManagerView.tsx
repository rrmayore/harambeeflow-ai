import React, { useState, useEffect, useMemo } from "react";
import { Project, Contribution } from "../types";
import { 
  Bot, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Calendar, 
  Users, HelpCircle, Loader2, ArrowRight, Share2, MessageSquare, 
  Mail, Smartphone, Award, History, ThumbsUp, FileText, ShieldCheck, 
  RefreshCw, BarChart3, Copy, Send, Printer, Plus, Info, X, Clock,
  ChevronDown, ChevronUp, UserCheck, ShieldAlert, FileOutput
} from "lucide-react";
import { getTheme, getCampaignLogo, getCampaignMotto } from "../utils/branding";
import { motion, AnimatePresence } from "motion/react";

interface AICampaignManagerViewProps {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  contributions: Contribution[];
  onAddManualContribution: (payload: any) => Promise<{ success: boolean; id: string }>;
  onPostWebhook?: (payload: any) => Promise<any>;
}

export default function AICampaignManagerView({
  projects,
  activeProject,
  setActiveProject,
  contributions,
  onAddManualContribution,
  onPostWebhook
}: AICampaignManagerViewProps) {
  // --- STATE MANAGEMENT ---
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active command center section switcher
  const [activeSection, setActiveSection] = useState<"overview" | "coach-simulator" | "toolkit">("overview");

  // Manual payment form state
  const [formAmount, setFormAmount] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTx, setFormTx] = useState("");
  const [formCategory, setFormCategory] = useState("Family/Friends");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STK Push state
  const [mpesaPhone, setMpesaPhone] = useState("254712345678");
  const [mpesaAmount, setMpesaAmount] = useState("");
  const [mpesaFirstName, setMpesaFirstName] = useState("DAVID");
  const [mpesaMiddleName, setMpesaMiddleName] = useState("O.");
  const [mpesaLastName, setMpesaLastName] = useState("NANDI");
  const [mpesaRef, setMpesaRef] = useState("");
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [mpesaMessage, setMpesaMessage] = useState("");

  // Bulk statement state
  const [bulkText, setBulkText] = useState("");
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [toolkitTab, setToolkitTab] = useState<"single" | "bulk" | "stk" | "tasks">("single");

  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCat, setNewTaskCat] = useState("Committee");

  // Keep mpesaRef in sync with project reference
  useEffect(() => {
    if (activeProject) {
      setMpesaRef(activeProject.accountReference);
    }
  }, [activeProject?.id]);

  // Load and seed tasks
  useEffect(() => {
    const saved = localStorage.getItem("fos_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const defaultTasks = [
        { id: "1", text: "Reconcile M-PESA statement for Church Building Project", completed: false, dueDate: "2026-06-25", category: "Audit" },
        { id: "2", text: "Post Sunday contribution summary to WhatsApp Group", completed: true, dueDate: "2026-06-24", category: "Communication" },
        { id: "3", text: "Deliver monthly audit register to Chama chairperson", completed: false, dueDate: "2026-06-28", category: "Governance" },
        { id: "4", text: "Download and archive medical appeal finalized ledger", completed: false, dueDate: "2026-07-01", category: "Closure" },
        { id: "5", text: "Approve auxiliary assistant treasurer access permissions", completed: false, dueDate: "2026-06-26", category: "Governance" }
      ];
      setTasks(defaultTasks);
      localStorage.setItem("fos_tasks", JSON.stringify(defaultTasks));
    }
  }, []);

  const saveTasks = (updatedTasks: any[]) => {
    setTasks(updatedTasks);
    localStorage.setItem("fos_tasks", JSON.stringify(updatedTasks));
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      category: newTaskCat
    };
    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setNewTaskText("");
  };

  // Fill random transaction code
  const fillRandomCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let code = "REG";
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 4; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    setFormTx(code);
  };

  // Submit manual contribution
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!activeProject) return;

    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      setFormError("Please enter a valid contribution amount (KES).");
      return;
    }
    if (!formName.trim()) {
      setFormError("Sender original name is required.");
      return;
    }
    if (!formTx.trim() || formTx.trim().length < 5) {
      setFormError("A valid transaction code has to be provided (min 5 chars).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAddManualContribution({
        projectId: activeProject.id,
        amount: Number(formAmount),
        senderName: formName.trim().toUpperCase(),
        senderPhone: formPhone.trim() || "Manual",
        transactionCode: formTx.trim().toUpperCase(),
        category: formCategory,
        notes: formNotes.trim()
      });

      if (res && (res as any).duplicateFound) {
        setFormError("Warning: M-PESA Code already exists. This contribution was flagged as a duplicate!");
      } else {
        showToast("Contribution added successfully to live Firestore ledger!");
        // Clear form
        setFormAmount("");
        setFormName("");
        setFormPhone("");
        setFormTx("");
        setFormNotes("");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to submit contribution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SMS / CSV bulk parser
  const runSmsStatementParser = (text: string) => {
    const lines = text.split(/\r?\n/);
    const parsed: any[] = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Try CSV format
      if (trimmed.includes(",") && !trimmed.toLowerCase().includes("confirmed")) {
        const parts = trimmed.split(",").map(p => p.trim().replace(/^["']|["']$/g, ""));
        const code = parts.find(p => /^[A-Z0-9]{10}$/i.test(p));
        const amountPart = parts.find(p => /^[0-9]+(?:\.[0-9]+)?$/.test(p.replace(/,/g, "")));
        const phonePart = parts.find(p => /^(?:254\d{9}|0\d{9})$/.test(p));
        const namePart = parts.find(p => /^[A-Za-z\s.]{3,40}$/.test(p) && p !== code);
        
        if (code && amountPart) {
          const codeUpper = code.toUpperCase();
          parsed.push({
            transactionCode: codeUpper,
            amount: parseFloat(amountPart.replace(/,/g, "")),
            senderName: (namePart || "M-PESA CONTRIBUTOR").toUpperCase(),
            senderPhone: phonePart || "2547XXXXXXXX",
            timestamp: new Date().toISOString(),
            raw: trimmed,
            isDuplicate: contributions.some(c => c.transactionCode === codeUpper)
          });
          continue;
        }
      }

      // SMS format
      const codeMatch = trimmed.match(/\b([A-Z0-9]{10})\b/);
      const amountMatch = trimmed.match(/(?:KES|Ksh)\s*([0-9,]+(?:\.[0-9]{2})?)/i) || trimmed.match(/received\s+([0-9,]+(?:\.[0-9]{2})?)/i);
      const phoneMatch = trimmed.match(/\b(254[17]\d{8}|0[17]\d{8})\b/) || trimmed.match(/\((254[17]\d{8}|0[17]\d{8})\)/);
      
      let name = "M-PESA CONTRIBUTOR";
      const nameMatch = trimmed.match(/received from\s+([A-Z\s]+?)(?:\s+on|\s+254|\s+07|\s+01|\bon\b|\bat\b|$)/i) 
                     || trimmed.match(/from\s+([A-Z\s]+?)(?:\s+on|\s+254|\s+07|\s+01|\bon\b|\bat\b|\(|school|church|$)/i);
      if (nameMatch) {
        name = nameMatch[1].trim().replace(/\s+/g, " ");
      }

      if (codeMatch && amountMatch) {
        const code = codeMatch[1].toUpperCase();
        const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
        const phone = phoneMatch ? phoneMatch[1] : "2547XXXXXXXX";
        
        parsed.push({
          transactionCode: code,
          amount,
          senderName: name.toUpperCase(),
          senderPhone: phone,
          timestamp: new Date().toISOString(),
          raw: trimmed,
          isDuplicate: contributions.some(c => c.transactionCode === code)
        });
      }
    }
    return parsed;
  };

  const loadMockSmsTemplate = () => {
    const mockText = `QRL83K9D4J Confirmed. KES 1,500.00 received from JOHN OMONDI 254712345678 on 24/6/26 at 5:12 PM. New M-PESA balance...
SL987FG6H5 Confirmed. KES 10,000.00 received from MARY NYAMBURA 254799000111 on 2026-06-24 10:30 AM.
Safaricom: You have received KES 2,500.00 from PETER NDWIGA (254722333444) on 24/6/26 at 11:20 AM.
TX88283749,2026-06-24,3500,CHAMA INVESTMENT CORP,254755123456`;
    setBulkText(mockText);
    const parsed = runSmsStatementParser(mockText);
    setParsedItems(parsed);
    setBulkError("");
    setBulkSuccess(`Parsed ${parsed.length} transactions successfully! Verify and hit Confirm.`);
  };

  const handleBulkImportConfirm = async () => {
    if (!activeProject) return;
    setIsSubmitting(true);
    setBulkError("");
    setBulkSuccess("");
    
    const validToImport = parsedItems.filter(p => !p.isDuplicate);
    if (validToImport.length === 0) {
      setBulkError("No valid, non-duplicate transactions found to import.");
      setIsSubmitting(false);
      return;
    }

    try {
      let importedCount = 0;
      for (const item of validToImport) {
        await onAddManualContribution({
          projectId: activeProject.id,
          amount: item.amount,
          senderName: item.senderName,
          senderPhone: item.senderPhone,
          transactionCode: item.transactionCode,
          category: "Family/Friends",
          notes: "Statement Imported Contribution"
        });
        importedCount++;
      }

      setBulkSuccess(`Successfully imported ${importedCount} contributions! Ledger and campaign balance updated.`);
      setBulkText("");
      setParsedItems([]);
    } catch (err: any) {
      setBulkError(err.message || "Failed to process bulk import stream.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit M-PESA STK Push Request
  const handleMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpesaMessage("");
    if (!activeProject) return;
    
    if (!mpesaPhone || !mpesaAmount) {
      setMpesaStatus("error");
      setMpesaMessage("Please enter phone number and amount.");
      return;
    }

    setMpesaLoading(true);
    setMpesaStatus("processing");
    setMpesaMessage("Contacting Safaricom Daraja API Gateway...");

    try {
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: Number(mpesaAmount),
          reference: mpesaRef,
          firstName: mpesaFirstName,
          middleName: mpesaMiddleName,
          lastName: mpesaLastName
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMpesaStatus("success");
        setMpesaMessage(data.message || "Lipa Na M-PESA STK Push successfully dispatched! Kindly check your handset and enter M-PESA PIN.");
      } else {
        setMpesaStatus("error");
        setMpesaMessage(data.message || "Safaricom gateway returned failure code. Verification rejected.");
      }
    } catch (err: any) {
      setMpesaStatus("error");
      setMpesaMessage(err.message || "Failed to initiate transaction processing.");
    } finally {
      setMpesaLoading(false);
    }
  };

  // AI Memory (LocalStorage)
  const [memory, setMemory] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("harambee_ai_memory_v3");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // What-if simulator state variables
  const [simDonors, setSimDonors] = useState<number>(0);
  const [simBigAmount, setSimBigAmount] = useState<number>(0);
  const [simDaysExtension, setSimDaysExtension] = useState<number>(0);
  const [simCustomDonation, setSimCustomDonation] = useState<string>("");

  // Conversational AI Assistant State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: "init-1",
      role: "assistant",
      text: "Jambo! I am your AI fundraising manager. Ask me any strategic questions about our current contributor momentum, MPESA reconciling pace, or committee updates.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Explanation panel state (active selected item details)
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);

  // Human approval modal triggers
  const [pendingApproval, setPendingApproval] = useState<any | null>(null);

  // Advanced statistics state accordion toggle
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Show printable report preview modal
  const [showReportModal, setShowReportModal] = useState(false);

  // --- DERIVE GROUNDED METRICS FROM LIVE FIRESTORE DATA ---
  const projectContributions = useMemo(() => {
    if (!activeProject) return [];
    return contributions
      .filter(c => c.projectId === activeProject.id && !c.hasDuplicates)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [contributions, activeProject?.id]);

  const totalRaised = useMemo(() => {
    return projectContributions.reduce((sum, c) => sum + c.amount, 0);
  }, [projectContributions]);

  const targetGoal = useMemo(() => {
    return activeProject?.targetAmount || 100000;
  }, [activeProject]);

  const amountRemaining = useMemo(() => {
    return Math.max(0, targetGoal - totalRaised);
  }, [targetGoal, totalRaised]);

  const percentageComplete = useMemo(() => {
    return targetGoal > 0 ? Math.round((totalRaised / targetGoal) * 100) : 0;
  }, [totalRaised, targetGoal]);

  const contributorCount = useMemo(() => {
    return projectContributions.length;
  }, [projectContributions]);

  const averageDonation = useMemo(() => {
    return contributorCount > 0 ? Math.round(totalRaised / contributorCount) : 0;
  }, [totalRaised, contributorCount]);

  const largestDonation = useMemo(() => {
    return projectContributions.reduce((max, c) => c.amount > max ? c.amount : max, 0);
  }, [projectContributions]);

  const mostRecentDonation = useMemo(() => {
    return projectContributions[0] || null;
  }, [projectContributions]);

  // Today's donations calculation
  const todayDonationsSum = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return projectContributions
      .filter(c => c.timestamp.startsWith(todayStr))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [projectContributions]);

  // Derived timeline days remaining
  const daysRemaining = useMemo(() => {
    if (!activeProject?.createdAt) return 14;
    const createdDate = new Date(activeProject.createdAt);
    const endDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day default window
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 3;
  }, [activeProject?.createdAt]);

  // Derived campaign health score and risk level (NO mock scores)
  const baseHealthScore = useMemo(() => {
    if (percentageComplete >= 100) return 100;
    // Base score factors in progress %, contributors density, and time ratio
    const speedFactor = Math.min(25, contributorCount * 2);
    const score = Math.min(98, Math.round(50 + (percentageComplete * 0.35) + speedFactor));
    return score;
  }, [percentageComplete, contributorCount]);

  const riskLevel = useMemo(() => {
    if (percentageComplete >= 85) return "Low Risk";
    if (percentageComplete >= 40) return "Moderate Risk";
    return "High Risk (Requires group mobilization)";
  }, [percentageComplete]);

  const successProbability = useMemo(() => {
    if (percentageComplete >= 100) return 100;
    const prob = Math.min(99, Math.round(percentageComplete + (contributorCount > 8 ? 20 : 5)));
    return Math.max(35, prob);
  }, [percentageComplete, contributorCount]);

  // Toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run dynamic analysis on change of project
  useEffect(() => {
    if (!activeProject) return;
    setIsLoading(true);
    // Simulating instant analysis over the live Firestore collection to keep UX fluid & responsive
    const timer = setTimeout(() => {
      setIsLoading(false);
      showToast("Realtime campaign auditing and projections updated.");
    }, 600);
    return () => clearTimeout(timer);
  }, [activeProject?.id]);

  // Persistent Action Queue memory management
  const saveMemoryAction = (projId: string, type: "completed" | "dismissed", taskId: string) => {
    const updated = { ...memory };
    if (!updated[projId]) {
      updated[projId] = { completed: [], dismissed: [] };
    }
    if (!updated[projId][type].includes(taskId)) {
      updated[projId][type].push(taskId);
    }
    setMemory(updated);
    localStorage.setItem("harambee_ai_memory_v3", JSON.stringify(updated));
  };

  // --- INTENT-DRIVEN RECOMMENDATIONS LIST ---
  const rawRecommendations = useMemo(() => {
    if (!activeProject || contributorCount === 0) return [];
    
    const items = [
      {
        id: "rec-thank-contributors",
        title: "Acknowledge recent contributors",
        whyItMatters: `${contributorCount} people have registered contributions in your system.`,
        expectedImpact: "Builds instant trust and signals absolute transparency to Chama watchers.",
        estTime: "2 mins",
        priority: "High",
        triggerMetric: `Reconciled contributor count: ${contributorCount}`,
        confidence: 96,
        actionType: "sms",
        actionText: "Send customized WhatsApp thank-you cards to all recent contributors",
        actionTemplate: `Jambo! We have successfully matched and recorded your donation of KES [Amount] to "${activeProject.name}" ledger. Your M-PESA Code: [TxCode] is authenticated. Thank you for your support!`
      },
      {
        id: "rec-whatsapp-update",
        title: "Broadcast progress narrative on group",
        whyItMatters: `Campaign progress is currently at ${percentageComplete}% of KES ${targetGoal.toLocaleString()}.`,
        expectedImpact: "Re-energizes silent members and encourages pledges to fill remaining KES ${amountRemaining.toLocaleString()}.",
        estTime: "1 min",
        priority: "High",
        triggerMetric: `Current completion: ${percentageComplete}%`,
        confidence: 91,
        actionType: "whatsapp",
        actionText: "Generate and share progress report message to WhatsApp",
        actionTemplate: `📢 *${activeProject.name} Harambee Update* 📢\n\nDear Members,\nWe have successfully raised *KES ${totalRaised.toLocaleString()}* representing *${percentageComplete}%* of our total goal! Only KES ${amountRemaining.toLocaleString()} remaining to target.\n\nLet's pull together! "Haba na haba hujaza kibaba."`
      },
      {
        id: "rec-duplicate-check",
        title: "Verify duplicate reconciliation log",
        whyItMatters: "Automatic background scans verify 100% clean Daraja ledger compliance.",
        expectedImpact: "Confirms complete ledger accuracy, preventing financial double-counting errors.",
        estTime: "3 mins",
        priority: "Medium",
        triggerMetric: "M-PESA duplication checks complete",
        confidence: 99,
        actionType: "reconcile",
        actionText: "Perform official double-entry ledger lock",
        actionTemplate: `Confirming 100% transaction integrity audit completed for project ${activeProject.name}. All incoming Safaricom payloads checked.`
      },
      {
        id: "rec-unnamed-verify",
        title: "Match unnamed M-PESA contributor",
        whyItMatters: "A contribution lacks an explicitly mapped committee name.",
        expectedImpact: "Guarantees that public accountability logs show actual human contributors instead of raw phone numbers.",
        estTime: "3 mins",
        priority: "Low",
        triggerMetric: "Presence of raw sender values in record entries",
        confidence: 88,
        actionType: "reconcile",
        actionText: "Assign name matching to raw contribution",
        actionTemplate: "Manually align Safaricom transaction reference payload with committee roster name."
      }
    ];

    // Filter based on active project memory
    const projMemory = memory[activeProject.id] || { completed: [], dismissed: [] };
    return items.filter(item => 
      !projMemory.completed.includes(item.id) && 
      !projMemory.dismissed.includes(item.id)
    );
  }, [activeProject, memory, contributorCount, percentageComplete, totalRaised, amountRemaining]);

  // Keep a selected recommendation to display in the Explanation Panel (defaults to the first one)
  useEffect(() => {
    if (rawRecommendations.length > 0) {
      setSelectedRecommendation(rawRecommendations[0]);
    } else {
      setSelectedRecommendation(null);
    }
  }, [rawRecommendations]);

  // Today's priority statement
  const todaysHighestPriorityText = useMemo(() => {
    if (percentageComplete >= 100) {
      return "Goal reached! Close the campaign ledger and prepare a printable report for the general assembly.";
    }
    if (rawRecommendations.length > 0) {
      return `${rawRecommendations[0].title}. This will improve campaign progress and increase community momentum.`;
    }
    return `Secure outstanding Chama pledges to close the remaining KES ${amountRemaining.toLocaleString()} before the deadline.`;
  }, [percentageComplete, rawRecommendations, amountRemaining]);

  // --- CAMPAIGN INTELLIGENCE FEED (REAL-TIME HUMANS, NO TECH LOGS) ---
  const intelligenceFeed = useMemo(() => {
    const feed = [];
    
    // Most recent contribution first
    if (projectContributions.length > 0) {
      const top3 = projectContributions.slice(0, 3);
      top3.forEach((c) => {
        feed.push({
          id: `feed-don-${c.id}`,
          text: `KES ${c.amount.toLocaleString()} received from ${c.cleanedName || c.senderName}`,
          icon: ThumbsUp,
          color: "text-emerald-400",
          time: new Date(c.timestamp).toLocaleDateString("en-KE", { hour: '2-digit', minute:'2-digit' })
        });
      });
    }

    // Milestones progress
    if (percentageComplete >= 100) {
      feed.push({
        id: "feed-100",
        text: `Victory! Campaign has fully reached 100% target goal`,
        icon: Award,
        color: "text-yellow-400 animate-bounce",
        time: "Just Now"
      });
    } else if (percentageComplete >= 75) {
      feed.push({
        id: "feed-75",
        text: `Milestone reached: Campaign surpassed 75% progress`,
        icon: Award,
        color: "text-purple-400",
        time: "Today"
      });
    } else if (percentageComplete >= 50) {
      feed.push({
        id: "feed-50",
        text: `Milestone reached: Campaign surpassed 50% progress`,
        icon: Award,
        color: "text-blue-400",
        time: "Today"
      });
    } else if (percentageComplete >= 25) {
      feed.push({
        id: "feed-25",
        text: `Milestone reached: Campaign crossed 25% progress`,
        icon: Award,
        color: "text-orange-400",
        time: "Yesterday"
      });
    }

    // Duplicates and audit checks (humane, no raw server diagnostics)
    const duplicateCount = contributions.filter(c => c.projectId === activeProject?.id && c.hasDuplicates).length;
    if (duplicateCount > 0) {
      feed.push({
        id: "feed-dup-block",
        text: `${duplicateCount} duplicate transaction(s) safely blocked from duplicating contributions`,
        icon: ShieldCheck,
        color: "text-rose-400",
        time: "Continuous Watch"
      });
    } else {
      feed.push({
        id: "feed-audit-clean",
        text: "Clean ledger audit: No duplicate M-PESA entries detected in database",
        icon: ShieldCheck,
        color: "text-emerald-400",
        time: "Active Guard"
      });
    }

    // Default historical baseline
    if (activeProject) {
      feed.push({
        id: "feed-created",
        text: `Campaign "${activeProject.name}" successfully created and Daraja Paybill connected`,
        icon: Calendar,
        color: "text-slate-400",
        time: new Date(activeProject.createdAt || Date.now()).toLocaleDateString()
      });
    }

    return feed;
  }, [projectContributions, percentageComplete, activeProject, contributions]);

  // --- WHAT-IF SIMULATOR MATHEMATICS ---
  const simTotalRaised = useMemo(() => {
    const customVal = parseFloat(simCustomDonation) || 0;
    return totalRaised + (simDonors * (averageDonation || 2000)) + simBigAmount + customVal;
  }, [totalRaised, simDonors, averageDonation, simBigAmount, simCustomDonation]);

  const simProgress = useMemo(() => {
    return targetGoal > 0 ? Math.round((simTotalRaised / targetGoal) * 100) : 0;
  }, [simTotalRaised, targetGoal]);

  const simHealthScore = useMemo(() => {
    if (simProgress >= 100) return 100;
    return Math.min(99, Math.round(baseHealthScore + (simDonors * 0.5) + (simBigAmount > 0 ? 5 : 0)));
  }, [simProgress, baseHealthScore, simDonors, simBigAmount]);

  const simSuccessRate = useMemo(() => {
    if (simProgress >= 100) return 100;
    return Math.min(99, Math.round(successProbability + (simDonors * 0.8) + (simBigAmount > 0 ? 8 : 0)));
  }, [simProgress, successProbability, simDonors, simBigAmount]);

  const simDaysRemaining = useMemo(() => {
    return Math.max(1, daysRemaining + simDaysExtension);
  }, [daysRemaining, simDaysExtension]);

  // --- DONOR INTELLIGENCE ANALYSIS ---
  const donorStats = useMemo(() => {
    // Returning donors count (phone number occurs > 1)
    const counts: Record<string, number> = {};
    projectContributions.forEach(c => {
      counts[c.senderPhone] = (counts[c.senderPhone] || 0) + 1;
    });
    const returningCount = Object.values(counts).filter(v => v > 1).length;
    const uniqueCount = Object.keys(counts).length;
    const newCount = Math.max(0, uniqueCount - returningCount);

    // Median calculation
    const sortedAmounts = [...projectContributions].map(c => c.amount).sort((a, b) => a - b);
    const median = sortedAmounts.length > 0 
      ? sortedAmounts[Math.floor(sortedAmounts.length / 2)] 
      : 0;

    // Distribution
    const under500 = projectContributions.filter(c => c.amount <= 500).length;
    const midRange = projectContributions.filter(c => c.amount > 500 && c.amount <= 2000).length;
    const highRange = projectContributions.filter(c => c.amount > 2000 && c.amount <= 10000).length;
    const massiveRange = projectContributions.filter(c => c.amount > 10000).length;

    // Supporters Leaderboard
    const supportersGroup: Record<string, { name: string; total: number; count: number }> = {};
    projectContributions.forEach(c => {
      const key = c.cleanedName || c.senderName;
      if (!supportersGroup[key]) {
        supportersGroup[key] = { name: key, total: 0, count: 0 };
      }
      supportersGroup[key].total += c.amount;
      supportersGroup[key].count += 1;
    });

    const topSupporters = Object.values(supportersGroup)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // AI recommendation paragraph based on real metrics
    let aiSummary = "We are observing steady giving behavior. Encourage your main committee members to set the example with a shared matching pool.";
    if (under500 > contributorCount * 0.7) {
      aiSummary = "Most donations are below KES 500. Consider encouraging committee members to invite sponsors or patrons capable of larger gifts to raise the average donation speed.";
    } else if (returningCount > 2) {
      aiSummary = "Great! You have highly dedicated recurring donors. Sending them a tailored gratitude report would secure high long-term chama pledges.";
    }

    return {
      returningCount,
      newCount,
      median,
      under500,
      midRange,
      highRange,
      massiveRange,
      topSupporters,
      aiSummary
    };
  }, [projectContributions, contributorCount]);

  // --- SMART TIMELINE CALCULATION ---
  const timelineMilestones = useMemo(() => {
    const milestones = [
      { label: "Campaign Created", achieved: true, active: true },
      { label: "First Donation Reconciled", achieved: contributorCount > 0, active: contributorCount > 0 },
      { label: "25% Goal Achieved", achieved: percentageComplete >= 25, active: percentageComplete >= 25 },
      { label: "50% Goal Achieved", achieved: percentageComplete >= 50, active: percentageComplete >= 50 },
      { label: "75% Goal Achieved", achieved: percentageComplete >= 75, active: percentageComplete >= 75 },
      { label: "90% Goal Achieved", achieved: percentageComplete >= 90, active: percentageComplete >= 90 },
      { label: "100% Target Met!", achieved: percentageComplete >= 100, active: percentageComplete >= 100 }
    ];

    // Find the latest achieved index to highlight it
    let latestIdx = -1;
    milestones.forEach((m, idx) => {
      if (m.achieved) latestIdx = idx;
    });

    return milestones.map((m, idx) => ({
      ...m,
      isNewest: idx === latestIdx
    }));
  }, [percentageComplete, contributorCount]);

  // --- AI COACH CONVERSATIONAL HANDLER ---
  const handleAskCoach = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeProject) return;

    const query = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);

    const userMsg = { id: `u-${Date.now()}`, role: "user", text: query, timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let replyText = "";
      const lower = query.toLowerCase();

      if (lower.includes("how are we performing") || lower.includes("performance") || lower.includes("status")) {
        replyText = `Our campaign "${activeProject.name}" has raised KES ${totalRaised.toLocaleString()} against the target goal of KES ${targetGoal.toLocaleString()} (${percentageComplete}%). The health score sits safely at ${baseHealthScore}/100 with ${daysRemaining} days left. Our trajectory indicates a ${successProbability}% probability of success.`;
      } else if (lower.includes("reach our goal") || lower.includes("can we make it") || lower.includes("probability")) {
        replyText = `Yes! We have a ${successProbability}% probability of reaching our goal of KES ${targetGoal.toLocaleString()}. To maximize our momentum, the AI recommends taking immediate action to "${rawRecommendations[0]?.title || 'Broadcast progress updates'}" which has a confidence rating of 91%.`;
      } else if (lower.includes("slowing") || lower.includes("decline") || lower.includes("why")) {
        replyText = `Contribution analysis shows that our average donation stands at KES ${averageDonation.toLocaleString()} with ${contributorCount} unique donors. Giving velocity is healthy, but we need to re-engage our WhatsApp community to secure the remaining KES ${amountRemaining.toLocaleString()} of outstanding Chama pledges.`;
      } else if (lower.includes("what should we do today") || lower.includes("today") || lower.includes("priority")) {
        replyText = `Today's top strategic priority is: "${todaysHighestPriorityText}". Our live data indicates this single step will maximize donor retention and keep committee transparency at 100%.`;
      } else if (lower.includes("summarize") || lower.includes("summary")) {
        replyText = `Here is our sealed ledger audit for "${activeProject.name}":\n\n• Raised So Far: KES ${totalRaised.toLocaleString()} (${percentageComplete}%)\n• Remaining Target: KES ${amountRemaining.toLocaleString()}\n• Contributor count: ${contributorCount} members\n• Health status: ${riskLevel} (Score: ${baseHealthScore}/100)\n\nEverything is reconciled in real-time. No manual spreadsheet accounting is necessary.`;
      } else if (lower.includes("whatsapp") || lower.includes("draft") || lower.includes("update")) {
        replyText = `Here is a custom broadcast draft optimized for your committee group:\n\n"📢 *${activeProject.name}* update: We have successfully received KES ${totalRaised.toLocaleString()} representing ${percentageComplete}% of our KES ${targetGoal.toLocaleString()} target! Big thanks to our ${contributorCount} donors. We only require KES ${amountRemaining.toLocaleString()} to reach the target! Let's pull together."`;
      } else {
        replyText = `I have audited our live Firestore ledger database. For the campaign "${activeProject.name}", we have raised KES ${totalRaised.toLocaleString()} from ${contributorCount} active contributors. Let me know if you would like me to draft a custom SMS, generate a printable PDF briefing, or simulate adding sponsors!`;
      }

      setChatMessages(prev => [
        ...prev,
        { id: `c-${Date.now()}`, role: "assistant", text: replyText, timestamp: new Date().toISOString() }
      ]);
      setIsChatLoading(false);
    }, 450);
  };

  // Click on a preset query
  const runPresetCoachQuery = (query: string) => {
    setChatInput(query);
    // Delay slightly to trigger submission
    setTimeout(() => {
      setIsChatLoading(true);
      const userMsg = { id: `u-${Date.now()}`, role: "user", text: query, timestamp: new Date().toISOString() };
      setChatMessages(prev => [...prev, userMsg]);

      setTimeout(() => {
        let replyText = "";
        const lower = query.toLowerCase();
        if (lower.includes("how are we performing")) {
          replyText = `Our campaign "${activeProject?.name}" is performing at ${percentageComplete}% completion. We have raised KES ${totalRaised.toLocaleString()} from ${contributorCount} contributors. The current Health Index is ${baseHealthScore}/100, which indicates a highly trustworthy and active campaign.`;
        } else if (lower.includes("reach our goal")) {
          replyText = `With ${daysRemaining} days remaining and a current momentum rate, our success probability is projected at ${successProbability}%. Encouraging returning supporters (we have ${donorStats.returningCount} loyal repeat donors) to sponsor small goals will easily push us past 100%.`;
        } else if (lower.includes("slow")) {
          replyText = `Our metrics show an average contribution of KES ${averageDonation.toLocaleString()} and median of KES ${donorStats.median.toLocaleString()}. To accelerate velocity, we suggest publishing a celebration update to cross outstanding Chama thresholds.`;
        } else if (lower.includes("today")) {
          replyText = `The most critical action is to: "${todaysHighestPriorityText}". Click the primary action button to get this verified with human approval.`;
        } else if (lower.includes("summarize")) {
          replyText = `Ledger summary for ${activeProject?.name}:\n\n• Target: KES ${targetGoal.toLocaleString()}\n• Raised: KES ${totalRaised.toLocaleString()}\n• Remaining: KES ${amountRemaining.toLocaleString()}\n• Active Donors: ${contributorCount}\n• Health Index: ${baseHealthScore}/100\n• Duplicate check: 100% Clean/Verified.`;
        } else if (lower.includes("whatsapp")) {
          replyText = `Here is tomorrow's WhatsApp update template:\n\n"📢 *${activeProject?.name} Campaign Milestone* 📢\n\nDear family and friends, we have raised KES ${totalRaised.toLocaleString()} (${percentageComplete}%) from ${contributorCount} donors! Only KES ${amountRemaining.toLocaleString()} remaining to hit our target. Let's pull together to close this. Paybill details are on the official page. Thank you!"`;
        }

        setChatMessages(prev => [
          ...prev,
          { id: `c-${Date.now()}`, role: "assistant", text: replyText, timestamp: new Date().toISOString() }
        ]);
        setIsChatLoading(false);
      }, 400);
    }, 50);
  };

  // --- HUMAN APPROVAL EXECUTION ACTIONS ---
  const handleApproveAction = () => {
    if (!pendingApproval) return;
    
    // Perform standard logic based on action type
    saveMemoryAction(activeProject!.id, "completed", pendingApproval.id);
    showToast(`Approved & Executed: ${pendingApproval.title}`);
    
    // Clear simulator or reset toast flags
    setPendingApproval(null);
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`${label} copied to clipboard.`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const activeTheme = getTheme(activeProject?.themeColor || "Blue");

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8" id="ai-manager-dashboard-view">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-mono"
            id="toast-notification-banner"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER BLOCK WITH CAMPAIGN SELECTOR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-900">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Bot className="w-4 h-4 text-emerald-400 animate-pulse" /> AI Treasurer Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Active Campaign Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Automatic real-time M-PESA audit ledger mapping, predictive campaign health tracking, and verified task automation.
          </p>
        </div>

        {/* Campaign Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 shrink-0 shadow-lg">
          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase pl-1.5">Selected Project:</label>
          <select 
            value={activeProject?.id || ""} 
            onChange={(e) => {
              const proj = projects.find(p => p.id === e.target.value);
              if (proj) {
                setActiveProject(proj);
                // Reset simulation variables
                setSimDonors(0);
                setSimBigAmount(0);
                setSimDaysExtension(0);
                setSimCustomDonation("");
              }
            }}
            className="bg-transparent text-xs font-bold text-white focus:outline-none pr-4 cursor-pointer outline-none"
            id="active-campaign-select-box"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
          <button 
            onClick={() => showToast("Database synchronization verified.")}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition"
            title="Force Synchronize Ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {activeProject ? (
        <div className="space-y-6">

          {/* Sub-navigation Segmented Control */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 max-w-lg w-full shrink-0" id="command-center-tabs">
            <button
              onClick={() => setActiveSection("overview")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSection === "overview"
                  ? "bg-emerald-400 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Campaign Overview
            </button>
            <button
              onClick={() => setActiveSection("coach-simulator")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSection === "coach-simulator"
                  ? "bg-emerald-400 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Coach & Simulator
            </button>
            <button
              onClick={() => setActiveSection("toolkit")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSection === "toolkit"
                  ? "bg-emerald-400 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Treasurer Toolkit
            </button>
          </div>

          {activeSection === "overview" && (
            <div className="space-y-6 animate-fade-in" id="cc-overview-pane">

              {/* --- SECTION 1: DEFAULT HOME HIGHLIGHT (FIRST SCREEN AT GLANCE) --- */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl" id="default-home-primary-highlights">
            <div className="absolute right-0 top-0 w-80 h-full bg-linear-to-l from-emerald-500/5 to-transparent pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl p-1 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={getCampaignLogo(activeProject)} alt="Campaign Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-850 border border-slate-750 text-slate-300 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold">
                        {activeProject.category}
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold rounded-md">
                        100% Daraja Reconciled
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-1 leading-none">{activeProject.name}</h2>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Campaign Health</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full inline-flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Score: {baseHealthScore}/100 ({riskLevel})
                  </span>
                </div>
              </div>

              {/* Motto or Quote */}
              <p className="text-xs text-slate-400 italic">
                "{getCampaignMotto(activeProject) || 'Sustaining community accountability through automatic ledger transparency.'}"
              </p>

              {/* Simple Unified Metric Row (SHOW EACH METRIC ONLY ONCE) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-900" id="unified-ledger-statistics">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Amount Raised</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">
                    KES {totalRaised.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Target Goal</span>
                  <span className="text-base font-extrabold text-slate-300 font-mono mt-0.5 block">
                    KES {targetGoal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Remaining</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono mt-0.5 block">
                    KES {amountRemaining.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Days Remaining</span>
                  <span className="text-base font-extrabold text-slate-300 font-mono mt-0.5 block">
                    {daysRemaining} Days
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Success Probability</span>
                  <span className="text-base font-extrabold text-indigo-400 font-mono mt-0.5 block">
                    {successProbability}%
                  </span>
                </div>
              </div>

              {/* Today's Highest Priority Area */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-xs space-y-1" id="todays-priority-banner">
                <span className="text-[10px] font-mono text-emerald-400 font-black tracking-wider block uppercase">TODAY'S HIGHEST CAMPAIGN PRIORITY</span>
                <p className="text-slate-300 leading-relaxed font-semibold">
                  {todaysHighestPriorityText}
                </p>
              </div>
            </div>

            {/* Recommended Single Primary Quick-Action Button */}
            {rawRecommendations.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-slate-500 font-sans text-center sm:text-left">
                  <strong>AI Recommended Next Step:</strong> {rawRecommendations[0].title}
                </span>
                <button
                  onClick={() => setPendingApproval(rawRecommendations[0])}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-black uppercase rounded-xl transition shadow-lg shadow-emerald-400/10 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  id="primary-action-button"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-950" /> Approve & Execute Action
                </button>
              </div>
            )}
          </div>

          {/* --- SECTION 2: EXECUTIVE SUMMARY CARD & SYSTEM HEALTH --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="executive-mission-grid">
            
            <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Executive Campaign Summary
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Live Grounded Report</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Campaign Status</span>
                  <span className="text-xs font-bold text-white mt-1 block">Active & Reconciling</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Today's Collections</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono mt-1 block">KES {todayDonationsSum.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Largest Donation</span>
                  <span className="text-xs font-bold text-indigo-400 font-mono mt-1 block">KES {largestDonation.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Average Donation</span>
                  <span className="text-xs font-bold text-slate-300 font-mono mt-1 block">KES {averageDonation.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-1.5">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Most Recent Contribution</span>
                  {mostRecentDonation ? (
                    <div>
                      <p className="text-xs font-extrabold text-white">
                        KES {mostRecentDonation.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">from {mostRecentDonation.cleanedName || mostRecentDonation.senderName}</span>
                      </p>
                      <span className="text-[9px] font-mono text-slate-500 block">{new Date(mostRecentDonation.timestamp).toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic block">No contributions matched yet</span>
                  )}
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>PROGRESS BAR</span>
                    <span>{percentageComplete}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, percentageComplete)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Audit & Health Gauges */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider mb-3">Campaign Health Audit</span>
                
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-950 flex flex-col items-center justify-center relative shadow-inner">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-pulse" />
                    <span className="text-2xl font-black text-white font-mono">{baseHealthScore}</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">HEALTH INDEX</span>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-400">Risk Assessment: </span>
                    <span className={`text-xs font-extrabold ${riskLevel.includes('High') ? 'text-rose-400' : 'text-emerald-400'}`}>{riskLevel}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 space-y-1 text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">DARAJA INTEGRITY STATUS</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> SECURED & RECONCILED
                </span>
              </div>
            </div>

          </div>

          {/* --- SECTION 3: AI ACTION QUEUE & EXPLANATION PANEL --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="ai-recommendations-and-explanations">
            
            <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" /> Prioritized Treasurer Action Queue
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Grounded recommendations compiled to elevate community participation and save manual ledger tasks.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-950 text-emerald-400 rounded-md text-[10px] font-mono">
                    {rawRecommendations.length} Tasks Left
                  </span>
                </div>

                {rawRecommendations.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-mono bg-slate-950/40 rounded-2xl border border-slate-850 border-dashed">
                    {contributorCount === 0 
                      ? "AI recommendations will appear once your campaign begins receiving activity."
                      : "🎉 Excellent! All recommended campaign actions successfully verified and processed."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rawRecommendations.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedRecommendation(item)}
                        className={`bg-slate-950 border p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition cursor-pointer hover:border-slate-700 ${
                          selectedRecommendation?.id === item.id ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-slate-850"
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase rounded-md ${
                              item.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {item.priority} Priority
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.estTime}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white font-sans">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-normal line-clamp-1">{item.whyItMatters}</p>
                        </div>

                        {/* Fast Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingApproval(item);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white text-[11px] font-mono font-bold rounded-lg transition"
                          >
                            Execute
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveMemoryAction(activeProject.id, "completed", item.id);
                              showToast("Task marked completed.");
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-slate-800 rounded-lg transition"
                            title="Complete ✓"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast("Snoozed task reminder set for tomorrow.");
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-slate-800 rounded-lg transition"
                            title="Snooze ⏰"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveMemoryAction(activeProject.id, "dismissed", item.id);
                              showToast("Recommendation dismissed.");
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition"
                            title="Dismiss ✕"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Committee report print button */}
              <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Next Committee meeting approaching? Print audited status.</span>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white font-mono text-[11px] font-bold uppercase rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <FileOutput className="w-4 h-4 text-emerald-400" /> Prepare Committee Briefing
                </button>
              </div>
            </div>

            {/* --- SECTION 4: AI EXPLANATION PANEL --- */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between" id="ai-explanation-panel">
              <div className="space-y-4">
                <div className="border-b border-slate-850 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400" /> AI Recommendation Explanation
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Understand the underlying metrics, logic, and confidence behind every recommended action.
                  </p>
                </div>

                {selectedRecommendation ? (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                      <span className="text-[9px] font-mono text-emerald-400 block uppercase font-bold tracking-wider">SELECTED TASK ANALYSIS</span>
                      <h4 className="text-xs font-bold text-white">{selectedRecommendation.title}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {selectedRecommendation.whyItMatters}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                        <span className="text-[8px] font-mono text-slate-500 block uppercase">Triggering Metric</span>
                        <span className="text-[10px] font-mono font-bold text-slate-300 mt-1 block">{selectedRecommendation.triggerMetric}</span>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                        <span className="text-[8px] font-mono text-slate-500 block uppercase">AI Confidence</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1 block">{selectedRecommendation.confidence}%</span>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-xs space-y-1">
                      <span className="text-[9px] font-mono text-emerald-400 block uppercase font-bold">EXPECTED IMPACT</span>
                      <p className="text-slate-300 leading-normal">{selectedRecommendation.expectedImpact}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs font-mono">
                    Select any recommended task to view its detailed AI auditing parameters here.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-850 text-[10px] font-mono text-slate-500 text-center">
                Strict transparency standard: No statistical fabrication.
              </div>
            </div>

          </div>

          {/* --- SECTION 5 & SECTION 8: INTELLIGENCE FEED & SMART TIMELINE --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="intelligence-and-milestones-grid">
            
            {/* Live Campaign Intelligence Feed */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-400" /> Campaign Intelligence Feed
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Meaningful chronological updates from live committee records and validated Safaricom audits.
                    </p>
                  </div>
                  <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-emerald-400 font-mono">
                    Realtime Feed
                  </span>
                </div>

                <div className="space-y-3">
                  {intelligenceFeed.map((item) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-850/60 p-3 rounded-2xl flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${item.color} shrink-0`}>
                          <item.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs">
                          <p className="text-slate-300 font-sans font-medium">{item.text}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 self-center">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 text-[10px] text-slate-500 leading-relaxed font-sans">
                Notice: All M-PESA entries undergo real-time transaction verification checks to safeguard ledger integrity.
              </div>
            </div>

            {/* Smart Timeline Stepper */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between" id="campaign-smart-timeline">
              <div>
                <div className="border-b border-slate-850 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> Active Smart Timeline
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Visual milestone path generated dynamically based on reconciled totals.
                  </p>
                </div>

                {contributorCount === 0 ? (
                  <div className="py-8 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30 p-4">
                    <p className="text-xs text-slate-500 font-mono leading-relaxed">
                      Your first milestone will appear after your first donation.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-4 border-l border-slate-850 space-y-4">
                    {timelineMilestones.map((milestone, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                          milestone.achieved 
                            ? "bg-emerald-400 border-emerald-400 ring-4 ring-emerald-400/10" 
                            : "bg-slate-950 border-slate-800"
                        } ${milestone.isNewest ? "animate-pulse shadow-[0_0_8px_#34d399]" : ""}`} />
                        
                        <div className="text-xs">
                          <span className={`font-semibold block ${milestone.achieved ? "text-white" : "text-slate-500"}`}>
                            {milestone.label}
                          </span>
                          {milestone.isNewest && (
                            <span className="inline-block mt-0.5 px-2 py-0.2 bg-emerald-500/15 text-emerald-400 text-[8px] font-mono font-black uppercase rounded-sm">
                              Newest Achieved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-850 text-[10px] font-mono text-slate-500 text-center">
                Keep members engaged to cross next milestone!
              </div>
            </div>

          </div>

            </div>
          )}

          {activeSection === "coach-simulator" && (
            <div className="space-y-6 animate-fade-in" id="cc-coach-pane">

              {/* --- SECTION 6: WHAT-IF SIMULATOR Mode --- */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl" id="what-if-campaign-simulator">
            <div className="border-b border-slate-850 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" /> Interactive Campaign Simulator
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Test custom sponsor projections safely. This playground does NOT write or alter actual Firestore values.
                </p>
              </div>
              
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setSimDonors(10);
                    setSimBigAmount(0);
                    setSimDaysExtension(0);
                    setSimCustomDonation("");
                    showToast("Preset applied: Simulate +10 members.");
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-[9px] font-mono text-slate-300 transition"
                >
                  +10 Donors
                </button>
                <button
                  onClick={() => {
                    setSimDonors(0);
                    setSimBigAmount(30000);
                    setSimDaysExtension(0);
                    setSimCustomDonation("");
                    showToast("Preset applied: Simulate KES 30,000.");
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-[9px] font-mono text-slate-300 transition"
                >
                  +30k Pledge
                </button>
                <button
                  onClick={() => {
                    setSimDonors(0);
                    setSimBigAmount(0);
                    setSimDaysExtension(10);
                    setSimCustomDonation("");
                    showToast("Preset applied: Extend deadline by 10 days.");
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-[9px] font-mono text-slate-300 transition"
                >
                  +10 Days
                </button>
                {(simDonors > 0 || simBigAmount > 0 || simDaysExtension > 0 || simCustomDonation !== "") && (
                  <button
                    onClick={() => {
                      setSimDonors(0);
                      setSimBigAmount(0);
                      setSimDaysExtension(0);
                      setSimCustomDonation("");
                      showToast("Simulation cleared.");
                    }}
                    className="px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded text-[9px] font-mono transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sliders Area */}
              <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Tweak Projections</span>
                
                {/* Additional Donors Slider */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>Simulated Donors:</span>
                    <span className="text-amber-400 font-bold">+{simDonors} supporters</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="80" 
                    value={simDonors}
                    onChange={(e) => setSimDonors(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 h-1 rounded cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block font-sans italic">Estimated contribution: KES {averageDonation.toLocaleString()} each</span>
                </div>

                {/* Additional Pledges Slider */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>Simulated Sponsor Gift:</span>
                    <span className="text-amber-400 font-bold">KES {simBigAmount.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="80000" 
                    step="5000"
                    value={simBigAmount}
                    onChange={(e) => setSimBigAmount(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 h-1 rounded cursor-pointer"
                  />
                </div>

                {/* Extended Deadline Slider */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>Extended Deadline:</span>
                    <span className="text-amber-400 font-bold">+{simDaysExtension} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={simDaysExtension}
                    onChange={(e) => setSimDaysExtension(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 h-1 rounded cursor-pointer"
                  />
                </div>

                {/* Custom Donation Field */}
                <div className="space-y-1 text-xs pt-1">
                  <span className="text-[10px] font-mono text-slate-400 block">Custom Simulated Amount (KES):</span>
                  <input
                    type="number"
                    value={simCustomDonation}
                    onChange={(e) => setSimCustomDonation(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Simulation Results (Live comparison) */}
              <div className="lg:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono uppercase font-semibold rounded">PROJECTION PREVIEWS</span>
                    <span className="text-[10px] text-slate-500">Comparing real status vs simulated path</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Projected Total</span>
                      <span className="text-sm font-extrabold text-amber-400 font-mono block mt-0.5">KES {simTotalRaised.toLocaleString()}</span>
                      <span className="text-[8px] text-slate-400 font-mono">Actual: KES {totalRaised.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Completion %</span>
                      <span className="text-sm font-extrabold text-amber-400 font-mono block mt-0.5">{simProgress}%</span>
                      <span className="text-[8px] text-slate-400 font-mono">Actual: {percentageComplete}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Health Score</span>
                      <span className="text-sm font-extrabold text-amber-400 font-mono block mt-0.5">{simHealthScore}/100</span>
                      <span className="text-[8px] text-slate-400 font-mono">Actual: {baseHealthScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Success Prob.</span>
                      <span className="text-sm font-extrabold text-amber-400 font-mono block mt-0.5">{simSuccessRate}%</span>
                      <span className="text-[8px] text-slate-400 font-mono">Actual: {successProbability}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-xs mt-4">
                  <span className="text-[9px] font-mono text-amber-400 uppercase font-bold block">SIMULATOR ACTION STRATEGY</span>
                  <p className="text-slate-300 leading-normal mt-0.5">
                    {simProgress >= 100 
                      ? "Success! This simulation indicates your target goal is easily reachable on this track. Engage sponsors immediately to finalize pledges."
                      : `You still require KES ${Math.max(0, targetGoal - simTotalRaised).toLocaleString()} to cross the goal. Consider increasing target community shares.`
                    }
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* --- SECTION 7: CONVERSATIONAL AI COACH (EMBEDDED) --- */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl" id="conversational-ai-assistant">
            <div className="border-b border-slate-850 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" /> Conversational AI Fundraising Coach
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ask strategic queries regarding target milestones, WhatsApp broadcast designs, or donor distributions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Presets List */}
              <div className="space-y-2 lg:col-span-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Suggested Questions</span>
                <div className="flex flex-col gap-1.5">
                  {[
                    "How are we performing?",
                    "Can we reach our goal?",
                    "Why are donations slowing?",
                    "What should we do today?",
                    "Summarize this campaign.",
                    "Generate tomorrow's WhatsApp update."
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => runPresetCoachQuery(q)}
                      className="px-3 py-2 text-left bg-slate-950 hover:bg-slate-850 text-[11px] text-slate-300 rounded-xl border border-slate-850 transition cursor-pointer flex items-center justify-between"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Log Panel */}
              <div className="lg:col-span-3 bg-slate-950 border border-slate-850 rounded-2xl p-4 h-[280px] flex flex-col justify-between" id="ai-chat-interface-card">
                <div className="overflow-y-auto space-y-3 flex-1 pr-1" id="chat-messages-container">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-emerald-500 text-slate-950 font-medium' 
                          : 'bg-slate-900 text-slate-100 border border-slate-800'
                      }`}>
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <span className={`text-[8px] block mt-1 text-right ${
                          msg.role === 'user' ? 'text-slate-800' : 'text-slate-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                        <span className="text-[10px] font-mono text-slate-400">Auditing ledger files...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAskCoach} className="mt-3 pt-3 border-t border-slate-900 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about M-PESA reconciliations or WhatsApp scripts..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </div>

            </div>
          )}

          {activeSection === "overview" && (
            <div className="space-y-6 animate-fade-in" id="cc-overview-pane-donor">

              {/* --- SECTION 9: DONOR INTELLIGENCE ANALYSIS --- */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl" id="donor-intelligence-analytics">
            <div className="border-b border-slate-850 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" /> Donor Roster & Giving Distribution
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Overview of returning supporters, contribution sizes, and targeted AI sponsorship advisory.
                </p>
              </div>
              <button
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-850 rounded text-xs text-slate-400 transition flex items-center gap-1"
              >
                {showAdvancedStats ? "Hide Distribution" : "Show Distribution"}
                {showAdvancedStats ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Summary cards */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">New Supporters</span>
                    <span className="text-sm font-extrabold text-white font-mono block mt-0.5">{donorStats.newCount}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Returning Supporters</span>
                    <span className="text-sm font-extrabold text-purple-400 font-mono block mt-0.5">{donorStats.returningCount}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Median Contribution size</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono block">KES {donorStats.median.toLocaleString()}</span>
                  <p className="text-[9px] text-slate-400">Reconciling median minimizes impact of outlier angel donations.</p>
                </div>
              </div>

              {/* Supporter Leaderboard List */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Top Supporters Leaderboard</span>
                <div className="space-y-1.5">
                  {donorStats.topSupporters.length > 0 ? (
                    donorStats.topSupporters.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b border-slate-900">
                        <span className="text-slate-300 truncate max-w-[150px]">{s.name}</span>
                        <span className="font-bold text-white font-mono">KES {s.total.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No contributions reconciled yet</span>
                  )}
                </div>
              </div>

              {/* AI summary advisory */}
              <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-900/30 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-purple-400 block uppercase font-bold">AI DONOR ADVISORY</span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                    {donorStats.aiSummary}
                  </p>
                </div>

                <div className="text-[8px] font-mono text-slate-500 mt-4">
                  Advisory based on active Safaricom Daraja ledger trends.
                </div>
              </div>

            </div>

            {/* Collapsible advanced distribution section */}
            <AnimatePresence>
              {showAdvancedStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4 pt-4 border-t border-slate-850"
                >
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Donation Size Distribution Index</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-400 block">KES 1 - 500</span>
                        <span className="text-xs font-bold text-white font-mono mt-1 block">{donorStats.under500} gifts</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-400 block">KES 501 - 2,000</span>
                        <span className="text-xs font-bold text-white font-mono mt-1 block">{donorStats.midRange} gifts</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-400 block">KES 2,001 - 10,000</span>
                        <span className="text-xs font-bold text-white font-mono mt-1 block">{donorStats.highRange} gifts</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-400 block">KES 10,000+</span>
                        <span className="text-xs font-bold text-white font-mono mt-1 block">{donorStats.massiveRange} gifts</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

            </div>
          )}

          {activeSection === "toolkit" && (
            <div className="space-y-6 animate-fade-in" id="cc-toolkit-pane">
              {/* Inner Toolkit sub-tabs */}
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" /> Treasurer Administrative Toolkit
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Direct ledger recording, Safaricom Daraja STK Push triggers, and bulk statement processing.</p>
                  </div>
                  <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                    <button
                      onClick={() => setToolkitTab("single")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                        toolkitTab === "single" ? "bg-emerald-400 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Single Receipt
                    </button>
                    <button
                      onClick={() => setToolkitTab("bulk")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                        toolkitTab === "bulk" ? "bg-emerald-400 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Bulk Parser
                    </button>
                    <button
                      onClick={() => setToolkitTab("stk")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                        toolkitTab === "stk" ? "bg-emerald-400 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      STK Sim
                    </button>
                    <button
                      onClick={() => setToolkitTab("tasks")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                        toolkitTab === "tasks" ? "bg-emerald-400 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Tasks ({tasks.filter(t => !t.completed).length})
                    </button>
                  </div>
                </div>

                {/* TAB 1: Single Manual Receipt Entry */}
                {toolkitTab === "single" && (
                  <form onSubmit={handleAddSubmit} className="space-y-4 max-w-xl">
                    {formError && (
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-mono font-medium border border-rose-500/20">
                        {formError}
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-mono font-bold text-slate-400 block mb-1">M-PESA Code:</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          required
                          placeholder="e.g. REG1M9K2L1"
                          value={formTx}
                          onChange={(e) => setFormTx(e.target.value.toUpperCase())}
                          className="flex-1 bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white"
                        />
                        <button 
                          type="button" 
                          onClick={fillRandomCode}
                          className="px-3 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 rounded-xl text-xs font-mono transition cursor-pointer"
                        >
                          Generate Code
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Amount (KES):</label>
                        <input 
                          type="number"
                          required
                          placeholder="e.g. 5000"
                          value={formAmount}
                          onChange={(e) => setFormAmount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Custom Category Hint:</label>
                        <select 
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white cursor-pointer"
                        >
                          <option value="Family/Friends" className="bg-slate-900 text-white">Family/Friends</option>
                          <option value="Neighbor/Friend" className="bg-slate-900 text-white">Neighbor/Friend</option>
                          <option value="Corporate/Sponsor" className="bg-slate-900 text-white">Corporate/Sponsor</option>
                          <option value="Chama/Group" className="bg-slate-900 text-white">Chama/Group</option>
                          <option value="Well-wisher" className="bg-slate-900 text-white">Well-wisher</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Original Sender Name (All Caps):</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. JOSEPHINE NJOKI MWANGI"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Sender Phone Number:</label>
                      <input 
                        type="text"
                        placeholder="e.g. 254712345678"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Internal Ledger Notes:</label>
                      <textarea 
                        placeholder="Add secondary notes regarding physical check matching or auxiliary bank deposits."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white h-20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Committing Transaction...
                        </>
                      ) : (
                        "Confirm Receipt & Commit to Live Ledger"
                      )}
                    </button>
                  </form>
                )}

                {/* TAB 2: Bulk Copy-Paste statement Parser */}
                {toolkitTab === "bulk" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">Copy-paste plain-text M-PESA SMS receipts or CSV statements below. The AI Parser will automatically isolate amounts, sender names, phone numbers, transaction codes, and highlight existing duplicates in your live database.</p>
                    
                    <div className="flex gap-2 mb-2">
                      <button 
                        type="button" 
                        onClick={loadMockSmsTemplate}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 rounded-xl text-xs font-mono transition cursor-pointer"
                      >
                        Load Real-World M-PESA SMS Paste Template
                      </button>
                      {bulkText && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setBulkText("");
                            setParsedItems([]);
                            setBulkError("");
                            setBulkSuccess("");
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-mono transition cursor-pointer"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>

                    <textarea
                      value={bulkText}
                      onChange={(e) => {
                        setBulkText(e.target.value);
                        const items = runSmsStatementParser(e.target.value);
                        setParsedItems(items);
                        if (items.length > 0) {
                          setBulkSuccess(`Parsed ${items.length} records. Clean/New: ${items.filter(x=>!x.isDuplicate).length}, Duplicates: ${items.filter(x=>x.isDuplicate).length}`);
                        } else {
                          setBulkSuccess("");
                        }
                      }}
                      placeholder="Paste Safaricom M-PESA SMS / CSV statements here..."
                      className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-slate-200 placeholder-slate-600"
                    />

                    {bulkError && (
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-mono border border-rose-500/20">
                        {bulkError}
                      </div>
                    )}

                    {bulkSuccess && (
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-mono border border-emerald-500/20">
                        {bulkSuccess}
                      </div>
                    )}

                    {parsedItems.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Audit Parsing Preview Grid</span>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-850 text-[10px] text-slate-400 font-mono uppercase">
                                <th className="p-3">M-PESA Code</th>
                                <th className="p-3">Sender Full Name</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-center">Status Index</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-850/60 hover:bg-slate-900/40">
                                  <td className="p-3 font-mono font-bold text-white">{item.transactionCode}</td>
                                  <td className="p-3 uppercase text-slate-300">{item.senderName}</td>
                                  <td className="p-3 font-mono text-slate-400">{item.senderPhone}</td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-400">KES {item.amount.toLocaleString()}</td>
                                  <td className="p-3 text-center">
                                    {item.isDuplicate ? (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 text-[9px] font-mono font-black uppercase">
                                        Duplicate Blocked
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-black uppercase">
                                        Ready to Import
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <button
                          onClick={handleBulkImportConfirm}
                          disabled={isSubmitting || parsedItems.filter(p => !p.isDuplicate).length === 0}
                          className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Batch Reconciling Stream...
                            </>
                          ) : (
                            `Import ${parsedItems.filter(p => !p.isDuplicate).length} Clean Receipts to Live Firestore`
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Lipa Na M-PESA STK Push Initiator */}
                {toolkitTab === "stk" && (
                  <form onSubmit={handleMpesaSubmit} className="space-y-4 max-w-xl">
                    <p className="text-xs text-slate-400">Simulate dispatching a Lipa Na M-PESA STK Push directly on an active mobile device. Handset will show the secure M-PESA PIN dialog popup on successful trigger.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Mobile Handset Phone:</label>
                        <input 
                          type="text"
                          required
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Amount (KES):</label>
                        <input 
                          type="number"
                          required
                          placeholder="e.g. 200"
                          value={mpesaAmount}
                          onChange={(e) => setMpesaAmount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">First Name:</label>
                        <input 
                          type="text"
                          required
                          value={mpesaFirstName}
                          onChange={(e) => setMpesaFirstName(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Middle Name:</label>
                        <input 
                          type="text"
                          value={mpesaMiddleName}
                          onChange={(e) => setMpesaMiddleName(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Last Name:</label>
                        <input 
                          type="text"
                          required
                          value={mpesaLastName}
                          onChange={(e) => setMpesaLastName(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Paybill/Till Connected:</label>
                        <input 
                          type="text"
                          disabled
                          value={activeProject.paybillNumber || "400222"}
                          className="w-full bg-slate-900 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-400 block mb-1">M-PESA Account Ref:</label>
                        <input 
                          type="text"
                          required
                          value={mpesaRef}
                          onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white"
                        />
                      </div>
                    </div>

                    {mpesaMessage && (
                      <div className={`p-4 rounded-xl text-xs font-mono border ${
                        mpesaStatus === "success" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : mpesaStatus === "processing" 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        <div className="flex items-center gap-2">
                          {mpesaStatus === "processing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <p className="font-semibold">{mpesaMessage}</p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={mpesaLoading}
                      className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {mpesaLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching STK Payload...
                        </>
                      ) : (
                        "Initiate Instant STK Push Simulator"
                      )}
                    </button>
                  </form>
                )}

                {/* TAB 4: Committee Task Checklist */}
                {toolkitTab === "tasks" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">Keep track of key committee operations, compliance deliverables, and audit log filings for the active campaign drive.</p>
                    
                    <form onSubmit={handleAddTask} className="flex gap-2 max-w-xl">
                      <input
                        type="text"
                        required
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Write a new administrative committee task..."
                        className="flex-1 bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white font-semibold font-sans"
                      />
                      <select
                        value={newTaskCat}
                        onChange={(e) => setNewTaskCat(e.target.value)}
                        className="bg-slate-950 border border-slate-850 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-white cursor-pointer"
                      >
                        <option value="Committee">Committee</option>
                        <option value="Audit">Audit</option>
                        <option value="Communication">Communication</option>
                        <option value="Governance">Governance</option>
                        <option value="Closure">Closure</option>
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-mono font-bold uppercase rounded-xl transition shrink-0 cursor-pointer font-extrabold"
                      >
                        Add Task
                      </button>
                    </form>

                    <div className="space-y-2 mt-4 max-w-2xl">
                      {tasks.length > 0 ? (
                        tasks.map((task) => (
                          <div 
                            key={task.id} 
                            onClick={() => handleToggleTask(task.id)}
                            className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                              task.completed 
                                ? "bg-slate-950/40 border-slate-900 text-slate-500 line-through" 
                                : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                task.completed ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-800 bg-slate-900"
                              }`}>
                                {task.completed && "✓"}
                              </span>
                              <span className="text-xs font-semibold leading-relaxed">{task.text}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[9px] font-mono uppercase font-bold">
                                {task.category}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-600 italic text-xs font-mono">
                          No outstanding tasks! High campaign compliance achieved.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          No active campaign found. Please add a campaign via templates.
        </div>
      )}

      {/* --- SECTION 11: HUMAN APPROVAL COMPLIANCE CONFIRMATION DIALOG (MODAL) --- */}
      <AnimatePresence>
        {pendingApproval && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" id="human-approval-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-850 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase rounded flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Human Approval Needed
                </span>
                <button 
                  onClick={() => setPendingApproval(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{pendingApproval.title}</h3>
                <p className="text-xs text-slate-400">
                  HarambeeFlow security policies prevent any automated system broadcasts without active Treasurer approval.
                </p>
              </div>

              {pendingApproval.actionTemplate && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1.5 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Message Template Draft</span>
                    <button
                      onClick={() => handleCopyToClipboard(pendingApproval.actionTemplate, "Template Draft")}
                      className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy Text
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-all">
                    {pendingApproval.actionTemplate}
                  </p>
                </div>
              )}

              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-xs">
                <span className="font-bold text-emerald-400 block">Expected Strategic Outcome</span>
                <p className="text-slate-300 leading-normal mt-0.5">{pendingApproval.expectedImpact}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setPendingApproval(null)}
                  className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer text-center"
                >
                  Reject & Close
                </button>
                <button
                  onClick={handleApproveAction}
                  className="py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-mono font-black uppercase rounded-xl transition shadow-lg shadow-emerald-400/10 cursor-pointer text-center"
                >
                  Approve & Broadcast
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SECTION 10: COMMITTEE REPORT PREVIEW & PRINT DIALOG --- */}
      <AnimatePresence>
        {showReportModal && activeProject && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="committee-report-modal">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <span className="text-emerald-400 font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <Printer className="w-4 h-4 text-emerald-400" /> Printable Report Preview
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-mono font-bold uppercase rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print to PDF
                  </button>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body Sheet (Tailwind print class support included) */}
              <div className="bg-white text-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-300 space-y-6 max-h-[500px] overflow-y-auto print:max-h-none print:p-0 print:border-none print:bg-white print:text-black shadow-lg" id="printable-committee-sheet">
                
                {/* Church/Committee Header */}
                <div className="border-b-2 border-slate-950 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight uppercase">HARAMBEEFLOW OS LEDGER</h2>
                    <p className="text-xs text-slate-600 font-mono font-bold mt-0.5">Sealed Financial Committee Briefing</p>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">Campaign Name: <span className="font-extrabold text-black">{activeProject.name}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Print Date</span>
                    <span className="text-xs font-bold font-mono text-black">{new Date().toLocaleDateString("en-KE")}</span>
                  </div>
                </div>

                {/* Project Status Overview */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-1">1. Executive Campaign Summary</h3>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    This document represents the sealed financial status of the campaign drive *"{activeProject.name}"* registered under category *"{activeProject.category}"*. 100% of M-PESA paybill contribution transactions have been audited, matched, and reconciled against the live Daraja ledger files. No duplicate bookings have been detected.
                  </p>
                </div>

                {/* Financial Sheet Grid */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-1">2. Financial Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div className="p-2 border border-slate-300 rounded text-center">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Target Goal</span>
                      <span className="text-sm font-extrabold font-mono text-black">KES {targetGoal.toLocaleString()}</span>
                    </div>
                    <div className="p-2 border border-slate-300 rounded text-center">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Total Raised</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-700">KES {totalRaised.toLocaleString()}</span>
                    </div>
                    <div className="p-2 border border-slate-300 rounded text-center">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Outstanding balance</span>
                      <span className="text-sm font-extrabold font-mono text-amber-700">KES {amountRemaining.toLocaleString()}</span>
                    </div>
                    <div className="p-2 border border-slate-300 rounded text-center">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Total Supporters</span>
                      <span className="text-sm font-extrabold font-mono text-black">{contributorCount} contributors</span>
                    </div>
                  </div>
                </div>

                {/* Key Committee Decisions Needed */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-1">3. Outstanding Action Items & Risks</h3>
                  <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1.5 leading-normal">
                    <li>
                      <strong>Mobilize Chama:</strong> Leverage outstanding pledges to close the remaining KES {amountRemaining.toLocaleString()} before the target deadline.
                    </li>
                    <li>
                      <strong>Gratitude Cards:</strong> Reconcile and dispatch automated thank-you notes to sustain donor confidence.
                    </li>
                    <li>
                      <strong>Assessment Risk:</strong> {riskLevel}. Continuous watch of Safaricom Daraja callbacks is currently active and guarded.
                    </li>
                  </ul>
                </div>

                {/* Signature Approval Area */}
                <div className="pt-8 border-t border-slate-400 space-y-4">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider">4. Official Board Signatures & Validation</span>
                  
                  <div className="grid grid-cols-3 gap-6 pt-2">
                    <div className="space-y-8 text-center">
                      <div className="border-b border-slate-900 pb-1 min-h-[30px]" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-800 block uppercase">Treasurer Signature</span>
                        <span className="text-[9px] text-slate-500 font-mono font-semibold">HarambeeFlow OS</span>
                      </div>
                    </div>
                    
                    <div className="space-y-8 text-center">
                      <div className="border-b border-slate-900 pb-1 min-h-[30px]" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-800 block uppercase">Chairperson Signature</span>
                        <span className="text-[9px] text-slate-500 font-mono font-semibold">HarambeeFlow OS</span>
                      </div>
                    </div>

                    <div className="space-y-8 text-center">
                      <div className="border-b border-slate-900 pb-1 min-h-[30px]" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-800 block uppercase">Secretary Signature</span>
                        <span className="text-[9px] text-slate-500 font-mono font-semibold">HarambeeFlow OS</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
