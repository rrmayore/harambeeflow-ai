const rawMode = process.env.MPESA_MODE || "sandbox";
const mode = rawMode.trim().toLowerCase() === "live" ? "live" : "sandbox";

console.log(`[PAYMENT ENGINE] mode = ${mode}`);

export function getPaymentMode(): "sandbox" | "live" {
  return mode;
}

export function isSandbox(): boolean {
  return mode === "sandbox";
}

export function isLive(): boolean {
  return mode === "live";
}
