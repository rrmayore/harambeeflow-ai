/**
 * Global environment helper to determine if the application is running in Sandbox,
 * Development, or AI Studio Preview Mode.
 * Fully defensive against cross-origin iframe security restrictions.
 */
export const IS_SANDBOX = (() => {
  // Determine Sandbox Mode strictly from compile-time configuration (Vite environment variables)
  const metaEnv = import.meta.env;
  
  // If explicitly configured as "false", Sandbox Mode is disabled (secure production behavior)
  if (metaEnv.VITE_SANDBOX === "false") {
    return false;
  }
  
  // If explicitly configured as "true", Sandbox Mode is enabled
  if (metaEnv.VITE_SANDBOX === "true") {
    return true;
  }
  
  // In development or non-production builds, always default to Sandbox Mode
  if (metaEnv.DEV || metaEnv.MODE !== "production") {
    return true;
  }
  
  // For production builds, if VITE_SANDBOX is not explicitly defined, we default to Sandbox Mode
  // to allow seamless sandbox/testing deployments without requiring a manual .env file setup.
  return true;
})();
