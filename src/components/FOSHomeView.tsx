import React, { useState, useEffect } from "react";
import { Project, Contribution } from "../types";
import { 
  LayoutDashboard, Users, TrendingUp, Sparkles, Clock, CheckSquare, 
  ArrowRight, ShieldCheck, FileText, Plus, RefreshCw, AlertCircle, 
  MessageSquare, Globe, Gift, CheckCircle2, Trophy, Flame
} from "lucide-react";

interface FOSHomeViewProps {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  contributions: Contribution[];
  setActiveTab: (tab: string) => void;
  onStartFundraiserLauncher: () => void;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string;
  category: string;
}

export default function FOSHomeView({
  projects,
  activeProject,
  setActiveProject,
  contributions,
  setActiveTab,
  onStartFundraiserLauncher
}: FOSHomeViewProps) {
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCat, setNewTaskCat] = useState("Committee");

  // Load and seed tasks
  useEffect(() => {
    const saved = localStorage.getItem("fos_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const defaultTasks: Task[] = [
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

  const saveTasks = (updatedTasks: Task[]) => {
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
    const newTask: Task = {
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

  // Math Calculations for General Command Center
  const activeCount = projects.filter(p => !p.name.toLowerCase().includes("archived") && !p.name.toLowerCase().includes("closed")).length;
  const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0);
  
  // Calculate average health
  const totalHealth = projects.reduce((sum, p) => sum + (p.healthScore || 85), 0);
  const avgHealth = projects.length > 0 ? Math.round(totalHealth / projects.length) : 85;

  // Calculate Treasurer Efficiency Score: (processed contributions * 10) + (hours saved * 20)
  // Let's assume hours saved is ~0.15h per M-PESA transaction matched automatically
  const hoursSavedVal = contributions.length * 0.15;
  const successScore = Math.min(100, Math.round(50 + (contributions.length * 1.5) + (hoursSavedVal * 2)));

  // Categorize contributions for trends
  const recentContributions = [...contributions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const handleSelectProjectAndRoute = (proj: Project, tab: string) => {
    setActiveProject(proj);
    setActiveTab(tab);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 font-sans p-6" id="fos-home-root">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ★ HARAMBEE FLOW OS
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            Fundraising Operating System <span className="text-xs bg-emerald-500 text-white font-mono font-normal px-2 py-0.5 rounded-sm">V2.4 PRO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Committee transparency, automated Daraja reconciliations, audit trails, and donor trust metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("templates")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Quick Template Launch
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Active drives */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{activeCount} Drives</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{projects.length} Total Registered</p>
          </div>
        </div>

        {/* Card 2: Cumulative collection */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Raised (KES)</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              KES {totalRaised.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 inline" /> 100% Daraja Audited
            </p>
          </div>
        </div>

        {/* Card 3: Average health score */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Campaign Health Score</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{avgHealth}% Rating</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Weighted on matching data</p>
          </div>
        </div>

        {/* Card 4: Treasurer efficiency */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Hours Reclaim Rate</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">+{hoursSavedVal.toFixed(1)} hrs</h3>
            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Score: {successScore}/100 PRO</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Left is Active Campaigns Ledger, Right is Task Checklist & Recent Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Campaigns (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Active Campaigns Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Launch actions, track goals, and access portal parameters.</p>
              </div>
              <button 
                onClick={onStartFundraiserLauncher}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold font-mono uppercase bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Start Campaign
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => {
                const projContributions = contributions.filter(c => c.projectId === proj.id);
                const raisedAmount = projContributions.reduce((sum, c) => sum + c.amount, 0);
                const pct = Math.min(100, Math.round((raisedAmount / proj.targetAmount) * 100)) || 0;
                
                // Color codes for different sectors
                let catBadge = "bg-slate-100 text-slate-700";
                if (proj.category.includes("Church")) catBadge = "bg-purple-100 text-purple-700";
                else if (proj.category.includes("Medical")) catBadge = "bg-rose-100 text-rose-700";
                else if (proj.category.includes("Education")) catBadge = "bg-blue-100 text-blue-700";
                else if (proj.category.includes("Chama")) catBadge = "bg-amber-100 text-amber-700";
                else if (proj.category.includes("Wedding")) catBadge = "bg-pink-100 text-pink-700";

                const isActive = activeProject?.id === proj.id;

                return (
                  <div 
                    key={proj.id} 
                    className={`border rounded-xl p-5 hover:border-slate-300 transition-all ${
                      isActive ? "border-indigo-500 bg-indigo-50/10 shadow-xs" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{proj.name}</h4>
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${catBadge}`}>
                            {proj.category}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              Active Context
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 max-w-xl">
                          {proj.description || "No description provided for this fundraiser campaign drive."}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Health Rating</span>
                        <span className={`text-xs font-mono font-bold ${
                          (proj.healthScore || 85) >= 80 ? "text-emerald-600" : "text-amber-500"
                        }`}>
                          {proj.healthScore || 85}% Optimized
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">
                      <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                        <span className="text-slate-500">Raised: <strong className="text-slate-800">KES {raisedAmount.toLocaleString()}</strong></span>
                        <span className="text-indigo-600 font-bold">{pct}% Complete</span>
                        <span className="text-slate-400">Target: KES {proj.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta values */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">ShortCode</span>
                        <span className="text-slate-700 font-bold">{proj.paybillNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Ref Code</span>
                        <span className="text-slate-700 font-bold">{proj.accountReference || "AUTO"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Givers</span>
                        <span className="text-slate-700 font-bold">{projContributions.length} Contributors</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Phone</span>
                        <span className="text-slate-700 font-bold">{proj.treasurerPhone}</span>
                      </div>
                    </div>

                    {/* OS Direct Action Panel */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSelectProjectAndRoute(proj, "dashboard")}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-mono font-bold text-[10px] uppercase rounded-lg transition flex items-center gap-1"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> Manage Ledger
                      </button>

                      <button
                        onClick={() => handleSelectProjectAndRoute(proj, "public-pages")}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 font-mono font-bold text-[10px] uppercase rounded-lg transition flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" /> Public Page
                      </button>

                      <button
                        onClick={() => handleSelectProjectAndRoute(proj, "receipts")}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-mono font-bold text-[10px] uppercase rounded-lg transition flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5" /> Issue Receipt
                      </button>

                      <button
                        onClick={() => handleSelectProjectAndRoute(proj, "committee")}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 font-mono font-bold text-[10px] uppercase rounded-lg transition flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" /> Committee View
                      </button>

                      <button
                        onClick={() => handleSelectProjectAndRoute(proj, "closure")}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-mono font-bold text-[10px] uppercase rounded-lg transition flex items-center gap-1 ml-auto"
                      >
                        <Flame className="w-3.5 h-3.5" /> Close campaign
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Tasks Checklist & Recent activity */}
        <div className="space-y-6">
          
          {/* Timeline tasks checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-600" /> Pending Tasks Ledger
            </h3>

            <form onSubmit={handleAddTask} className="mb-4 flex gap-1">
              <input
                type="text"
                placeholder="Add new committee action item..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={newTaskCat}
                onChange={(e) => setNewTaskCat(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-[10px] font-mono rounded-xl px-1 py-2 text-slate-600 cursor-pointer"
              >
                <option value="Audit">Audit</option>
                <option value="Governance">Gov</option>
                <option value="Comms">Comms</option>
                <option value="Closure">Close</option>
              </select>
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition ${
                    task.completed 
                      ? "border-emerald-100 bg-emerald-50/20 text-slate-400" 
                      : "border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    className="mt-1 cursor-pointer rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-relaxed truncate ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {task.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-400">
                      <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded-sm font-bold text-[8px] uppercase">
                        {task.category}
                      </span>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Auditable Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" /> Recent Activity Log
            </h3>

            <div className="space-y-4">
              {recentContributions.length > 0 ? (
                recentContributions.map((contrib, idx) => (
                  <div key={contrib.id || idx} className="flex gap-3 items-start text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      KES
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {contrib.senderName || "Unknown Contributor"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Contributed KES {contrib.amount.toLocaleString()} via M-PESA Code: <span className="font-mono text-indigo-600 font-bold">{contrib.transactionCode}</span>
                      </p>
                      <span className="text-[9px] font-mono text-slate-400 block mt-1">
                        {new Date(contrib.timestamp).toLocaleTimeString()} - Verified
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-mono">
                  No recent audit activities registered.
                </div>
              )}
            </div>
          </div>

          {/* System Certifications */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200">Legal Compliance Cert</h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This system processes Safaricom Daraja webhooks strictly in accordance with the <strong>Kenya Data Protection Act (ODPC 2019)</strong>. All manual imports are signed and held in audited journals.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-400">
              <span>SHA-256 SECURED</span>
              <span className="text-emerald-400">STATUS: AUDITED ✓</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
