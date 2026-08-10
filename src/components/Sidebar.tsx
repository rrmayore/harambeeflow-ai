import React from "react";
import { 
  LayoutDashboard, Smartphone, Bot, Cpu, FileText, Sparkles, HelpCircle, Download,
  Home, Gift, Landmark, MessageSquare, Shield, ShieldAlert, Scale, Settings, Terminal, Briefcase,
  Globe, Flame, Trophy, Archive, Users, Plus, HeartHandshake, Share2, Coins, TrendingUp, Target,
  CreditCard, ChevronDown
} from "lucide-react";
import { Project } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  geminiActive: boolean;
  onInstall: () => void;
  isInstallable: boolean;
  currentUser?: any;
  onLogout?: () => void;
  isMobile?: boolean;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (dev: boolean) => void;
  syncStatus?: "Online and Synced" | "Offline Changes Pending" | "Sync Complete";
  hasCampaign: boolean;
  activeProject?: Project | null;
  onOpenCampaignSwitcher?: () => void;
  onCreateCampaign?: () => void;
  onLoadSampleCampaign?: () => void;
  onShowHelp?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  geminiActive,
  onInstall,
  isInstallable,
  currentUser,
  onLogout,
  isMobile = false,
  isDeveloperMode,
  setIsDeveloperMode,
  syncStatus = "Online and Synced",
  hasCampaign,
  activeProject,
  onOpenCampaignSwitcher,
  onCreateCampaign,
  onLoadSampleCampaign,
  onShowHelp
}: SidebarProps) {
  const [showAbout, setShowAbout] = React.useState(false);
  const [showSupport, setShowSupport] = React.useState(false);

  const renderSyncStatusBadge = (status: "Online and Synced" | "Offline Changes Pending" | "Sync Complete") => {
    if (status === "Online and Synced") {
      return null;
    }
    if (status === "Sync Complete") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-800/30">
          <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1] animate-bounce" />
          Sync Complete
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium font-mono bg-amber-950/40 text-amber-400 border border-amber-800/30">
        <span className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse" />
        Offline Pending
      </span>
    );
  };
  
  const publicItems = [
    { id: "landing", label: "Campaign Page", icon: Home, desc: "High-converting public onboarding page" },
    { id: "trust", label: "Trust & Security", icon: Shield, desc: "Fintech compliance, non-custodial money details" },
  ];

  const commItems = [
    { id: "whatsapp-logs", label: "WhatsApp Logs", icon: MessageSquare, desc: "Track delivery and read status of WhatsApp confirmations" },
  ];

  const userItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Treasurer Command Center & AI recommendations" },
    { id: "campaigns", label: "Campaigns", icon: Target, desc: "Plan, execute, monitor, automate, celebrate, and archive campaigns" },
    { id: "collect", label: "Fundraisers", icon: HeartHandshake, desc: "STK push callback simulator, Cash logging & SMS parser" },
    { id: "committee", label: "Committee", icon: Users, desc: "Multi-role workspace, invitations, chat room & secure audit log" },
    { id: "pledges", label: "Contributors", icon: Coins, desc: "Record promises, track balance fulfillment & run AI reconciliation" },
    { id: "documents", label: "Documents 📂", icon: Briefcase, desc: "Executive digital records, beautiful receipts & certificates vault" },
    { id: "share", label: "Share Campaign", icon: Share2, desc: "WhatsApp broadcasts, printable QR flyers & web guidelines" },
    { id: "report", label: "Reports", icon: FileText, desc: "Reconciled ledger audit sheets & print-ready PDF briefs" },
    { id: "insights", label: "Insights", icon: TrendingUp, desc: "AI intelligence, donation trends & goal forecasting" },
    { id: "settings", label: "Settings", icon: Settings, desc: "Reset sandbox parameters, load sample campaigns & configs" },
    { id: "billing", label: "Billing & Subscription", icon: CreditCard, desc: "Manage plans, usage limits, invoices & M-PESA" },
  ];

  const systemItems = [
    { id: "whatsapp-api", label: "WhatsApp Automation", icon: MessageSquare, desc: "Meta Business & Twilio webhook specs" },
    { id: "daraja-onboarding", label: "Daraja Onboarding", icon: Landmark, desc: "onboarding checklists & church exemptions" },
    { id: "super-admin", label: "Super Admin Hub", icon: ShieldAlert, desc: "Fraud panel & national stress load simulator" },
    { id: "compliance", label: "Compliance Manuals", icon: Scale, desc: "Kenya Data Protection Act requirements" },
  ];

  const sandboxItems = [
    { id: "simulator", label: "M-PESA Simulator", icon: Smartphone, desc: "Simulate Daraja callback events & STK Pushes" },
    { id: "ai-prompt", label: "AI Prompt Customizer", icon: Bot, desc: "Prompt engineering sandbox & models" },
    { id: "developer", label: "Developer Blueprint", icon: FileText, desc: "Flutter, Daraja, Node & Firebase code assets" },
  ];

  const campaignActionItems = [
    { id: "create", label: "Create Campaign", icon: Plus, desc: "Launch new campaigns in under 60 seconds", action: onCreateCampaign || (() => {}) },
    { id: "load-sample", label: "Load Sample Campaign", icon: Sparkles, desc: "Seed Nairobi Medical Fund sandbox campaign", action: onLoadSampleCampaign || (() => {}) },
  ];

  const renderSection = (title: string, items: Array<{ id: string; label: string; icon: any; desc: string; action?: () => void }>) => (
    <div className="space-y-1.5 pt-3">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 font-mono">{title}</p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                setActiveTab(item.id);
              }
            }}
            className={`w-full flex items-start gap-3 px-3.5 py-2.5 rounded-xl transition duration-150 text-left border cursor-pointer ${
              isActive
                ? "bg-slate-800 text-emerald-400 border-slate-700 font-semibold shadow-xs"
                : "text-slate-400 hover:bg-slate-850 hover:text-slate-200 border-transparent"
            }`}
          >
            <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <span className="text-[12.5px] leading-none block font-medium">{item.label}</span>
              <span className="text-[10px] text-slate-500 mt-1 block truncate leading-tight">{item.desc}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const setupItems = [
    { id: "landing", label: "Home Portal", icon: Home, desc: "High-converting public onboarding page", action: () => setActiveTab("landing") },
    { id: "trust", label: "Trust & Security", icon: Shield, desc: "Fintech compliance, non-custodial money details", action: () => setActiveTab("trust") },
    { id: "create", label: "Create Campaign", icon: Plus, desc: "Launch new campaigns in under 60 seconds", action: onCreateCampaign || (() => {}) },
    { id: "load-sample", label: "Load Sample Campaign", icon: Sparkles, desc: "Seed Nairobi Medical Fund sandbox campaign", action: onLoadSampleCampaign || (() => {}) },
    { id: "help", label: "Help Center & Tour", icon: HelpCircle, desc: "Safaricom sandbox guide & setup walkthrough", action: onShowHelp || (() => {}) },
    { id: "settings", label: "Settings", icon: Settings, desc: "Configure database & user accounts", action: () => setActiveTab("settings") },
    { id: "billing", label: "Billing & Subscription", icon: CreditCard, desc: "Manage plans, usage limits & M-PESA payment", action: () => setActiveTab("billing") },
  ];

  return (
    <aside className={isMobile ? "flex-1 flex flex-col select-none overflow-y-auto" : "w-80 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen select-none sticky top-0 md:flex hidden animate-fade-in z-20"}>
      
      {/* Brand Header (Desktop only - mobile drawer provides primary header) */}
      {!isMobile && (
        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg shadow-emerald-950/50 text-slate-950 font-black font-mono text-sm shrink-0">
              HF
            </div>
            <div className="flex flex-col leading-tight text-left">
              <h1 className="font-sans font-black tracking-tight text-lg text-white">
                HarambeeFlow
              </h1>
              <span className="text-xs font-mono font-medium text-emerald-400 tracking-wide mt-0.5">
                AI Treasurer
              </span>
              {syncStatus !== "Online and Synced" && (
                <div className="mt-1">
                  {renderSyncStatusBadge(syncStatus)}
                </div>
              )}
            </div>
          </div>

          {/* Active Campaign Switcher Widget */}
          {activeProject && (
            <button
              onClick={() => onOpenCampaignSwitcher?.()}
              aria-label="Switch Active Campaign"
              className="mt-3.5 w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition duration-150 flex items-center justify-between text-left group cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              id="sidebar-active-campaign-button"
              title="Click to switch or manage campaigns"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0 animate-pulse" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Active Fundraiser
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate block">
                    {activeProject.name}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-transform group-hover:translate-y-0.5 shrink-0 ml-1" />
            </button>
          )}

          {/* Mode Switcher Widget */}
          {hasCampaign && (
            <div className="mt-4 p-1.5 bg-slate-950 border border-slate-800 rounded-xl flex gap-1">
              <button
                onClick={() => {
                  setIsDeveloperMode(false);
                  if (["whatsapp-api", "daraja-onboarding", "super-admin", "compliance", "simulator", "ai-prompt", "developer"].includes(activeTab)) {
                    setActiveTab("dashboard");
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold font-sans flex items-center justify-center gap-1 cursor-pointer transition ${
                  !isDeveloperMode 
                    ? "bg-emerald-500 text-slate-950 shadow-md" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Treasurer
              </button>
              <button
                onClick={() => setIsDeveloperMode(true)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold font-sans flex items-center justify-center gap-1 cursor-pointer transition ${
                  isDeveloperMode 
                    ? "bg-amber-500 text-slate-950 shadow-md" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Developer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Categories Content scrollable */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!hasCampaign ? (
          <>
            {renderSection("Setup & Onboarding", setupItems)}
            {isMobile && (
              <div className="space-y-1.5 pt-4 border-t border-slate-800 mt-3">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 font-mono">Secondary Pages</p>
                <button
                  onClick={() => { if (onShowHelp) onShowHelp(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <HelpCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">Help Center & Tour</span>
                </button>
                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <Cpu className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">About HarambeeFlow</span>
                </button>
                {showAbout && (
                  <div className="mx-3.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-sans leading-relaxed">
                    <strong className="text-white block mb-1">HarambeeFlow AI v6</strong>
                    Kenya's smart fundraising and community treasurer ecosystem.
                  </div>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/20 text-left cursor-pointer"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    <span className="text-[12.5px] font-semibold">Sign Out / Logout</span>
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {renderSection("Campaign Actions", campaignActionItems)}
            {renderSection("Public Portal", publicItems)}
            {renderSection("Participant Desks", userItems)}
            {renderSection("Communications", commItems)}
            {isDeveloperMode && (
              <>
                {renderSection("System & Compliance", systemItems)}
                {renderSection("Sandboxes & Blueprints", sandboxItems)}
              </>
            )}
            {isMobile && (
              <div className="space-y-1.5 pt-4 border-t border-slate-800 mt-3">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 font-mono">Secondary Pages</p>
                
                <button
                  onClick={() => { if (onShowHelp) onShowHelp(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <HelpCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">Help Center & Tour</span>
                </button>

                <button
                  onClick={() => {
                    setIsDeveloperMode(!isDeveloperMode);
                    if (!isDeveloperMode) {
                      setActiveTab("simulator");
                    } else {
                      setActiveTab("dashboard");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left cursor-pointer ${
                    isDeveloperMode ? "bg-amber-950/20 text-amber-300 border border-amber-800/30" : "text-slate-300 hover:bg-slate-850 hover:text-slate-100"
                  }`}
                >
                  <Terminal className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[12.5px] font-medium">Developer Center</span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {isDeveloperMode ? "Active" : "Tap to enable"}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <Cpu className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">About HarambeeFlow</span>
                </button>
                {showAbout && (
                  <div className="mx-3.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-sans leading-relaxed">
                    <strong className="text-white block mb-1">HarambeeFlow AI v6</strong>
                    Kenya's smart fundraising and community treasurer ecosystem.
                  </div>
                )}

                <button
                  onClick={() => setActiveTab("compliance")}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <Scale className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">Privacy Policy</span>
                </button>

                <button
                  onClick={() => setActiveTab("compliance")}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <FileText className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">Terms of Service</span>
                </button>

                <button
                  onClick={() => setShowSupport(!showSupport)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-slate-100 text-left cursor-pointer"
                >
                  <MessageSquare className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                  <span className="text-[12.5px] font-medium">Support Help Desk</span>
                </button>
                {showSupport && (
                  <div className="mx-3.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-sans leading-relaxed">
                    <strong className="text-white block mb-1">Safaricom Dev Support</strong>
                    Contact <span className="text-emerald-400 underline">support@harambeeflow.org</span> or visit Safaricom Developer Portal.
                  </div>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/20 text-left cursor-pointer"
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    <span className="text-[12.5px] font-semibold">Sign Out / Logout</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Footer controls & install */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-2.5">
          <div className={`p-1 rounded-lg ${geminiActive ? "bg-amber-500/20 text-amber-400 animate-bounce" : "bg-slate-800 text-slate-500"} shrink-0`}>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-200">AI Engine Ready</h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
              {geminiActive 
                ? "HarambeeFlow AI assistant active." 
                : "HarambeeFlow AI offline mode."}
            </p>
          </div>
        </div>
        
        <div className="mt-3 space-y-2.5">
          <button
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-mono font-bold rounded-xl shadow-md cursor-pointer transition transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            {isInstallable ? "Install HarambeeFlow" : "Add App to Home Screen"}
          </button>

          {currentUser && (
            <div className="pt-3 border-t border-slate-800 space-y-2 text-left">
              <div className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-[10px] font-bold">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-300 font-medium truncate">{currentUser.email}</p>
                  <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Ecosystem Admin</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center py-1.5 px-3 border border-slate-800 hover:border-slate-700 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-[10px] font-mono rounded-lg transition"
              >
                Sign Out / Logout
              </button>
            </div>
          )}
          
          <div className="text-center pt-1.5">
            <a
              href="https://github.com/Safaricom-Developer"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono inline-flex items-center gap-1 transition"
            >
              <HelpCircle className="w-3 h-3" /> Safaricom Dev Portal
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
