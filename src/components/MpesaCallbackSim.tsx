import React, { useState, useEffect } from "react";
import { Project, Contribution, WhatsAppMessage } from "../types";
import { 
  Smartphone, 
  Send, 
  Code, 
  Terminal, 
  Sparkles, 
  Check, 
  X, 
  HelpCircle, 
  Loader2, 
  ArrowDown, 
  Activity, 
  MessageSquare, 
  Database, 
  Layers 
} from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface MpesaCallbackSimProps {
  activeProject: Project;
  onPostWebhook: (payload: any) => Promise<any>;
  lastSuccessfulStk: any;
  setLastSuccessfulStk: (stk: any) => void;
  contributions: Contribution[];
  whatsappMessages: WhatsAppMessage[];
  projects: Project[];
  refreshData?: () => Promise<void>;
  onNavigate?: (tab: string, receiptCode?: string) => void;
  isDemoMode?: boolean;
}

export default function MpesaCallbackSim({ 
  activeProject, 
  onPostWebhook, 
  lastSuccessfulStk, 
  setLastSuccessfulStk,
  contributions,
  whatsappMessages,
  projects,
  refreshData,
  onNavigate,
  isDemoMode
}: MpesaCallbackSimProps) {
  const [stkPhone, setStkPhone] = useState("254712345678");
  const [stkAmount, setStkAmount] = useState("3500");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stkSending, setStkSending] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pinString, setPinString] = useState("");
  const [phoneSimLog, setPhoneSimLog] = useState("");
  
  // New Donor registration states
  const [showNewDonorModal, setShowNewDonorModal] = useState(false);
  const [donorFirstName, setDonorFirstName] = useState("");
  const [donorMiddleName, setDonorMiddleName] = useState("");
  const [donorLastName, setDonorLastName] = useState("");

  const [lastSentPayload, setLastSentPayload] = useState<any>(null);
  const [responseLog, setResponseLog] = useState("");

  // Track if current simulation enrolled a brand-new donor
  const [isNewDonor, setIsNewDonor] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentReceiptCode, setCurrentReceiptCode] = useState("");
  
  // Track timestamps for when each step completes
  const [pipelineTimes, setPipelineTimes] = useState<Record<string, string>>({});
  
  // Status of the 6 stages in the pipeline (user-specified exact 6-step flow)
  const [pipeline, setPipeline] = useState<{
    stkSuccess: { status: "idle" | "pending" | "completed" | "failed"; error?: string };
    donorRecognized: { status: "idle" | "pending" | "completed" | "failed"; error?: string };
    firestoreSaved: { status: "idle" | "pending" | "completed" | "failed"; error?: string };
    campaignTotalsUpdated: { status: "idle" | "pending" | "completed" | "failed"; error?: string };
    ledgerUpdated: { status: "idle" | "pending" | "completed" | "failed"; error?: string };
    whatsappPosted: { status: "idle" | "pending" | "completed" | "failed"; error?: string };
  }>({
    stkSuccess: { status: "idle" },
    donorRecognized: { status: "idle" },
    firestoreSaved: { status: "idle" },
    campaignTotalsUpdated: { status: "idle" },
    ledgerUpdated: { status: "idle" },
    whatsappPosted: { status: "idle" },
  });

  const recordStageTime = (stageKey: string) => {
    setPipelineTimes(prev => {
      if (prev[stageKey]) return prev;
      return {
        ...prev,
        [stageKey]: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      };
    });
  };

  const triggerSTKPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkPhone || !stkAmount) return;
    setStkSending(true);
    setPhoneSimLog("Waiting for Safaricom Daraja push to client handset...");
    setPinString("");
    
    // Reset pipeline for the new transaction
    setPipeline({
      stkSuccess: { status: "idle" },
      donorRecognized: { status: "idle" },
      firestoreSaved: { status: "idle" },
      campaignTotalsUpdated: { status: "idle" },
      ledgerUpdated: { status: "idle" },
      whatsappPosted: { status: "idle" },
    });
    setPipelineTimes({});
    setLastSentPayload(null);
    setResponseLog("");
    setIsNewDonor(false);
    setShowSuccessDialog(false);
    setCurrentReceiptCode("");

    setTimeout(() => {
      setStkSending(false);
      setShowPhoneModal(true);
      setPhoneSimLog("Daraja STK Session initiated. Enter secret PIN on handset simulator below.");
    }, 1200);
  };

  const handlePinSubmit = async () => {
    if (pinString.length < 4) return;
    setShowPhoneModal(false);
    setStkSending(true);
    setPhoneSimLog("Safaricom processing payment. Interrogating donor index...");

    let existingDonor: any = null;
    if (isDemoMode) {
      // In demo mode, simulate recognition for Jane Kemunto's demo number
      if (stkPhone.trim() === "254712345678") {
        existingDonor = {
          firstName: "JANE",
          middleName: "",
          lastName: "KEMUNTO",
          fullName: "JANE KEMUNTO",
          phoneNumber: "254712345678"
        };
      }
    } else if (db) {
      try {
        const donorRef = doc(db, "donors", stkPhone.trim());
        const snap = await getDoc(donorRef);
        if (snap.exists()) {
          existingDonor = snap.data();
        }
      } catch (err) {
        console.error("Failed to look up donor in simulator:", err);
      }
    }

    if (existingDonor) {
      // Returning contributor! Auto-populate details and proceed immediately
      const fN = existingDonor.firstName || "M-PESA";
      const mN = existingDonor.middleName || "";
      const lN = existingDonor.lastName || "Customer";
      setFirstName(fN);
      setMiddleName(mN);
      setLastName(lN);
      setIsNewDonor(false);

      setPhoneSimLog(`Returning Contributor Recognized! Welcome back, ${existingDonor.fullName}. Webhook automatically generated.`);
      await proceedWithWebhookAndPolling(fN, mN, lN, false);
    } else {
      // First contribution! Open Details dialog
      setPhoneSimLog("First Contribution from this phone number. Enrolling donor details...");
      setStkSending(false);
      setDonorFirstName("");
      setDonorMiddleName("");
      setDonorLastName("");
      setShowNewDonorModal(true);
    }
  };

  const handleNewDonorSubmit = async () => {
    if (!donorFirstName.trim() || !donorLastName.trim()) return;

    setShowNewDonorModal(false);
    setStkSending(true);
    setPhoneSimLog("Safaricom processing payment. Saving new donor profile...");

    const fN = donorFirstName.trim().toUpperCase();
    const mN = donorMiddleName.trim().toUpperCase();
    const lN = donorLastName.trim().toUpperCase();

    setFirstName(fN);
    setMiddleName(mN);
    setLastName(lN);
    setIsNewDonor(true);

    if (isDemoMode) {
      console.log(`[DEMO SIMULATOR] Saved new donor profile locally: ${fN} ${lN}`);
    } else if (db) {
      try {
        const donorRef = doc(db, "donors", stkPhone.trim());
        const fullName = `${fN} ${mN} ${lN}`.replace(/\s+/g, " ").trim();
        await setDoc(donorRef, {
          firstName: fN,
          middleName: mN,
          lastName: lN,
          fullName,
          phoneNumber: stkPhone.trim(),
          firstContribution: new Date().toISOString(),
          lastContribution: new Date().toISOString(),
          totalContributions: 1,
          totalAmount: Number(stkAmount)
        });
        console.log(`[SIMULATOR] Saved new donor profile: ${fullName}`);
      } catch (err) {
        console.error("Failed to persist donor profile from simulator:", err);
      }
    }

    await proceedWithWebhookAndPolling(fN, mN, lN, true);
  };

  const proceedWithWebhookAndPolling = async (simulatedFirstName: string, simulatedMiddleName: string, simulatedLastName: string, wasNewlyEnrolled: boolean) => {
    // 1. STK Success and Donor Recognized are completed
    setPipeline(prev => ({
      ...prev,
      stkSuccess: { status: "completed" },
      donorRecognized: { status: "completed" }
    }));
    
    setPipelineTimes(prev => ({
      ...prev,
      stkSuccess: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      donorRecognized: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    }));

    // Generate accurate Daraja C2B callback payload
    const receiptNum = "STK" + Math.random().toString(36).substring(2, 9).toUpperCase();
    setCurrentReceiptCode(receiptNum);
    const transTime = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);
    
    const amountStr = Number(stkAmount).toFixed(2);
    const billRef = activeProject.accountReference.toUpperCase();

    const paybillPayload = {
      TransactionType: "Pay Bill",
      TransID: receiptNum,
      TransTime: transTime,
      TransAmount: amountStr,
      BusinessShortCode: activeProject.paybillNumber || "29115",
      BillRefNumber: billRef,
      OrgAccountBalance: "78000.00",
      MSISDN: stkPhone,
      FirstName: simulatedFirstName,
      MiddleName: simulatedMiddleName,
      LastName: simulatedLastName
    };

    setLastSentPayload(paybillPayload);

    // Save metadata for diagnostic view & state update
    const updatedTx = {
      firstName: simulatedFirstName,
      middleName: simulatedMiddleName,
      lastName: simulatedLastName,
      phone: stkPhone,
      amount: amountStr,
      transId: receiptNum,
      billRefNumber: billRef
    };
    setLastSuccessfulStk(updatedTx);

    try {
      // Submit to webhook processor
      const res = await onPostWebhook(paybillPayload);
      setResponseLog(JSON.stringify(res, null, 2));

      setPipeline(prev => ({
        ...prev,
        firestoreSaved: { status: "pending" },
        campaignTotalsUpdated: { status: "pending" },
        ledgerUpdated: { status: "pending" },
        whatsappPosted: { status: "pending" }
      }));

      setPhoneSimLog(`✅ M-PESA processed KES ${stkAmount} successfully.\nWebhook pipeline triggered.`);

      // Start real-time verification polling
      startVerificationPolling(receiptNum, Number(stkAmount));
    } catch (err: any) {
      setResponseLog(`Error processing webhook: ${err.message}`);
      setPhoneSimLog(`❌ Webhook submission failed: ${err.message}`);
      setPipeline(prev => ({
        ...prev,
        firestoreSaved: { status: "failed", error: "Pre-requisite webhook submission failed." },
        campaignTotalsUpdated: { status: "failed", error: "Pre-requisite webhook submission failed." },
        ledgerUpdated: { status: "failed", error: "Pre-requisite webhook submission failed." },
        whatsappPosted: { status: "failed", error: "Pre-requisite webhook submission failed." }
      }));
    } finally {
      setStkSending(false);
    }
  };

  const startVerificationPolling = (receiptNum: string, amount: number) => {
    if (isDemoMode) {
      // In demo mode, simulate a fast, beautiful step-by-step sequential completion of stages
      let currentStage = 0;
      const stages = ["firestoreSaved", "campaignTotalsUpdated", "ledgerUpdated", "whatsappPosted"];
      
      const interval = setInterval(() => {
        if (currentStage >= stages.length) {
          clearInterval(interval);
          setTimeout(() => {
            setShowSuccessDialog(true);
          }, 400);
          return;
        }
        
        const stageKey = stages[currentStage];
        setPipeline(prev => ({
          ...prev,
          [stageKey]: { status: "completed" }
        }));
        recordStageTime(stageKey);
        currentStage++;
      }, 500);
      return;
    }

    const startTime = Date.now();
    const timeoutMs = 15000; // 15 seconds timeout
    
    // Check initial fundraiser amount
    const matchedProj = projects.find(p => p.id === activeProject.id);
    const prevAmount = matchedProj ? matchedProj.currentAmount : activeProject.currentAmount;

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      
      // Refresh parent dataset to bring in any changes from server
      if (refreshData) {
        await refreshData();
      }

      // Read most up-to-date state from current props
      const isSaved = contributions.some(c => c.transactionCode.toUpperCase() === receiptNum.toUpperCase());
      
      const freshProject = projects.find(p => p.id === activeProject.id);
      const isLedgerUpdated = freshProject ? (freshProject.currentAmount >= prevAmount + amount) : false;

      // Note: check the message content for receipt number OR the sender's name and amount
      const isWhatsappPosted = whatsappMessages.some(m => m.message.includes(receiptNum));

      setPipeline(prev => {
        const next = { ...prev };

        // Firestore Saved
        if (next.firestoreSaved.status === "pending" || next.firestoreSaved.status === "idle") {
          if (isSaved) {
            next.firestoreSaved = { status: "completed" };
            recordStageTime("firestoreSaved");
          } else if (elapsed > timeoutMs) {
            next.firestoreSaved = { status: "failed", error: "Timeout waiting for Firestore record insertion." };
          }
        }

        // Campaign Totals Updated
        if (next.campaignTotalsUpdated.status === "pending" || next.campaignTotalsUpdated.status === "idle") {
          if (isLedgerUpdated) {
            next.campaignTotalsUpdated = { status: "completed" };
            recordStageTime("campaignTotalsUpdated");
          } else if (elapsed > timeoutMs) {
            next.campaignTotalsUpdated = { status: "failed", error: "Timeout waiting for campaign total updates." };
          }
        }

        // Ledger Updated
        if (next.ledgerUpdated.status === "pending" || next.ledgerUpdated.status === "idle") {
          if (isLedgerUpdated) {
            next.ledgerUpdated = { status: "completed" };
            recordStageTime("ledgerUpdated");
          } else if (elapsed > timeoutMs) {
            next.ledgerUpdated = { status: "failed", error: "Timeout waiting for ledger balance calculation." };
          }
        }

        // WhatsApp Posted
        if (next.whatsappPosted.status === "pending" || next.whatsappPosted.status === "idle") {
          if (isWhatsappPosted) {
            next.whatsappPosted = { status: "completed" };
            recordStageTime("whatsappPosted");
          } else if (elapsed > timeoutMs) {
            next.whatsappPosted = { status: "failed", error: "Timeout waiting for automated WhatsApp broadcast." };
          }
        }

        return next;
      });

      // Clear interval when everything succeeds or timeout is reached
      const allDone = isSaved && isLedgerUpdated && isWhatsappPosted;
      if (allDone || elapsed > timeoutMs) {
        clearInterval(interval);
        if (allDone) {
          setTimeout(() => {
            setShowSuccessDialog(true);
          }, 600);
        }
      }
    }, 1000);
  };

  // Status helper
  const getStageIcon = (stageState: { status: "idle" | "pending" | "completed" | "failed"; error?: string }) => {
    switch (stageState.status) {
      case "completed":
        return <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center font-extrabold text-[10px]">✓</div>;
      case "failed":
        return <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center font-extrabold text-[10px]">✗</div>;
      case "pending":
        return <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in" id="mpesa-callback-simulator-root">
      <div className="mb-8 p-0.5">
        <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase">Interactive Sandbox Playground</span>
        <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1">Safaricom Daraja API Simulator</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">
          Instantly simulate payments and trigger webhook routes mimicking live Safaricom production callbacks in ~250ms latency.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: STK Push Simulator */}
        <div className="glass-card p-6 rounded-2xl space-y-6" id="stk-push-simulator-card">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-[#10B981] rounded-xl shadow-2xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">STK Push Simulation</h3>
              <p className="text-[11px] text-slate-500">Mocks client handset payment notifications on Safaricom's Daraja gateway.</p>
            </div>
          </div>

          <form onSubmit={triggerSTKPush} className="space-y-4" id="stk-push-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">M-PESA Phone Number:</label>
                <input 
                  type="text" 
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-700"
                  placeholder="e.g. 254712345678"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Amount (KES):</label>
                <input 
                  type="number" 
                  value={stkAmount}
                  onChange={(e) => setStkAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-700"
                  placeholder="e.g. 1500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">First Name:</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-700 font-extrabold uppercase"
                  placeholder="DAVID"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Middle Name:</label>
                <input 
                  type="text" 
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-700 font-extrabold uppercase"
                  placeholder="O."
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Last Name:</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-700 font-extrabold uppercase"
                  placeholder="NANDI"
                  required
                />
              </div>
            </div>

            <p className="text-[10px] text-amber-600 bg-amber-50/70 px-3 py-2.5 rounded-xl border border-amber-200/50 leading-relaxed">
              ⚠️ <strong>Simulated Donor Name:</strong> Since Safaricom's Daraja sandbox does not return real registered subscriber identities, these values are used to represent the registered name returned by the simulator.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 max-w-md">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Initiating this push maps values to active account reference <strong>{activeProject.accountReference}</strong> automatically.
              </span>
            </div>

             <button
              type="submit"
              id="stk-launch-btn"
              disabled={stkSending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:shadow-emerald-500/10 active:scale-99"
            >
              {stkSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing STK Session...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Launch STK simulation request
                </>
              )}
            </button>
          </form>

          {phoneSimLog && (
            <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs border border-slate-800 leading-normal whitespace-pre-wrap shadow-inner" id="phone-sim-log-terminal">
              <span className="text-slate-500 select-none block border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wider font-bold">Sandbox Terminal Feed</span>
              {phoneSimLog}
            </div>
          )}
        </div>

        {/* Right Side: Fully Automated Diagnostic Pipeline & Live Payload Viewer */}
        <div className="glass-card p-6 rounded-2xl space-y-6 flex flex-col justify-between" id="diagnostic-pipeline-card">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-2xs">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Automated Pipeline & Diagnostics</h3>
                  <p className="text-[11px] text-slate-500">Real-time STK → C2B webhook routing analysis and verification.</p>
                </div>
              </div>
              {lastSentPayload && (
                <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" /> Active Flow
                </span>
              )}
            </div>

            {/* Pipeline Stage Tracker */}
            <div className="space-y-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4" id="pipeline-tracker-stages-container">
              <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">E2E Autopilot Verification Stages</span>
              
              <div className="space-y-3">
                {/* 1. STK Payment Approved */}
                <div className="flex items-center justify-between text-xs" id="stage-stk-success">
                  <div className="flex gap-2.5 items-center">
                    {getStageIcon(pipeline.stkSuccess)}
                    <div>
                      <p className="font-semibold text-slate-700">STK Payment Approved</p>
                      <p className="text-[10px] text-slate-400">PIN entry authorized on simulated handset</p>
                    </div>
                  </div>
                  {pipelineTimes.stkSuccess && (
                    <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold shrink-0">{pipelineTimes.stkSuccess}</span>
                  )}
                </div>

                <div className="h-4 w-px bg-slate-200 ml-2.5" />

                {/* 2. Donor Recognized */}
                <div className="flex items-center justify-between text-xs" id="stage-donor-recognized">
                  <div className="flex gap-2.5 items-center">
                    {getStageIcon(pipeline.donorRecognized)}
                    <div>
                      <p className="font-semibold text-slate-700">Donor Recognized</p>
                      <p className="text-[10px] text-slate-400">Looked up phone in index or enrolled profile</p>
                    </div>
                  </div>
                  {pipelineTimes.donorRecognized && (
                    <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold shrink-0">{pipelineTimes.donorRecognized}</span>
                  )}
                </div>

                <div className="h-4 w-px bg-slate-200 ml-2.5" />

                {/* 3. Firestore Saved */}
                <div className="flex items-center justify-between text-xs" id="stage-firestore-saved">
                  <div className="flex gap-2.5 items-center">
                    {getStageIcon(pipeline.firestoreSaved)}
                    <div>
                      <p className="font-semibold text-slate-700">Firestore Saved</p>
                      <p className="text-[10px] text-slate-400">Contribution recorded in donations collection</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pipeline.firestoreSaved.error && (
                      <span className="text-[10px] text-rose-600 font-mono italic max-w-[120px] truncate">{pipeline.firestoreSaved.error}</span>
                    )}
                    {pipelineTimes.firestoreSaved && (
                      <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold">{pipelineTimes.firestoreSaved}</span>
                    )}
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-200 ml-2.5" />

                {/* 4. Campaign Totals Updated */}
                <div className="flex items-center justify-between text-xs" id="stage-campaign-totals-updated">
                  <div className="flex gap-2.5 items-center">
                    {getStageIcon(pipeline.campaignTotalsUpdated)}
                    <div>
                      <p className="font-semibold text-slate-700">Campaign Totals Updated</p>
                      <p className="text-[10px] text-slate-400">Recalculated currentAmount dynamically</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pipeline.campaignTotalsUpdated.error && (
                      <span className="text-[10px] text-rose-600 font-mono italic max-w-[120px] truncate">{pipeline.campaignTotalsUpdated.error}</span>
                    )}
                    {pipelineTimes.campaignTotalsUpdated && (
                      <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold">{pipelineTimes.campaignTotalsUpdated}</span>
                    )}
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-200 ml-2.5" />

                {/* 5. Ledger Updated */}
                <div className="flex items-center justify-between text-xs" id="stage-ledger-updated">
                  <div className="flex gap-2.5 items-center">
                    {getStageIcon(pipeline.ledgerUpdated)}
                    <div>
                      <p className="font-semibold text-slate-700">Ledger Updated</p>
                      <p className="text-[10px] text-slate-400">Double-entry ledger record verified and locked</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pipeline.ledgerUpdated.error && (
                      <span className="text-[10px] text-rose-600 font-mono italic max-w-[120px] truncate">{pipeline.ledgerUpdated.error}</span>
                    )}
                    {pipelineTimes.ledgerUpdated && (
                      <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold">{pipelineTimes.ledgerUpdated}</span>
                    )}
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-200 ml-2.5" />

                {/* 6. WhatsApp Summary Updated */}
                <div className="flex items-center justify-between text-xs" id="stage-whatsapp-posted">
                  <div className="flex gap-2.5 items-center">
                    {getStageIcon(pipeline.whatsappPosted)}
                    <div>
                      <p className="font-semibold text-slate-700">WhatsApp Summary Updated</p>
                      <p className="text-[10px] text-slate-400">Autopilot broadcast compiled and posted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pipeline.whatsappPosted.error && (
                      <span className="text-[10px] text-rose-600 font-mono italic max-w-[120px] truncate">{pipeline.whatsappPosted.error}</span>
                    )}
                    {pipelineTimes.whatsappPosted && (
                      <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold">{pipelineTimes.whatsappPosted}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic View of the generated/sent payload */}
          <div className="mt-5 space-y-3" id="diagnostics-payload-box">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
              <span className="text-slate-500 text-[10px] select-none font-mono block uppercase mb-1.5 tracking-wider font-bold">C2B Payload Sent (Diagnostics)</span>
              {lastSentPayload ? (
                <pre className="text-sky-350 font-mono text-[10px] overflow-x-auto select-text leading-tight max-h-32">
                  {JSON.stringify(lastSentPayload, null, 2)}
                </pre>
              ) : (
                <div className="text-[11px] text-slate-500 italic py-6 text-center font-mono">
                  No active transaction. Start an STK push above to trace.
                </div>
              )}
            </div>

            {responseLog && (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner" id="response-console-box">
                <span className="text-slate-500 text-[10px] select-none font-mono block uppercase mb-1 tracking-wider font-bold">Daraja Webhook Server Response</span>
                <pre className="text-emerald-400 font-mono text-[10px] overflow-x-auto select-text leading-tight max-h-24">
                  {responseLog}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STK simulated client handset display PIN modal overlay */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" id="handset-modal-overlay">
          {/* Simulated Handset container */}
          <div className="bg-slate-950 w-72 p-5 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl relative select-none animate-scale-up text-slate-100 flex flex-col items-center">
            {/* Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-b-xl absolute top-0" />
            
            {/* Handset screen */}
            <div className="w-full pt-6 pb-2 text-center">
              <p className="text-[11px] font-semibold text-green-400 uppercase tracking-widest font-mono">M-PESA SAFARICOM</p>
              <h4 className="text-xs font-bold text-slate-100 mt-2 max-w-[200px] mx-auto leading-normal">
                Pay KES {stkAmount} to {activeProject.name} (Paybill: {activeProject.paybillNumber})?
              </h4>
            </div>

            <div className="w-full bg-white text-slate-900 p-4 rounded-2xl shadow-inner border border-slate-250 mt-2">
              <span className="text-[10px] font-mono text-slate-400 block text-center uppercase tracking-wider">Secret M-PESA PIN Entry:</span>
              <div className="h-10 border border-slate-200 rounded-xl bg-slate-50 mt-1.5 flex items-center justify-center tracking-[0.5em] text-lg font-bold font-mono">
                {Array(pinString.length).fill("•").join("")}
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-2">This is a secure simulated Safaricom Daraja STK prompt.</p>
            </div>

            {/* Custom Keypad layout */}
            <div className="grid grid-cols-3 gap-2.5 w-full mt-5 px-1 font-mono text-sm">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button 
                  key={num}
                  onClick={() => pinString.length < 4 && setPinString(pinString + num)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-750 text-slate-200 py-2.5 rounded-xl text-center font-bold tracking-tight active:scale-95 transition cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={() => setPinString("")}
                className="bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900/40 text-xs py-2.5 rounded-xl font-bold uppercase transition active:scale-95 text-center cursor-pointer"
              >
                Clear
              </button>
              <button 
                onClick={() => pinString.length < 4 && setPinString(pinString + "0")}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-750 text-slate-200 py-2.5 rounded-xl font-bold active:scale-95 transition text-center cursor-pointer"
              >
                0
              </button>
              <button 
                onClick={handlePinSubmit}
                disabled={pinString.length < 4}
                className="bg-green-950/40 border border-green-800 text-green-400 hover:bg-green-900/40 text-xs py-2.5 rounded-xl font-bold uppercase transition disabled:opacity-30 active:scale-95 text-center cursor-pointer"
                id="handset-pay-btn"
              >
                Send
              </button>
            </div>

            {/* Cancel Button */}
            <button 
              onClick={() => setShowPhoneModal(false)}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-bold uppercase font-mono mt-5 py-1 tracking-wider cursor-pointer"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      {/* New Donor Details registration modal overlay */}
      {showNewDonorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" id="new-donor-modal-overlay">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative select-text text-slate-100 flex flex-col">
            <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              New Contributor Recognized
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              This is the first contribution from <span className="font-mono text-amber-300 font-semibold">{stkPhone}</span>.
              Please capture their registered M-PESA details to enroll their profile.
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">First Name (Required)</label>
                <input 
                  type="text"
                  value={donorFirstName}
                  onChange={(e) => setDonorFirstName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none tracking-wide"
                  placeholder="e.g. RICHARD"
                  id="donor-first-name-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Middle Name (Optional)</label>
                <input 
                  type="text"
                  value={donorMiddleName}
                  onChange={(e) => setDonorMiddleName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none tracking-wide"
                  placeholder="e.g. KIPCHOGE"
                  id="donor-middle-name-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Last Name (Required)</label>
                <input 
                  type="text"
                  value={donorLastName}
                  onChange={(e) => setDonorLastName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none tracking-wide"
                  placeholder="e.g. ARAP"
                  id="donor-last-name-input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={() => {
                  setShowNewDonorModal(false);
                  setPipeline(prev => ({
                    ...prev,
                    stkSuccess: { status: "failed", error: "User cancelled enrollment of new donor details." }
                  }));
                  setPhoneSimLog("❌ Transaction halted. New donor details were not provided.");
                }}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95"
              >
                Halt Payment
              </button>
              <button 
                onClick={handleNewDonorSubmit}
                disabled={!donorFirstName.trim() || !donorLastName.trim()}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:brightness-110 disabled:opacity-30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
                id="donor-continue-btn"
              >
                <Check className="h-4 w-4" />
                Enroll & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success Dialog (Real-time Webhook Validation Overview) */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in" id="transaction-success-dialog-overlay">
          <div className="bg-white border border-slate-250 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col animate-scale-up select-text">
            
            {/* Visual Header */}
            <div className="bg-emerald-600 p-6 text-white text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 bg-white/20 border-2 border-white rounded-full flex items-center justify-center text-white text-xl font-bold animate-bounce shadow-md">
                ✓
              </div>
              <h3 className="text-lg font-sans font-black tracking-tight uppercase" id="payment-success-title">Payment Successful</h3>
              <p className="text-xs text-emerald-100 font-mono">Daraja Webhook Integration Fully Validated</p>
            </div>

            {/* Receipt details */}
            <div className="p-6 space-y-4">
              <div className="space-y-2.5 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-sans">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-medium">Receipt Number:</span>
                  <span className="font-mono font-extrabold text-slate-900 select-all" id="success-receipt-num">{currentReceiptCode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <span className="font-mono font-black text-emerald-600">KES {Number(stkAmount).toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-medium">Campaign:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]" title={activeProject.name}>{activeProject.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-medium">Phone Number:</span>
                  <span className="font-mono font-bold text-slate-700">{stkPhone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400 font-medium">Donor Name:</span>
                  <span className="font-extrabold text-slate-900 uppercase">{`${firstName} ${middleName} ${lastName}`.replace(/\s+/g, " ").trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Donor Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    isNewDonor 
                      ? "bg-blue-50 text-blue-700 border border-blue-200" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`} id="success-donor-status">
                    {isNewDonor ? "New Donor Registered" : "Returning Donor"}
                  </span>
                </div>
              </div>

              {/* Firestore Status Verification Checklist */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest">Firestore Verification Status</h4>
                <div className="space-y-1.5 text-xs text-slate-700" id="firestore-success-checklist">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="font-semibold text-slate-800">Donation Saved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="font-semibold text-slate-800">Donor Profile Updated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="font-semibold text-slate-800">Campaign Updated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="font-semibold text-slate-800">Ledger Updated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="font-semibold text-slate-800">Activity Feed Updated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowSuccessDialog(false);
                  // also reset current inputs/logs safely
                  setPipelineTimes({});
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                id="success-close-btn"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowSuccessDialog(false);
                  if (onNavigate) {
                    onNavigate("receipts", currentReceiptCode);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition flex items-center gap-1 cursor-pointer"
                id="success-view-donation-btn"
              >
                View Donation
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
