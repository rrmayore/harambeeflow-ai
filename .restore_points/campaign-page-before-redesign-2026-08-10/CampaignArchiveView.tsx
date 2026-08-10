import React, { useState } from "react";
import { Archive, Search, BarChart3, TrendingUp, Info, HelpCircle, FileText, ArrowRight, Layers, Coins } from "lucide-react";

interface ArchivedCampaign {
  id: string;
  name: string;
  category: string;
  goal: number;
  raised: number;
  contributors: number;
  year: string;
  health: number;
  description: string;
}

export default function CampaignArchiveView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Seeded completed historical campaigns
  const [archives] = useState<ArchivedCampaign[]>([
    { id: "arc-1", name: "Sanctuary Construction Phase 1", category: "Community/Church", goal: 800000, raised: 825000, contributors: 145, year: "2025", health: 96, description: "Phase 1 construction of structural columns and roofing frames for the new local church building project." },
    { id: "arc-2", name: "Medical Appeal - Mama Mary", category: "Medical/Family", goal: 400000, raised: 412000, contributors: 98, year: "2025", health: 92, description: "Emergency fund drive to support Mama Mary with open-heart surgery bill clearance and treatment." },
    { id: "arc-3", name: "Regional Pathfinder Rally Fund", category: "Community/Church", goal: 200000, raised: 185000, contributors: 65, year: "2024", health: 88, description: "Sponsorship of camp registrations, caravan transport, and gear allocations for our church youth." },
    { id: "arc-4", name: "Chama Welfare - Education Seed", category: "Education/Chama", goal: 150000, raised: 150000, contributors: 35, year: "2024", health: 94, description: "Seasonal rotary micro-credit seed funds for school fees and tuition support." },
    { id: "arc-5", name: "Local Area Relief Harambee", category: "General/Harambee", goal: 300000, raised: 310000, contributors: 110, year: "2023", health: 90, description: "General community welfare pooling for drought and flood response log support." }
  ]);

  const filtered = archives.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.year.includes(searchTerm)
  );

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(x => x !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        // limit to 2
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  // Compare campaigns math
  const comp1 = archives.find(a => a.id === selectedForCompare[0]);
  const comp2 = archives.find(a => a.id === selectedForCompare[1]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="campaign-archive-root">
      
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-150 px-2.5 py-1 rounded-full uppercase border border-slate-250 flex items-center gap-1 w-max">
            <Archive className="w-3.5 h-3.5" /> Campaign Archive & History
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Institutional Campaign Memory & Trend Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search completed campaigns, compare performance variables side-by-side, and retrieve historical PDF report files.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search past campaigns or years..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {/* Comparison Panel (only shows if at least 1 selected) */}
      {selectedForCompare.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Comparative Performance Desk
            </h3>
            <button 
              onClick={() => setSelectedForCompare([])}
              className="text-xs font-mono text-rose-500 hover:text-rose-700 uppercase font-bold"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Slot 1 */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50">
              {comp1 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{comp1.year} - {comp1.category}</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">{comp1.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Target Goal</span>
                      <p className="font-bold text-slate-800">KES {comp1.goal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Raised</span>
                      <p className="font-bold text-emerald-600">KES {comp1.raised.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contributors</span>
                      <p className="font-bold text-slate-800">{comp1.contributors} Givers</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg Donation</span>
                      <p className="font-bold text-slate-800">KES {Math.round(comp1.raised / comp1.contributors).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-mono text-center py-12">Select another campaign below to compare side-by-side</p>
              )}
            </div>

            {/* Slot 2 */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50">
              {comp2 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{comp2.year} - {comp2.category}</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">{comp2.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Target Goal</span>
                      <p className="font-bold text-slate-800">KES {comp2.goal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Raised</span>
                      <p className="font-bold text-emerald-600">KES {comp2.raised.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contributors</span>
                      <p className="font-bold text-slate-800">{comp2.contributors} Givers</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg Donation</span>
                      <p className="font-bold text-slate-800">KES {Math.round(comp2.raised / comp2.contributors).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-mono text-center py-12">Select a second campaign below to compare side-by-side</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Archives List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-6">
          Historical Campaigns Register
        </h3>

        <div className="space-y-4">
          {filtered.map((arc) => {
            const isComparing = selectedForCompare.includes(arc.id);
            const pct = Math.min(100, Math.round((arc.raised / arc.goal) * 100));

            return (
              <div 
                key={arc.id} 
                className="border border-slate-150 rounded-2xl p-5 hover:border-slate-300 transition bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm">
                      YEAR: {arc.year}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{arc.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {arc.description}
                  </p>
                </div>

                {/* Progress bar info */}
                <div className="w-40 text-xs font-mono shrink-0">
                  <div className="flex justify-between items-center mb-1 text-slate-500">
                    <span>{pct}% Raised</span>
                    <span className="font-bold text-emerald-600">KES {arc.raised.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Goal: KES {arc.goal.toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleToggleCompare(arc.id)}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold rounded-lg border transition cursor-pointer uppercase ${
                      isComparing 
                        ? "bg-indigo-600 text-white border-indigo-600" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isComparing ? "Selected ✓" : "Compare"}
                  </button>

                  <button
                    onClick={() => alert(`Opening Historical Report Package for ${arc.name}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg transition uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Past Report
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
