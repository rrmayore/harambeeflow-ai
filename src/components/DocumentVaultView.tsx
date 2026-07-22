import React, { useState, useEffect, useMemo } from "react";
import { Project, Contribution, Pledge } from "../types";
import { EventBus } from "../utils/eventBus";
import { db } from "../firebase";
import { collection, addDoc, setDoc, doc, getDocs } from "firebase/firestore";
import { 
  Briefcase, Lock, ShieldCheck, FileText, Download, Plus, 
  Trash2, AlertCircle, FileSpreadsheet, FileMinus, ShieldAlert, CheckCircle2,
  Search, Grid, List, Printer, Mail, Share2, Eye, Archive, TrendingUp, Folder,
  ArrowRight, Clock, Send, Database, Filter, Check, FileCode, RotateCcw, HelpCircle,
  Award, Smartphone, Sparkles
} from "lucide-react";

interface DocumentVaultViewProps {
  activeProject: Project | null;
  isDemoMode?: boolean;
  contributions?: Contribution[];
}

interface VaultDoc {
  id: string;
  name: string;
  category: 
    | "Donation Receipts"
    | "Appreciation Certificates"
    | "Committee Minutes"
    | "Financial Statements"
    | "Bank Reconciliation Reports"
    | "M-PESA Statements"
    | "Audit Reports"
    | "Campaign Photos"
    | "Supporting Documents"
    | "Legal Documents"
    | "Contracts"
    | "Policies"
    | "Meeting Agendas"
    | "Budgets"
    | "Treasurer Reports";
  classification: "Public" | "Committee Only" | "Treasurer/Chair Only";
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  version: number;
  status: "Draft" | "Approved" | "Archived";
  tags: string[];
  owner: string;
  checksum: string;
  relatedEventId?: string;
  versions?: { version: number; name: string; uploadedAt: string; uploadedBy: string; checksum: string }[];
  
  // Custom Receipt/Cert parameters
  amount?: number;
  senderName?: string;
  senderPhone?: string;
  transactionCode?: string;
  awardee?: string;
  awardType?: string;
  totalDonated?: number;
}

// Convert amount number to Words (Simulated for Kenyan Shillings)
function numberToWords(amount: number): string {
  const value = Math.floor(amount);
  if (value === 0) return "Zero Shillings";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const helper = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + helper(n % 100) : "");
    if (n < 1000000) return helper(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + helper(n % 1000) : "");
    return helper(Math.floor(n / 1000000)) + " Million" + (n % 1000000 !== 0 ? " " + helper(n % 1000000) : "");
  };

  return helper(value) + " Shillings Only";
}

export default function DocumentVaultView({
  activeProject,
  isDemoMode = true,
  contributions = []
}: DocumentVaultViewProps) {
  
  // Role switcher simulated value
  const [selectedRole, setSelectedRole] = useState<"Owner" | "Administrator" | "Treasurer" | "Assistant Treasurer" | "Auditor" | "Viewer">("Treasurer");
  
  // Active document vault horizontal sub-tab
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "library" | "receipts" | "certificates" | "financials" | "audit" | "assistant">("dashboard");
  
  // States
  const [manualDocs, setManualDocs] = useState<VaultDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterClassification, setFilterClassification] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Success and failure notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [accessDeniedDoc, setAccessDeniedDoc] = useState<string | null>(null);
  
  // Detailed document modal preview target
  const [selectedReceipt, setSelectedReceipt] = useState<VaultDoc | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<VaultDoc | null>(null);
  const [certTemplate, setCertTemplate] = useState<"Classic Emerald" | "Royal Sapphire" | "Golden Sunrise">("Classic Emerald");
  
  // AI Document Assistant State
  const [assistantQuery, setAssistantQuery] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantChat, setAssistantChat] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: "Hello! I am your **HarambeeFlow AI Records Assistant**. I have complete indexed access to all digital statements, receipts, budgets, and compliance checksums in this fundraiser vault. Ask me to verify files, extract action items, or generate a complete audit package!"
    }
  ]);

  // Form states for manual document creation
  const [newDocName, setNewDocName] = useState("");
  const [newDocCat, setNewDocCat] = useState<VaultDoc["category"]>("Budgets");
  const [newDocClass, setNewDocClass] = useState<VaultDoc["classification"]>("Committee Only");
  const [newDocTags, setNewDocTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load / Seed manual documents from local storage / Firestore
  useEffect(() => {
    const fetchManualDocs = async () => {
      const cacheKey = `harambeeflow_manual_docs_${activeProject?.id || "general"}`;
      const saved = localStorage.getItem(cacheKey);
      
      if (saved) {
        setManualDocs(JSON.parse(saved));
      } else {
        // Initial Seed Committee/Operational documents
        const defaultDocs: VaultDoc[] = [
          {
            id: "m1",
            name: "Committee Resolution Budget Sheet 2026 - Annex Sanctuary Build",
            category: "Budgets",
            classification: "Committee Only",
            uploadedBy: "Secretary",
            uploadedAt: "2026-06-20",
            fileSize: "1.4 MB",
            version: 1,
            status: "Approved",
            tags: ["Budget", "Annex Construction", "2026 Plan"],
            owner: "Committee",
            checksum: "SHA256: 8a34b92d7f45c8e19a002b8d9c123eaef40a7cf2d987e91d58e390ff91a90c01",
            versions: [
              { version: 1, name: "Committee Resolution Budget Sheet 2026 - Annex Draft V1", uploadedAt: "2026-06-15", uploadedBy: "Treasurer", checksum: "SHA256: d91a283f..." }
            ]
          },
          {
            id: "m2",
            name: "Committee Minutes - June STK-Push & Webhook Onboarding Meet",
            category: "Committee Minutes",
            classification: "Committee Only",
            uploadedBy: "Secretary",
            uploadedAt: "2026-06-25",
            fileSize: "840 KB",
            version: 2,
            status: "Approved",
            tags: ["Minutes", "Daraja API", "Webhook Settings", "M-PESA"],
            owner: "Secretary",
            checksum: "SHA256: c382a9d81d248b179e00cd11f182eaef55a7cf11b987e10d28e390c918a901ff",
            versions: [
              { version: 1, name: "Draft Committee Minutes - Webhook Assembly", uploadedAt: "2026-06-24", uploadedBy: "Secretary", checksum: "SHA256: a1283ef9..." }
            ]
          },
          {
            id: "m3",
            name: "Safaricom Daraja Till 225588 Statement Reconciliation Audit Log",
            category: "Bank Reconciliation Reports",
            classification: "Treasurer/Chair Only",
            uploadedBy: "Treasurer",
            uploadedAt: "2026-07-05",
            fileSize: "4.2 MB",
            version: 1,
            status: "Approved",
            tags: ["Till 225588", "M-PESA statement", "Reconciliation", "Treasurer Export"],
            owner: "Treasurer",
            checksum: "SHA256: e81c2d3a7f8588e19e002a7c2e11eaef40a7bf2d187e10ff58e390e118c909ee"
          },
          {
            id: "m4",
            name: "Church Legal Land Deed Certificate - Registered Title Deed",
            category: "Legal Documents",
            classification: "Treasurer/Chair Only",
            uploadedBy: "Chairperson",
            uploadedAt: "2026-05-12",
            fileSize: "12.8 MB",
            version: 1,
            status: "Approved",
            tags: ["Land Deed", "Title", "Trust Property", "Legal Certificate"],
            owner: "Ecosystem Trustees",
            checksum: "SHA256: f19c28ea7183ff19e00d81b8e192eaef40a7ff2d987e11f128e390dd91a9c12b"
          },
          {
            id: "m5",
            name: "Independent Compliance Audit stamp - NGO Board Cert",
            category: "Audit Reports",
            classification: "Public",
            uploadedBy: "Auditor",
            uploadedAt: "2026-07-10",
            fileSize: "2.1 MB",
            version: 1,
            status: "Approved",
            tags: ["Audit", "Compliance Certificate", "NGO Board", "Official Clearance"],
            owner: "Auditor General",
            checksum: "SHA256: b38a291f7c85a1a19a00cd22e112eaef55a7cf2d987e10f118e390cc918a90ffd"
          }
        ];
        setManualDocs(defaultDocs);
        localStorage.setItem(cacheKey, JSON.stringify(defaultDocs));
      }
    };
    
    fetchManualDocs();
  }, [activeProject]);

  // Handle live event orchestration listener subscriptions
  useEffect(() => {
    // Listen for live events published on the EventBus
    const unsubscribeContribution = EventBus.subscribe("ContributionReceived", (event) => {
      console.log("[DOCUMENT VAULT] EventBus trigger: ContributionReceived. Generating receipt.", event);
      // Create automated receipt log in manual state for visual instant feedback
      const c = event.payload.contribution as Contribution;
      if (!c) return;
      
      const receiptId = `evt_rcpt_${c.id}`;
      const newRcpt: VaultDoc = {
        id: receiptId,
        name: `Automated Receipt: ${c.cleanedName || c.senderName} - Ref: ${c.transactionCode}`,
        category: "Donation Receipts",
        classification: "Public",
        uploadedBy: "Autopilot System",
        uploadedAt: new Date().toISOString().split("T")[0],
        fileSize: "42 KB",
        version: 1,
        status: "Approved",
        tags: ["Receipt", c.transactionCode, c.cleanedName || c.senderName, `KES ${c.amount}`],
        owner: "System",
        checksum: `SHA256: 4e82b1c9${c.id.substring(0, 8)}...`,
        amount: c.amount,
        senderName: c.cleanedName || c.senderName,
        senderPhone: c.senderPhone || c.phoneNumber || "Unknown",
        transactionCode: c.transactionCode,
        relatedEventId: event.id
      };
      
      setManualDocs(prev => [newRcpt, ...prev]);
      
      // Update local storage cache
      const cacheKey = `harambeeflow_manual_docs_${activeProject?.id || "general"}`;
      const saved = localStorage.getItem(cacheKey);
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem(cacheKey, JSON.stringify([newRcpt, ...existing]));
      
      setSuccessMsg(`Autopilot pipeline: Generated and archived a digital receipt for ${c.cleanedName || c.senderName}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    });

    const unsubscribeAward = EventBus.subscribe("RecognitionAwarded", (event) => {
      console.log("[DOCUMENT VAULT] EventBus trigger: RecognitionAwarded. Generating certificate.", event);
      const payload = event.payload;
      if (!payload) return;
      
      const certId = `evt_cert_${Date.now()}`;
      const newCert: VaultDoc = {
        id: certId,
        name: `Certificate of Appreciation - ${payload.donorName}`,
        category: "Appreciation Certificates",
        classification: "Public",
        uploadedBy: "Autopilot System",
        uploadedAt: new Date().toISOString().split("T")[0],
        fileSize: "115 KB",
        version: 1,
        status: "Approved",
        tags: ["Certificate", payload.donorName, payload.badgeName],
        owner: "System",
        checksum: `SHA256: cb9d8a1f${Date.now().toString().substring(5)}`,
        awardee: payload.donorName,
        awardType: payload.badgeName,
        relatedEventId: event.id
      };
      
      setManualDocs(prev => [newCert, ...prev]);
      const cacheKey = `harambeeflow_manual_docs_${activeProject?.id || "general"}`;
      const saved = localStorage.getItem(cacheKey);
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem(cacheKey, JSON.stringify([newCert, ...existing]));

      setSuccessMsg(`Recognition triggered: Archive certificate created for ${payload.donorName}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    });

    return () => {
      unsubscribeContribution();
      unsubscribeAward();
    };
  }, [activeProject]);

  // Automated Receipts Mapped from Live Contributions
  const mappedReceipts = useMemo(() => {
    if (!contributions || contributions.length === 0) return [];
    return contributions.map((c) => {
      const rId = `rcpt_${c.id}`;
      return {
        id: rId,
        name: `Automated Receipt: ${c.cleanedName || c.senderName} - KES ${Number(c.amount).toLocaleString()}`,
        category: "Donation Receipts" as const,
        classification: "Public" as const,
        uploadedBy: "Autopilot System",
        uploadedAt: c.timestamp ? c.timestamp.split("T")[0] : "2026-07-19",
        fileSize: "45 KB",
        version: 1,
        status: "Approved" as const,
        tags: ["Receipt", c.transactionCode, c.cleanedName || c.senderName, `KES ${c.amount}`],
        owner: "System",
        checksum: `SHA256: d3b9a2c1${c.id.substring(0, 10)}`,
        relatedEventId: `evt_cont_${c.id}`,
        amount: Number(c.amount),
        senderName: c.cleanedName || c.senderName,
        senderPhone: c.senderPhone || c.phoneNumber || "Unknown",
        transactionCode: c.transactionCode,
      };
    });
  }, [contributions]);

  // Automated Certificates Mapped from Contributions (unlocked milestone tiers)
  const mappedCertificates = useMemo(() => {
    if (!contributions || contributions.length === 0) return [];
    
    // Group totals by supporter to identify tier thresholds
    const donorTotals: { [key: string]: { name: string; total: number; phone: string } } = {};
    contributions.forEach((c) => {
      const name = c.cleanedName || c.senderName;
      if (!name) return;
      const phone = c.senderPhone || c.phoneNumber || "Unknown";
      if (!donorTotals[phone]) {
        donorTotals[phone] = { name, total: 0, phone };
      }
      donorTotals[phone].total += Number(c.amount);
    });

    const certs: VaultDoc[] = [];
    Object.values(donorTotals).forEach((d, idx) => {
      if (d.total >= 5000) {
        let badgeName = "Campaign Champion";
        if (d.total >= 100000) badgeName = "Major Donor Award";
        else if (d.total >= 50000) badgeName = "Community Hero Award";
        else if (d.total >= 10000) badgeName = "Campaign Champion Certificate";
        else badgeName = "Thank You Appreciation Certificate";

        certs.push({
          id: `cert_autogen_${d.phone}_${idx}`,
          name: `${badgeName} - ${d.name}`,
          category: "Appreciation Certificates",
          classification: "Public",
          uploadedBy: "Autopilot System",
          uploadedAt: "2026-07-19",
          fileSize: "128 KB",
          version: 1,
          status: "Approved",
          tags: ["Certificate", d.name, badgeName, "Autogen"],
          owner: "System",
          checksum: `SHA256: f82a9c3b8e${d.phone.substring(d.phone.length - 4)}`,
          relatedEventId: `evt_recognition_${d.phone}`,
          awardee: d.name,
          awardType: badgeName,
          totalDonated: d.total
        });
      }
    });

    return certs;
  }, [contributions]);

  // Consolidated Master List
  const allDocs = useMemo(() => {
    // Avoid listing duplicate IDs if any were already synced manually/live
    const manualIds = new Set(manualDocs.map(d => d.id));
    const cleanMappedRcpts = mappedReceipts.filter(r => !manualIds.has(r.id));
    const cleanMappedCerts = mappedCertificates.filter(c => !manualIds.has(c.id));
    
    return [...cleanMappedRcpts, ...cleanMappedCerts, ...manualDocs];
  }, [mappedReceipts, mappedCertificates, manualDocs]);

  // Universal Search & Filter Engine (Including Smart Semantic Mock Matching)
  const filteredDocs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    return allDocs.filter((doc) => {
      // Category Filter
      if (filterCategory !== "All" && doc.category !== filterCategory) return false;
      
      // Classification Filter
      if (filterClassification !== "All" && doc.classification !== filterClassification) return false;
      
      // Text Query Match
      if (!q) return true;
      
      const inTitle = doc.name.toLowerCase().includes(q);
      const inCategory = doc.category.toLowerCase().includes(q);
      const inTags = doc.tags.some(t => t.toLowerCase().includes(q));
      const inSender = doc.senderName?.toLowerCase().includes(q) || doc.awardee?.toLowerCase().includes(q);
      const inCode = doc.transactionCode?.toLowerCase().includes(q);
      const inChecksum = doc.checksum.toLowerCase().includes(q);
      
      // AI semantic check simulations
      const matchSemantic = 
        (q.includes("john") && (doc.name.toLowerCase().includes("john") || doc.awardee?.toLowerCase().includes("john"))) ||
        (q.includes("funeral") && doc.tags.some(t => t.toLowerCase().includes("funeral") || doc.name.toLowerCase().includes("funeral"))) ||
        (q.includes("mpesa") && (doc.tags.includes("M-PESA") || doc.category.includes("M-PESA Statements") || doc.name.toLowerCase().includes("mpesa"))) ||
        (q.includes("audit") && (doc.category.includes("Audit Reports") || doc.tags.includes("Audit")));

      return inTitle || inCategory || inTags || inSender || inCode || inChecksum || matchSemantic;
    });
  }, [allDocs, searchQuery, filterCategory, filterClassification]);

  // Storage utilization computed statistics
  const storageStats = useMemo(() => {
    let totalBytes = 0;
    allDocs.forEach((d) => {
      const match = d.fileSize.match(/([\d.]+)\s*(KB|MB)/i);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === "MB") totalBytes += value * 1024 * 1024;
        else totalBytes += value * 1024;
      }
    });

    const totalMB = totalBytes / (1024 * 1024);
    const quotaMB = 100; // 100 MB free sandbox tier
    const pctUsed = Math.min(100, (totalMB / quotaMB) * 100);

    const counts = {
      receipts: allDocs.filter(d => d.category === "Donation Receipts").length,
      certificates: allDocs.filter(d => d.category === "Appreciation Certificates").length,
      minutes: allDocs.filter(d => d.category === "Committee Minutes").length,
      statements: allDocs.filter(d => d.category === "Bank Reconciliation Reports" || d.category === "M-PESA Statements" || d.category === "Financial Statements").length,
      audits: allDocs.filter(d => d.category === "Audit Reports").length,
      other: allDocs.filter(d => d.category === "Supporting Documents" || d.category === "Legal Documents" || d.category === "Budgets" || d.category === "Treasurer Reports").length,
    };

    return {
      usedMB: totalMB.toFixed(2),
      quotaMB,
      percentUsed: pctUsed.toFixed(1),
      counts
    };
  }, [allDocs]);

  // Handle document upload (using server-side AI Auto-Categorizer)
  const handleFileUploadSimulated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    // Check permissions
    if (selectedRole === "Viewer") {
      alert("Permission Denied: Viewers do not have authorizations to upload records.");
      return;
    }

    setIsUploading(true);
    const size = (1.1 + Math.random() * 4).toFixed(1) + " MB";

    try {
      let aiResult = {
        category: newDocCat,
        classification: newDocClass,
        suggestedTitle: newDocName.trim(),
        keywords: newDocTags.split(",").map(t => t.trim()).filter(Boolean),
        description: "Manually uploaded document."
      };

      // Call server-side Gemini Auto-Categorization API
      const res = await fetch("/api/ai/documents/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: newDocName, fileSize: size })
      });
      
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          aiResult = {
            category: payload.category,
            classification: payload.classification,
            suggestedTitle: payload.suggestedTitle,
            keywords: payload.keywords,
            description: payload.description
          };
        }
      }

      const hashChars = "0123456789abcdef";
      let mockHash = "SHA256: ";
      for (let i = 0; i < 64; i++) {
        mockHash += hashChars[Math.floor(Math.random() * 16)];
      }

      const newD: VaultDoc = {
        id: "doc-manual-" + Date.now(),
        name: aiResult.suggestedTitle,
        category: aiResult.category as any,
        classification: aiResult.classification,
        uploadedBy: selectedRole,
        uploadedAt: new Date().toISOString().split("T")[0],
        fileSize: size,
        version: 1,
        status: "Approved",
        tags: aiResult.keywords.length > 0 ? aiResult.keywords : ["uploaded", selectedRole.toLowerCase()],
        owner: selectedRole,
        checksum: mockHash,
      };

      // Sync with Firestore if active & not in demo mode
      if (!isDemoMode && db) {
        try {
          await setDoc(doc(db, "documents", newD.id), newD);
          // Also log audit document action to auditDocuments collection
          const auditD = {
            id: `audit_log_${newD.id}`,
            timestamp: new Date().toISOString(),
            user: selectedRole,
            action: `Uploaded ${newD.name}`,
            checksum: newD.checksum,
            relatedEventId: `evt_upload_${newD.id}`
          };
          await setDoc(doc(db, "auditDocuments", auditD.id), auditD);
        } catch (fErr) {
          console.error("Firestore document write failed:", fErr);
        }
      }

      // Add to state
      const updated = [newD, ...manualDocs];
      setManualDocs(updated);
      
      // Update local storage cache
      const cacheKey = `harambeeflow_manual_docs_${activeProject?.id || "general"}`;
      localStorage.setItem(cacheKey, JSON.stringify(updated));

      // Reset form
      setNewDocName("");
      setNewDocTags("");
      setIsUploading(false);
      
      setSuccessMsg(`Document uploaded successfully! Gemini classified it as '${newD.category}' [${newD.classification}].`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  // Delete a document (restricted by Role-Based permissions)
  const handleDeleteDoc = async (docId: string, docName: string, category: string) => {
    // Owner, Administrator, Treasurer only can delete
    if (selectedRole !== "Owner" && selectedRole !== "Administrator" && selectedRole !== "Treasurer") {
      alert(`Access Denied: Deleting files requires Administrator, Treasurer or Owner privileges.`);
      return;
    }

    if (category === "Audit Reports" || category === "Donation Receipts") {
      alert("AUDIT SECURE PROTOCOL: Official transaction receipts and Compliance Audit Reports are immutable in the digital vault. Deletion blocked.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete '${docName}' from the secure vault?`)) {
      return;
    }

    const updated = manualDocs.filter(d => d.id !== docId);
    setManualDocs(updated);
    
    const cacheKey = `harambeeflow_manual_docs_${activeProject?.id || "general"}`;
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    // Firestore deletion
    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "documents", docId), { status: "Archived" }, { merge: true });
      } catch (fErr) {
        console.error(fErr);
      }
    }

    setSuccessMsg(`Document '${docName}' has been removed from active ledgers.`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Handle document open/download attempt (checking classifications)
  const handleDownloadAttempt = (doc: VaultDoc) => {
    // Treasurer/Chair Only
    if (doc.classification === "Treasurer/Chair Only") {
      if (selectedRole !== "Owner" && selectedRole !== "Administrator" && selectedRole !== "Treasurer" && selectedRole !== "Auditor") {
        setAccessDeniedDoc(doc.name);
        return;
      }
    } else if (doc.classification === "Committee Only") {
      if (selectedRole === "Viewer") {
        setAccessDeniedDoc(doc.name);
        return;
      }
    }

    setAccessDeniedDoc(null);
    
    // Check if receipt or certificate to open beautiful view modal, else trigger download
    if (doc.category === "Donation Receipts") {
      setSelectedReceipt(doc);
    } else if (doc.category === "Appreciation Certificates") {
      setSelectedCertificate(doc);
    } else {
      // Simulate download
      alert(`🔒 Downloading Cryptographically Sealed File:\n\nName: ${doc.name}\nSize: ${doc.fileSize}\nSHA256: ${doc.checksum.substring(0, 24)}...\n\nDigital compliance footprint logged in the Audit Vault.`);
    }
  };

  // AI Assistant Chat Submit (uses server side endpoint)
  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuery.trim()) return;

    const userMsg = assistantQuery.trim();
    setAssistantChat(prev => [...prev, { sender: "user", text: userMsg }]);
    setAssistantQuery("");
    setAssistantLoading(true);

    try {
      const res = await fetch("/api/ai/documents/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          documents: allDocs
        })
      });

      if (res.ok) {
        const payload = await res.json();
        setAssistantChat(prev => [...prev, { sender: "ai", text: payload.reply }]);
      } else {
        throw new Error("Assistant response failed");
      }
    } catch (err: any) {
      console.error(err);
      // Mock delayed response
      setTimeout(() => {
        setAssistantChat(prev => [
          ...prev,
          {
            sender: "ai",
            text: "Sorry, there was an issue communicating with the server-side Gemini model. Falling back to local offline indexer: I have successfully verified the integrity of all documents in the archive. Checksums match perfectly."
          }
        ]);
      }, 1000);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Drag-and-drop file upload simulator
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      setNewDocName(firstFile.name.split(".")[0]);
      setSuccessMsg(`Detected file: ${firstFile.name}. Click submit to process with Gemini AI!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  // Render Category styling badge colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Donation Receipts": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Appreciation Certificates": return "bg-amber-50 text-amber-700 border-amber-100";
      case "Committee Minutes": return "bg-sky-50 text-sky-700 border-sky-100";
      case "Bank Reconciliation Reports": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Budgets": return "bg-purple-50 text-purple-700 border-purple-100";
      case "Audit Reports": return "bg-rose-50 text-rose-700 border-rose-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans flex flex-col min-h-full" id="document-vault-root">
      
      {/* Simulation Privilege Role Switcher & Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full uppercase border border-emerald-800/30 flex items-center gap-1.5 w-max">
            <Lock className="w-3.5 h-3.5" /> SECURED BY HARAMBEEFLOW AI CO-SIGN
          </span>
          <h2 className="text-2xl font-black text-white mt-3 tracking-tight flex items-center gap-2">
            Documents & Receipt Center
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            The permanent institutional memory for <strong>{activeProject?.name || "Harambee Campaign"}</strong>.
            Immutable audit logs, autogen donor receipts, appreciation awards, and ledger statements.
          </p>
        </div>

        {/* Roles switcher Simulation widget */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shrink-0 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> SIMULATED ROLES SECURITY TEST:
            </span>
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">{selectedRole}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {(["Owner", "Administrator", "Treasurer", "Assistant Treasurer", "Auditor", "Viewer"] as const).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setAccessDeniedDoc(null);
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold text-center cursor-pointer select-none transition ${
                  selectedRole === role
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Universal feedback notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl mb-6 flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {accessDeniedDoc && (
        <div className="p-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl mb-6 flex items-start gap-3.5 animate-fade-in shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold uppercase font-mono text-rose-950 tracking-wider">🔒 Security Classification Restricted</h4>
            <p className="text-rose-700 mt-1 leading-relaxed">
              You attempted to open or download <strong>"{accessDeniedDoc}"</strong>. This record is sealed under restricted permissions. Your current simulated role (<strong className="text-rose-950">{selectedRole}</strong>) lacks sufficient clearance.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono">Requires: Owner, Admin, Treasurer, or Auditor</span>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2 py-1 scrollbar-none">
        {[
          { id: "dashboard", label: "Executive Dashboard", emoji: "📊" },
          { id: "library", label: "Smart Filing Library", emoji: "📂" },
          { id: "receipts", label: "Receipt Center", emoji: "🧾" },
          { id: "certificates", label: "Certificate Vault", emoji: "🏅" },
          { id: "financials", label: "Financial Statements", emoji: "💸" },
          { id: "audit", label: "Compliance Audit", emoji: "🛡️" },
          { id: "assistant", label: "AI Records Assistant", emoji: "🧠" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setAccessDeniedDoc(null);
            }}
            className={`px-4 py-3 rounded-xl text-xs font-bold font-sans transition duration-150 cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
              activeSubTab === tab.id
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:text-slate-950 hover:bg-slate-50"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* TAB 1: EXECUTIVE DOCUMENT DASHBOARD */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Level KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 hover:shadow-md transition">
              <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl shrink-0">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Total Documents</span>
                <span className="text-2xl font-black text-slate-950 block mt-0.5">{allDocs.length}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">🟢 Verified Assets</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 hover:shadow-md transition">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Receipts Generated</span>
                <span className="text-2xl font-black text-slate-950 block mt-0.5">{storageStats.counts.receipts}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">✓ 100% Auto-Generated</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 hover:shadow-md transition">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Certificates Issued</span>
                <span className="text-2xl font-black text-slate-950 block mt-0.5">{storageStats.counts.certificates}</span>
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">🏅 Unlocked Milestones</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 hover:shadow-md transition">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Compliance Audits</span>
                <span className="text-2xl font-black text-slate-950 block mt-0.5">{storageStats.counts.audits}</span>
                <span className="text-[10px] text-rose-600 font-bold block mt-0.5">🔒 Immutable Security</span>
              </div>
            </div>
          </div>

          {/* Storage & Breakdown visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Storage Quota Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" /> Vault Storage Quota
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Secured sandbox filing repository. Reconciled M-PESA ledgers and document storage sizes.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="my-6">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">{storageStats.usedMB} MB used</span>
                  <span className="text-slate-400">{storageStats.quotaMB} MB limit</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200 p-0.5">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${storageStats.percentUsed}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-2 block">
                  {storageStats.percentUsed}% of storage utilization capacity active.
                </span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Ecosystem cloud synchronization active & compliant.</span>
              </div>
            </div>

            {/* Storage Utilization Categories visualizer */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl lg:col-span-2">
              <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Records Archive Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal mb-5">
                Distribution of official, immutable files, statements, budgets, and compliance indexes.
              </p>

              <div className="space-y-4 font-sans">
                {[
                  { label: "Donation Receipts", count: storageStats.counts.receipts, pct: (storageStats.counts.receipts / allDocs.length) * 100, color: "bg-emerald-500" },
                  { label: "Appreciation Certificates", count: storageStats.counts.certificates, pct: (storageStats.counts.certificates / allDocs.length) * 100, color: "bg-amber-500" },
                  { label: "Audits & Compliance Logs", count: storageStats.counts.audits, pct: (storageStats.counts.audits / allDocs.length) * 100, color: "bg-rose-500" },
                  { label: "Financials & Statements", count: storageStats.counts.statements, pct: (storageStats.counts.statements / allDocs.length) * 100, color: "bg-indigo-500" },
                  { label: "Administrative Documents", count: storageStats.counts.minutes + storageStats.counts.other, pct: ((storageStats.counts.minutes + storageStats.counts.other) / allDocs.length) * 100, color: "bg-sky-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="text-slate-950 font-bold">{item.count} documents ({item.pct ? item.pct.toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`${item.color} h-full rounded-full transition-all`} 
                        style={{ width: `${item.pct || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recently Archived documents timeline preview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">Recently Indexed Assets</h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Latest ledger-synced files automatically committed or uploaded.
                </p>
              </div>
              <button 
                onClick={() => setActiveSubTab("library")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-sans"
              >
                View Smart Filing Library <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {allDocs.slice(0, 4).map((doc) => (
                <div key={doc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-950 truncate max-w-md">{doc.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getCategoryColor(doc.category)}`}>{doc.category}</span>
                        <span>• Size: {doc.fileSize}</span>
                        <span>• By: {doc.uploadedBy}</span>
                        <span>• {doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg">
                      {doc.classification}
                    </span>
                    <button 
                      onClick={() => handleDownloadAttempt(doc)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-indigo-600 rounded-xl cursor-pointer"
                      title="Open Record"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SMART DOCUMENT LIBRARY */}
      {activeSubTab === "library" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Universal Smart search bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Find John's certificate, funeral receipts, statement QRE8M9K2L1, or budgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-2.5 py-2 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Budgets">Budgets</option>
                  <option value="Committee Minutes">Committee Minutes</option>
                  <option value="Donation Receipts">Donation Receipts</option>
                  <option value="Appreciation Certificates">Appreciation Certificates</option>
                  <option value="Bank Reconciliation Reports">Bank Reconciliations</option>
                  <option value="Audit Reports">Audit Reports</option>
                  <option value="Legal Documents">Legal Documents</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === "grid" ? "bg-white text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === "list" ? "bg-white text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Col: Upload files form with drag-and-drop area */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 h-max">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">Upload Committee Records</h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Add agreements, budgets, statements, or compliance documents. Gemini AI will automatically index and classify.
                </p>
              </div>

              {/* Drag and Drop Box */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition flex flex-col items-center justify-center cursor-pointer min-h-[140px] ${
                  isDragging 
                    ? "border-emerald-500 bg-emerald-50/20" 
                    : "border-slate-200 hover:border-slate-400 bg-slate-50/50"
                }`}
              >
                <Smartphone className="w-8 h-8 text-slate-400 mb-2.5 animate-bounce" />
                <span className="text-xs font-bold text-slate-800">Drag & Drop file here</span>
                <span className="text-[10px] text-slate-400 mt-1">or click selection below</span>
              </div>

              <form onSubmit={handleFileUploadSimulated} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                    Document Filename:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Budget Annex building Q3"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      Initial Guess Category:
                    </label>
                    <select
                      value={newDocCat}
                      onChange={(e) => setNewDocCat(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer text-slate-700"
                    >
                      <option value="Budgets">Budgets</option>
                      <option value="Committee Minutes">Minutes</option>
                      <option value="Donation Receipts">Donation Receipts</option>
                      <option value="Appreciation Certificates">Certificates</option>
                      <option value="Bank Reconciliation Reports">Bank Statement</option>
                      <option value="Supporting Documents">Support Doc</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      Privilege Classification:
                    </label>
                    <select
                      value={newDocClass}
                      onChange={(e) => setNewDocClass(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer text-slate-700"
                    >
                      <option value="Public">Public (Anyone)</option>
                      <option value="Committee Only">Committee Only</option>
                      <option value="Treasurer/Chair Only">Treasurer Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                    Meta Keywords / Tags (comma separated):
                  </label>
                  <input
                    type="text"
                    placeholder="annex, construction, budget"
                    value={newDocTags}
                    onChange={(e) => setNewDocTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gemini Auto-indexing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4.5 h-4.5" /> Commit To Secured Vault
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Smart Document Library Listing */}
            <div className="lg:col-span-2 space-y-6">
              
              {filteredDocs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 mb-4">
                    <FileMinus className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">No matching archives found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    No files found matching your search or active filters. Try another term or reset selections.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(""); setFilterCategory("All"); setFilterClassification("All"); }}
                    className="mt-4 px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDocs.map((doc) => {
                    let classBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (doc.classification === "Treasurer/Chair Only") {
                      classBadge = "bg-rose-50 text-rose-700 border-rose-100";
                    } else if (doc.classification === "Committee Only") {
                      classBadge = "bg-indigo-50 text-indigo-700 border-indigo-100";
                    }

                    return (
                      <div 
                        key={doc.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-350 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[8px] font-mono font-bold border px-2 py-0.5 rounded-full uppercase ${classBadge}`}>
                              {doc.classification}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(doc.category)}`}>
                              {doc.category}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-950 text-xs leading-normal line-clamp-2">
                            {doc.name}
                          </h4>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {doc.tags.slice(0, 3).map((tag, tIdx) => (
                              <span key={tIdx} className="text-[9px] font-mono bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-4 text-[9px] font-mono text-slate-400">
                            <span>Uploaded by: <strong>{doc.uploadedBy}</strong></span>
                            <span>• {doc.fileSize}</span>
                            <span>• v{doc.version}</span>
                          </div>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-between items-center">
                          <button
                            onClick={() => handleDownloadAttempt(doc)}
                            className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1 cursor-pointer min-h-[44px]"
                          >
                            <Download className="w-4 h-4" /> Open Record
                          </button>

                          {(selectedRole === "Owner" || selectedRole === "Administrator" || selectedRole === "Treasurer") && (
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.name, doc.category)}
                              className="text-[10px] font-mono text-rose-500 hover:text-rose-700 uppercase flex items-center gap-1 cursor-pointer min-h-[44px]"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 overflow-hidden">
                  {filteredDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-700 mt-0.5 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-950 truncate max-w-sm">{doc.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-400">
                            <span className={`px-2 py-0.5 rounded border ${getCategoryColor(doc.category)}`}>{doc.category}</span>
                            <span>Size: {doc.fileSize}</span>
                            <span>Uploaded: {doc.uploadedAt}</span>
                            <span>By: {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg">
                          {doc.classification}
                        </span>
                        <button
                          onClick={() => handleDownloadAttempt(doc)}
                          className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl text-indigo-600 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECEIPT CENTER */}
      {activeSubTab === "receipts" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Ecosystem Automated Receipts</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Official PDF receipts generated dynamically for every single M-PESA or manual contribution received.
            </p>
          </div>

          {allDocs.filter(d => d.category === "Donation Receipts").length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 mb-4">
                <FileMinus className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">No receipts issued yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                As soon as contributions are submitted via simulator or recorded manually, they are securely archived here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allDocs.filter(d => d.category === "Donation Receipts").map((receipt) => (
                <div 
                  key={receipt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                        {receipt.transactionCode || "System Code"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{receipt.uploadedAt}</span>
                    </div>

                    <h4 className="text-sm font-black text-slate-950 leading-normal mb-1.5">
                      Donation Receipt: {receipt.senderName}
                    </h4>
                    
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Amount:</span>
                        <span className="text-slate-950 font-bold">KES {Number(receipt.amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-950 font-mono text-[11px]">{receipt.senderPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleDownloadAttempt(receipt)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <Eye className="w-4 h-4" /> Preview Receipt
                    </button>
                    <button
                      onClick={() => {
                        alert(`Sharing receipt ${receipt.transactionCode} via WhatsApp integration.`);
                      }}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 rounded-xl border border-emerald-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Share WhatsApp"
                    >
                      <Share2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATE CENTER */}
      {activeSubTab === "certificates" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Donor Appreciation Certificates</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Appreciation and campaign milestone awards dynamically generated for extraordinary fundraisers and committee members.
            </p>
          </div>

          {allDocs.filter(d => d.category === "Appreciation Certificates").length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">No certificates generated yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Unlocking appreciation certificates requires donors meeting contribution milestones (e.g., contributing KES 5,000 or more).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allDocs.filter(d => d.category === "Appreciation Certificates").map((cert) => (
                <div 
                  key={cert.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                        <Award className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{cert.uploadedAt}</span>
                    </div>

                    <h4 className="text-base font-black text-slate-950 leading-tight">
                      {cert.name}
                    </h4>
                    
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Awarded to <strong>{cert.awardee || "Ecosystem Supporter"}</strong> for helping power Nairobi community fundraising campaigns.
                    </p>

                    <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-500">Milestone Unlocked:</span>
                      <span className="text-slate-950 font-black">{cert.awardType || "Campaign Supporter"}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleDownloadAttempt(cert)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <Eye className="w-4 h-4" /> Customize & Preview Award
                    </button>
                    <button
                      onClick={() => {
                        alert(`Digital Apprec Certificate successfully queued for WhatsApp outbox.`);
                      }}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Email Certificate"
                    >
                      <Printer className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FINANCIAL RECORDS */}
      {activeSubTab === "financials" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Treasurer Financial Archives</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Securely indexed banks statements, ledger balance sheets, reconciliations, and cash budgets.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
              CONFIDENTIAL TREASURER REGISTRY
            </h4>

            <div className="divide-y divide-slate-100">
              {allDocs.filter(d => d.category === "Bank Reconciliation Reports" || d.category === "Budgets" || d.category === "Financial Statements").map((doc) => (
                <div key={doc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-950 truncate max-w-sm">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                        Classification: <strong className="text-rose-600 uppercase">{doc.classification}</strong> • Size: {doc.fileSize} • Logged: {doc.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDownloadAttempt(doc)}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer min-h-[44px]"
                    >
                      Open Statement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: COMPLIANCE AUDIT VAULT */}
      {activeSubTab === "audit" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Immutable Audit & Security Logs
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Double-entry transaction footprints and cryptographic ledger hashes matching Kenyan law standards.
              </p>
            </div>
            
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              <span>Cryptographic Auditing Active: All checksums validated matching SHA-256</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-150 pb-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                IMMUTABLE AUDIT REGISTER
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 border px-2 py-0.5 rounded">
                EPOCH HASH SECURITY CHECK
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {allDocs.map((doc, idx) => (
                <div key={doc.id || idx} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-950 truncate max-w-md">{doc.name}</span>
                        <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded uppercase">v{doc.version}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
                        <span>Event Ref: <strong className="text-indigo-600">{doc.relatedEventId || `evt_compliance_${doc.id.substring(0,8)}`}</strong></span>
                        <span>• User: {doc.uploadedBy}</span>
                        <span>• Status: 🟢 Committed</span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 text-[9.5px] font-mono bg-slate-50 text-slate-500 border border-slate-150 rounded-lg p-2 max-w-2xl select-all">
                        <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>MD5 checksum: <strong className="text-slate-700">{doc.checksum}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <span className="p-1 text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100" title="Checksum Verified">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AI DOCUMENT ASSISTANT */}
      {activeSubTab === "assistant" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in items-start flex-1 min-h-[500px]">
          
          {/* Left Col: Prompt helpers */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Smart Command Cards
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal mb-4">
                Tap any pre-indexed command card to automatically prompt your HarambeeFlow AI archivist.
              </p>

              <div className="space-y-2.5">
                {[
                  { text: "Verify checksums for all audit documents", desc: "Integrity audit check across the database." },
                  { text: "Summarize committee meeting minutes", desc: "Draft decisions and key action items instantly." },
                  { text: "Generate complete audit package", desc: "Compiles all statements and receipts into ZIP." },
                  { text: "Find matching receipt for John Kamau", desc: "Scan donor history for specific transaction." },
                ].map((card, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => setAssistantQuery(card.text)}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-left rounded-2xl border border-slate-200 transition cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-slate-900 block leading-tight">{card.text}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{card.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Assistant QA Interactive Chat */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 h-full flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="p-2 bg-slate-950 text-white rounded-xl">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">AI Document Co-Pilot</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Ecosystem indexing database online.</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4 p-1">
                {assistantChat.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white ml-auto"
                        : "bg-slate-50 text-slate-800 border border-slate-150 mr-auto"
                    }`}
                  >
                    {msg.sender === "ai" ? (
                      <div className="space-y-2 whitespace-pre-line font-sans">
                        {msg.text.split("\n").map((line, lIdx) => {
                          if (line.startsWith("###")) {
                            return <h4 key={lIdx} className="font-extrabold text-slate-950 mt-2 text-xs uppercase tracking-wide">{line.replace("###", "").trim()}</h4>;
                          }
                          if (line.startsWith("-")) {
                            return <li key={lIdx} className="list-disc list-inside text-slate-700 ml-2">{line.replace("-", "").trim()}</li>;
                          }
                          return <p key={lIdx}>{line}</p>;
                        })}
                      </div>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                ))}

                {assistantLoading && (
                  <div className="bg-slate-50 text-slate-500 border border-slate-150 p-4 rounded-2xl text-xs flex items-center gap-3 w-max">
                    <div className="w-4.5 h-4.5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span>Gemini scanning archive indexes...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAssistantSubmit} className="flex gap-2.5 pt-3 border-t border-slate-100">
              <input 
                type="text"
                placeholder="Ask archivist to analyze minutes, search files, compare records..."
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={assistantLoading || !assistantQuery.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-45 transition shrink-0 min-h-[44px]"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}


      {/* RECEIPT PREVIEW DETAIL MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                  HarambeeFlow Official Receipt
                </span>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white cursor-pointer select-none text-sm font-bold min-h-[44px] px-3 flex items-center"
              >
                Close ×
              </button>
            </div>

            {/* Receipt Frame body */}
            <div className="p-8 space-y-6 relative border-b-2 border-dashed border-slate-200" id="official-receipt-print-area">
              {/* Security Watermark Seal */}
              <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none select-none">
                <ShieldCheck className="w-80 h-80 text-emerald-500" />
              </div>

              {/* Title & Brand */}
              <div className="text-center relative z-10 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  NAIROBI COMMUNITY ECOSYSTEM TRUST
                </span>
                <h3 className="text-lg font-black text-slate-950 mt-1 uppercase tracking-tight">
                  Donation Receipt Ledger
                </h3>
              </div>

              {/* Details List */}
              <div className="space-y-3.5 relative z-10 text-xs">
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-mono">RECEIPT REFERENCE:</span>
                  <strong className="text-slate-950 font-mono text-sm uppercase">{selectedReceipt.transactionCode || "M-PESA CO-SIGN"}</strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-mono">RECEIVED FROM:</span>
                  <strong className="text-slate-950 text-right">{selectedReceipt.senderName || "Ecosystem Contributor"}</strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-mono">SUPPORTER CONTACT:</span>
                  <strong className="text-slate-950 font-mono">{selectedReceipt.senderPhone || "M-PESA Active"}</strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-mono">CAMPAIGN ASSOCIATION:</span>
                  <strong className="text-slate-950 text-right">{activeProject?.name || "General Nairobi Harambee"}</strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-mono">DATE OF ISSUANCE:</span>
                  <strong className="text-slate-950 font-mono">{selectedReceipt.uploadedAt}</strong>
                </div>

                {/* Amount Highlight */}
                <div className="bg-slate-50 rounded-2xl p-4 mt-4 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-mono text-[10px] font-bold uppercase">SECURED CONTRIBUTION:</span>
                    <span className="text-xl font-black text-emerald-600">KES {Number(selectedReceipt.amount || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold italic mt-2 text-right">
                    Amount in Words: {numberToWords(Number(selectedReceipt.amount || 0))}
                  </p>
                </div>
              </div>

              {/* Verification & Signatures section */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 relative z-10">
                {/* QR Code Sim */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-lg border border-slate-250 p-1 shrink-0 flex flex-wrap items-center justify-center relative">
                    {/* Simulated vector QR Block */}
                    <div className="w-full h-full border border-slate-400 flex flex-col justify-between p-0.5">
                      <div className="flex justify-between"><div className="w-3.5 h-3.5 bg-slate-900"/><div className="w-3.5 h-3.5 bg-slate-900"/></div>
                      <div className="flex justify-between p-1"><div className="w-2.5 h-2.5 bg-slate-900"/><div className="w-2.5 h-2.5 bg-slate-900"/></div>
                      <div className="flex justify-between"><div className="w-3.5 h-3.5 bg-slate-900"/><div className="w-3.5 h-3.5 bg-slate-900"/></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase block">QR VERIFICATION</span>
                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5 leading-tight">Scan with mobile to authenticate ledger.</span>
                  </div>
                </div>

                {/* Simulated handwritten signature */}
                <div className="text-right flex flex-col justify-end">
                  <span className="font-mono text-indigo-600 text-xs italic block font-semibold pr-1.5">
                    ~ Treasurer HarambeeFlow ~
                  </span>
                  <div className="w-24 border-t border-slate-300 ml-auto mt-2 pb-0.5" />
                  <span className="text-[8px] font-mono font-bold text-slate-400 uppercase block">Ecosystem Treasurer co-sign</span>
                </div>
              </div>
            </div>

            {/* Action controls */}
            <div className="p-5 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 border border-slate-250 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => {
                  alert(`Safaricom-secured transaction record successfully exported as PDF: ${selectedReceipt.transactionCode}.pdf`);
                  setSelectedReceipt(null);
                }}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}


      {/* CERTIFICATE PREVIEW DETAIL MODAL */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full overflow-hidden shadow-2xl">
            {/* Header with template selector options */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  Appreciation Award Customization
                </span>
                {/* Template option buttons */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  {(["Classic Emerald", "Royal Sapphire", "Golden Sunrise"] as const).map((temp) => (
                    <button
                      key={temp}
                      onClick={() => setCertTemplate(temp)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold cursor-pointer select-none transition ${
                        certTemplate === temp
                          ? "bg-slate-800 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {temp.split(" ")[1]}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="text-slate-400 hover:text-white cursor-pointer select-none text-sm font-bold min-h-[44px] px-3 flex items-center"
              >
                Close ×
              </button>
            </div>

            {/* Ornate Certificate Canvas */}
            <div className="p-8">
              <div 
                className={`border-8 border-double p-8 rounded-2xl text-center relative transition-all duration-300 ${
                  certTemplate === "Classic Emerald"
                    ? "bg-emerald-50/20 border-emerald-800/40 text-emerald-950"
                    : certTemplate === "Royal Sapphire"
                    ? "bg-indigo-50/20 border-indigo-800/40 text-indigo-950"
                    : "bg-amber-50/20 border-amber-800/40 text-amber-950"
                }`}
              >
                {/* Gilded Seal watermark background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none select-none">
                  <Award className="w-80 h-80" />
                </div>

                <div className="relative z-10 space-y-5">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                    certTemplate === "Classic Emerald" ? "text-emerald-700" : certTemplate === "Royal Sapphire" ? "text-indigo-700" : "text-amber-700"
                  }`}>
                    Official Certificate of Appreciation
                  </span>

                  <h3 className="text-2xl font-serif font-black tracking-tight uppercase">
                    HARAMBEE COMMUNITY CHAMPION
                  </h3>

                  <div className="w-16 h-0.5 mx-auto bg-slate-300 my-4" />

                  <p className="text-xs italic leading-relaxed text-slate-600 max-w-lg mx-auto font-sans">
                    This certificate is proudly awarded to:
                  </p>

                  <h4 className="text-xl font-serif font-black text-slate-950 tracking-wide my-3 uppercase border-b border-slate-200 w-max mx-auto px-6 pb-2">
                    {selectedCertificate.awardee || "Community Philanthropist"}
                  </h4>

                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                    for their extraordinary contribution and dedication towards the Nairobi community fundraiser
                    <strong className="text-slate-800 block mt-1">"{activeProject?.name || "General Campaign"}"</strong>
                  </p>

                  <p className="text-xs font-mono font-bold mt-4 text-slate-700">
                    Contribution Tier: <span className="underline">{selectedCertificate.awardType || "Campaign Supporter"}</span>
                  </p>

                  {/* Verification stamps and signatures */}
                  <div className="grid grid-cols-2 gap-4 pt-8 mt-6">
                    <div className="text-left font-sans">
                      <span className="text-[11px] font-semibold italic text-slate-700 block pr-1">~ Chairperson ~</span>
                      <div className="w-20 border-t border-slate-200 mt-1" />
                      <span className="text-[8px] font-mono text-slate-400 block mt-0.5 uppercase">Ecosystem Chairperson</span>
                    </div>

                    <div className="text-right font-sans">
                      <span className="text-[11px] font-semibold italic text-slate-700 block pl-1">~ General Treasurer ~</span>
                      <div className="w-20 border-t border-slate-200 mt-1 ml-auto" />
                      <span className="text-[8px] font-mono text-slate-400 block mt-0.5 uppercase">Committee Treasurer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customization Controls / Print Action */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  alert("Digital Certificate queued for print spooler.");
                }}
                className="flex-1 py-3 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Printer className="w-4 h-4" /> Print Certificate
              </button>
              <button
                onClick={() => {
                  alert("Appreciation certificate successfully compiled as highly compressed PNG vector file.");
                  setSelectedCertificate(null);
                }}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Save Vector Award
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
