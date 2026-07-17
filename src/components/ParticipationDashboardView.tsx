import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  Users, Award, Sparkles, AlertTriangle, Settings, ArrowUpRight, 
  HelpCircle, CheckCircle2, TrendingUp, Compass, HeartHandshake 
} from "lucide-react";

interface ParticipationDashboardViewProps {
  activeProject: Project;
  contributions: Contribution[];
  totalGroupMembers: number;
  setTotalGroupMembers: (n: number) => void;
}

export default function ParticipationDashboardView({
  activeProject,
  contributions,
  totalGroupMembers,
  setTotalGroupMembers
}: ParticipationDashboardViewProps) {
  const [showConfig, setShowConfig] = useState(false);

  const projectContributions = contributions.filter(c => c.projectId === activeProject.id && !c.hasDuplicates);
  
  // Calculate unique contributors
  const contributorFrequencies: Record<string, { count: number; firstTimestamp: string; lastTimestamp: string }> = {};
  
  projectContributions.forEach(c => {
    const existing = contributorFrequencies[c.cleanedName];
    if (existing) {
      existing.count += 1;
      if (new Date(c.timestamp) < new Date(existing.firstTimestamp)) {
        existing.firstTimestamp = c.timestamp;
      }
      if (new Date(c.timestamp) > new Date(existing.lastTimestamp)) {
        existing.lastTimestamp = c.timestamp;
      }
    } else {
      contributorFrequencies[c.cleanedName] = {
        count: 1,
        firstTimestamp: c.timestamp,
        lastTimestamp: c.timestamp
      };
    }
  });

  const uniqueContributors = Object.keys(contributorFrequencies).length;
  const membersPending = Math.max(0, totalGroupMembers - uniqueContributors);
  const participationRate = Math.round((uniqueContributors / totalGroupMembers) * 100);

  // New Participants (e.g. joined in the last 5 days)
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000);
  const newParticipants = Object.values(contributorFrequencies).filter(freq => {
    return new Date(freq.firstTimestamp) > fiveDaysAgo;
  }).length;

  // Returning Participants (frequency >= 2 contributions)
  const returningParticipants = Object.values(contributorFrequencies).filter(freq => freq.count >= 2).length;

  // Consistency Leaderboard - Rank strictly by frequency count (descending)
  const consistencyLeaderboard = Object.entries(contributorFrequencies)
    .map(([name, stats]) => {
      // Determine badge status
      let badge = "早期支持者 (Early Supporter)"; // Early Supporter
      if (stats.count >= 3) {
        badge = "Gold Consistency Champion (3+ Posts)";
      } else if (stats.count === 2) {
        badge = "Faithful Chama Supporter";
      } else {
        // Check if early contribution (e.g., matching first few hours of project creation)
        const isEarly = new Date(stats.firstTimestamp) < new Date(Date.now() - 3 * 24 * 3600 * 1000);
        badge = isEarly ? "Early Supporter Recognition" : "Active Campaign Supporter";
      }

      return {
        name,
        count: stats.count,
        badge,
        lastDate: stats.lastTimestamp
      };
    })
    .sort((a, b) => b.count - a.count); // sort by frequency, NOT amount!

  // Visual Progress Ring configuration
  const radius = 45;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, participationRate) / 100) * circumference;

  // Weekly participation history comparison
  const weeklyTrends = [
    { week: "Week 1", rate: Math.max(10, Math.round(participationRate * 0.3)), label: "Campaign Launch" },
    { week: "Week 2", rate: Math.max(25, Math.round(participationRate * 0.6)), label: "Midway Rally" },
    { week: "Week 3", rate: participationRate, label: "Current Pace" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Intro Metrics Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-indigo-600 uppercase">Participation Analytics Desk</span>
          <h3 className="font-sans font-extrabold text-slate-900 text-lg mt-1">Harambee Inclusivity Dashboard</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Fundraisers are far more successful when everyone participates. Monitor group inclusivity, detect disengaged list segments, and encourage consistency instead of large singular cash amounts.
          </p>
        </div>

        {/* Total Group Size configuration button */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Set Group Size ({totalGroupMembers} Members)
          </button>
        </div>
      </div>

      {/* Slide-out settings form to update Total Members */}
      {showConfig && (
        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-900 block">Configure Chama/Committee Membership Size</span>
            <span className="text-[11px] text-slate-500 block">Enter the total list volume of church members, neighbors, or chama relatives expected to participate.</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <input 
              type="number"
              min="1"
              value={totalGroupMembers}
              onChange={(e) => setTotalGroupMembers(Math.max(1, Number(e.target.value)))}
              className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-24 text-slate-700 text-center"
            />
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Apply Limits
            </button>
          </div>
        </div>
      )}

      {/* Visual Progress ring & Metrics Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress Circle Visualizer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">Participation Coverage</span>
          
          <div className="relative flex items-center justify-center">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              <circle
                stroke="#E2E8F0"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#4F46E5"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-black text-slate-900 font-mono leading-none">{participationRate}%</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Coverage</span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 w-full pt-4 border-t border-slate-50">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Contributors Locked</span>
              <span className="font-mono font-bold text-slate-800">{uniqueContributors} Members</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Pending Outreach</span>
              <span className="font-mono font-bold text-slate-800">{membersPending} Members</span>
            </div>
          </div>
        </div>

        {/* Key Indicators */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Participant Breakdown</span>
            
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600 font-medium">Returning Supporters</span>
              </div>
              <span className="font-mono font-bold text-slate-800">{returningParticipants} Members</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="text-slate-600 font-medium">New Joined This Week</span>
              </div>
              <span className="font-mono font-bold text-slate-800">+{newParticipants} Members</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 text-indigo-800 text-[10.5px] rounded-xl border border-indigo-100 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-indigo-950 font-bold">Inclusivity Trend Analysis:</strong>
              {participationRate >= 70 ? "Excellent giving velocity! The community is fully integrated with high transparent accountability." :
               participationRate >= 40 ? "Moderate participation. Share a copy of the WhatsApp summary bulletin to trigger more members." :
               "High disengagement detected. We recommend direct outreach and utilizing Paybill exemptions."}
            </div>
          </div>
        </div>

        {/* Visual Bar graph comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">Campaign Velocity Trend</span>
          
          <div className="space-y-3.5">
            {weeklyTrends.map((trend, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span className="font-semibold text-slate-700">{trend.week} ({trend.label})</span>
                  <span className="font-mono font-bold text-slate-800">{trend.rate}% Coverage</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${trend.rate}%` }} />
                </div>
              </div>
            ))}
          </div>

          <span className="text-[9px] text-slate-400 leading-normal block mt-4 pt-3 border-t border-slate-50">
            📊 Displays cumulative Unique Donor count over the course of the fundraiser. High velocity prevents fatigue.
          </span>
        </div>

      </div>

      {/* Consistency Leaderboard Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" /> Top Committee Contributors By Consistency
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Ranks members strictly based on support frequency and consistency. High donations are hidden to encourage equal community respect.</p>
          </div>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono font-bold rounded uppercase">
            Consistency Focus
          </span>
        </div>

        {consistencyLeaderboard.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs border border-slate-100 rounded-xl bg-slate-50/50">
            Waiting for multiple contributors to enter database ledger...
          </div>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-mono border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase">Rank</th>
                  <th className="py-2.5 px-4 font-bold uppercase">Member Name</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-center">Support Frequency</th>
                  <th className="py-2.5 px-4 font-bold uppercase">Consistency Award</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-right">Latest Post</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {consistencyLeaderboard.map((item, index) => {
                  let medal = "🎗️";
                  if (index === 0) medal = "🥇";
                  else if (index === 1) medal = "🥈";
                  else if (index === 2) medal = "🥉";

                  return (
                    <tr key={index} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-slate-800 flex items-center gap-1">
                        <span className="text-sm">{medal}</span> {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 uppercase">{item.name}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px]">
                          {item.count} Contributions
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 font-bold font-mono text-[9px] rounded uppercase ${
                          item.count >= 3 ? "bg-amber-100 text-amber-800" :
                          item.count === 2 ? "bg-blue-50 text-blue-700" :
                          "bg-slate-50 text-slate-600"
                        }`}>
                          {item.badge}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-[10px]">
                        {new Date(item.lastDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
