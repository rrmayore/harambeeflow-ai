import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import InteractiveTour from "./InteractiveTour";

interface LandingPageViewProps {
  onEnterApp: () => void;
  onEnterDemo?: () => void;
}

export default function LandingPageView({ onEnterApp, onEnterDemo }: LandingPageViewProps) {
  const [showTour, setShowTour] = useState(false);

  return (
    <div 
      className="bg-[#030712] min-h-screen w-full text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300" 
      id="landing-page-root"
    >
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />



      {/* Main Hero Section: Perfectly Vertically Centered & Shifted Upward slightly */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center z-20 relative max-w-5xl mx-auto w-full" id="hero-content">
        <div className="flex flex-col items-center max-w-4xl -translate-y-8 sm:-translate-y-10">
          
          {/* Badge: Kenya's Trusted M-PESA Fundraising Platform */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] sm:text-xs font-semibold text-slate-400 tracking-wide shadow-lg shadow-emerald-500/5 flex items-center gap-2 mb-6 sm:mb-8"
          >
            <span>🇰🇪 Kenya's Trusted M-PESA Fundraising Platform</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white mb-5 sm:mb-6"
          >
            Never Track M-PESA Contributions <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
              Manually Again
            </span>
          </motion.h1>

          {/* Supporting text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-slate-300 text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed mb-6 sm:mb-8"
          >
            Automatically record every M-PESA contribution, update your fundraiser instantly, and keep supporters informed on WhatsApp in real time.
          </motion.p>

          {/* Audience / Sectors Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center gap-3 w-full mb-8 sm:mb-10"
          >
            <span className="text-[10px] sm:text-xs font-extrabold tracking-widest uppercase text-slate-500">
              Built For
            </span>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {["Churches", "Schools", "Chamas", "NGOs", "Medical Appeals", "Funeral Committees"].map((sector) => (
                <span 
                  key={sector} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/60 text-[11px] sm:text-xs font-medium text-slate-300 shadow-sm"
                >
                  {sector}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Only Primary Action Button & Trust Line */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
            className="pt-2 flex flex-col items-center"
          >
            <button
              onClick={onEnterApp}
              className="px-12 py-6 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] border border-emerald-300/20 hover:border-emerald-200/30 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
              id="btn-start-fundraising-primary"
            >
              Start Fundraising
              <ArrowRight className="w-5 h-5 stroke-[2.5] transition group-hover:translate-x-1" />
            </button>
            
            <p className="mt-4 text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
              No setup fees • Secure M-PESA integration • Start in under 2 minutes
            </p>
          </motion.div>

        </div>
      </main>

      {/* Empty space at the bottom to ensure page ends immediately after button */}
      <footer className="w-full h-16 z-10 shrink-0" />

      {/* Onboarding tour modal overlay */}
      {showTour && (
        <InteractiveTour 
          onClose={() => setShowTour(false)} 
          activeTab="landing"
          setActiveTab={() => {}}
          wizardOpen={false}
          setWizardOpen={() => {}}
          projectsCount={0}
          contributionsCount={0}
        />
      )}

    </div>
  );
}
