import React from "react";
import { ChevronRight, Layers, LayoutDashboard, Megaphone, Users, Smartphone, Bot, FileText, Settings, HeartHandshake, FolderOpen, Coins } from "lucide-react";
import { Project } from "../types";

interface CampaignBreadcrumbsProps {
  activeTab: string;
  activeProject: Project | null;
  subSection?: string;
  onOpenCampaignSwitcher: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function CampaignBreadcrumbs({
  activeTab,
  activeProject,
  subSection,
  onOpenCampaignSwitcher,
  onNavigateTab
}: CampaignBreadcrumbsProps) {
  // Human readable tab names and icons mapping
  const getTabInfo = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return { label: "Dashboard", icon: LayoutDashboard };
      case "campaigns":
        return { label: "Campaign Workspace", icon: Layers };
      case "supporters":
        return { label: "Supporters & Donors", icon: Users };
      case "live":
        return { label: "Live Fundraising", icon: Megaphone };
      case "simulator":
        return { label: "M-PESA Simulator", icon: Smartphone };
      case "ai":
        return { label: "AI Treasurer", icon: Bot };
      case "documents":
        return { label: "Document Vault", icon: FileText };
      case "settings":
        return { label: "Campaign Settings", icon: Settings };
      default:
        return { 
          label: tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g, " "), 
          icon: FolderOpen 
        };
    }
  };

  const currentTabInfo = getTabInfo(activeTab);
  const TabIcon = currentTabInfo.icon;

  return (
    <nav 
      aria-label="Campaign Workspace Breadcrumb Navigation"
      className="bg-slate-950/80 border-b border-slate-800/60 px-4 py-1.5 shrink-0 z-10 text-[11px] font-mono text-slate-400 select-none backdrop-blur-xs transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5">
        
        {/* Left: Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Root Workspace */}
          <button
            onClick={() => onNavigateTab?.("dashboard")}
            className="flex items-center gap-1 hover:text-slate-200 transition cursor-pointer rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            aria-label="Navigate to Main Dashboard"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold text-slate-300">Harambee Workspace</span>
          </button>

          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* Current Tab */}
          <button
            onClick={() => onNavigateTab?.(activeTab)}
            className="flex items-center gap-1 hover:text-slate-200 transition cursor-pointer rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          >
            <TabIcon className="w-3 h-3 text-slate-400" />
            <span>{currentTabInfo.label}</span>
          </button>

          {/* Active Campaign Link / Universal Selector */}
          {activeProject && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              
              <button
                onClick={onOpenCampaignSwitcher}
                aria-label="Switch Active Campaign"
                className="group flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-extrabold rounded-md transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/80 shadow-2xs"
                title="Click to switch active campaign"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse shrink-0" />
                <span className="truncate max-w-[160px] sm:max-w-[240px] md:max-w-[320px]">
                  {activeProject.name}
                </span>
                <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-emerald-400/80 transition-colors">
                  [Switch]
                </span>
              </button>
            </>
          )}

          {/* Optional Sub-section */}
          {subSection && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-slate-300 font-semibold truncate max-w-[150px]">
                {subSection}
              </span>
            </>
          )}
        </div>

        {/* Right: Quick Campaign Status Tag */}
        {activeProject && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-500 font-mono">
              Target: <strong className="text-slate-300">KES {Number(activeProject.targetAmount || 0).toLocaleString()}</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-800" />
            <span className="text-[10px] text-emerald-400 font-bold font-mono">
              {Math.min(100, Math.round(((Number(activeProject.currentAmount || 0)) / Math.max(1, Number(activeProject.targetAmount || 1))) * 100))}% Raised
            </span>
          </div>
        )}

      </div>
    </nav>
  );
}
