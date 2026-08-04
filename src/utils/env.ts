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

  // 1. Explicit production override flags
  if (metaEnv.APP_ENV === "production" || metaEnv.VITE_ENVIRONMENT === "production" || metaEnv.VITE_SANDBOX_MODE === "false" || metaEnv.VITE_SANDBOX === "false") {
    return {
      mode: "PRODUCTION",
      badgeLabel: "PRODUCTION",
      badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-800/80 shadow-emerald-900/20",
      dotColorClass: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
      reason: "Explicit production environment flag override",
      hostname
    };
  }

  // 2. Explicit production domains MUST ALWAYS run in Production Mode (harambeeflow.org)
  const productionDomains = [
    "harambeeflow.org",
    "www.harambeeflow.org"
  ];

  const isProductionDomain = productionDomains.includes(hostname) || 
    hostname === "harambeeflow.org" ||
    hostname === "www.harambeeflow.org";

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

  // 3. All non-production environments (localhost, ais-dev, ais-pre, Cloud Run preview containers) default to Sandbox Mode
  return {
    mode: "SANDBOX",
    badgeLabel: "SANDBOX",
    badgeClass: "bg-amber-950/90 text-amber-300 border-amber-800/80 shadow-amber-900/20",
    dotColorClass: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
    reason: `Interactive Sandbox / Development environment (${hostname})`,
    hostname
  };
}

export const RUNTIME_ENV_INFO = getRuntimeEnvironmentInfo();
export const IS_PRODUCTION = RUNTIME_ENV_INFO.mode === "PRODUCTION";
export const IS_SANDBOX = !IS_PRODUCTION;
export const IS_STAGING = false;
