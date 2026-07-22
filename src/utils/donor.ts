import { Contribution } from "../types";

/**
 * Resolves the donor badge information for a specific transaction.
 * If the transaction is the earliest completed contribution for that phone, it's a "First Contribution" (blue).
 * Otherwise, it's a "Returning Donor" (green).
 */
export function getDonorBadgeInfo(phone: string, txIdOrCode: string, contributions: Contribution[]): { 
  isReturning: boolean; 
  label: string; 
  badgeColor: string; 
  dotColor: string; 
} {
  if (!phone) {
    return { 
      isReturning: false, 
      label: "First Contribution", 
      badgeColor: "bg-blue-50 text-blue-700 border-blue-150", 
      dotColor: "bg-blue-500" 
    };
  }
  
  const cleanPhone = phone.trim();
  const donorTxs = contributions
    .filter(c => {
      const p = (c.senderPhone || c.phoneNumber || "").trim();
      const isCompleted = c.status !== "failed" && !c.hasDuplicates;
      return p === cleanPhone && isCompleted;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.transactionTime || 0).getTime();
      const timeB = new Date(b.timestamp || b.transactionTime || 0).getTime();
      return timeA - timeB;
    });

  if (donorTxs.length <= 1) {
    return { 
      isReturning: false, 
      label: "First Contribution", 
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200", 
      dotColor: "bg-blue-500" 
    };
  }

  const index = donorTxs.findIndex(t => t.id === txIdOrCode || t.transactionCode === txIdOrCode);
  if (index > 0) {
    return { 
      isReturning: true, 
      label: "Returning Donor", 
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", 
      dotColor: "bg-emerald-500" 
    };
  }

  return { 
    isReturning: false, 
    label: "First Contribution", 
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200", 
    dotColor: "bg-blue-500" 
  };
}

/**
 * Gets overall stats for a single donor based on their phone number.
 */
export function getDonorProfileStats(phone: string, contributions: Contribution[]) {
  const cleanPhone = (phone || "").trim();
  const donorTxs = contributions
    .filter(c => {
      const p = (c.senderPhone || c.phoneNumber || "").trim();
      return p === cleanPhone && !c.hasDuplicates && c.status !== "failed";
    })
    .sort((a, b) => new Date(a.timestamp || a.transactionTime || 0).getTime() - new Date(b.timestamp || b.transactionTime || 0).getTime());

  const totalContributions = donorTxs.length;
  const totalAmount = donorTxs.reduce((sum, c) => sum + c.amount, 0);
  const averageGift = totalContributions > 0 ? totalAmount / totalContributions : 0;
  const largestGift = totalContributions > 0 ? Math.max(...donorTxs.map(c => c.amount)) : 0;
  
  const supportedCampaignIds = Array.from(new Set(donorTxs.map(c => c.projectId || c.campaignId).filter(Boolean)));
  
  const firstContribution = donorTxs[0] ? (donorTxs[0].timestamp || donorTxs[0].transactionTime || "") : "";
  const latestContribution = donorTxs[donorTxs.length - 1] ? (donorTxs[donorTxs.length - 1].timestamp || donorTxs[donorTxs.length - 1].transactionTime || "") : "";

  // Compute donor display name (use the latest registered name)
  let fullName = "M-PESA Customer";
  const latestTx = donorTxs[donorTxs.length - 1];
  if (latestTx) {
    if (latestTx.firstName || latestTx.lastName) {
      fullName = `${latestTx.firstName || ""} ${latestTx.middleName || ""} ${latestTx.lastName || ""}`.replace(/\s+/g, " ").trim();
    } else if (latestTx.senderName) {
      fullName = latestTx.senderName;
    }
  }

  return {
    fullName,
    phoneNumber: cleanPhone,
    firstContribution,
    latestContribution,
    totalContributions,
    totalAmount,
    averageGift,
    largestGift,
    campaignsSupported: supportedCampaignIds,
    history: donorTxs
  };
}
