import { Request, Response, NextFunction } from "express";
import { getAdminDb } from "./db-instance.js";
import { Subscription, SubscriptionPlanId, SubscriptionStatus } from "./src/types.js";

// =========================================================================
// 1. AUTHORITATIVE PLAN ENTITLEMENTS DEFINITION
// =========================================================================

export interface PlanEntitlements {
  maxActiveCampaigns: number;
  fundraisingCapKes: number;
  maxTreasurers: number;
  manualEntry: boolean;
  aiAssistant: boolean;
  automatedMpesaSync: boolean;
  whatsappAutomation: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  dedicatedApi: boolean;
  multiBranchManagement: boolean;
  committeeRolesAndPermissions: boolean;
  unlimitedOrganizations: boolean;
}

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlanId, PlanEntitlements> = {
  community: {
    maxActiveCampaigns: 1,
    fundraisingCapKes: 100000,
    maxTreasurers: 1,
    manualEntry: true,
    aiAssistant: false,
    automatedMpesaSync: false,
    whatsappAutomation: false,
    advancedAnalytics: false,
    customBranding: false,
    dedicatedApi: false,
    multiBranchManagement: false,
    committeeRolesAndPermissions: false,
    unlimitedOrganizations: false
  },
  standard: {
    maxActiveCampaigns: Infinity,
    fundraisingCapKes: Infinity,
    maxTreasurers: Infinity,
    manualEntry: true,
    aiAssistant: true,
    automatedMpesaSync: true,
    whatsappAutomation: true,
    advancedAnalytics: false,
    customBranding: false,
    dedicatedApi: false,
    multiBranchManagement: false,
    committeeRolesAndPermissions: false,
    unlimitedOrganizations: false
  },
  professional: {
    maxActiveCampaigns: Infinity,
    fundraisingCapKes: Infinity,
    maxTreasurers: Infinity,
    manualEntry: true,
    aiAssistant: true,
    automatedMpesaSync: true,
    whatsappAutomation: true,
    advancedAnalytics: true,
    customBranding: true,
    dedicatedApi: true,
    multiBranchManagement: true,
    committeeRolesAndPermissions: true,
    unlimitedOrganizations: true
  }
};

export interface EffectiveSubscriptionAccess {
  authenticated: boolean;
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  access: {
    paid: boolean;
    trial: boolean;
    expired: boolean;
  };
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew?: boolean;
  entitlements: PlanEntitlements;
}

// Plan hierarchy rank for comparison
const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  community: 0,
  standard: 1,
  professional: 2
};

// =========================================================================
// 2. CENTRAL AUTHORITATIVE SUBSCRIPTION EVALUATION
// =========================================================================

/**
 * Reads user's subscription record from Firestore using Admin SDK and
 * computes the effective, server-authoritative subscription state.
 * 
 * Never trusts client input. If currentPeriodEnd has elapsed, access
 * is computed as expired regardless of the status string.
 */
export async function getAuthoritativeSubscription(userId: string): Promise<EffectiveSubscriptionAccess> {
  if (!userId || typeof userId !== "string") {
    return {
      authenticated: false,
      userId: "",
      planId: "community",
      status: "free",
      access: { paid: false, trial: false, expired: false },
      entitlements: PLAN_ENTITLEMENTS.community
    };
  }

  const adminDb = getAdminDb();
  let subscriptionData: Subscription | null = null;

  if (adminDb) {
    try {
      const docSnap = await adminDb.collection("subscriptions").doc(userId).get();
      if (docSnap && docSnap.exists) {
        subscriptionData = docSnap.data() as Subscription;
      }
    } catch (err) {
      console.error(`[SUBSCRIPTION SERVICE] Admin DB read failed for uid ${userId}:`, err);
    }
  }

  // Default fallback if no subscription document exists (Community tier)
  if (!subscriptionData) {
    return {
      authenticated: true,
      userId,
      planId: "community",
      status: "free",
      access: { paid: false, trial: false, expired: false },
      entitlements: PLAN_ENTITLEMENTS.community
    };
  }

  const rawPlanId = subscriptionData.planId;
  const rawStatus = subscriptionData.status;
  const periodEndIso = subscriptionData.currentPeriodEnd;
  const periodEndDate = periodEndIso ? new Date(periodEndIso) : null;
  const now = new Date();

  const isPeriodValid = periodEndDate ? periodEndDate.getTime() > now.getTime() : false;

  let effectivePlanId: SubscriptionPlanId = "community";
  let effectiveStatus: SubscriptionStatus = rawStatus;
  let isPaid = false;
  let isTrial = false;
  let isExpired = false;

  if (rawStatus === "active") {
    if (isPeriodValid) {
      effectivePlanId = (rawPlanId === "standard" || rawPlanId === "professional") ? rawPlanId : "community";
      isPaid = effectivePlanId !== "community";
    } else {
      effectiveStatus = "expired";
      isExpired = true;
      effectivePlanId = "community";
    }
  } else if (rawStatus === "trial") {
    if (isPeriodValid) {
      effectivePlanId = (rawPlanId === "standard" || rawPlanId === "professional") ? rawPlanId : "community";
      isTrial = true;
      isPaid = effectivePlanId !== "community";
    } else {
      effectiveStatus = "expired";
      isExpired = true;
      effectivePlanId = "community";
    }
  } else if (rawStatus === "past_due") {
    effectiveStatus = "past_due";
    effectivePlanId = "community";
    isExpired = true;
  } else if (rawStatus === "cancelled") {
    if (isPeriodValid) {
      effectivePlanId = (rawPlanId === "standard" || rawPlanId === "professional") ? rawPlanId : "community";
      isPaid = effectivePlanId !== "community";
    } else {
      effectiveStatus = "expired";
      isExpired = true;
      effectivePlanId = "community";
    }
  } else {
    // "free" or unrecognized
    effectivePlanId = "community";
    effectiveStatus = "free";
  }

  return {
    authenticated: true,
    userId,
    planId: effectivePlanId,
    status: effectiveStatus,
    access: {
      paid: isPaid,
      trial: isTrial,
      expired: isExpired
    },
    currentPeriodStart: subscriptionData.currentPeriodStart,
    currentPeriodEnd: subscriptionData.currentPeriodEnd,
    autoRenew: subscriptionData.autoRenew,
    entitlements: PLAN_ENTITLEMENTS[effectivePlanId]
  };
}

// =========================================================================
// 3. EXPRESS AUTHORIZATION MIDDLEWARE
// =========================================================================

/**
 * Middleware that enforces a minimum required subscription plan.
 * Automatically checks token auth context first, loads the server-authoritative
 * subscription record, and denies access with clear machine-readable codes.
 */
export function requirePlan(requiredPlan: "standard" | "professional") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({
        error: "Authentication required to access this resource.",
        code: "AUTH_REQUIRED"
      });
    }

    try {
      const sub = await getAuthoritativeSubscription(uid);

      if (sub.access.expired) {
        return res.status(403).json({
          error: "Your subscription period has expired. Please renew your plan to continue using this feature.",
          code: "SUBSCRIPTION_EXPIRED",
          requiredPlan
        });
      }

      const userRank = PLAN_RANK[sub.planId] ?? 0;
      const requiredRank = PLAN_RANK[requiredPlan];

      if (userRank < requiredRank) {
        return res.status(403).json({
          error: `A ${requiredPlan.toUpperCase()} subscription plan is required to access this feature.`,
          code: "PLAN_UPGRADE_REQUIRED",
          requiredPlan,
          currentPlan: sub.planId
        });
      }

      // Attach authoritative subscription to request for downstream handlers
      (req as any).subscription = sub;
      return next();
    } catch (err: any) {
      console.error(`[REQUIRE_PLAN MIDDLEWARE ERROR] User ${uid}:`, err);
      return res.status(500).json({
        error: "Internal Server Error verifying subscription entitlements",
        code: "INTERNAL_ERROR"
      });
    }
  };
}
