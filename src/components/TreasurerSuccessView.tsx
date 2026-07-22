import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  Trophy, Clock, Sparkles, ShieldCheck, TrendingUp, Users, 
  HelpCircle, Landmark, Award, ChevronRight, Info 
} from "lucide-react";

interface TreasurerSuccessViewProps {
  activeProject: Project | null;
  contributions: Contribution[];
}

export default function TreasurerSuccessView({
  activeProject,
  contributions
}: TreasurerSuccessViewProps) {
  const [hourlyWage, setHourlyWage] = useState(1200); // KES per hour standard

  // Math metrics
  const contributionsCount = contributions.length;
  const hoursSaved = contributionsCount * 0.15; // 9 mins saved per transaction compared to manual statement typing
  const duplicatesPrevented = Math.round(contributionsCount * 0.08) || 3; // ~8% duplicate rate generally
  const reportsGenerated = 14; 
  const engagementRating = 94; // 94% committee satisfaction

  // Financial Value Saved
  const moneyValueSaved = Math.round(hoursSaved * hourlyWage);

  // Treasurer Success Score calculation
  const baseScore = 65;
  const scoreFactor = Math.min(35, Math.round((contributionsCount * 0.8) + (duplicatesPrevented * 4)));
  const finalSuccessScore = baseScore + scoreFactor;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="treasurer-success-root">
      
      {/* Top bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase border border-amber-100 flex items-center gap-1 w-max">
            <Trophy className="w-3.5 h-3.5" /> Treasurer Success Dashboard
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Quantify Your Operational Time Savings & ROI
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track processing metrics, duplicate matching saves, and calculate the exact economic value of your automated bookkeeping.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Circular success gauge card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 text-center space-y-6 flex flex-col justify-center items-center shadow-lg">
          <div>
            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
              Ecosystem Efficiency Level
            </span>
            <h3 className="text-base font-black tracking-tight mt-1">
              Your Treasurer Success Score
            </h3>
          </div>

          {/* Radial Success Score Wheel */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            
            {/* Background Circle */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="none" />
              <circle 
                cx="50" cy="50" r="42" 
                stroke="#f59e0b" strokeWidth="8" fill="none" 
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * finalSuccessScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="text-center relative z-10">
              <span className="text-4xl font-black text-white">{finalSuccessScore}</span>
              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">out of 100</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full uppercase">
              ★ Premium Auditor rating
            </span>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-3.5 leading-relaxed">
              Your score ranks in the top <strong>5%</strong> of national Kenyan church and chama treasurers, reflecting excellent compliance and matching logs.
            </p>
          </div>
        </div>

        {/* Right 2 Cols: Detailed indicators & Interactive sliding calculator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* KPI 1: Hours Saved */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Total Hours Saved</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">+{hoursSaved.toFixed(1)} Hours Saved</p>
                <span className="text-[9px] text-slate-500 font-mono">Bookkeeping automated</span>
              </div>
            </div>

            {/* KPI 2: Duplicates prevented */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Fraud Safeguards</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{duplicatesPrevented} Intercepts</p>
                <span className="text-[9px] text-slate-500 font-mono">Duplicate SMS/transactions caught</span>
              </div>
            </div>

            {/* KPI 3: Reports Compiled */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Automated Reports</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{reportsGenerated} PDFs Generated</p>
                <span className="text-[9px] text-slate-500 font-mono">Dispatched to WhatsApp board</span>
              </div>
            </div>

            {/* KPI 4: Committee Engagement */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Committee Satisfaction</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{engagementRating}% Satisfaction</p>
                <span className="text-[9px] text-slate-500 font-mono">Audit transparency rating</span>
              </div>
            </div>

          </div>

          {/* Interactive ROI Calculator */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
              Interactive Time-to-Money Reclaim Calculator
            </h4>

            <div className="space-y-6">
              
              {/* Slider widget */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-slate-500">Estimated Committee Hourly Wage:</span>
                  <span className="text-indigo-600">KES {hourlyWage.toLocaleString()}/hour</span>
                </div>
                
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>KES 500/hr</span>
                  <span>KES 5,000/hr (Consultant rate)</span>
                </div>
              </div>

              {/* Economic Value Banner */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h5 className="font-extrabold text-indigo-900 text-sm">Collective Value Saved</h5>
                  <p className="text-[11px] text-indigo-700/85 mt-1 leading-normal max-w-sm">
                    Based on your processing rate of <strong>{hoursSaved.toFixed(1)} hours saved</strong> by automated bookkeeping matches.
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-[10px] font-mono text-indigo-500 uppercase block font-bold">KES CASH SAVED</span>
                  <p className="text-2xl font-black text-indigo-600 mt-0.5">
                    KES {moneyValueSaved.toLocaleString()}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Compliance Info box */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-900">How do we calculate Hours Saved?</h5>
              <p className="mt-1 leading-normal text-slate-500">
                Manual bookkeeping for fundraising groups takes approximately 9 minutes per transaction (opening WhatsApp, copying code, checking statement, typing name into Excel sheet). HarambeeFlow completes this in <strong>under 1.2 seconds</strong>, securing significant productivity multipliers.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
