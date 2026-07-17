import { Project } from "../types";

export interface ThemeColors {
  name: string;
  primary: string;       // e.g. "bg-blue-600 hover:bg-blue-700"
  text: string;          // e.g. "text-blue-600"
  textDark: string;      // e.g. "text-blue-900"
  bgLight: string;       // e.g. "bg-blue-50/50"
  bgLightSolid: string;  // e.g. "bg-blue-50"
  border: string;        // e.g. "border-blue-100"
  borderMuted: string;   // e.g. "border-blue-200/60"
  borderStrong: string;  // e.g. "border-blue-500"
  ring: string;          // e.g. "ring-blue-500/20"
  badge: string;         // e.g. "bg-blue-50 text-blue-700 border-blue-200"
  chartColor: string;    // e.g. "#2563eb"
  progressBar: string;   // e.g. "bg-blue-600"
}

export const CAMPAIGN_THEMES: Record<string, ThemeColors> = {
  Blue: {
    name: "Blue",
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    text: "text-blue-600",
    textDark: "text-blue-900",
    bgLight: "bg-blue-50/40",
    bgLightSolid: "bg-blue-50",
    border: "border-blue-100",
    borderMuted: "border-blue-200/50",
    borderStrong: "border-blue-500",
    ring: "focus:ring-blue-500/20 focus:border-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    chartColor: "#2563eb",
    progressBar: "bg-blue-600"
  },
  Green: {
    name: "Green",
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    text: "text-emerald-600",
    textDark: "text-emerald-900",
    bgLight: "bg-emerald-50/40",
    bgLightSolid: "bg-emerald-50",
    border: "border-emerald-100",
    borderMuted: "border-emerald-200/50",
    borderStrong: "border-emerald-500",
    ring: "focus:ring-emerald-500/20 focus:border-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    chartColor: "#059669",
    progressBar: "bg-emerald-600"
  },
  Purple: {
    name: "Purple",
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    text: "text-purple-600",
    textDark: "text-purple-900",
    bgLight: "bg-purple-50/40",
    bgLightSolid: "bg-purple-50",
    border: "border-purple-100",
    borderMuted: "border-purple-200/50",
    borderStrong: "border-purple-500",
    ring: "focus:ring-purple-500/20 focus:border-purple-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    chartColor: "#8b5cf6",
    progressBar: "bg-purple-600"
  },
  Maroon: {
    name: "Maroon",
    primary: "bg-rose-900 hover:bg-rose-950 text-white",
    text: "text-rose-900",
    textDark: "text-rose-950",
    bgLight: "bg-rose-50/40",
    bgLightSolid: "bg-rose-50",
    border: "border-rose-100",
    borderMuted: "border-rose-200/50",
    borderStrong: "border-rose-900",
    ring: "focus:ring-rose-900/20 focus:border-rose-900",
    badge: "bg-rose-50 text-rose-900 border-rose-200",
    chartColor: "#881337",
    progressBar: "bg-rose-900"
  },
  Orange: {
    name: "Orange",
    primary: "bg-orange-600 hover:bg-orange-700 text-white",
    text: "text-orange-600",
    textDark: "text-orange-900",
    bgLight: "bg-orange-50/40",
    bgLightSolid: "bg-orange-50",
    border: "border-orange-100",
    borderMuted: "border-orange-200/50",
    borderStrong: "border-orange-500",
    ring: "focus:ring-orange-500/20 focus:border-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    chartColor: "#ea580c",
    progressBar: "bg-orange-600"
  },
  Gold: {
    name: "Gold",
    primary: "bg-amber-600 hover:bg-amber-700 text-white",
    text: "text-amber-600",
    textDark: "text-amber-900",
    bgLight: "bg-amber-50/40",
    bgLightSolid: "bg-amber-50",
    border: "border-amber-100",
    borderMuted: "border-amber-200/50",
    borderStrong: "border-amber-500",
    ring: "focus:ring-amber-500/20 focus:border-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    chartColor: "#d97706",
    progressBar: "bg-amber-600"
  },
  Red: {
    name: "Red",
    primary: "bg-red-600 hover:bg-red-700 text-white",
    text: "text-red-600",
    textDark: "text-red-950",
    bgLight: "bg-red-50/40",
    bgLightSolid: "bg-red-50",
    border: "border-red-100",
    borderMuted: "border-red-200/50",
    borderStrong: "border-red-600",
    ring: "focus:ring-red-500/20 focus:border-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    chartColor: "#dc2626",
    progressBar: "bg-red-600"
  },
  Gray: {
    name: "Gray",
    primary: "bg-slate-600 hover:bg-slate-700 text-white",
    text: "text-slate-600",
    textDark: "text-slate-900",
    bgLight: "bg-slate-50/40",
    bgLightSolid: "bg-slate-50",
    border: "border-slate-100",
    borderMuted: "border-slate-200/50",
    borderStrong: "border-slate-500",
    ring: "focus:ring-slate-500/20 focus:border-slate-505",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    chartColor: "#475569",
    progressBar: "bg-slate-600"
  }
};

export function getTheme(themeName?: string): ThemeColors {
  if (!themeName || !CAMPAIGN_THEMES[themeName]) {
    return CAMPAIGN_THEMES.Blue;
  }
  return CAMPAIGN_THEMES[themeName];
}

// Normalize category string
export function normalizeCategory(category?: string): string {
  const norm = (category || "").toLowerCase();
  if (norm.includes("church") || norm.includes("faith") || norm.includes("pastor") || norm.includes("ministry")) return "Church";
  if (norm.includes("medical") || norm.includes("health") || norm.includes("patient") || norm.includes("hospital") || norm.includes("treatment")) return "Medical";
  if (norm.includes("funeral") || norm.includes("memorial") || norm.includes("bereavement") || norm.includes("burial")) return "Funeral";
  if (norm.includes("education") || norm.includes("school") || norm.includes("chama") || norm.includes("fees") || norm.includes("student")) return "Education";
  if (norm.includes("sports") || norm.includes("athlete") || norm.includes("game") || norm.includes("tournament")) return "Sports";
  if (norm.includes("emergency") || norm.includes("crisis") || norm.includes("disaster") || norm.includes("rescue") || norm.includes("accident")) return "Emergency";
  return "Community"; // Default fallback
}

// Generate premium vector geometric illustrations as UTF-8 encoded SVG data URLs
export function getCategoryIllustration(category: string, type: "banner" | "logo"): string {
  const norm = normalizeCategory(category);
  
  if (type === "banner") {
    switch (norm) {
      case "Church":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e1b4b'/><stop offset='60%' stop-color='%23311042'/><stop offset='100%' stop-color='%23581c87'/></linearGradient><linearGradient id='g2' x1='0%' y1='100%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23b45309'/><stop offset='50%' stop-color='%23f59e0b'/><stop offset='100%' stop-color='%23fef08a'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><path d='M400,50 L480,210 L320,210 Z' fill='url(%23g2)' opacity='0.25'/><path d='M400,10 L520,250 L280,250 Z' fill='url(%23g2)' opacity='0.15'/><circle cx='400' cy='220' r='140' stroke='url(%23g2)' stroke-width='2' fill='none' opacity='0.3'/><circle cx='400' cy='220' r='100' stroke='url(%23g2)' stroke-width='1' fill='none' opacity='0.2' stroke-dasharray='5,5'/><line x1='400' y1='220' x2='400' y2='30' stroke='url(%23g2)' stroke-width='1.5' opacity='0.3'/><line x1='400' y1='220' x2='150' y2='220' stroke='url(%23g2)' stroke-width='1.5' opacity='0.3'/><line x1='400' y1='220' x2='650' y2='220' stroke='url(%23g2)' stroke-width='1.5' opacity='0.3'/><path d='M396,150 h8 v30 h20 v8 h-20 v60 h-8 v-60 h-20 v-8 h20 Z' fill='url(%23g2)'/></svg>`;
      
      case "Medical":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='60%' stop-color='%23042f2e'/><stop offset='100%' stop-color='%23115e59'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%232dd4bf'/><stop offset='100%' stop-color='%2334d399'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><path d='M50,225 H300 L320,150 L340,300 L360,210 L370,240 L390,225 H750' fill='none' stroke='url(%23g2)' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' opacity='0.7'/><g opacity='0.2' transform='translate(600, 100) scale(1.5)'><path d='M10,0 H20 V10 H30 V20 H20 V30 H10 V20 H0 V10 H10 Z' fill='url(%23g2)'/></g><g opacity='0.25' transform='translate(150, 300) scale(1)'><path d='M10,0 H20 V10 H30 V20 H20 V30 H10 V20 H0 V10 H10 Z' fill='url(%23g2)'/></g><path d='M400,160 C370,120 320,120 300,150 C270,195 330,260 400,310 C470,260 530,195 500,150 C480,120 430,120 400,160 Z' fill='url(%23g2)' opacity='0.15' /></svg>`;
      
      case "Education":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23030712'/><stop offset='60%' stop-color='%231e1b4b'/><stop offset='100%' stop-color='%231e3a8a'/></linearGradient><linearGradient id='g2' x1='0%' y1='100%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23d97706'/><stop offset='100%' stop-color='%23fbbf24'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><g stroke='url(%23g2)' stroke-width='1' opacity='0.15'><line x1='0' y1='400' x2='800' y2='400'/><line x1='0' y1='350' x2='800' y2='350'/><line x1='0' y1='300' x2='800' y2='300'/><line x1='200' y1='0' x2='200' y2='450'/><line x1='400' y1='0' x2='400' y2='450'/><line x1='600' y1='0' x2='600' y2='450'/></g><circle cx='400' cy='225' r='120' stroke='url(%23g2)' stroke-width='2' fill='none' opacity='0.25'/><g fill='url(%23g2)' transform='translate(335, 160) scale(1.6)'><path d='M20,0 L40,10 L20,20 L0,10 Z'/><path d='M5,13 v5 c0,5 10,7 15,7 s15-2 15-7 v-5' fill='none' stroke='url(%23g2)' stroke-width='2'/><path d='M35,10 v10' fill='none' stroke='url(%23g2)' stroke-width='2'/></g></svg>`;
      
      case "Funeral":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23090d16'/><stop offset='60%' stop-color='%231c1917'/><stop offset='100%' stop-color='%2344403c'/></linearGradient><linearGradient id='g2' x1='0%' y1='100%' x2='0%' y2='0%'><stop offset='0%' stop-color='%237c2d12'/><stop offset='50%' stop-color='%23ea580c'/><stop offset='100%' stop-color='%23fef08a'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><path d='M0,450 L200,300 L450,450 Z' fill='%231c1917' opacity='0.5'/><path d='M350,450 L600,280 L800,450 Z' fill='%231c1917' opacity='0.4'/><circle cx='400' cy='250' r='100' fill='url(%23g2)' opacity='0.12'/><g fill='url(%23g2)' transform='translate(385, 180) scale(1.5)'><path d='M10,0 C20,10 20,25 10,30 C0,25 0,10 10,0 Z' opacity='0.85'/><path d='M10,5 C15,12 15,22 10,25 C5,22 5,12 10,5 Z' fill='%23fef08a' opacity='0.95'/></g></svg>`;
      
      case "Sports":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='60%' stop-color='%231c1917'/><stop offset='100%' stop-color='%23292524'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f97316'/><stop offset='100%' stop-color='%23ea580c'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><path d='M-100,450 L800,100 L800,120 L-100,470 Z' fill='url(%23g2)' opacity='0.15'/><circle cx='600' cy='200' r='120' stroke='url(%23g2)' stroke-width='2' fill='none' opacity='0.25'/><g fill='url(%23g2)' transform='translate(365, 140) scale(1.6)'><path d='M5,0 h30 v15 c0,8 -6,15 -15,15 s-15,-7 -15,-15 Z'/><path d='M10,30 h20 v4 h-20 Z'/><path d='M15,34 h10 v6 h-10 Z'/><path d='M0,5 c0,-3 5,-3 5,0 v10 c0,3 -5,3 -5,0 Z' stroke='url(%23g2)' stroke-width='2' fill='none'/><path d='M40,5 c0,-3 -5,-3 -5,0 v10 c0,3 5,3 5,0 Z' stroke='url(%23g2)' stroke-width='2' fill='none'/></g></svg>`;
      
      case "Emergency":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23110000'/><stop offset='60%' stop-color='%232d0606'/><stop offset='100%' stop-color='%23450a0a'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23ef4444'/><stop offset='100%' stop-color='%23f59e0b'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><polygon points='400,225 100,50 150,50' fill='url(%23g2)' opacity='0.15'/><polygon points='400,225 700,50 650,50' fill='url(%23g2)' opacity='0.15'/><circle cx='400' cy='225' r='100' stroke='url(%23g2)' stroke-width='3' fill='none' opacity='0.3'/><g fill='url(%23g2)' transform='translate(365, 175) scale(1.8)' opacity='0.85'><path d='M20,0 L38,10 L32,30 L20,40 L8,30 L2,10 Z' fill='none' stroke='url(%23g2)' stroke-width='2'/><path d='M17,10 h6 v8 h8 v6 h-8 v-8 h-6 v-8 h-8 v-6 h-8 Z' /></g></svg>`;
      
      default: // Community
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='60%' stop-color='%231e1b4b'/><stop offset='100%' stop-color='%23311042'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='50%' stop-color='%23ec4899'/><stop offset='100%' stop-color='%23f43f5e'/></linearGradient></defs><rect width='800' height='450' fill='url(%23g1)'/><circle cx='400' cy='225' r='160' stroke='url(%23g2)' stroke-width='2' fill='none' opacity='0.3'/><circle cx='400' cy='225' r='100' stroke='url(%23g2)' stroke-width='1.5' fill='none' opacity='0.2' stroke-dasharray='10,5'/><g stroke='url(%23g2)' stroke-width='2' fill='none' opacity='0.4'><path d='M400,65 C350,125 350,175 400,225 C450,175 450,125 400,65 Z'/><path d='M400,225 C350,275 350,325 400,385 C450,325 450,275 400,225 Z'/><path d='M240,225 C300,175 350,175 400,225 C350,275 300,275 240,225 Z'/><path d='M400,225 C450,175 500,175 560,225 C500,275 450,275 400,225 Z'/></g></svg>`;
    }
  } else {
    switch (norm) {
      case "Church":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23311042'/><stop offset='100%' stop-color='%2312061c'/></linearGradient><linearGradient id='g2' x1='0%' y1='100%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23d97706'/><stop offset='100%' stop-color='%23fef08a'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.25'/><path d='M256,120 v272 M160,200 h192' stroke='url(%23g2)' stroke-width='16' stroke-linecap='round' opacity='0.95'/></svg>`;
      
      case "Medical":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23011627'/><stop offset='100%' stop-color='%23081c15'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2306b6d4'/><stop offset='100%' stop-color='%2310b981'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.25'/><path d='M136,256 h60 L226,166 L256,346 L286,226 L306,276 L326,256 h50' fill='none' stroke='url(%23g2)' stroke-width='12' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
      
      case "Education":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='100%' stop-color='%231e293b'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f59e0b'/><stop offset='100%' stop-color='%23fbbf24'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.25'/><path d='M256,150 L396,220 L256,290 L116,220 Z' fill='url(%23g2)'/><path d='M156,245 v60 c0,30 60,45 100,45 s100-15 100-45 v-60' fill='none' stroke='url(%23g2)' stroke-width='12' stroke-linecap='round'/><path d='M366,225 v70' fill='none' stroke='url(%23g2)' stroke-width='8' stroke-linecap='round'/></svg>`;
      
      case "Funeral":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231c1917'/><stop offset='100%' stop-color='%230c0a09'/></linearGradient><linearGradient id='g2' x1='0%' y1='100%' x2='0%' y2='0%'><stop offset='0%' stop-color='%23ea580c'/><stop offset='100%' stop-color='%23fde047'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.2'/><path d='M256,150 C296,190 296,270 256,330 C216,270 216,190 256,150 Z' fill='url(%23g2)'/><path d='M256,200 C276,230 276,270 256,310 C236,270 236,230 256,200 Z' fill='%23fef08a'/></svg>`;
      
      case "Sports":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231c1917'/><stop offset='100%' stop-color='%230c0a09'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f97316'/><stop offset='100%' stop-color='%23ffedd5'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.25'/><path d='M206,160 h100 v60 c0,30 -20,50 -50,50 s-50,-20 -50,-50 Z' fill='url(%23g2)'/><path d='M231,270 h50 v30 h-50 Z' fill='url(%23g2)'/><path d='M216,300 h80 v15 h-80 Z' fill='url(%23g2)'/></svg>`;
      
      case "Emergency":
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23450a0a'/><stop offset='100%' stop-color='%231a0505'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23ef4444'/><stop offset='100%' stop-color='%23f59e0b'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.25'/><path d='M256,120 L376,170 L346,330 L256,392 L166,330 L136,170 Z' fill='none' stroke='url(%23g2)' stroke-width='12' stroke-linejoin='round'/><path d='M236,196 h40 v40 h40 v40 h-40 v-40 h-40 v-40 h-40 Z' fill='url(%23g2)'/></svg>`;
      
      default: // Community
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e1b4b'/><stop offset='100%' stop-color='%23311042'/></linearGradient><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='100%' stop-color='%23f43f5e'/></linearGradient></defs><rect width='512' height='512' rx='128' fill='url(%23g1)'/><circle cx='256' cy='256' r='180' stroke='url(%23g2)' stroke-width='4' fill='none' opacity='0.3'/><g fill='url(%23g2)' opacity='0.95'><circle cx='256' cy='210' r='40'/><circle cx='186' cy='250' r='30'/><circle cx='326' cy='250' r='30'/><path d='M186,290 C186,350 326,350 326,290 C296,290 276,310 256,310 C236,310 216,290 186,290 Z'/></g></svg>`;
    }
  }
}

// Curated high quality default vector brandings for different fundraising categories
export const CATEGORY_BRANDING: Record<string, {
  label: string;
  iconName: string; // matches Lucide icon
  image: string; // vector geometric illustration (no stock photos!)
  logo: string; // vector logo icon badge
  motto: string;
}> = {
  "Community/Church": {
    label: "Church / Faith-based Ministries",
    iconName: "Church",
    image: getCategoryIllustration("Church", "banner"),
    logo: getCategoryIllustration("Church", "logo"),
    motto: "“Let each one give as he has decided in his heart, not reluctantly or under compulsion.” — 2 Corinthians 9:7"
  },
  "Medical/Family": {
    label: "Medical Relief & Patient Support",
    iconName: "HeartPulse",
    image: getCategoryIllustration("Medical", "banner"),
    logo: getCategoryIllustration("Medical", "logo"),
    motto: "Stand together with patience, love, and community support in times of medical need."
  },
  "Funeral/Memorial": {
    label: "Funeral & Bereavement Support",
    iconName: "Flame",
    image: getCategoryIllustration("Funeral", "banner"),
    logo: getCategoryIllustration("Funeral", "logo"),
    motto: "Grieving together, honoring legacy, and supporting the family to give a dignified sendoff."
  },
  "Education/Chama": {
    label: "Education Fees & Chama Funds",
    iconName: "GraduationCap",
    image: getCategoryIllustration("Education", "banner"),
    logo: getCategoryIllustration("Education", "logo"),
    motto: "Empowering dreams through collaborative finance and educational advancement."
  },
  "Wedding/Social": {
    label: "Wedding & Social Celebrations",
    iconName: "Gift",
    image: getCategoryIllustration("Community", "banner"),
    logo: getCategoryIllustration("Community", "logo"),
    motto: "Joyous partnerships built together with community celebrations and mutual blessing."
  },
  "Youth/Pathfinders": {
    label: "Youth Activities & Pathfinder Club",
    iconName: "Tent",
    image: getCategoryIllustration("Community", "banner"),
    logo: getCategoryIllustration("Community", "logo"),
    motto: "Guiding the youth, strengthening faith, and preparing next generation leaders through service."
  },
  "Community/NGO": {
    label: "NGO Aid & Community Projects",
    iconName: "Globe",
    image: getCategoryIllustration("Community", "banner"),
    logo: getCategoryIllustration("Community", "logo"),
    motto: "Selfless service for public development, safe resources, and humanitarian advancement."
  },
  "General/Harambee": {
    label: "General Community Harambee",
    iconName: "Users",
    image: getCategoryIllustration("Community", "banner"),
    logo: getCategoryIllustration("Community", "logo"),
    motto: "“Harambee” — Let us pull together for the collective success of our community drive."
  }
};

export function getBrandingForCategory(category?: string) {
  const norm = category || "General/Harambee";
  if (CATEGORY_BRANDING[norm]) return CATEGORY_BRANDING[norm];
  
  // Try partial match
  for (const key of Object.keys(CATEGORY_BRANDING)) {
    if (norm.toLowerCase().includes(key.toLowerCase().split("/")[0])) {
      return CATEGORY_BRANDING[key];
    }
  }
  return CATEGORY_BRANDING["General/Harambee"];
}

export function getCampaignBanner(project: Project | null): string {
  if (!project) return getCategoryIllustration("Community", "banner");
  if (project.campaignImage && project.campaignImage.trim() !== "") {
    return project.campaignImage;
  }
  return getCategoryIllustration(project.campaignCategory || project.category, "banner");
}

export function getCampaignLogo(project: Project | null): string {
  if (!project) return getCategoryIllustration("Community", "logo");
  if (project.campaignLogo && project.campaignLogo.trim() !== "") {
    return project.campaignLogo;
  }
  return getCategoryIllustration(project.campaignCategory || project.category, "logo");
}

export function getCampaignMotto(project: Project | null): string {
  if (!project) return "";
  if (project.motto && project.motto.trim() !== "") {
    return project.motto;
  }
  return getBrandingForCategory(project.campaignCategory || project.category).motto;
}

// Crops a file/image to 16:9 ratio and compresses it
export async function cropAndCompressCoverImage(file: File, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetWidth = 1280;
        const targetHeight = 720; // 16:9 ratio
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        
        // Calculate crop boundaries to maintain 16:9 center crop
        const imgRatio = img.width / img.height;
        const targetRatio = 16 / 9;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        
        if (imgRatio > targetRatio) {
          // Image is wider than 16:9, crop left/right
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller than 16:9, crop top/bottom
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL("image/webp", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Image parsing failed"));
    };
    reader.onerror = () => reject(new Error("File reading failed"));
  });
}

// Resizes and crops a file/image to 1:1 ratio (512x512) for logo
export async function cropAndCompressLogoImage(file: File, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetDim = 512;
        
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        
        // Center crop to 1:1
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (img.width > img.height) {
          sw = img.height;
          sx = (img.width - img.height) / 2;
        } else {
          sh = img.width;
          sy = (img.height - img.width) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetDim, targetDim);
        const dataUrl = canvas.toDataURL("image/webp", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Image parsing failed"));
    };
    reader.onerror = () => reject(new Error("File reading failed"));
  });
}

// Compresses a file into standard JPEG base64 string
export async function compressImageFile(file: File, maxDim = 450, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Image parsing failed"));
    };
    reader.onerror = () => reject(new Error("File reading failed"));
  });
}
