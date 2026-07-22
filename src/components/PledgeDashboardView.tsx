import React, { useState, useMemo, useEffect } from "react";
import { Project, Contribution, Pledge, WhatsAppMessage } from "../types";
import { EventBus } from "../utils/eventBus";
import { 
  Sparkles, Search, Plus, Calendar, Coins, Users, CheckCircle2, Download, 
  ExternalLink, FileText, HeartHandshake, Share2, Eye, TrendingUp, Smartphone, 
  AlertCircle, ArrowRight, ChevronRight, User, Phone, Mail, ArrowUpRight, 
  Trash2, Send, Check, Clock, ShieldCheck, MessageSquare, Landmark, RefreshCw
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, addDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface PledgeDashboardViewProps {
  activeProject: Project | null;
  projects: Project[];
  contributions: Contribution[];
  whatsappMessages: WhatsAppMessage[];
  onAddManualContribution: (cnt: any) => Promise<any>;
  onAddSimulatedMessage?: (text: string) => Promise<void>;
  isDemoMode: boolean;
  currentUser?: any;
}

export default function PledgeDashboardView({
  activeProject,
  projects,
  contributions,
  whatsappMessages,
  onAddManualContribution,
  onAddSimulatedMessage,
  isDemoMode,
  currentUser
}: PledgeDashboardViewProps) {
  // Local real-time sync for pledges
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure activeProject is always available in dropdown selections even if projects array is empty
  const dropdownProjects = useMemo(() => {
    const list = [...projects];
    if (activeProject && !list.some(p => p.id === activeProject.id)) {
      list.push(activeProject);
    }
    return list;
  }, [projects, activeProject]);

  // Search, Filter and View States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPledgeId, setSelectedPledgeId] = useState<string | null>(null); // For detail view

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<Pledge | null>(null);

  // Create Pledge Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProjectId, setFormProjectId] = useState(activeProject?.id || "");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("M-PESA");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Record Payment Form State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("M-PESA");
  const [paymentTxCode, setPaymentTxCode] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Confetti & Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedPledge, setCelebratedPledge] = useState<Pledge | null>(null);

  // Real-time Firestore sync for Pledges
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (isDemoMode || currentUser.uid === "demo-user-123") {
      // Load sample pledges for Demo Mode
      const samplePledges: Pledge[] = [
        {
          id: "pledge-1",
          projectId: "demo-project-id",
          donorName: "Richard Mayore",
          phone: "254712345678",
          email: "rmayore@gmail.com",
          pledgedAmount: 50000,
          paidAmount: 20000,
          balance: 30000,
          status: "Partial",
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().substring(0, 10), // 5 days from now
          purpose: "Committee Support",
          expectedPaymentMethod: "M-PESA",
          notes: "Will complete before the end of next week.",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          paymentHistory: [
            {
              id: "pay-1",
              amount: 20000,
              timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
              transactionCode: "QRL83K9D4J"
            }
          ]
        },
        {
          id: "pledge-2",
          projectId: "demo-project-id",
          donorName: "Mama Njeri",
          phone: "254722334455",
          email: "mamanjeri@gmail.com",
          pledgedAmount: 15000,
          paidAmount: 15000,
          balance: 0,
          status: "Completed",
          dueDate: new Date(Date.now() - 86400000 * 2).toISOString().substring(0, 10),
          purpose: "Sponsor tier contribution",
          expectedPaymentMethod: "M-PESA",
          notes: "Blessings to the community.",
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          paymentHistory: [
            {
              id: "pay-2",
              amount: 15000,
              timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
              transactionCode: "SL987FG6H5"
            }
          ]
        },
        {
          id: "pledge-3",
          projectId: "demo-project-id",
          donorName: "Kenyan Diaspora Patron",
          phone: "254733445566",
          pledgedAmount: 120000,
          paidAmount: 0,
          balance: 120000,
          status: "Pending",
          dueDate: new Date(Date.now() + 86400000 * 12).toISOString().substring(0, 10),
          purpose: "Well-wisher backing",
          expectedPaymentMethod: "Bank",
          notes: "Sending bank wire. Keep track.",
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: "pledge-4",
          projectId: "demo-project-id",
          donorName: "Charles Ochieng",
          phone: "254799887766",
          pledgedAmount: 10000,
          paidAmount: 0,
          balance: 10000,
          status: "Overdue",
          dueDate: new Date(Date.now() - 86400000 * 5).toISOString().substring(0, 10), // 5 days ago
          purpose: "Family installment",
          expectedPaymentMethod: "Cash",
          notes: "Requested a gentle phone call reminder.",
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];
      setPledges(samplePledges);
      setLoading(false);
      return;
    }

    if (db) {
      const unsubscribe = onSnapshot(collection(db, "pledges"), (snapshot) => {
        const list: Pledge[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            ...data
          } as Pledge);
        });
        setPledges(list);
        setLoading(false);
      }, (error) => {
        console.error("Error loading real-time pledges:", error);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, [currentUser, isDemoMode]);

  // Sync default fundraiser selection when activeProject loads
  useEffect(() => {
    if (activeProject && !formProjectId) {
      setFormProjectId(activeProject.id);
    }
  }, [activeProject]);

  // Compute stats based on selected filters (or globally)
  const stats = useMemo(() => {
    const relevant = pledges.filter(p => {
      if (selectedProjectId !== "all" && p.projectId !== selectedProjectId) return false;
      return true;
    });

    const totalPledged = relevant.reduce((sum, p) => sum + p.pledgedAmount, 0);
    const totalReceived = relevant.reduce((sum, p) => sum + p.paidAmount, 0);
    const outstanding = relevant.reduce((sum, p) => sum + p.balance, 0);
    const completedCount = relevant.filter(p => p.status === "Completed").length;
    const partialCount = relevant.filter(p => p.status === "Partial").length;
    const pendingCount = relevant.filter(p => p.status === "Pending").length;
    const overdueCount = relevant.filter(p => p.status === "Overdue" || (p.balance > 0 && new Date(p.dueDate).getTime() < Date.now() && p.status !== "Completed")).length;

    const rate = totalPledged > 0 ? Math.round((totalReceived / totalPledged) * 100) : 0;

    return {
      totalPledged,
      totalReceived,
      outstanding,
      rate,
      completedCount,
      partialCount,
      pendingCount,
      overdueCount
    };
  }, [pledges, selectedProjectId]);

  // Filter pledges list for table
  const filteredPledges = useMemo(() => {
    return pledges.filter(p => {
      // Fundraiser project match
      if (selectedProjectId !== "all" && p.projectId !== selectedProjectId) return false;
      
      // Status match
      if (selectedStatus !== "all" && p.status !== selectedStatus) return false;

      // Text search match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = p.donorName?.toLowerCase().includes(query);
        const phoneMatch = p.phone?.includes(query);
        const purposeMatch = p.purpose?.toLowerCase().includes(query);
        const notesMatch = p.notes?.toLowerCase().includes(query);
        return nameMatch || phoneMatch || purposeMatch || notesMatch;
      }

      return true;
    });
  }, [pledges, selectedProjectId, selectedStatus, searchQuery]);

  // Get project name by ID
  const getProjectName = (id: string) => {
    const proj = dropdownProjects.find(p => p.id === id);
    return proj ? proj.name : "Unknown Fundraiser";
  };

  // Create Pledge handler
  const handleCreatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formAmount || !formDueDate || !formProjectId) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const newPledge: Omit<Pledge, "id"> = {
      projectId: formProjectId,
      donorName: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      pledgedAmount: Number(formAmount),
      paidAmount: 0,
      balance: Number(formAmount),
      status: "Pending",
      dueDate: formDueDate,
      purpose: formPurpose.trim() || undefined,
      notes: formNotes.trim() || undefined,
      expectedPaymentMethod: formPaymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentHistory: []
    };

    try {
      if (isDemoMode) {
        const randomId = `pledge-${Date.now()}`;
        const created: Pledge = { id: randomId, ...newPledge };
        setPledges(prev => [created, ...prev]);

        // Send a simulated WhatsApp message in demo mode
        if (onAddSimulatedMessage) {
          const msg = `📢 *Pledge Logged*: Thank you Richard Mayore for logging a pledge of KES ${Number(formAmount).toLocaleString()} from ${formName} for "${getProjectName(formProjectId)}". Due date: ${formDueDate}.`;
          await onAddSimulatedMessage(msg);
        }
      } else {
        if (db) {
          await addDoc(collection(db, "pledges"), newPledge);
          
          // Trigger simulated WhatsApp webhook notification if helper exists
          if (onAddSimulatedMessage) {
            const msg = `📢 *Pledge Logged*: Thank you *${formName}* for pledging KES ${Number(formAmount).toLocaleString()} toward *${getProjectName(formProjectId)}*. Expected fulfillment date: ${formDueDate}.`;
            await onAddSimulatedMessage(msg);
          }
        }
      }

      // Publish PledgeCreated event to the intelligent platform event bus
      const pledgeId = `pledge_evt_${Date.now()}`;
      EventBus.publish("PledgeCreated", {
        pledge: { id: pledgeId, ...newPledge }
      }, isDemoMode).catch(console.error);

      // Reset form & close
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormAmount("");
      setFormDueDate("");
      setFormPurpose("");
      setFormNotes("");
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(`Failed to save pledge: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record manual payment against pledge
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRecordPaymentModal || !paymentAmount) return;

    const pledge = showRecordPaymentModal;
    const payAmt = Number(paymentAmount);
    const txCode = paymentTxCode.trim() || `TX-M-${Date.now().toString().substring(7)}`;

    const newPaidAmount = pledge.paidAmount + payAmt;
    const newBalance = Math.max(0, pledge.pledgedAmount - newPaidAmount);
    const newStatus = newBalance === 0 ? "Completed" : "Partial";

    const updatedPaymentHistory = [
      ...(pledge.paymentHistory || []),
      {
        id: `pay-${Date.now()}`,
        amount: payAmt,
        timestamp: new Date().toISOString(),
        transactionCode: txCode
      }
    ];

    try {
      if (isDemoMode) {
        setPledges(prev => prev.map(p => {
          if (p.id === pledge.id) {
            return {
              ...p,
              paidAmount: newPaidAmount,
              balance: newBalance,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              paymentHistory: updatedPaymentHistory
            };
          }
          return p;
        }));

        // Send manual contribution back into the loop to record general stats too
        await onAddManualContribution({
          projectId: pledge.projectId,
          amount: payAmt,
          senderName: pledge.donorName,
          senderPhone: pledge.phone,
          transactionCode: txCode,
          notes: `Fulfillment payment toward pledge of KES ${pledge.pledgedAmount.toLocaleString()}.`,
          category: "Pledge Fulfillment"
        });
      } else {
        if (db) {
          const pledgeRef = doc(db, "pledges", pledge.id);
          await updateDoc(pledgeRef, {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            paymentHistory: updatedPaymentHistory
          });

          // Register contribution
          await onAddManualContribution({
            projectId: pledge.projectId,
            amount: payAmt,
            senderName: pledge.donorName,
            senderPhone: pledge.phone,
            transactionCode: txCode,
            notes: `Fulfillment payment toward pledge of KES ${pledge.pledgedAmount.toLocaleString()}.`,
            category: "Pledge Fulfillment"
          });
        }
      }

      // If completed, trigger celebration animation
      if (newBalance === 0) {
        setCelebratedPledge(pledge);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);

        if (onAddSimulatedMessage) {
          await onAddSimulatedMessage(`🎉 *PLEDGE FULFILLED!* Thank you *${pledge.donorName}* for completing your pledge of KES ${pledge.pledgedAmount.toLocaleString()} toward *${getProjectName(pledge.projectId)}*. May God bless your abundant generosity!`);
        }
      } else {
        if (onAddSimulatedMessage) {
          await onAddSimulatedMessage(`🟢 *Pledge Partial Payment*: Received KES ${payAmt.toLocaleString()} from *${pledge.donorName}* for *${getProjectName(pledge.projectId)}*. Remaining pledge balance: KES ${newBalance.toLocaleString()}.`);
        }
      }

      // Reset
      setPaymentAmount("");
      setPaymentTxCode("");
      setPaymentNotes("");
      setShowRecordPaymentModal(null);
    } catch (err) {
      console.error("Error recording pledge payment:", err);
    }
  };

  // Send Gentle WhatsApp Reminder manually
  const handleSendReminder = async (pledge: Pledge) => {
    if (!onAddSimulatedMessage) return;
    const msg = `🔔 *Friendly Reminder*: Dear *${pledge.donorName}*, this is a gentle reminder of your pending pledge balance of *KES ${pledge.balance.toLocaleString()}* toward the *${getProjectName(pledge.projectId)}*. Expected date: ${pledge.dueDate}. Paybill: 225588, Account: MAKUENI-BUS. Thank you for your continued support!`;
    await onAddSimulatedMessage(msg);
  };

  // Find exact unassigned contributions that might belong to the pledge
  const getPossibleMatches = (pledge: Pledge) => {
    // Return contributions that have similar name or phone and haven't been reconciled to a pledge yet
    return contributions.filter(c => {
      // Check if phone matches
      const phoneMatch = c.senderPhone && pledge.phone && (c.senderPhone.includes(pledge.phone) || pledge.phone.includes(c.senderPhone));
      // Check if name is similar
      const nameMatch = c.senderName && pledge.donorName && (
        c.senderName.toLowerCase().includes(pledge.donorName.toLowerCase()) || 
        pledge.donorName.toLowerCase().includes(c.senderName.toLowerCase())
      );
      // Ensure the contribution isn't already explicitly bound to a payment history ID (prevent double counts)
      const alreadyUsed = pledges.some(p => p.paymentHistory?.some(h => h.transactionCode === c.transactionCode));

      return (phoneMatch || nameMatch) && !alreadyUsed && c.projectId === pledge.projectId;
    });
  };

  // Approve potential AI match
  const handleApproveMatch = async (pledge: Pledge, contribution: Contribution) => {
    const payAmt = contribution.amount;
    const txCode = contribution.transactionCode;

    const newPaidAmount = pledge.paidAmount + payAmt;
    const newBalance = Math.max(0, pledge.pledgedAmount - newPaidAmount);
    const newStatus = newBalance === 0 ? "Completed" : "Partial";

    const updatedPaymentHistory = [
      ...(pledge.paymentHistory || []),
      {
        id: `pay-${Date.now()}`,
        amount: payAmt,
        timestamp: contribution.timestamp,
        transactionCode: txCode
      }
    ];

    try {
      if (isDemoMode) {
        setPledges(prev => prev.map(p => {
          if (p.id === pledge.id) {
            return {
              ...p,
              paidAmount: newPaidAmount,
              balance: newBalance,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              paymentHistory: updatedPaymentHistory
            };
          }
          return p;
        }));
      } else {
        if (db) {
          const pledgeRef = doc(db, "pledges", pledge.id);
          await updateDoc(pledgeRef, {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            paymentHistory: updatedPaymentHistory
          });
        }
      }

      if (newBalance === 0) {
        setCelebratedPledge(pledge);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
        
        if (onAddSimulatedMessage) {
          await onAddSimulatedMessage(`🎉 *AI Match Reconciled!* Pledge completed. Thank you *${pledge.donorName}* for fulfilling your pledge of KES ${pledge.pledgedAmount.toLocaleString()} toward *${getProjectName(pledge.projectId)}*!`);
        }
      } else {
        if (onAddSimulatedMessage) {
          await onAddSimulatedMessage(`🟢 *AI Match Approved*: KES ${payAmt.toLocaleString()} contribution mapped to *${pledge.donorName}*'s pledge. Balance outstanding: KES ${newBalance.toLocaleString()}.`);
        }
      }
    } catch (err) {
      console.error("AI Match reconciliation failed:", err);
    }
  };

  // CSV Exporter for Pledges Reports
  const exportToCSV = () => {
    const headers = ["Donor Name", "Phone", "Email", "Fundraiser", "Pledged Amount", "Paid Amount", "Balance", "Due Date", "Status", "Notes"];
    const rows = filteredPledges.map(p => [
      p.donorName,
      p.phone,
      p.email || "",
      getProjectName(p.projectId),
      p.pledgedAmount,
      p.paidAmount,
      p.balance,
      p.dueDate,
      p.status,
      p.notes || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pledges_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF mockup
  const exportToPDF = () => {
    alert("📄 Generating PDF summary brief of outstanding, aging, and completed pledges. Preparing report metadata for local print-spooler queue...");
  };

  // Pledge Selected Details Panel
  const selectedPledge = useMemo(() => {
    if (!selectedPledgeId) return null;
    return pledges.find(p => p.id === selectedPledgeId) || null;
  }, [pledges, selectedPledgeId]);

  // Handle auto-reconciliation hooks on mount/contributions change
  // If exact name and exact phone match, we automatically reconcile.
  useEffect(() => {
    const autoReconcile = async () => {
      // Look for completed contributions that match a pending/partial pledge exactly by phone and project
      for (const pledge of pledges) {
        if (pledge.status === "Completed") continue;

        const possibleDirectMatches = contributions.filter(c => {
          const exactPhone = c.senderPhone && pledge.phone && c.senderPhone.trim() === pledge.phone.trim();
          const matchesProject = c.projectId === pledge.projectId;
          const alreadyMatched = pledge.paymentHistory?.some(h => h.transactionCode === c.transactionCode);
          const matchedByOther = pledges.some(p => p.id !== pledge.id && p.paymentHistory?.some(h => h.transactionCode === c.transactionCode));
          
          return exactPhone && matchesProject && !alreadyMatched && !matchedByOther;
        });

        for (const match of possibleDirectMatches) {
          // Automatic exact match trigger!
          console.log(`[RECONCILIATION ENGINE] Auto-matching exact transaction ${match.transactionCode} to pledge ${pledge.id}`);
          await handleApproveMatch(pledge, match);
        }
      }
    };

    if (pledges.length > 0 && contributions.length > 0) {
      autoReconcile();
    }
  }, [contributions, pledges.length]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 text-slate-100 min-h-full">
      {/* Celebration Backdrop animation */}
      {showCelebration && celebratedPledge && (
        <div className="fixed inset-0 z-50 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in h-screen w-screen">
          <div className="space-y-6 max-w-md animate-scale-up">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
              <Sparkles className="w-12 h-12 text-slate-950 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full uppercase font-mono font-bold tracking-widest">Pledge Completed</span>
              <h3 className="text-2xl font-black text-white">May God Bless {celebratedPledge.donorName}!</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Successfully completed the pledged contribution of <strong className="text-emerald-400">KES {celebratedPledge.pledgedAmount.toLocaleString()}</strong> toward the campaign fundraiser.
              </p>
            </div>
            <button 
              onClick={() => setShowCelebration(false)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Back to Command Center
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-emerald-400" /> Pledge Management Console
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Record fundraising promises, track payment statuses, and trigger automated reconciliation processes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" /> Export CSV
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Pledge
            </button>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search pledges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-200"
              />
            </div>
            
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer min-h-[40px]"
            >
              <option value="all">All Fundraisers</option>
              {dropdownProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer min-h-[40px]"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">🟢 Completed</option>
              <option value="Partial">🟡 Partial</option>
              <option value="Pending">🔴 Pending</option>
              <option value="Overdue">⚫ Overdue</option>
            </select>
          </div>

          <div className="text-[10px] font-mono text-slate-500">
            Showing {filteredPledges.length} of {pledges.length} pledges
          </div>
        </div>

        {/* Dashboard Summary Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1 z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Total Promised Pledges</span>
              <h3 className="text-xl font-black text-white">KES {stats.totalPledged.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400">Committed funding pipeline</p>
            </div>
            <div className="p-2.5 bg-emerald-500/5 text-emerald-400 rounded-xl z-10">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1 z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Total Received</span>
              <h3 className="text-xl font-black text-emerald-400">KES {stats.totalReceived.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400">Collected amount</p>
            </div>
            <div className="p-2.5 bg-emerald-500/5 text-emerald-400 rounded-xl z-10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1 z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Outstanding Balance</span>
              <h3 className="text-xl font-black text-rose-400">KES {stats.outstanding.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400">Collection Rate: <strong className="text-white">{stats.rate}%</strong></p>
            </div>
            <div className="p-2.5 bg-rose-500/5 text-rose-400 rounded-xl z-10">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mb-1.5">Collection Funnel Status</span>
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] font-bold">
              <div className="p-1.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded-lg">
                <span>{stats.completedCount}</span>
                <span className="block text-[8px] mt-0.5 text-slate-500">Comp</span>
              </div>
              <div className="p-1.5 bg-amber-950/20 text-amber-400 border border-amber-900/30 rounded-lg">
                <span>{stats.partialCount}</span>
                <span className="block text-[8px] mt-0.5 text-slate-500">Part</span>
              </div>
              <div className="p-1.5 bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 rounded-lg">
                <span>{stats.pendingCount}</span>
                <span className="block text-[8px] mt-0.5 text-slate-500">Pend</span>
              </div>
              <div className="p-1.5 bg-rose-950/20 text-rose-400 border border-rose-900/30 rounded-lg">
                <span>{stats.overdueCount}</span>
                <span className="block text-[8px] mt-0.5 text-slate-500">Over</span>
              </div>
            </div>
          </div>

        </div>

        {/* Master Details Work Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT/CENTER: Searchable Pledge Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-400">Ledger of Active Pledges</h3>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded">Subscribers Only</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                <p className="text-xs">Synchronizing local pledge cache with server data...</p>
              </div>
            ) : filteredPledges.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Coins className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-xs font-bold text-slate-300">No pledges match your filters</p>
                <p className="text-[10px] text-slate-500">Try adjusting search parameters or create a new fundraiser pledge.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500">
                      <th className="p-4">Donor Name / Phone</th>
                      <th className="p-4">Fundraiser</th>
                      <th className="p-4 text-right">Commitment</th>
                      <th className="p-4 text-right">Paid</th>
                      <th className="p-4 text-right">Balance</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {filteredPledges.map((p) => {
                      const overdue = p.balance > 0 && new Date(p.dueDate).getTime() < Date.now();
                      const displayStatus = overdue ? "Overdue" : p.status;
                      
                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => setSelectedPledgeId(p.id)}
                          className={`hover:bg-slate-850/40 transition cursor-pointer ${selectedPledgeId === p.id ? "bg-slate-850/60 border-l-2 border-emerald-500" : ""}`}
                        >
                          <td className="p-4">
                            <div className="font-bold text-white leading-tight">{p.donorName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{p.phone}</div>
                          </td>
                          <td className="p-4 text-slate-300 truncate max-w-[120px]">
                            {getProjectName(p.projectId)}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-300">
                            KES {p.pledgedAmount.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono text-emerald-400">
                            KES {p.paidAmount.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-rose-300">
                            KES {p.balance.toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[10px]">
                            {p.dueDate}
                          </td>
                          <td className="p-4">
                            {displayStatus === "Completed" && (
                              <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 text-[9px] font-bold rounded-md font-mono">
                                🟢 Completed
                              </span>
                            )}
                            {displayStatus === "Partial" && (
                              <span className="px-2 py-0.5 bg-amber-950/60 text-amber-400 border border-amber-900/40 text-[9px] font-bold rounded-md font-mono">
                                🟡 Partial
                              </span>
                            )}
                            {displayStatus === "Pending" && (
                              <span className="px-2 py-0.5 bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 text-[9px] font-bold rounded-md font-mono">
                                🔴 Pending
                              </span>
                            )}
                            {displayStatus === "Overdue" && (
                              <span className="px-2 py-0.5 bg-rose-950/60 text-rose-400 border border-rose-900/40 text-[9px] font-bold rounded-md font-mono">
                                ⚫ Overdue
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {p.balance > 0 && (
                                <button
                                  onClick={() => setShowRecordPaymentModal(p)}
                                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 rounded-lg hover:text-emerald-300 transition"
                                  title="Log payment manually"
                                >
                                  <Coins className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleSendReminder(p)}
                                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-lg hover:text-indigo-300 transition"
                                title="Send gentle WhatsApp reminder"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Selected Detail Panel & Action Board */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[500px]">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-400">Pledge Dossier</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {!selectedPledge ? (
              <div className="p-8 text-center text-slate-500 space-y-4">
                <div className="w-14 h-14 bg-slate-950/50 rounded-full flex items-center justify-center mx-auto text-slate-700">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-[200px] mx-auto">
                  <p className="text-xs font-bold text-slate-300">No profile selected</p>
                  <p className="text-[10px]">Tap any row in the active pledge ledger to inspect donor timeline, WhatsApp records, and payment audits.</p>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                
                {/* Profile Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white text-base font-black font-mono uppercase">
                    {selectedPledge.donorName.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white leading-tight truncate">{selectedPledge.donorName}</h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{selectedPledge.phone}</span>
                    {selectedPledge.email && <span className="text-[10px] text-slate-500 block font-mono truncate">{selectedPledge.email}</span>}
                  </div>
                </div>

                {/* Financial Overview Gauge */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>Fulfillment Level</span>
                    <span className="text-white font-bold">{selectedPledge.pledgedAmount > 0 ? Math.round((selectedPledge.paidAmount / selectedPledge.pledgedAmount) * 100) : 0}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${selectedPledge.pledgedAmount > 0 ? Math.round((selectedPledge.paidAmount / selectedPledge.pledgedAmount) * 100) : 0}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center pt-1">
                    <div className="text-left">
                      <span className="text-[8px] uppercase text-slate-500 font-bold font-mono block">Paid Amount</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">KES {selectedPledge.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-left border-l border-slate-900 pl-3">
                      <span className="text-[8px] uppercase text-slate-500 font-bold font-mono block">Remaining Due</span>
                      <span className="text-xs font-black text-rose-400 font-mono">KES {selectedPledge.balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-850">
                    <span className="text-slate-500 font-medium">Associated Fundraiser</span>
                    <span className="text-slate-300 font-bold truncate max-w-[150px]">{getProjectName(selectedPledge.projectId)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-850">
                    <span className="text-slate-500 font-medium">Expected Via</span>
                    <span className="text-indigo-400 font-mono font-bold uppercase">{selectedPledge.expectedPaymentMethod || "M-PESA"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-850">
                    <span className="text-slate-500 font-medium">Deadline Target</span>
                    <span className="text-slate-300 font-mono font-bold">{selectedPledge.dueDate}</span>
                  </div>
                  {selectedPledge.purpose && (
                    <div className="py-1">
                      <span className="text-slate-500 font-medium block">Pledge Purpose</span>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-850">{selectedPledge.purpose}</p>
                    </div>
                  )}
                  {selectedPledge.notes && (
                    <div className="py-1">
                      <span className="text-slate-500 font-medium block">Internal Admin Notes</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed italic">"{selectedPledge.notes}"</p>
                    </div>
                  )}
                </div>

                {/* AI SUGGESTED MATCH PANEL */}
                {selectedPledge.balance > 0 && getPossibleMatches(selectedPledge).length > 0 && (
                  <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl space-y-3.5 animate-pulse">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <h4 className="text-[11px] font-black font-mono tracking-wider uppercase">Possible M-PESA Match Suggestion</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      We discovered a matching incoming contribution with a similar name, phone, or fundraiser target. Reconcile now to reduce balance.
                    </p>

                    <div className="space-y-2">
                      {getPossibleMatches(selectedPledge).map((match) => (
                        <div key={match.id} className="p-2.5 bg-slate-950 rounded-xl border border-indigo-900/30 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-white block truncate max-w-[140px]">{match.senderName}</span>
                            <span className="text-[9px] text-slate-500 block font-mono">{match.transactionCode} (KES {match.amount.toLocaleString()})</span>
                          </div>
                          <button
                            onClick={() => handleApproveMatch(selectedPledge, match)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Approve Match
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAYMENT HISTORY AUDIT TRAIL */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black font-mono tracking-wider uppercase text-slate-500">Fulfillment Audit Timeline</h4>
                  {!selectedPledge.paymentHistory || selectedPledge.paymentHistory.length === 0 ? (
                    <div className="text-center p-4 bg-slate-950/30 border border-slate-850/60 rounded-xl text-[10px] text-slate-500">
                      No payments processed yet. Waiting for M-PESA callbacks or manual audit entry.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedPledge.paymentHistory.map((history) => (
                        <div key={history.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-white font-mono">KES {history.amount.toLocaleString()}</span>
                              <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{history.transactionCode}</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">{new Date(history.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RECENT WHATSAPP LOGS */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black font-mono tracking-wider uppercase text-slate-500">Recent WhatsApp Correspondence</h4>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 max-h-32 overflow-y-auto space-y-2 font-sans text-[10px] text-slate-400">
                    <div className="flex gap-1.5 items-start">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      <p>Initial: "Thank you for pledging KES {selectedPledge.pledgedAmount.toLocaleString()} toward the campaign."</p>
                    </div>
                    {selectedPledge.paidAmount > 0 && (
                      <div className="flex gap-1.5 items-start">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                        <p>Installment update: "Friendly reminder of your remaining pledge balance of KES {selectedPledge.balance.toLocaleString()}."</p>
                      </div>
                    )}
                    {selectedPledge.balance === 0 && (
                      <div className="flex gap-1.5 items-start">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
                        <p>Complete: "Thank you for completing your pledge. May God bless your generosity."</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* CREATE NEW PLEDGE MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" /> Log Supporter Pledge Commitment
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl animate-fade-in">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreatePledge} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Donor Name:</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Richard Mayore"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Phone Number (254...):</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 254712345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Email Address (optional):</label>
                  <input 
                    type="email"
                    placeholder="e.g. name@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Fundraiser Target:</label>
                  <select 
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 cursor-pointer min-h-[40px]"
                  >
                    <option value="" disabled>Select Fundraiser...</option>
                    {dropdownProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Pledged Amount (KES):</label>
                  <input 
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Expected Due Date:</label>
                  <input 
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Expected Payment Method:</label>
                  <select 
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 cursor-pointer"
                  >
                    <option value="M-PESA">M-PESA Paybill</option>
                    <option value="Cash">Physical Cash</option>
                    <option value="Bank">Bank Wire Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Purpose / Tag:</label>
                  <input 
                    type="text"
                    placeholder="e.g. Committee Installment"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Internal Reminder Notes:</label>
                <textarea 
                  placeholder="e.g. Requested a gentle WhatsApp check-in on the due date."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 h-14 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl transition font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? "Logging Pledge..." : "Commit Pledge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL OVERLAY */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" /> Manual Payment Settlement
              </h3>
              <button 
                onClick={() => setShowRecordPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 block font-mono">Pledge Supporter</span>
                <strong className="text-slate-800">{showRecordPaymentModal.donorName} ({showRecordPaymentModal.phone})</strong>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200/60">
                  <span>Pledge Total: KES {showRecordPaymentModal.pledgedAmount.toLocaleString()}</span>
                  <span className="text-rose-600 font-bold">Outstanding: KES {showRecordPaymentModal.balance.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Receipt Fulfillment Amount (KES):</label>
                <input 
                  type="number"
                  required
                  placeholder={`Max KES ${showRecordPaymentModal.balance}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Payment Channel:</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 cursor-pointer"
                  >
                    <option value="M-PESA">M-PESA (Simulated)</option>
                    <option value="Cash">Physical Cash</option>
                    <option value="Bank">Bank Deposit</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Receipt / Tx Code (optional):</label>
                  <input 
                    type="text"
                    placeholder="e.g. QRL83K9D4J"
                    value={paymentTxCode}
                    onChange={(e) => setPaymentTxCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Internal Note:</label>
                <input 
                  type="text"
                  placeholder="Fulfillment received on Sunday service."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowRecordPaymentModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl transition font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
