/**
 * Global environment helper to determine runtime environment mode:
 * - SANDBOX (🟠)
 * - STAGING (🔵)
 * - PRODUCTION (🟢)
 *
 * Fully defensive against cross-origin iframe security restrictions.
 */

export type RuntimeEnvMode = "SANDBOX" | "STAGING" | "PRODUCTION";

export interface RuntimeEnvInfo {
  mode: RuntimeEnvMode;
  badgeLabel: string;
  badgeClass: string;
  dotColorClass: string;
  reason: string;
  hostname: string;
}

export function getRuntimeEnvironmentInfo(): RuntimeEnvInfo {
  const metaEnv: Record<string, any> = (import.meta.env as any) || {};
  const hostname = typeof window !== "undefined" && window.location ? window.location.hostname.toLowerCase() : "unknown";

  // 1. Explicit production override flags (APP_ENV=production, VITE_SANDBOX_MODE=false, VITE_SANDBOX=false)
  if (metaEnv.APP_ENV === "production" || metaEnv.VITE_SANDBOX_MODE === "false" || metaEnv.VITE_SANDBOX === "false") {
    return {
      mode: "PRODUCTION",
      badgeLabel: "PRODUCTION",
      badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-800/80 shadow-emerald-900/20",
      dotColorClass: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
      reason: "Explicit production environment flag override",
      hostname
    };
  }

  // 2. Explicit production domains MUST ALWAYS run in Production Mode
  const productionDomains = [
    "harambeeflow.org",
    "www.harambeeflow.org",
    "harambeeflow.web.app",
    "harambeeflow.firebaseapp.com"
  ];

  const isProductionDomain = productionDomains.includes(hostname) || 
    hostname.endsWith(".harambeeflow.org") || 
    hostname.endsWith(".web.app");

  if (isProductionDomain) {
    return {
      mode: "PRODUCTION",
      badgeLabel: "PRODUCTION",
      badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-800/80 shadow-emerald-900/20",
      dotColorClass: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
      reason: `Host matches production domain (${hostname})`,
      hostname
    };
  }

  // 3. Staging domain / explicit staging flag check
  const isStagingDomain = hostname.includes("staging") || 
    hostname.includes("ais-pre") || 
    metaEnv.VITE_STAGING === "true" || 
    metaEnv.VITE_ENVIRONMENT === "staging";

  if (isStagingDomain) {
    return {
      mode: "STAGING",
      badgeLabel: "STAGING",
      badgeClass: "bg-sky-950/90 text-sky-300 border-sky-800/80 shadow-sky-900/20",
      dotColorClass: "bg-sky-400 shadow-[0_0_8px_#38bdf8]",
      reason: hostname.includes("ais-pre") 
        ? `AI Studio Staging preview host (${hostname})`
        : `Explicit staging flag or staging domain (${hostname})`,
      hostname
    };
  }

  // 4. Default to SANDBOX mode for localhost / AI Studio dev preview / VITE_SANDBOX_MODE=true / APP_ENV=sandbox
  return {
    mode: "SANDBOX",
    badgeLabel: "SANDBOX",
    badgeClass: "bg-amber-950/90 text-amber-300 border-amber-800/80 shadow-amber-900/20",
    dotColorClass: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
    reason: (metaEnv.VITE_SANDBOX_MODE === "true" || metaEnv.APP_ENV === "sandbox" || metaEnv.VITE_SANDBOX === "true")
      ? "Explicit Sandbox flag override"
      : `Local development / AI Studio sandbox container (${hostname})`,
    hostname
  };
}

export const RUNTIME_ENV_INFO = getRuntimeEnvironmentInfo();
export const IS_SANDBOX = RUNTIME_ENV_INFO.mode === "SANDBOX";
export const IS_STAGING = RUNTIME_ENV_INFO.mode === "STAGING";
export const IS_PRODUCTION = RUNTIME_ENV_INFO.mode === "PRODUCTION";
