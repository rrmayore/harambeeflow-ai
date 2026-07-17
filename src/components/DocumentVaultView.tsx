import React, { useState, useEffect } from "react";
import { Project } from "../types";
import { 
  Briefcase, Lock, ShieldCheck, FileText, Download, Plus, 
  Trash2, AlertCircle, FileSpreadsheet, FileMinus, ShieldAlert, CheckCircle2 
} from "lucide-react";

interface DocumentVaultViewProps {
  activeProject: Project | null;
}

interface VaultDoc {
  id: string;
  name: string;
  category: "Budgets" | "Meeting Minutes" | "Receipts" | "Contracts" | "Procurement" | "Bank Statements" | "Audit Reports";
  classification: "Public" | "Committee Only" | "Treasurer/Chair Only";
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
}

export default function DocumentVaultView({
  activeProject
}: DocumentVaultViewProps) {
  const [selectedRole, setSelectedRole] = useState<"Chairperson" | "Secretary" | "Auditor" | "Committee Member">("Chairperson");
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCat, setNewDocCat] = useState<VaultDoc["category"]>("Budgets");
  const [newDocClass, setNewDocClass] = useState<VaultDoc["classification"]>("Committee Only");

  const [successMsg, setSuccessMsg] = useState("");
  const [accessDeniedDoc, setAccessDeniedDoc] = useState<string | null>(null);

  // Load and seed default docs
  useEffect(() => {
    const saved = localStorage.getItem("fos_vault_docs");
    if (saved) {
      setDocs(JSON.parse(saved));
    } else {
      const defaults: VaultDoc[] = [
        { id: "d1", name: "Sunday Church Building Budget Sheet 2026", category: "Budgets", classification: "Committee Only", uploadedBy: "Treasurer", uploadedAt: "2026-06-20", fileSize: "1.4 MB" },
        { id: "d2", name: "Committee Minutes - Resolution on Mpesa Webhooks", category: "Meeting Minutes", classification: "Committee Only", uploadedBy: "Secretary", uploadedAt: "2026-06-21", fileSize: "840 KB" },
        { id: "d3", name: "Safaricom Till Statement Dec Reconciled Logs", category: "Bank Statements", classification: "Treasurer/Chair Only", uploadedBy: "Treasurer", uploadedAt: "2026-06-24", fileSize: "4.2 MB" },
        { id: "d4", name: "External Auditor Compliance Stamp Certificate", category: "Audit Reports", classification: "Public", uploadedBy: "Auditor", uploadedAt: "2026-06-23", fileSize: "2.1 MB" },
        { id: "d5", name: "Construction Material Vendor Procurement Bill", category: "Procurement", classification: "Treasurer/Chair Only", uploadedBy: "Chairperson", uploadedAt: "2026-06-22", fileSize: "3.5 MB" }
      ];
      setDocs(defaults);
      localStorage.setItem("fos_vault_docs", JSON.stringify(defaults));
    }
  }, []);

  const saveDocs = (updated: VaultDoc[]) => {
    setDocs(updated);
    localStorage.setItem("fos_vault_docs", JSON.stringify(updated));
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const newD: VaultDoc = {
      id: "doc-" + Date.now(),
      name: newDocName.trim(),
      category: newDocCat,
      classification: newDocClass,
      uploadedBy: selectedRole,
      uploadedAt: new Date().toISOString().split("T")[0],
      fileSize: (1.2 + Math.random() * 3).toFixed(1) + " MB"
    };

    const updated = [newD, ...docs];
    saveDocs(updated);
    setNewDocName("");
    setSuccessMsg(`Document '${newD.name}' successfully encrypted and loaded into vault!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (id: string) => {
    // Chairperson or Secretary only can delete
    if (selectedRole !== "Chairperson" && selectedRole !== "Secretary") {
      alert(`Access Denied: Deleting files requires Administrator or Secretary privileges.`);
      return;
    }
    const updated = docs.filter(d => d.id !== id);
    saveDocs(updated);
  };

  const handleDownloadAttempt = (doc: VaultDoc) => {
    // Check classification
    if (doc.classification === "Treasurer/Chair Only") {
      if (selectedRole !== "Chairperson" && selectedRole !== "Auditor") {
        setAccessDeniedDoc(doc.name);
        return;
      }
    } else if (doc.classification === "Committee Only") {
      // All committee roles can download except external viewer (if we had one), so they all match Chairperson, Secretary, Auditor, Member
    }
    
    // Simulate successful download
    alert(`Downloading encrypted file: ${doc.name} (${doc.fileSize})`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="document-vault-root">
      
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase border border-indigo-100 flex items-center gap-1 w-max">
            <Briefcase className="w-3.5 h-3.5" /> Secure Document Vault
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Committee Auditable Resource Vault
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Safeguard bank statements, budgets, procurement contracts, and minutes under classified, role-based cryptography seals.
          </p>
        </div>

        {/* Roles switch for simulation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-slate-400 px-1">ROLE:</span>
          {(["Chairperson", "Secretary", "Auditor", "Committee Member"] as const).map((role) => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role);
                setAccessDeniedDoc(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer select-none ${
                selectedRole === role
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl mb-6 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {accessDeniedDoc && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl mb-6 flex items-start gap-2.5 animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold uppercase font-mono text-rose-900">Access Restricted</h4>
            <p className="text-rose-700/90 mt-1 leading-normal">
              You attempted to open or download <strong>"{accessDeniedDoc}"</strong>. This document is sealed under <strong>Treasurer/Chair Only</strong> classification. Your current simulation role ({selectedRole}) has insufficient clearance levels.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Upload files form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-max">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
            Upload Committee Asset
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Document Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Budget estimates Q3"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Document Category:
              </label>
              <select
                value={newDocCat}
                onChange={(e) => setNewDocCat(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer text-slate-700"
              >
                <option value="Budgets">Budgets</option>
                <option value="Meeting Minutes">Meeting Minutes</option>
                <option value="Receipts">Receipts</option>
                <option value="Contracts">Contracts</option>
                <option value="Procurement">Procurement</option>
                <option value="Bank Statements">Bank Statements</option>
                <option value="Audit Reports">Audit Reports</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Security Classification:
              </label>
              <select
                value={newDocClass}
                onChange={(e) => setNewDocClass(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer text-slate-700"
              >
                <option value="Public">Public (Anyone can view)</option>
                <option value="Committee Only">Committee Only</option>
                <option value="Treasurer/Chair Only">Treasurer/Chair Only (Classified)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Securely Upload to Vault
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Document Vault grid ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-6">
              Encrypted Repository Ledger
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docs.map((doc) => {
                
                // Set color scheme based on classification
                let classBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                if (doc.classification === "Treasurer/Chair Only") {
                  classBadge = "bg-rose-50 text-rose-700 border-rose-100";
                } else if (doc.classification === "Committee Only") {
                  classBadge = "bg-indigo-50 text-indigo-700 border-indigo-100";
                }

                return (
                  <div 
                    key={doc.id} 
                    className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[8px] font-mono font-bold border px-2 py-0.5 rounded-full uppercase ${classBadge}`}>
                          {doc.classification}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{doc.category}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">
                        {doc.name}
                      </h4>

                      <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-slate-400">
                        <span>By: {doc.uploadedBy}</span>
                        <span>Size: {doc.fileSize}</span>
                        <span>{doc.uploadedAt}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-150/50 flex justify-between items-center">
                      <button
                        onClick={() => handleDownloadAttempt(doc)}
                        className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>

                      {(selectedRole === "Chairperson" || selectedRole === "Secretary") && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-[10px] font-mono text-rose-500 hover:text-rose-700 uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
