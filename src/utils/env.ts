/**
 * Global environment helper to determine if the application is running in Sandbox,
 * Development, or AI Studio Preview Mode.
 * Fully defensive against cross-origin iframe security restrictions.
 */
export const IS_SANDBOX = (() => {
  const metaEnv = import.meta.env;
  const hostname = typeof window !== "undefined" && window.location ? window.location.hostname.toLowerCase() : "";

  // 1. Explicit production domains MUST ALWAYS disable sandbox mode (IS_SANDBOX = false)
  const productionDomains = [
    "harambeeflow.org",
    "www.harambeeflow.org",
    "harambeeflow.web.app",
    "harambeeflow.firebaseapp.com"
  ];

  if (productionDomains.includes(hostname) || hostname.endsWith(".harambeeflow.org") || hostname.endsWith(".web.app")) {
    return false;
  }

  // 2. Production build mode checks (import.meta.env.PROD === true or MODE === 'production')
  if (metaEnv.PROD === true || metaEnv.MODE === "production") {
    // Only enable sandbox in production build if explicitly requested via VITE_SANDBOX="true"
    if (metaEnv.VITE_SANDBOX === "true") {
      return true;
    }
    return false;
  }

  // 3. Explicit VITE_SANDBOX overrides
  if (metaEnv.VITE_SANDBOX === "false") {
    return false;
  }
  if (metaEnv.VITE_SANDBOX === "true") {
    return true;
  }

  // 4. Local development / AI Studio preview environment default to Sandbox Mode
  if (metaEnv.DEV || metaEnv.MODE !== "production") {
    return true;
  }

  return false;
})();

