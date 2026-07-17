export interface Project {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  description: string;
  category: string;
  treasurerPhone: string;
  paybillNumber: string;
  accountReference: string;
  whatsappGroupName: string;
  createdAt: string;
  trackingMethod?: "live_daraja" | "statement_import" | "manual_entry";
  healthScore?: number;
  campaignImage?: string;
  campaignLogo?: string;
  themeColor?: string;
  campaignCategory?: string;
  motto?: string;
  organizer?: string;
  createdBy?: string;
  status?: string;
  startDate?: string;
  closingDate?: string;
  committee?: Array<{ name: string; phone: string; role: string }>;
  sectorCategory?: string;
}

export interface Contribution {
  id: string;
  projectId: string;
  amount: number;
  senderName: string;
  senderPhone: string;
  transactionCode: string;
  timestamp: string;
  category: string;
  rawMessage: string;
  cleanedName: string;
  hasDuplicates: boolean;
  notes: string;
  whatsappPosted: boolean;
  status?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: string;
  receiptNumber?: string;
  billReference?: string;
  transactionTime?: string;
  campaignId?: string;
  donorId?: string;
}

export interface Donor {
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  firstContribution: string;
  lastContribution: string;
  totalContributions: number;
  totalAmount: number;
}

export interface WhatsAppMessage {
  id: string;
  groupName: string;
  message: string;
  timestamp: string;
  isSystem: boolean;
}

export interface STKResponse {
  merchantRequestID: string;
  checkoutRequestID: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export interface AISummary {
  totalRaised: number;
  contributorCount: number;
  topContributors: { name: string; amount: number }[];
  categories: { name: string; count: number; total: number }[];
  narrative: string;
}

export interface Notification {
  id: string;
  campaignId: string;
  type: "milestone" | "ai_recommendation" | "duplicate_payment" | "pending_approval" | "deadline" | "large_donation" | "thankyou_reminder";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
}

export interface ActivityLog {
  id: string;
  campaignId: string;
  timestamp: string;
  user: string;
  action: string;
  campaignName: string;
  device: string;
}

