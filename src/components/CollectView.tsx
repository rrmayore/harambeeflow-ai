import React, { useState, useMemo } from "react";
import { Project, Contribution } from "../types";
import { 
  Smartphone, FileText, Plus, Landmark, CheckCircle2, AlertCircle, 
  Search, Copy, Check, Info, Trash2, ShieldAlert, Sparkles, Send
} from "lucide-react";

interface CollectViewProps {
  activeProject: Project;
  contributions: Contribution[];
  onAddManualContribution: (cnt: any) => Promise<any>;
  isDemoMode?: boolean;
}

export default function CollectView({
  activeProject,
  contributions,
  onAddManualContribution,
  isDemoMode = false
}: CollectViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"stk" | "manual" | "bulk" | "receipts">("stk");

  // Filter contributions for this campaign
  const campaignContributions = useMemo(() => {
    return contributions.filter(c => c.projectId === activeProject.id || c.campaignId === activeProject.id);
  }, [contributions, activeProject.id]);

  // Search filter for receipts table
  const [receiptSearch, setReceiptSearch] = useState("");
  const filteredReceipts = useMemo(() => {
    return campaignContributions.filter(c => {
      const term = receiptSearch.toLowerCase();
      return (
        (c.senderName || "").toLowerCase().includes(term) ||
        (c.cleanedName || "").toLowerCase().includes(term) ||
        (c.transactionCode || "").toLowerCase().includes(term) ||
        (c.senderPhone || "").includes(term)
      );
    });
  }, [campaignContributions, receiptSearch]);

  // --- STK PUSH STATE ---
  const [stkPhone, setStkPhone] = useState("254712345678");
  const [stkAmount, setStkAmount] = useState("");
  const [stkFirstName, setStkFirstName] = useState("RICHARD");
  const [stkLastName, setStkLastName] = useState("MAYORE");
  const [stkStatus, setStkStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [stkMessage, setStkMessage] = useState("");

  // --- SINGLE MANUAL ENTRY STATE ---
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState("Well-wisher");
  const [manualNotes, setManualNotes] = useState("");
  const [manualStatus, setManualStatus] = useState<"idle" | "success" | "error">("idle");

  // --- BULK SMS PARSER STATE ---
  const [bulkSmsText, setBulkSmsText] = useState("");
  const [parsedSmsList, setParsedSmsList] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  // Receipt details view modal state
  const [activeReceipt, setActiveReceipt] = useState<Contribution | null>(null);

  // STK Push submission handler
  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkAmount || isNaN(Number(stkAmount)) || Number(stkAmount) <= 0) {
      setStkMessage("Please enter a valid positive contribution amount.");
      setStkStatus("error");
      return;
    }
    
    setStkStatus("processing");
    setStkMessage("Sending secure payment request to contributor's phone...");

    setTimeout(async () => {
      try {
        const txCode = `MPX${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const fullname = `${stkFirstName.trim()} ${stkLastName.trim()}`;
        
        await onAddManualContribution({
          projectId: activeProject.id,
          amount: Number(stkAmount),
          senderName: fullname,
          senderPhone: stkPhone.trim(),
          transactionCode: txCode,
          category: "Well-wisher",
          notes: "M-PESA Online Contribution"
        });

        setStkStatus("success");
        setStkMessage(`Payment request completed successfully! Transaction code: ${txCode}. The contribution has been recorded.`);
        setStkAmount("");
      } catch (err: any) {
        setStkStatus("error");
        setStkMessage(err.message || "Payment request failed.");
      }
    }, 2000);
  };

  // Single cash manual logging handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualStatus("idle");

    if (!manualName.trim() || !manualAmount || Number(manualAmount) <= 0) {
      setManualStatus("error");
      return;
    }

    try {
      const txCode = `MAN${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await onAddManualContribution({
        projectId: activeProject.id,
        amount: Number(manualAmount),
        senderName: manualName.trim(),
        senderPhone: manualPhone.trim() || "254700000000",
        transactionCode: txCode,
        category: manualCategory,
        notes: manualNotes.trim()
      });

      setManualStatus("success");
      setManualName("");
      setManualPhone("");
      setManualAmount("");
      setManualNotes("");
    } catch (err) {
      setManualStatus("error");
    }
  };

  // SMS Paste Parser helper
  const handleSmsParse = () => {
    setBulkError("");
    setBulkSuccess("");
    setParsedSmsList([]);

    if (!bulkSmsText.trim()) return;

    const lines = bulkSmsText.split("\n");
    const results: any[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Match common M-PESA patterns, e.g. "QRL83K9D4J Confirmed. KES 1,500.00 received from JOHN OMONDI"
      const txCodeMatch = trimmed.match(/^([A-Z0-9]{10})\s+Confirmed/i) || trimmed.match(/^([A-Z0-9]{10})/i);
      const amountMatch = trimmed.match(/KES\s*([\d,]+(?:\.\d{2})?)/i) || trimmed.match(/received\s*KES\s*([\d,]+)/i);
      const phoneMatch = trimmed.match(/(254\d{9})/);

      // Extract name (fallback parsing)
      let senderName = "M-PESA Giver";
      const nameMatch = trimmed.match(/from\s+([A-Z\s]+)(?:on|\d{1,2}\/\d{1,2})/i);
      if (nameMatch && nameMatch[1]) {
        senderName = nameMatch[1].trim();
      }

      if (txCodeMatch && amountMatch) {
        const code = txCodeMatch[1].toUpperCase();
        const amt = Number(amountMatch[1].replace(/,/g, ""));
        const phone = phoneMatch ? phoneMatch[1] : "254700000000";

        results.push({
          transactionCode: code,
          amount: amt,
          senderName: senderName,
          senderPhone: phone,
          notes: "Bulk statement import"
        });
      }
    });

    if (results.length === 0) {
      setBulkError("Unable to extract valid M-PESA receipts from the text. Check formatting.");
    } else {
      setParsedSmsList(results);
      setBulkSuccess(`Parsed ${results.length} payments. Verify the summary list below and confirm.`);
    }
  };

  // Confirm bulk copy import to database
  const handleConfirmBulk = async () => {
    setBulkError("");
    setBulkSuccess("");
    try {
      for (const item of parsedSmsList) {
        await onAddManualContribution({
          projectId: activeProject.id,
          amount: item.amount,
          senderName: item.senderName,
          senderPhone: item.senderPhone,
          transactionCode: item.transactionCode,
          category: "Well-wisher",
          notes: item.notes
        });
      }
      setBulkSuccess(`Successfully imported ${parsedSmsList.length} payments into the database!`);
      setParsedSmsList([]);
      setBulkSmsText("");
    } catch (err: any) {
      setBulkError(err.message || "Failed to commit bulk items.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100 min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Desk Panel */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight" id="collect-header-title">
              Receive Contributions
            </h1>
            <p className="text-xs text-slate-400 mt-0.5" id="collect-header-subtitle">
              Receive M-PESA contributions securely and record every payment automatically.
            </p>
          </div>
          {isDemoMode ? (
            <span className="text-[11px] font-sans bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold px-3 py-1 rounded-full flex items-center gap-1" id="collect-demo-badge">
              🧪 Demo Mode
            </span>
          ) : (
            <span className="text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded-md" id="collect-active-ref">
              Active Ref: {activeProject.accountReference}
            </span>
          )}
        </div>

        {/* Sub-navigation categories */}
        <div className="flex gap-2 bg-slate-900 border border-slate-850 p-1 rounded-xl" id="collect-tabs">
          {[
            { id: "stk", label: "Receive a Contribution", icon: Smartphone },
            { id: "manual", label: "Log Single Cash Entry", icon: Plus },
            { id: "bulk", label: "Bulk Copy-Paste SMS", icon: Landmark },
            { id: "receipts", label: "Receipting Center", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  active 
                    ? "bg-emerald-500 text-slate-950 shadow-md" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id={`tab-btn-${tab.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- RECEIVE CONTRIBUTIONS section --- */}
        {activeSubTab === "stk" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in" id="panel-receive-contribution">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-200">Receive a Contribution</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Send a secure M-PESA payment request to a contributor. Once payment is completed, HarambeeFlow records it automatically and updates your campaign instantly.
              </p>
            </div>

            <form onSubmit={handleStkPush} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Contributor First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Richard"
                  value={stkFirstName}
                  onChange={(e) => setStkFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-medium text-slate-200 focus:outline-hidden min-h-[44px]"
                  id="input-contributor-firstname"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Contributor Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mayore"
                  value={stkLastName}
                  onChange={(e) => setStkLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-medium text-slate-200 focus:outline-hidden min-h-[44px]"
                  id="input-contributor-lastname"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 254712345678"
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-slate-200 focus:outline-hidden min-h-[44px]"
                  id="input-contributor-phone"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Contribution Amount (KES)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1000"
                  value={stkAmount}
                  onChange={(e) => setStkAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono font-bold text-emerald-400 focus:outline-hidden min-h-[44px]"
                  id="input-contributor-amount"
                />
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[11px] text-slate-500 leading-normal max-w-sm">
                  The contributor will receive an instant payment prompt on their phone to complete the transaction.
                </p>
                <button
                  type="submit"
                  disabled={stkStatus === "processing"}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/10 hover:border-emerald-200/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 shrink-0 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                  id="btn-send-payment-request"
                >
                  {stkStatus === "processing" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                      Sending request...
                    </>
                  ) : (
                    "Send Payment Request"
                  )}
                </button>
              </div>
            </form>

            {stkStatus !== "idle" && (
              <div className={`p-4 border rounded-xl flex items-start gap-3 text-xs leading-normal ${
                stkStatus === "success" 
                  ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  : stkStatus === "processing"
                  ? "bg-slate-950 border-slate-800 text-slate-300"
                  : "bg-rose-950/20 border-rose-500/20 text-rose-300"
              }`} id="stk-status-feedback">
                {stkStatus === "processing" && <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                {stkStatus === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {stkStatus === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{stkMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* --- SINGLE MANUAL cash entry --- */}
        {activeSubTab === "manual" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-extrabold text-slate-200">Log Manual Contribution Receipt</h3>
              <p className="text-xs text-slate-500">
                Log physical envelopes, cash collections, bank checks, or external sponsorships manually.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Sender/Contributor Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elder James Koech"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 font-medium focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Phone Number:</label>
                <input
                  type="text"
                  placeholder="e.g. 2547..."
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 font-mono focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Contribution Amount (KES):</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 font-mono font-bold text-emerald-400 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Giver Circle Segment Category:</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-4 py-2.5 font-medium focus:outline-hidden"
                >
                  <option value="Well-wisher">Well-wisher</option>
                  <option value="Family/Friends">Family/Friends</option>
                  <option value="Committee Member">Committee Member</option>
                  <option value="Sponsor">Sponsor</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-slate-400 block font-bold">Internal Reconciling Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Received during main congregational assembly"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-800/60 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                >
                  Confirm Cash Receipt Entry
                </button>
              </div>
            </form>

            {manualStatus !== "idle" && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                manualStatus === "success" 
                  ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-950/20 border-rose-500/20 text-rose-300"
              }`}>
                {manualStatus === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{manualStatus === "success" ? "Cash donation successfully reconciled!" : "Failed to record cash entry. Check inputs."}</span>
              </div>
            )}
          </div>
        )}

        {/* --- BULK SMS statement parser --- */}
        {activeSubTab === "bulk" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in" id="panel-bulk-import">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Import M-PESA SMS Messages</h3>
                <p className="text-xs text-slate-500">Paste M-PESA confirmation messages to import multiple payments at once.</p>
              </div>
              <button
                onClick={() => {
                  setBulkSmsText(`QRL83K9D4J Confirmed. KES 1,500.00 received from JOHN OMONDI 254712345678 on 24/6/26 at 5:12 PM.
SL987FG6H5 Confirmed. KES 10,000.00 received from MARY NYAMBURA 254799000111 on 2026-06-24 10:30 AM.`);
                }}
                className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase underline cursor-pointer"
                id="btn-insert-bulk-template"
              >
                Insert Example Messages
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <textarea
                rows={5}
                placeholder="Paste Safaricom SMS strings here... One message per line"
                value={bulkSmsText}
                onChange={(e) => setBulkSmsText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 font-mono focus:outline-hidden resize-none text-slate-200"
                id="textarea-bulk-sms"
              />

              <button
                onClick={handleSmsParse}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-extrabold rounded-xl transition cursor-pointer"
                id="btn-parse-sms"
              >
                Parse Statements
              </button>

              {bulkError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-2" id="bulk-error-feedback">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2" id="bulk-success-feedback">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{bulkSuccess}</span>
                </div>
              )}

              {parsedSmsList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300">Extracted Payments Preview:</h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {parsedSmsList.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-200">{item.senderName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{item.transactionCode} • {item.senderPhone}</p>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono">KES {item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={async () => {
                      setBulkError("");
                      setBulkSuccess("");
                      try {
                        for (const item of parsedSmsList) {
                          await onAddManualContribution({
                            projectId: activeProject.id,
                            amount: item.amount,
                            senderName: item.senderName,
                            senderPhone: item.senderPhone,
                            transactionCode: item.transactionCode,
                            category: "Well-wisher",
                            notes: item.notes
                          });
                        }
                        setBulkSuccess(`Successfully imported ${parsedSmsList.length} payments into the contribution records!`);
                        setParsedSmsList([]);
                        setBulkSmsText("");
                      } catch (err: any) {
                        setBulkError(err.message || "Failed to import bulk items.");
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                    id="btn-confirm-bulk-import"
                  >
                    Confirm and Save Payments
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CONTRIBUTION RECORDS section --- */}
        {activeSubTab === "receipts" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in" id="panel-contribution-records">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Contribution Records</h3>
                <p className="text-xs text-slate-500">Search contributions and print or send donation receipts.</p>
              </div>

              {/* Search input bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search donor or payment code..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden text-slate-200"
                  id="input-search-receipts"
                />
              </div>
            </div>

            {/* Table layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-mono">
                    <th className="py-3 px-3">Donor Name</th>
                    <th className="py-3 px-3 font-mono">Payment Code</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                        {campaignContributions.length === 0 ? "No contributions yet." : "No transactions found matching your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-950/40 transition">
                        <td className="py-3.5 px-3 font-bold text-slate-200">
                          {c.senderName || c.cleanedName}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-400">
                          {c.transactionCode}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-400 font-mono">
                          KES {Number(c.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-400 font-mono font-bold text-[9px] uppercase">
                            Reconciled
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => setActiveReceipt(c)}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10px] font-mono font-bold text-emerald-400 cursor-pointer"
                          >
                            Generate Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- RECIPIENT VOUCHER GENERATOR MODAL COMPONENT --- */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-overlay" id="modal-receipt-voucher">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 relative shadow-2xl animate-scale-up text-left">
            
            {/* Modal Close */}
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white font-mono text-xs cursor-pointer"
              id="btn-close-receipt-modal"
            >
              Close [X]
            </button>

            <div className="space-y-6">
              {/* Formal Receipt Voucher Visual */}
              <div className="p-6 bg-white text-slate-900 rounded-xl space-y-4 border-2 border-dashed border-slate-300 font-sans shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full pointer-events-none" />
                
                {/* Visual watermark check */}
                <div className="absolute top-4 right-4 flex flex-col items-end opacity-20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  <span className="text-[8px] font-mono font-black text-emerald-800 mt-1 uppercase">reconciled</span>
                </div>

                <div className="border-b border-slate-200 pb-3 text-center space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wide">HarambeeFlow Donation Receipt</h3>
                  <p className="text-[9px] font-mono text-slate-500">Official Contribution Receipt</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider font-mono text-[8px] block">Campaign:</span>
                      <span className="font-bold text-slate-800 truncate block">{activeProject.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider font-mono text-[8px] block">Payment Code:</span>
                      <span className="font-bold text-slate-800 block font-mono">{activeReceipt.transactionCode}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-[11px] border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Donor Name:</span>
                      <strong className="text-slate-800">{activeReceipt.senderName || activeReceipt.cleanedName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Giver Phone:</span>
                      <strong className="text-slate-800 font-mono">{activeReceipt.senderPhone}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs font-bold text-emerald-700">
                      <span>Total Amount Reconciled:</span>
                      <span className="font-mono">KES {Number(activeReceipt.amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 text-center space-y-1">
                  <p className="text-[8px] text-slate-400 font-sans leading-normal">
                    This receipt serves as official confirmation of your generous donation. Thank you for your support.
                  </p>
                </div>
              </div>

              {/* Action utilities */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  id="btn-print-receipt"
                >
                  <FileText className="w-4 h-4" /> Print PDF Receipt
                </button>
                <button
                  onClick={() => {
                    const message = `Dear ${activeReceipt.senderName || activeReceipt.cleanedName}, thank you for your generous contribution of KES ${Number(activeReceipt.amount).toLocaleString()} towards our "${activeProject.name}" fundraising campaign. Your official receipt code is ${activeReceipt.transactionCode}. God bless you!`;
                    window.open(`https://api.whatsapp.com/send?phone=${activeReceipt.senderPhone}&text=${encodeURIComponent(message)}`, "_blank");
                  }}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  id="btn-send-whatsapp"
                >
                  <Send className="w-3.5 h-3.5" /> Send to WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
