import React, { useState } from "react";
import { 
  X, Check, Plus, Copy, Archive, Trash2, ExternalLink, Layers, 
  Target, Sparkles, FolderOpen, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw
} from "lucide-react";
import { Project } from "../types";

interface CampaignSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateNewCampaign: () => void;
  onDuplicateProject: (project: Project) => void;
  onArchiveProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function CampaignSwitcherModal({
  isOpen,
  onClose,
  projects,
  activeProject,
  onSelectProject,
  onCreateNewCampaign,
  onDuplicateProject,
  onArchiveProject,
  onDeleteProject
}: CampaignSwitcherModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "active" | "draft" | "completed" | "archived">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getStatus = (p: Project) => {
    const rawStatus = (p.status || "").toLowerCase();
    const current = Number(p.currentAmount || 0);
    const target = Number(p.targetAmount || 1);
    if (rawStatus === "archived") return "archived";
    if (rawStatus === "draft") return "draft";
    if (rawStatus === "completed" || (target > 0 && current >= target)) return "completed";
    return "active";
  };

  const activeProjects = projects.filter(p => getStatus(p) === "active");
  const draftProjects = projects.filter(p => getStatus(p) === "draft");
  const completedProjects = projects.filter(p => getStatus(p) === "completed");
  const archivedProjects = projects.filter(p => getStatus(p) === "archived");

  const filteredProjects = projects.filter(p => {
    const status = getStatus(p);
    if (filterTab === "active") return status === "active";
    if (filterTab === "draft") return status === "draft";
    if (filterTab === "completed") return status === "completed";
    if (filterTab === "archived") return status === "archived";
    return true;
  });

  // Format relative time helper
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "Recently updated";
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Updated just now";
      if (diffMins < 60) return `Updated ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Updated ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Updated ${diffDays}d ago`;
    } catch {
      return "Recently updated";
    }
  };

  const getEmptyStateContent = () => {
    if (projects.length === 0) {
      return {
        title: "No Campaigns Found",
        subtitle: "Create your first fundraiser to start collecting M-PESA contributions.",
        buttonText: "Create First Fundraiser"
      };
    }
    if (filterTab === "active" && activeProjects.length === 0) {
      return {
        title: "No Active Campaigns",
        subtitle: "You currently have no active fundraising drives running.",
        buttonText: "Create Active Fundraiser"
      };
    }
    if (filterTab === "draft" && draftProjects.length === 0) {
      return {
        title: "No Draft Campaigns",
        subtitle: "Complete setup to launch fundraising.",
        buttonText: "Create Draft Fundraiser"
      };
    }
    if (filterTab === "archived" && archivedProjects.length === 0) {
      return {
        title: "No Archived Campaigns",
        subtitle: "Archived fundraisers will appear here for historical reference.",
        buttonText: "Create New Fundraiser"
      };
    }
    return {
      title: "No Campaigns Match Filter",
      subtitle: "Try switching tabs or creating a new campaign drive.",
      buttonText: "Create New Campaign"
    };
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in" id="campaign-switcher-modal-overlay">
      
      {/* Toast Alert Feedback */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[160] bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-5 py-2.5 rounded-2xl shadow-2xl font-mono text-xs flex items-center gap-2 animate-slide-in-down">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up relative">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-sans font-black tracking-tight text-white flex items-center gap-2">
                Campaign Switcher & Workspace Manager
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Switch between active fundraising drives or organize your campaigns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {[
              { id: "all", label: "All Drives", count: projects.length },
              { id: "active", label: "Active", count: activeProjects.length },
              { id: "draft", label: "Drafts", count: draftProjects.length },
              { id: "completed", label: "Completed", count: completedProjects.length },
              { id: "archived", label: "Archived", count: archivedProjects.length },
            ].map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    isActive ? "bg-slate-950/30 text-slate-950 font-black" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onCreateNewCampaign();
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-102 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>

        {/* List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filteredProjects.length === 0 ? (
            (() => {
              const empty = getEmptyStateContent();
              return (
                <div className="py-12 text-center text-slate-400 space-y-3.5 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                    <FolderOpen className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{empty.title}</h3>
                    <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">{empty.subtitle}</p>
                  </div>
                  <button
                    onClick={onCreateNewCampaign}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black text-xs rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{empty.buttonText}</span>
                  </button>
                </div>
              );
            })()
          ) : (
            filteredProjects.map((p) => {
              const isActiveWorkspace = p.id === activeProject?.id;
              const status = getStatus(p);
              const current = Number(p.currentAmount || 0);
              const target = Number(p.targetAmount || 1);
              const progressPct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
              const supportersCount = (p as any).supporterCount || (p as any).contributionsCount || (current > 0 ? Math.max(1, Math.round(current / 3500)) : 0);
              const lastUpdatedText = getRelativeTime((p as any).updatedAt || (p as any).createdAt);

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActiveWorkspace
                      ? "bg-slate-950 border-l-4 border-l-emerald-500 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
                      : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700"
                  }`}
                >
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white truncate">
                        {p.name}
                      </h3>
                      
                      {isActiveWorkspace && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-black uppercase rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Currently Managing
                        </span>
                      )}

                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md border ${
                        status === "active" ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" :
                        status === "draft" ? "bg-amber-950/60 text-amber-300 border-amber-800/40" :
                        status === "completed" ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/40" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {status}
                      </span>
                      
                      <span className="text-xs text-slate-400 font-mono">
                        • {p.campaignCategory || p.sectorCategory || "Community"}
                      </span>
                    </div>

                    {/* Enhanced Stats Row: KES Raised, Progress %, Supporters & Updated Time */}
                    <div className="flex items-center gap-3 text-xs font-mono flex-wrap text-slate-300">
                      <span>
                        <strong className="text-white font-extrabold">KES {current.toLocaleString()}</strong> Raised
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        <strong className="text-emerald-400 font-bold">{progressPct}%</strong> Goal (KES {target.toLocaleString()})
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        <strong className="text-slate-200">{supportersCount}</strong> Supporters
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 italic">
                        {lastUpdatedText}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 font-sans">
                      {p.description || "No description provided."}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 justify-end flex-wrap">
                    {/* Select / Switch Button */}
                    {!isActiveWorkspace ? (
                      <button
                        onClick={() => {
                          onSelectProject(p);
                          showToast(`Now managing "${p.name}"`);
                          onClose();
                        }}
                        aria-label={`Switch Active Campaign to ${p.name}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Switch Workspace</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        aria-label={`Currently managing ${p.name}`}
                        className="px-3 py-2 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 opacity-90 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Active Now</span>
                      </button>
                    )}

                    {/* Duplicate Button */}
                    <button
                      onClick={() => {
                        onDuplicateProject(p);
                        showToast(`Duplicated campaign "${p.name}"`);
                      }}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer"
                      title="Duplicate Campaign"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Archive Button */}
                    <button
                      onClick={() => {
                        onArchiveProject(p);
                        showToast(p.status === "Archived" ? `Restored "${p.name}" to Active` : `Archived "${p.name}"`);
                      }}
                      className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer"
                      title={p.status === "Archived" ? "Unarchive Campaign" : "Archive Campaign"}
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Confirmation Sub-dialog for Deleting */}
                  {confirmDeleteId === p.id && (
                    <div className="w-full mt-3 p-4 bg-rose-950/90 border border-rose-500/40 rounded-2xl space-y-3 animate-slide-in-down col-span-full">
                      <div className="flex items-center gap-2 text-rose-300 text-xs font-mono font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Confirm Deletion of "{p.name}"?</span>
                      </div>
                      <p className="text-xs text-rose-200">
                        This action will permanently delete this campaign workspace. This action cannot be undone.
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onDeleteProject(p.id);
                            setConfirmDeleteId(null);
                            showToast(`Deleted campaign "${p.name}"`);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                        >
                          Yes, Delete Campaign
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <span>Active Campaign:</span>
            <span className="text-emerald-400 font-bold truncate max-w-[200px]">
              {activeProject ? activeProject.name : "None selected"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-mono text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
