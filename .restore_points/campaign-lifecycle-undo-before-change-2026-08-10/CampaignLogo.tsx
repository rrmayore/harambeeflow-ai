import React from "react";
import { 
  Church, HeartPulse, GraduationCap, Flame, Users, Trophy, 
  HelpCircle, ShieldAlert, Landmark, HelpCircle as HelpIcon 
} from "lucide-react";
import { Project } from "../types";

interface CampaignLogoProps {
  project: Project | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export default function CampaignLogo({ project, className = "", size = "md" }: CampaignLogoProps) {
  // If we have an uploaded custom campaign logo
  if (project?.campaignLogo && project.campaignLogo.trim() !== "") {
    return (
      <img
        src={project.campaignLogo}
        alt={project.name || "Campaign Logo"}
        referrerPolicy="no-referrer"
        loading="lazy"
        className={`object-cover rounded-xl border border-slate-800 bg-slate-900 ${getSizeClasses(size)} ${className}`}
      />
    );
  }

  // Fallback category matching
  const category = (project?.category || project?.campaignCategory || "").toLowerCase();

  // Pick appropriate icon & style gradient
  let IconComponent = HelpCircle;
  let gradientClass = "from-slate-800 to-slate-900 text-slate-400";

  if (category.includes("church") || category.includes("faith")) {
    IconComponent = Church;
    gradientClass = "from-blue-600/20 to-blue-900/30 text-blue-400 border border-blue-500/20";
  } else if (category.includes("medical") || category.includes("health") || category.includes("care")) {
    IconComponent = HeartPulse;
    gradientClass = "from-emerald-600/20 to-emerald-900/30 text-emerald-400 border border-emerald-500/20";
  } else if (category.includes("school") || category.includes("education") || category.includes("fees") || category.includes("grad")) {
    IconComponent = GraduationCap;
    gradientClass = "from-orange-600/20 to-orange-900/30 text-orange-400 border border-orange-500/20";
  } else if (category.includes("funeral") || category.includes("memorial") || category.includes("bereavement")) {
    IconComponent = Flame; // candle-like or candle placeholder
    gradientClass = "from-purple-600/20 to-purple-900/30 text-purple-400 border border-purple-500/20";
  } else if (category.includes("community") || category.includes("chama") || category.includes("social") || category.includes("wedding")) {
    IconComponent = Users;
    gradientClass = "from-indigo-600/20 to-indigo-900/30 text-indigo-400 border border-indigo-500/20";
  } else if (category.includes("sports") || category.includes("soccer") || category.includes("run") || category.includes("football")) {
    IconComponent = Trophy;
    gradientClass = "from-amber-600/20 to-amber-900/30 text-amber-400 border border-amber-500/20";
  } else if (category.includes("emergency") || category.includes("disaster") || category.includes("shield")) {
    IconComponent = ShieldAlert;
    gradientClass = "from-red-600/20 to-red-900/30 text-red-400 border border-red-500/20";
  } else if (category.includes("ngo") || category.includes("charity") || category.includes("landmark")) {
    IconComponent = Landmark;
    gradientClass = "from-teal-600/20 to-teal-900/30 text-teal-400 border border-teal-500/20";
  }

  return (
    <div 
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} ${getSizeClasses(size)} ${className}`}
      title={project?.category || "Fundraiser"}
    >
      <IconComponent className={getIconSizeClasses(size)} />
    </div>
  );
}

function getSizeClasses(size: "xs" | "sm" | "md" | "lg" | "xl") {
  switch (size) {
    case "xs":
      return "w-7 h-7 min-w-[28px] min-h-[28px]";
    case "sm":
      return "w-10 h-10 min-w-[40px] min-h-[40px]";
    case "md":
      return "w-14 h-14 min-w-[56px] min-h-[56px]";
    case "lg":
      return "w-20 h-20 min-w-[80px] min-h-[80px]";
    case "xl":
      return "w-32 h-32 min-w-[128px] min-h-[128px]";
    default:
      return "w-14 h-14 min-w-[56px] min-h-[56px]";
  }
}

function getIconSizeClasses(size: "xs" | "sm" | "md" | "lg" | "xl") {
  switch (size) {
    case "xs":
      return "w-3.5 h-3.5";
    case "sm":
      return "w-5 h-5";
    case "md":
      return "w-7 h-7";
    case "lg":
      return "w-10 h-10";
    case "xl":
      return "w-14 h-14";
    default:
      return "w-7 h-7";
  }
}
