import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  terminate
} from "firebase/firestore";
import { initiateSTKPush } from "./mpesa.service.js";
import { validateSTKRequest, rateLimitSTKPush } from "./mpesa-security.js";
import { 
  validateCallbackOrigin, 
  isDuplicateCallback, 
  isSystemBlocked, 
  logTransactionAudit,
  isDuplicateReceipt,
  setFirestoreInstance
} from "./mpesa-production-hardening.js";
import { setDb } from "./db-instance.js";
import { registerEventQueueDelegates, setPendingPayment } from "./eventQueue.service.js";
import { mpesaWebhookController } from "./webhook.controller.js";
import { mpesaWebhookAuthMiddleware } from "./webhookAuth.middleware.js";

dotenv.config();

// Local map to track in-flight transaction CheckoutRequestIDs from Daraja for callback alignment
const pendingMpesaPayments = new Map<string, {
  projectId: string;
  senderName: string;
  senderPhone: string;
  amount: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
}>();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Request logger to inspect and audit HTTP headers/requests
app.use((req, res, next) => {
  console.log("REQUEST RECEIVED:", req.method, req.url);
  next();
});

// Load Firebase configuration safely from root
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.error("Failed to read firebase-applet-config.json:", err);
}

// Initialize Firebase client
let db: any = null;
let useFirebase = false;

if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    useFirebase = true;
    console.log(`🔥 Firebase DB initialized successfully with databaseId: ${firebaseConfig.firestoreDatabaseId} for projectId: ${firebaseConfig.projectId}`);
    setFirestoreInstance(db);
    setDb(db); // Register singleton database reference for high scalability Stripe v2 services
  } catch (error) {
    console.error("⚠️ Failed to initialize Firebase client:", error);
  }
} else {
  console.log("ℹ️ No firebase-applet-config.json found. Operating in local-only sandbox mode.");
}

// In-memory persistent tables for low-bandwidth local speed with rich sandbox seed data
let projects: any[] = [
  {
    id: "fundraiser-1",
    name: "St. Jude Church Harambee",
    targetAmount: 500000,
    currentAmount: 275000,
    description: "Annual community fundraiser for the construction of the St. Jude sanctuary annex. Pulling together for a sustainable foundation.",
    category: "Community/Church",
    treasurerPhone: "+254712345678",
    paybill: "225588",
    paybillNumber: "225588",
    accountReference: "STJUDE",
    whatsappGroupName: "St. Jude Harambee Group",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "fundraiser-2",
    name: "Baby Amina Medical Fund",
    targetAmount: 300000,
    currentAmount: 185000,
    description: "Emergency surgical treatment fund for Baby Amina at the Gertrude Hospital. Stand with Amina and family for a speedy recovery.",
    category: "Medical/Family",
    treasurerPhone: "+254788112233",
    paybill: "225500",
    paybillNumber: "225500",
    accountReference: "AMINA",
    whatsappGroupName: "Amina Recovery Team",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let contributions: any[] = [
  {
    id: "cnt-1",
    projectId: "fundraiser-1",
    amount: 50000,
    senderName: "SARAH WANJIKU",
    senderPhone: "254711122233",
    transactionCode: "QRE8M9K2L1",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Family/Friends",
    rawMessage: "M-PESA: KES 50,000 received from SARAH WANJIKU on 10/06 at 14:32",
    cleanedName: "Sarah Wanjiku",
    hasDuplicates: false,
    notes: "A generous contribution from the elder sister.",
    status: "completed",
    whatsappPosted: true
  },
  {
    id: "cnt-2",
    projectId: "fundraiser-1",
    amount: 120000,
    senderName: "SAFARICOM HOME CORP",
    senderPhone: "Corporate",
    transactionCode: "QRF3N4M5K2",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Corporate/Sponsor",
    rawMessage: "Corporate Transfer KES 120,000 from SAFARICOM HOME CORP",
    cleanedName: "Safaricom Corporate",
    hasDuplicates: false,
    notes: "Matching donation program for employees.",
    status: "completed",
    whatsappPosted: true
  },
  {
    id: "cnt-3",
    projectId: "fundraiser-1",
    amount: 15000,
    senderName: "JOHN OMONDI",
    senderPhone: "254722334455",
    transactionCode: "QRG5P6Q7N3",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Neighbor/Friend",
    rawMessage: "M-PESA: KES 15,000 received from JOHN OMONDI on 12/06 at 09:15",
    cleanedName: "John Omondi",
    hasDuplicates: false,
    notes: "Neighborhood drive contributor.",
    status: "completed",
    whatsappPosted: true
  },
  {
    id: "cnt-4",
    projectId: "fundraiser-1",
    amount: 80000,
    senderName: "CHAMA CHA MAMA ANNEX",
    senderPhone: "Group-Ref",
    transactionCode: "QRH1R2S3T4",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Chama/Group",
    rawMessage: "Group contribution Chama Cha Mama Annex KES 80,000",
    cleanedName: "Chama Cha Mama",
    hasDuplicates: false,
    notes: "Combined group contribution.",
    status: "completed",
    whatsappPosted: true
  },
  {
    id: "cnt-5",
    projectId: "fundraiser-1",
    amount: 80000,
    senderName: "CHAMA CHA MAMA ANNEX",
    senderPhone: "Group-Ref",
    transactionCode: "QRH1R2S3T4",
    timestamp: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Chama/Group",
    rawMessage: "Group contribution Chama Cha Mama Annex KES 80,000",
    cleanedName: "Chama Cha Mama",
    hasDuplicates: true,
    notes: "Duplicate code flagged by AI Guard engine.",
    status: "failed",
    whatsappPosted: false
  },
  {
    id: "cnt-6",
    projectId: "fundraiser-1",
    amount: 10000,
    senderName: "CLIFFORD MBITI",
    senderPhone: "254733445566",
    transactionCode: "QRN4S5T6U7",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Well-wisher",
    rawMessage: "M-PESA: KES 10,000 received from CLIFFORD MBITI on 14/06 at 18:22",
    cleanedName: "Clifford Mbiti",
    hasDuplicates: false,
    notes: "Wished the church annexed project the absolute best.",
    status: "completed",
    whatsappPosted: true
  },
  {
    id: "cnt-7",
    projectId: "fundraiser-1",
    amount: 25000,
    senderName: "GRACE CHERONO",
    senderPhone: "254701234567",
    transactionCode: "QRP2W1V3Y4",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    category: "Neighbor/Friend",
    rawMessage: "M-PESA STK: KES 25,000 pending from GRACE CHERONO",
    cleanedName: "Grace Cherono",
    hasDuplicates: false,
    notes: "Incomplete PIN authorization on handset.",
    status: "pending",
    whatsappPosted: false
  },
  {
    id: "cnt-8",
    projectId: "fundraiser-1",
    amount: 5000,
    senderName: "UNKNOWN WEB EVENT",
    senderPhone: "254711998877",
    transactionCode: "QRX9W8V7U6",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: "Well-wisher",
    rawMessage: "M-PESA Error: Insufficient funds user cancel.",
    cleanedName: "Declined Payee",
    hasDuplicates: false,
    notes: "Safaricom error code 5003 balance exception.",
    status: "failed",
    whatsappPosted: false
  }
];

let whatsappMessages: {
  id: string;
  groupName: string;
  message: string;
  timestamp: string;
  isSystem: boolean;
}[] = [
  {
    id: "wm-init",
    groupName: "St. Jude Harambee Group",
    message: "📢 Welcome everyone to the \"St. Jude Harambee Group\" progress group. System active & tracked via HarambeeFlow AI.",
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isSystem: true
  },
  {
    id: "wm-1",
    groupName: "St. Jude Harambee Group",
    message: "✅ *Sarah Wanjiku* has contributed KES 50,000 via M-PESA. Total Raised: KES 50,000. (Ref: QRE8M9K2L1)",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isSystem: false
  },
  {
    id: "wm-2",
    groupName: "St. Jude Harambee Group",
    message: "✅ *Safaricom Corporate* has contributed KES 120,000 via Corporate Transfer. Total Raised: KES 170,000. (Ref: QRF3N4M5K2)",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isSystem: false
  }
];

// Initialize Gemini client lazily/safely
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        geminiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI with provided key:", err);
      }
    }
  }
  return geminiClient;
}

// Helper to Clean Name up with Gemini
async function cleanNameWithAI(rawName: string, notes: string): Promise<{ cleanedName: string; category: string; explanation: string }> {
  const client = getGeminiClient();
  const defaultFall = {
    cleanedName: rawName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
    category: "Well-wisher",
    explanation: "Formatted with local casing engine (AI key not set)."
  };

  if (!client) {
    return defaultFall;
  }

  try {
    const prompt = `You are an expert East African linguistic analyst and database cleaner for fintech integrations.
Clean and format the following Kenyan contributor name.
Input Raw Name: "${rawName}"
Additional Context: "${notes}"

Rules:
1. Format into standard Title Case (e.g. "SARAH W WAIRIMU" -> "Sarah Wairimu" or "Sarah W. Wairimu").
2. Standardize abbreviations: format standalone middle initials (like "W") into uppercase and add a trailing period if appropriate, or omit redundant middle noise (such as "M-PESA USER").
3. Determine likely fundraising category. Choose exactly one of these: "Family/Friends", "Neighbor/Friend", "Corporate/Sponsor", "Chama/Group", "Well-wisher".
4. Provide a 1-sentence note of what was cleaned or categorized.

Return a JSON object conforming exactly to this structure:
{
  "cleanedName": "string",
  "category": "string",
  "explanation": "string"
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cleanedName: { type: Type.STRING },
            category: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["cleanedName", "category", "explanation"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    if (parsed.cleanedName) {
      return {
        cleanedName: parsed.cleanedName,
        category: parsed.category || "Well-wisher",
        explanation: parsed.explanation || "Cleaned by Google Gemini AI."
      };
    }
  } catch (error) {
    console.error("Gemini cleanup error, falling back:", error);
  }
  return defaultFall;
}

interface AISummary {
  totalRaised: number;
  contributorCount: number;
  topContributors: { name: string; amount: number }[];
  categories: { name: string; count: number; total: number }[];
  narrative: string;
}

// Helper to generate dynamic summarizing narrative
async function generateSummarizationAI(project: any, currentContributions: any[]): Promise<AISummary> {
  const client = getGeminiClient();
  const total = currentContributions.reduce((sum, c) => sum + c.amount, 0);
  const count = currentContributions.length;

  // Calculte top contributors
  const contribMap: Record<string, number> = {};
  currentContributions.forEach(c => {
    contribMap[c.cleanedName] = (contribMap[c.cleanedName] || 0) + c.amount;
  });
  const topList = Object.entries(contribMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Group by category
  const catMap: Record<string, { count: number; total: number }> = {};
  currentContributions.forEach(c => {
    if (!catMap[c.category]) {
      catMap[c.category] = { count: 0, total: 0 };
    }
    catMap[c.category].count += 1;
    catMap[c.category].total += c.amount;
  });
  const catList = Object.entries(catMap).map(([name, val]) => ({
    name,
    count: val.count,
    total: val.total
  }));

  const defaultNarrative = `${project.name} has raised KES ${total.toLocaleString()} from ${count} contributions. The top contributor is ${topList[0]?.name || "N/A"} with KES ${(topList[0]?.amount || 0).toLocaleString()}. Let's join hands to reach the target of KES ${project.targetAmount.toLocaleString()}.`;

  const fallbackResult: AISummary = {
    totalRaised: total,
    contributorCount: count,
    topContributors: topList,
    categories: catList,
    narrative: defaultNarrative + " (High-quality template generation applied without AI)"
  };

  if (!client) {
    return fallbackResult;
  }

  try {
    const prompt = `You are a warm, helpful community chairperson or fund treasurer for a Harambee (fundraising committee) in Kenya. He is analyzing current totals and formulating a highly encouraging progress update for the group.

Project Context:
Name: "${project.name}"
Target: KES ${project.targetAmount}
Total raised so far: KES ${total}
Number of contributors: ${count}
Top contributor list: ${JSON.stringify(topList)}
Contributions split by category: ${JSON.stringify(catList)}

Task:
Write a beautifully worded, encouraging, and clear 3-4 sentence update summary of the fund.
Emphasize East African community values ("Harambee" means "Pulling together"). Mention the progress percentage, acknowledge the top contributors with pride, and encourage members to continue sharing. Offer an encouraging final blessing or Swahili proverb (like "Haba na haba hujaza kibaba" - Little by little fills the pot). Keep it concise, friendly, and appropriate for text sharing.

Format your output inside of a JSON string with a single key "narrative" holding the paragraph text.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING }
          },
          required: ["narrative"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    if (parsed.narrative) {
      return {
        totalRaised: total,
        contributorCount: count,
        topContributors: topList,
        categories: catList,
        narrative: parsed.narrative
      };
    }
  } catch (error) {
    console.error("Gemini summary error, falling back:", error);
  }
  return fallbackResult;
}

// Helper to keep projects state synced with live Firestore fundraisers collection
async function loadFundraisers() {
  if (useFirebase && db) {
    try {
      const colRef = collection(db, "fundraisers");
      const snap = await getDocs(colRef);
      const loaded: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        loaded.push({
          id: d.id,
          name: data.name || "",
          targetAmount: Number(data.targetAmount) || 0,
          currentAmount: Number(data.currentAmount) || 0,
          description: data.description || "",
          category: data.category || "General/Harambee",
          treasurerPhone: data.treasurerPhone || "",
          paybillNumber: data.paybill || "",
          accountReference: data.accountReference || "",
          whatsappGroupName: data.whatsappGroupName || `${data.name} Info`,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
        });
      });
      loaded.sort((a, b) => new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime());
      projects = loaded;
      console.log(`📦 Synced ${projects.length} live fundraisers from Firestore collection "fundraisers".`);
    } catch (err) {
      console.error("Failed to load fundraisers from Firestore 'fundraisers' collection:", err);
    }
  }
}

// Helper to update fundraiser currentAmount in live Firestore
async function updateFundraiserAmountInFirestore(proj: any) {
  if (useFirebase && db && proj) {
    try {
      await setDoc(doc(db, "fundraisers", proj.id), {
        fundraiserName: proj.name || "",
        targetAmount: Number(proj.targetAmount) || 0,
        currentAmount: Number(proj.currentAmount) || 0,
        description: proj.description || "",
        sectorCategory: proj.category || "",
        mpesaShortcode: proj.paybillNumber || proj.paybill || "",
        accountReference: proj.accountReference || "",
        treasurerPhone: proj.treasurerPhone || "",
        whatsappGroupName: proj.whatsappGroupName || `${proj.name} Info`,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update fundraiser currentAmount in Firestore:", err);
    }
  }
}

// Seed data and load Firestore documents
async function seedAndLoadDatabase() {
  if (!useFirebase || !db) {
    console.log("ℹ️ Skipping Firestore seeding/loading as Firebase is not connected.");
    return;
  }

  try {
    console.log("🔍 Checking Firestore databases collections...");
    
    // 1. Load standard Fundraisers collection
    await loadFundraisers();

    // 2. Contributions
    const contribsCol = collection(db, "donations");
    const contribSnap = await getDocs(contribsCol);
    if (!contribSnap.empty) {
      const loaded: any[] = [];
      contribSnap.forEach(d => {
        loaded.push(d.data());
      });
      loaded.sort((a, b) => new Date(a.timestamp || "").getTime() - new Date(b.timestamp || "").getTime());
      contributions = loaded;
      console.log(`📦 Loaded ${contributions.length} contributions successfully from live Firestore.`);
    }

    // 3. WhatsApp messages
    const waCol = collection(db, "whatsappMessages");
    const waSnap = await getDocs(waCol);
    if (!waSnap.empty) {
      const loaded: any[] = [];
      waSnap.forEach(d => {
        loaded.push(d.data());
      });
      loaded.sort((a, b) => new Date(a.timestamp || "").getTime() - new Date(b.timestamp || "").getTime());
      whatsappMessages = loaded;
      console.log(`📦 Loaded ${whatsappMessages.length} simulated WhatsApp messages successfully from live Firestore.`);
    }
    
  } catch (error) {
    console.error("❌ Google Cloud Firestore Connection failed / insufficient permissions:", error);
    console.error("💡 Falling back completely to local memory sandbox, app remains fully functional.");
    if (db) {
      try {
        await terminate(db).catch(() => {});
      } catch (tErr) {
        // Safe to ignore
      }
    }
    useFirebase = false;
    db = null;
  }
}

// REST ENDPOINTS

// Simple Baseline: Get list of all fundraisers
app.get("/fundraisers", async (req, res) => {
  await loadFundraisers();
  res.json(projects);
});

// Simple Baseline: Setup/Create a fundraiser project
app.post("/fundraisers", async (req, res) => {
  const { name, targetAmount, description, category, treasurerPhone, paybillNumber, accountReference } = req.body;
  
  if (!name || !targetAmount) {
    return res.status(400).json({ error: "Missing required fields: name, targetAmount" });
  }

  const newProjId = `fundraiser-${Date.now()}`;
  const newProj = {
    name: String(name).trim(),
    targetAmount: Number(targetAmount),
    currentAmount: 0,
    description: (description || "").trim() || "Community Harambee Drive",
    category: category || "General/Harambee",
    treasurerPhone: treasurerPhone || "+254712345678",
    paybill: paybillNumber || "225588",
    paybillNumber: paybillNumber || "225588",
    accountReference: accountReference || name.substring(0, 7).toUpperCase().replace(/\s/g, ""),
    whatsappGroupName: `${name.trim()} Group`,
    createdAt: new Date().toISOString()
  };

  projects.push({ id: newProjId, ...newProj });

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "fundraisers", newProjId), {
        name: newProj.name,
        targetAmount: newProj.targetAmount,
        currentAmount: newProj.currentAmount,
        description: newProj.description,
        category: newProj.category,
        treasurerPhone: newProj.treasurerPhone,
        paybill: newProj.paybill,
        accountReference: newProj.accountReference,
        whatsappGroupName: newProj.whatsappGroupName,
        createdAt: new Date()
      });
    } catch (err) {
      console.error("Firestore error writing new fundraiser:", err);
    }
  }

  await loadFundraisers();
  res.status(201).json({ id: newProjId, ...newProj });
});

// Simple Baseline: List realtime donations/contributions with successful/pending/failed statuses
app.get("/realtime-donations", (req, res) => {
  const { projectId } = req.query;
  if (projectId) {
    res.json(contributions.filter(c => c.projectId === projectId));
  } else {
    res.json(contributions);
  }
});

// Simple Baseline: Submit a contribution webhook simulated or manual
app.post("/realtime-donations", async (req, res) => {
  const { projectId, amount, senderName, senderPhone, transactionCode, category, notes, status } = req.body;

  if (!projectId || !amount || !senderName || !transactionCode) {
    return res.status(400).json({ error: "Missing required values: projectId, amount, senderName, and transactionCode" });
  }

  const cleanResult = await cleanNameWithAI(senderName, notes || "");
  const isDuplicate = contributions.some(c => c.transactionCode.toUpperCase() === transactionCode.toUpperCase() && c.projectId === projectId);

  const finalStatus = isDuplicate ? 'failed' : (status || 'completed');

  const parts = senderName.trim().split(/\s+/);
  const firstName = parts[0] || "M-PESA";
  const middleName = parts.length > 2 ? parts[1] : "";
  const lastName = parts.length > 2 ? parts.slice(2).join(" ") : (parts[1] || "Customer");
  const phoneVal = senderPhone || "+254700000000";

  const newCont = {
    id: `cnt-${contributions.length + 1}`,
    projectId,
    amount: Number(amount),
    senderName,
    senderPhone: phoneVal,
    transactionCode: transactionCode.toUpperCase(),
    timestamp: new Date().toISOString(),
    category: category || cleanResult.category,
    rawMessage: `M-PESA incoming: KES ${amount} from ${senderName}`,
    cleanedName: cleanResult.cleanedName,
    hasDuplicates: isDuplicate,
    notes: isDuplicate ? "Duplicate transactional code blocked by system audit" : (notes || cleanResult.explanation),
    status: finalStatus,
    whatsappPosted: finalStatus === 'completed',

    firstName,
    middleName,
    lastName,
    phoneNumber: phoneVal,
    receiptNumber: transactionCode.toUpperCase(),
    billReference: projectId,
    transactionTime: new Date().toISOString(),
    campaignId: projectId,
    donorId: phoneVal
  };

  contributions.push(newCont);

  if (useFirebase && db && finalStatus === 'completed' && !isDuplicate) {
    try {
      const donorRef = doc(db, "donors", phoneVal);
      const donorSnap = await getDoc(donorRef);
      const nowIso = new Date().toISOString();
      if (donorSnap.exists()) {
        const donorData = donorSnap.data();
        const totalAmount = Number(donorData.totalAmount || 0) + Number(amount);
        const totalContributions = Number(donorData.totalContributions || 0) + 1;
        await setDoc(donorRef, {
          ...donorData,
          lastContribution: nowIso,
          totalContributions,
          totalAmount
        }, { merge: true });
        console.log(`[SERVER] Updated returning donor stats for manual donation ${phoneVal}`);
      } else {
        await setDoc(donorRef, {
          firstName,
          middleName,
          lastName,
          fullName: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, " ").trim(),
          phoneNumber: phoneVal,
          firstContribution: nowIso,
          lastContribution: nowIso,
          totalContributions: 1,
          totalAmount: Number(amount)
        });
        console.log(`[SERVER] Created new donor profile for manual donation ${phoneVal}`);
      }
    } catch (err) {
      console.error("Firestore error writing donor profile for manual donation:", err);
    }
  }

  if (!isDuplicate && finalStatus === 'completed') {
    // Update live memory counter
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      proj.currentAmount += Number(amount);
      if (useFirebase && db) {
        try {
          await updateFundraiserAmountInFirestore(proj);
        } catch (err) {
          console.error("Failed to update firestore fundraiser total:", err);
        }
      }
    }
  }

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "donations", newCont.id), newCont);
    } catch (err) {
      console.error("Firestore error writing donation:", err);
    }
  }

  res.status(201).json({ ...newCont, duplicateFound: isDuplicate });
});

// Get All Projects
app.get("/api/projects", async (req, res) => {
  await loadFundraisers();
  res.json(projects);
});

// Create New Project
app.post("/api/projects", async (req, res) => {
  const { name, targetAmount, description, category, treasurerPhone, paybillNumber, accountReference, whatsappGroupName } = req.body;
  if (!name || !targetAmount) {
    return res.status(400).json({ error: "Name and targetAmount are required." });
  }

  const newProjId = `fundraiser-${Date.now()}`;
  const newProj = {
    name,
    targetAmount: Number(targetAmount),
    currentAmount: 0,
    description: description || "",
    category: category || "General/Harambee",
    treasurerPhone: treasurerPhone || "",
    paybill: paybillNumber || "225588",
    accountReference: accountReference || name.substring(0, 7).toUpperCase().replace(/\s/g, ""),
    whatsappGroupName: whatsappGroupName || `${name} Info`,
    createdAt: new Date().toISOString()
  };

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "fundraisers", newProjId), newProj);
    } catch (err) {
      console.error("Firestore error writing new fundraiser:", err);
    }
  }

  await loadFundraisers();
  res.status(201).json({ id: newProjId, ...newProj, paybillNumber: newProj.paybill });
});

// Get Combined Contributions Logs
app.get("/api/contributions", (req, res) => {
  const { projectId } = req.query;
  if (projectId) {
    res.json(contributions.filter(c => c.projectId === projectId));
  } else {
    res.json(contributions);
  }
});

// Add New Contribution Manually / Import Direct
app.post("/api/contributions", async (req, res) => {
  const { projectId, amount, senderName, senderPhone, transactionCode, category, notes, timestamp } = req.body;

  if (!projectId || !amount || !senderName || !transactionCode) {
    return res.status(400).json({ error: "Missing required values: projectId, amount, senderName, and transactionCode" });
  }

  // Check Duplicate
  const duplicate = contributions.some(c => c.transactionCode.toUpperCase() === transactionCode.toUpperCase() && c.projectId === projectId);

  const cleanResult = await cleanNameWithAI(senderName, notes || "");

  const newContribution = {
    id: `cnt-${contributions.length + 1}`,
    projectId,
    amount: Number(amount),
    senderName,
    senderPhone: senderPhone || "",
    transactionCode: transactionCode.toUpperCase(),
    timestamp: timestamp || new Date().toISOString(),
    category: category || cleanResult.category,
    rawMessage: `Manual Import: KES ${amount} from ${senderName} (TX: ${transactionCode.toUpperCase()})`,
    cleanedName: cleanResult.cleanedName,
    hasDuplicates: duplicate,
    notes: notes || cleanResult.explanation,
    whatsappPosted: false
  };

  if (!duplicate) {
    contributions.push(newContribution);
    // Update current project totals
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      proj.currentAmount += Number(amount);
    }

    // Generate simulated WhatsApp message
    const projectObj = projects.find(p => p.id === projectId);
    let waMsg: any = null;
    if (projectObj) {
      waMsg = {
        id: `wm-${Date.now()}`,
        groupName: projectObj.whatsappGroupName,
        message: `✅ *${cleanResult.cleanedName}* has contributed KES ${Number(amount).toLocaleString()} via M-PESA. Total Raised: KES ${projectObj.currentAmount.toLocaleString()}. (Ref: ${transactionCode.toUpperCase()})`,
        timestamp: new Date().toISOString(),
        isSystem: false
      };
      whatsappMessages.push(waMsg);
      newContribution.whatsappPosted = true;
    }

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, "donations", newContribution.id), newContribution);
        if (proj) {
          await updateFundraiserAmountInFirestore(proj);
        }
        if (waMsg) {
          await setDoc(doc(db, "whatsappMessages", waMsg.id), waMsg);
        }
      } catch (err) {
        console.error("Firestore error sync contribution:", err);
      }
    }
  }

  res.status(201).json({ ...newContribution, duplicateFound: duplicate });
});

// Trigger STK Push (Simulator)
app.post("/api/daraja/stk", async (req, res) => {
  const { projectId, phoneNumber, amount } = req.body;

  if (!projectId || !phoneNumber || !amount) {
    return res.status(400).json({ error: "Missing parameters: projectId, phoneNumber, amount" });
  }

  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project not found" });
  }

  // Mimic Daraja response
  const callbackId = `ws_CO_${Date.now().toString().substring(5, 15)}`;
  const mpesaCode = "MP" + Math.random().toString(36).substring(2, 10).toUpperCase();

  res.json({
    merchantRequestID: `29115-${Date.now()}-1`,
    checkoutRequestID: callbackId,
    responseCode: "0",
    responseDescription: "Success. Request accepted for processing",
    customerMessage: "Success. Please check your handset and key in your M-PESA PIN.",
    simulatedMpesaCode: mpesaCode
  });
});

// Unified, secure fintech-grade callback endpoint handler
async function handleMpesaWebhook(req: any, res: any) {
  console.log("[CALLBACK] [SECURITY] Callback received:", JSON.stringify(req.body));

  // 1. Verify structure using our validation engine
  if (!validateCallbackOrigin(req)) {
    console.log("[CALLBACK] [SECURITY] Rejected callback due to invalid structure.");
    return res.status(400).json({ ResultCode: 1, ResultDesc: "Request rejected due to invalid callback structure." });
  }

  // 2. Verify that callback is not blocked by active system-blocked state
  if (isSystemBlocked()) {
    console.log("[CALLBACK] [SECURITY] Rejected callback due to active system kill-switch.");
    return res.status(400).json({ ResultCode: 1, ResultDesc: "Callbacks are currently blocked by system administrators." });
  }

  try {
    const isStk = !!(req.body?.Body?.stkCallback);
    
    // 3. Extract key details depending on whether it's STK or C2B
    let amount = 0;
    let code = "";
    let name = "M-PESA Customer";
    let phone = "";
    let refCode = "GENERAL";
    let checkoutRequestID = "";
    let isSuccessState = false;
    let statusDesc = "";

    if (isStk) {
      const callback = req.body.Body.stkCallback;
      checkoutRequestID = callback.CheckoutRequestID;
      isSuccessState = callback.ResultCode === 0;
      statusDesc = callback.ResultDesc || "";

      // Replay check for checkout ID
      const isDupe = await isDuplicateCallback(checkoutRequestID);
      if (isDupe) {
        console.log(`[CALLBACK] [SECURITY] Replay protection blocked duplicate CheckoutRequestID: ${checkoutRequestID}`);
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Replay protection active: duplicate transaction callback blocked." });
      }

      if (isSuccessState) {
        const meta = callback.CallbackMetadata?.Item || [];
        const amtItem = meta.find((i: any) => i.Name === "Amount");
        const codeItem = meta.find((i: any) => i.Name === "MpesaReceiptNumber");
        const numItem = meta.find((i: any) => i.Name === "PhoneNumber");
        const userItem = meta.find((i: any) => i.Name === "User");

        amount = amtItem ? Number(amtItem.Value) : 0;
        code = codeItem ? String(codeItem.Value).toUpperCase() : "";
        phone = numItem ? String(numItem.Value) : "";
        name = userItem ? String(userItem.Value) : "";
      }
    } else {
      // C2B format
      amount = req.body.TransAmount ? Number(req.body.TransAmount) : 0;
      code = (req.body.TransID || "").toString().toUpperCase();
      name = `${req.body.FirstName || ""} ${req.body.MiddleName || ""} ${req.body.LastName || ""}`.trim() || "M-PESA Customer";
      phone = req.body.MSISDN || "";
      refCode = req.body.BillRefNumber || "STJUDE";
      isSuccessState = true; // C2B push callback is only received on success
      statusDesc = "Success";
      checkoutRequestID = `C2B-${code}`;

      // Replay check for C2B pseudo checkout
      const isDupe = await isDuplicateCallback(checkoutRequestID);
      if (isDupe) {
        console.log(`[CALLBACK] [SECURITY] Replay protection blocked duplicate C2B pseudo checkout: ${checkoutRequestID}`);
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Replay protection active: duplicate transaction callback blocked." });
      }
    }

    // Retrieve cached context if available for STK
    const cachedPayment = checkoutRequestID ? pendingMpesaPayments.get(checkoutRequestID) : null;
    const targetPhone = phone || cachedPayment?.senderPhone || "";
    const finalSenderName = name || cachedPayment?.senderName || "M-PESA CONTRIBUTOR";

    let firstName = "";
    let middleName = "";
    let lastName = "";

    if (isStk) {
      if (cachedPayment) {
        firstName = cachedPayment.firstName || "";
        middleName = cachedPayment.middleName || "";
        lastName = cachedPayment.lastName || "";
      }
    } else {
      firstName = req.body.FirstName || "";
      middleName = req.body.MiddleName || "";
      lastName = req.body.LastName || "";
    }

    if (!firstName && !lastName && finalSenderName) {
      const parts = finalSenderName.trim().split(/\s+/);
      firstName = parts[0] || "M-PESA";
      middleName = parts.length > 2 ? parts[1] : "";
      lastName = parts.length > 2 ? parts.slice(2).join(" ") : (parts[1] || "Contributor");
    }

    if (isSuccessState && amount > 0 && code) {
      // 4. Double spend protection across receipt numbers (FINTECH-GRADE UNIQUE CONSTRAINT)
      const isDupeReceipt = await isDuplicateReceipt(code);
      if (isDupeReceipt) {
        console.warn(`[CALLBACK] [FRAUD DETECTION] Receipt ${code} detected as duplicate replay attack! Double crediting prevented!`);
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Duplicate transaction code recorded." });
      }

      // Check against current contribution code in db/cache to double protect
      const isCodeUsedBefore = contributions.some(c => c.transactionCode.toUpperCase() === code);
      if (isCodeUsedBefore) {
        console.warn(`[CALLBACK] [FRAUD DETECTION] Receipt ${code} double-check failed! Already parsed in in-memory collection.`);
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Duplicate transaction code recorded in memory collection." });
      }

      // Find project match
      let targetProj = projects.find(p => p.accountReference.toUpperCase() === refCode.toUpperCase());
      if (cachedPayment?.projectId) {
        targetProj = projects.find(p => p.id === cachedPayment.projectId);
      }
      if (!targetProj) {
        targetProj = projects[0]; // fallback
      }

      const maskedPhone = targetPhone.substring(0, 4) + "***" + targetPhone.substring(targetPhone.length - 4);
      console.log(`✅ [CALLBACK] Verified Successful payment of KES ${amount} (Receipt: ${code}) by ${finalSenderName} (${maskedPhone})`);

      // Audit log (masked phone number)
      logTransactionAudit({
        timestamp: new Date().toISOString(),
        phone: String(targetPhone),
        amount: Number(amount),
        receipt: String(code),
        status: "success"
      });

      // AI cleaning and categorization
      const cleanResult = await cleanNameWithAI(finalSenderName, `M-PESA dynamic callback verification. Phone: ${targetPhone}`);

      const newContribution = {
        id: `cnt-${Date.now()}`,
        projectId: targetProj.id,
        amount: Number(amount),
        senderName: finalSenderName,
        senderPhone: String(targetPhone),
        transactionCode: code,
        timestamp: new Date().toISOString(),
        category: cleanResult.category || "Well-wisher",
        rawMessage: `Safaricom Callback: KES ${amount} received from ${finalSenderName} (TX: ${code})`,
        cleanedName: cleanResult.cleanedName || finalSenderName,
        hasDuplicates: false,
        notes: cleanResult.explanation || "Safaricom Daraja automated callback mapping.",
        status: "completed",
        whatsappPosted: false,

        firstName: firstName || "",
        middleName: middleName || "",
        lastName: lastName || "",
        phoneNumber: String(targetPhone),
        receiptNumber: code,
        billReference: targetProj.accountReference || "",
        transactionTime: new Date().toISOString(),
        campaignId: targetProj.id,
        donorId: String(targetPhone)
      };

      // Assert verification assertion
      const requiredKeys = [
        "senderName", "cleanedName", "firstName", "middleName", "lastName",
        "phoneNumber", "receiptNumber", "billReference", "amount", "transactionTime", "campaignId", "donorId"
      ];
      for (const key of requiredKeys) {
        if ((newContribution as any)[key] === undefined) {
          throw new Error(`Critical Field Missing in backend callback: ${key} is required to commit donation.`);
        }
      }

      contributions.push(newContribution);
      targetProj.currentAmount += Number(amount);

      // Create WhatsApp message
      const waMsgText = `✅ *${newContribution.cleanedName}* has contributed KES ${amount.toLocaleString()} via M-PESA. Total Raised: KES ${targetProj.currentAmount.toLocaleString()} (Ref: ${newContribution.transactionCode})`;
      const waMsg = {
        id: `wm-${Date.now()}`,
        groupName: targetProj.whatsappGroupName,
        message: waMsgText,
        timestamp: new Date().toISOString(),
        isSystem: false
      };
      
      whatsappMessages.push(waMsg);
      newContribution.whatsappPosted = true;

      if (useFirebase && db) {
        try {
          await setDoc(doc(db, "donations", newContribution.id), newContribution);
          await updateFundraiserAmountInFirestore(targetProj);
          await setDoc(doc(db, "whatsappMessages", waMsg.id), waMsg);

          // Update or create donor profile in Firestore
          const donorRef = doc(db, "donors", String(targetPhone));
          const donorSnap = await getDoc(donorRef);
          const nowIso = new Date().toISOString();
          if (donorSnap.exists()) {
            const donorData = donorSnap.data();
            const totalAmount = Number(donorData.totalAmount || 0) + Number(amount);
            const totalContributions = Number(donorData.totalContributions || 0) + 1;
            await setDoc(donorRef, {
              ...donorData,
              lastContribution: nowIso,
              totalContributions,
              totalAmount
            }, { merge: true });
            console.log(`[CALLBACK] Updated returning donor stats for ${targetPhone}`);
          } else {
            const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, " ").trim();
            await setDoc(donorRef, {
              firstName,
              middleName,
              lastName,
              fullName,
              phoneNumber: String(targetPhone),
              firstContribution: nowIso,
              lastContribution: nowIso,
              totalContributions: 1,
              totalAmount: Number(amount)
            });
            console.log(`[CALLBACK] Created new donor profile for ${targetPhone}`);
          }
        } catch (err) {
          console.error("[CALLBACK] [FIREBASE] Sync error:", err);
        }
      }
    } else {
      console.log(`❌ [CALLBACK] Transaction failed / cancelled: ${statusDesc}`);
      if (cachedPayment) {
        const receipt = `FAIL-${checkoutRequestID.substring(checkoutRequestID.length - 8)}`;
        
        logTransactionAudit({
          timestamp: new Date().toISOString(),
          phone: String(cachedPayment.senderPhone || ""),
          amount: Number(cachedPayment.amount || 0),
          receipt,
          status: "failed"
        });

        const newContribution = {
          id: `cnt-${Date.now()}`,
          projectId: cachedPayment.projectId,
          amount: cachedPayment.amount,
          senderName: cachedPayment.senderName,
          senderPhone: cachedPayment.senderPhone,
          transactionCode: receipt.toUpperCase(),
          timestamp: new Date().toISOString(),
          category: "Well-wisher",
          rawMessage: `M-PESA Callback Cancelled/Failed: ${statusDesc}`,
          cleanedName: cachedPayment.senderName,
          hasDuplicates: false,
          notes: `Failed. Reason: ${statusDesc}`,
          status: "failed",
          whatsappPosted: false,

          firstName: cachedPayment.firstName || firstName || "",
          middleName: cachedPayment.middleName || middleName || "",
          lastName: cachedPayment.lastName || lastName || "",
          phoneNumber: cachedPayment.senderPhone || "",
          receiptNumber: receipt.toUpperCase(),
          billReference: cachedPayment.projectId || "",
          transactionTime: new Date().toISOString(),
          campaignId: cachedPayment.projectId,
          donorId: cachedPayment.senderPhone || ""
        };

        // Assert verification assertion
        const requiredKeys = [
          "senderName", "cleanedName", "firstName", "middleName", "lastName",
          "phoneNumber", "receiptNumber", "billReference", "amount", "transactionTime", "campaignId", "donorId"
        ];
        for (const key of requiredKeys) {
          if ((newContribution as any)[key] === undefined) {
            throw new Error(`Critical Field Missing in backend failed callback: ${key} is required to commit donation.`);
          }
        }

        contributions.push(newContribution);
        if (useFirebase && db) {
          try {
            await setDoc(doc(db, "donations", newContribution.id), newContribution);
          } catch (err) {
            console.error("[CALLBACK] [FIREBASE] Failed writing cancelled record:", err);
          }
        }
      }
    }

    // Clear pending payment cache
    if (checkoutRequestID) {
      pendingMpesaPayments.delete(checkoutRequestID);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback accepted and processed safely" });

  } catch (error) {
    console.error("[CALLBACK] Error during webhook appraisal:", error);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal callback appraisal error occurred" });
  }
}

// Map safaricom callbacks entry to unified secure webhook
app.post("/api/daraja/callback", mpesaWebhookAuthMiddleware, mpesaWebhookController);

// WhatsApp simulated messages feed
app.get("/api/whatsapp/messages", (req, res) => {
  res.json(whatsappMessages);
});

// Clear Sim feeds or Reset
app.post("/api/whatsapp/clear", async (req, res) => {
  await loadFundraisers();
  const activeProj = projects[0];
  
  if (activeProj) {
    whatsappMessages = [
      {
        id: "wm-init",
        groupName: activeProj.whatsappGroupName,
        message: `📢 Welcome everyone to the "${activeProj.whatsappGroupName}" progress group. System active & tracked via HarambeeFlow AI.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      }
    ];
  } else {
    whatsappMessages = [];
  }

  if (useFirebase && db) {
    try {
      const waCol = collection(db, "whatsappMessages");
      const waSnap = await getDocs(waCol);
      for (const d of waSnap.docs) {
        await deleteDoc(doc(db, "whatsappMessages", d.id));
      }
      if (whatsappMessages.length > 0) {
        await setDoc(doc(db, "whatsappMessages", "wm-init"), whatsappMessages[0]);
      }
    } catch (err) {
      console.error("Firestore clear error:", err);
    }
  }

  res.json({ success: true });
});

// POST /api/mpesa/stkpush
app.post("/api/mpesa/stkpush", validateSTKRequest, rateLimitSTKPush, async (req, res) => {
  const { phone, phoneNumber, amount, reference, accountReference, firstName, middleName, lastName } = req.body;
  const targetPhone = phone || phoneNumber;
  const targetRef = reference || accountReference;

  console.log(`[MPESA STK PUSH INITIATED] phone: ${targetPhone}, amount: ${amount}, reference: ${targetRef}, donor: ${firstName} ${middleName} ${lastName}`);

  if (!targetPhone || !amount) {
    return res.status(400).json({
      success: false,
      checkoutRequestID: "",
      message: "Missing required parameters: phone/phoneNumber and amount are required."
    });
  }

  // Find the campaign project if possible to map accurately
  const proj = projects.find(p => p.id === targetRef || p.accountReference === targetRef || p.name === targetRef);
  const projectId = proj ? proj.id : "fundraiser-1";
  const campaignName = proj ? proj.name : "General Drive";
  const accountRef = proj ? proj.accountReference : (targetRef || "Harambee");

  // Format valid account reference (Must be alphanumeric, <= 12 chars)
  const formattedRef = accountRef.replace(/[^a-zA-Z0-9]/g, "").substring(0, 12) || "Harambee";

  try {
    const result = await initiateSTKPush({
      phoneNumber: targetPhone,
      amount: Number(amount),
      accountReference: formattedRef,
      firstName,
      middleName,
      lastName
    });

    console.log(`[MPESA RESPONSE RECEIVED] success: ${result.success}, checkoutRequestID: ${result.checkoutRequestID || ""}`);

    if (result.success && result.checkoutRequestID) {
      const pendingData = {
        projectId,
        senderName: `${firstName || ""} ${middleName || ""} ${lastName || ""}`.trim() || `M-PESA (${targetPhone})`,
        senderPhone: targetPhone,
        amount: Number(amount),
        firstName: firstName || "",
        middleName: middleName || "",
        lastName: lastName || ""
      };
      
      // Register local cache
      pendingMpesaPayments.set(result.checkoutRequestID, pendingData);

      // Register in-flight context so when callback matches, we attribute it correctly to the project and run AI name-cleanse
      await setPendingPayment(result.checkoutRequestID, pendingData);
    }

    res.json({
      success: result.success,
      checkoutRequestID: result.checkoutRequestID || "",
      message: result.message
    });
  } catch (error: any) {
    console.error("Error executing M-PESA STK Push handler:", error);
    res.status(500).json({
      success: false,
      checkoutRequestID: "",
      message: error.message || "Failed to initiate M-PESA transaction processing flow."
    });
  }
});

// POST /api/mpesa/callback
app.post("/api/mpesa/callback", mpesaWebhookAuthMiddleware, mpesaWebhookController);

// AI summarize text
app.post("/api/ai/summarize", async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: "Missing projectId" });
  }
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project not found" });
  }

  const projContribs = contributions.filter(c => c.projectId === projectId && !c.hasDuplicates);
  const summaryObj = await generateSummarizationAI(proj, projContribs);
  res.json(summaryObj);
});

// POST /api/ai/campaign-analysis
app.post("/api/ai/campaign-analysis", async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: "Missing projectId" });
  }
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project not found" });
  }

  const projContribs = contributions.filter(c => c.projectId === projectId && !c.hasDuplicates);

  // Calculate real metrics server-side
  const totalRaised = projContribs.reduce((sum, c) => sum + c.amount, 0);
  const targetAmount = proj.targetAmount || 0;
  const remainingBalance = Math.max(0, targetAmount - totalRaised);
  const percentageComplete = targetAmount > 0 ? (totalRaised / targetAmount) * 100 : 0;
  const contributorCount = projContribs.length;
  const averageDonation = contributorCount > 0 ? totalRaised / contributorCount : 0;
  const largestDonation = projContribs.reduce((max, c) => c.amount > max ? c.amount : max, 0);
  
  const sortedContribs = [...projContribs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const mostRecentDonation = sortedContribs[0] ? {
    amount: sortedContribs[0].amount,
    senderName: sortedContribs[0].cleanedName || sortedContribs[0].senderName,
    timestamp: sortedContribs[0].timestamp
  } : null;

  const daysSinceLastDonation = sortedContribs[0] ? Math.floor((Date.now() - new Date(sortedContribs[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 999;

  // Set up Gemini connection
  const client = getGeminiClient();
  if (!client) {
    // Generate high-fidelity default fallback analysis if Gemini key is not active
    const fallbackReport = {
      understand: {
        currentStatus: "Active",
        campaignStage: percentageComplete >= 100 ? "Completed" : percentageComplete >= 75 ? "Final Stage" : "Ongoing",
        missingInfo: ["Historical matching sponsors records requested"],
        contextSummary: `${proj.name} is a ${proj.category} fundraising campaign organized by ${proj.organizer || "the Harambee Committee"}.`
      },
      analyze: {
        percentageCompleted: Math.round(percentageComplete),
        remainingBalance: remainingBalance,
        dailyFundraisingRate: Math.round(totalRaised / 30) || 500,
        weeklyTrend: "Stable with periodic updates",
        donationMomentum: percentageComplete >= 100 ? "Completed" : "Healthy",
        averageDonation: Math.round(averageDonation),
        estimatedCompletionDate: "Estimated within 25 days",
        probabilityOfSuccess: percentageComplete >= 75 ? 90 : 65,
        riskOfMissingDeadline: "Low Risk",
        healthClassification: percentageComplete >= 100 ? "Completed" : "Healthy",
        reasoning: "The campaign is showing steady donations from the community."
      },
      detectedEvents: [
        {
          eventId: "evt-start",
          title: "First contribution received",
          description: "The campaign kicked off with an active response from the community.",
          severity: "success",
          timestamp: proj.createdAt || new Date().toISOString()
        }
      ],
      recommendations: [
        {
          id: "rec-1",
          title: "Publish progress update to WhatsApp group",
          description: `Let the group know we are at ${Math.round(percentageComplete)}% of the target.`,
          expectedImpact: "High",
          priority: 1
        },
        {
          id: "rec-2",
          title: "Acknowledge recent contributors",
          description: "Send personalized thank you receipts to the latest contributors.",
          expectedImpact: "Medium",
          priority: 2
        }
      ],
      communications: {
        whatsapp: `📊 *${proj.name} Campaign Update* 📊\n\nDear friends and family, we have raised KES ${totalRaised.toLocaleString()} so far, reaching ${Math.round(percentageComplete)}% of our goal! Only KES ${remainingBalance.toLocaleString()} remains. Let's pull together to reach our target. "Haba na haba hujaza kibaba."`,
        sms: `Dear Supporter, ${proj.name} has raised KES ${totalRaised.toLocaleString()} (${Math.round(percentageComplete)}% of target). Thank you for pulling together!`,
        email: `Dear Supporter,\n\nWe are writing to share a progress update for ${proj.name}. We have raised KES ${totalRaised.toLocaleString()} (${Math.round(percentageComplete)}%) of our target amount of KES ${targetAmount.toLocaleString()}.\n\nThank you for your support!\n\nBest regards,\n${proj.organizer || "Harambee Committee"}`
      },
      predict: {
        probabilityOfSuccess: percentageComplete >= 75 ? 90 : 65,
        estimatedCompletionDate: "25 days",
        bestDayToCommunicate: "Sunday afternoon after church services",
        bestCommunicationChannel: "WhatsApp Community Broadcaster",
        expectedFundraisingPace: "Steady weekly contributions",
        additionalPromotionRequired: true,
        reasoning: "Steady traction, but needs extra coordination before the upcoming deadline."
      },
      celebration: {
        isMilestoneReached: percentageComplete >= 50,
        milestoneTitle: percentageComplete >= 100 ? "Goal Achieved!" : percentageComplete >= 50 ? "50% Target Reached" : "Campaign Launched",
        celebrationText: `Congratulations! Your campaign has reached ${Math.round(percentageComplete)}%. Only KES ${remainingBalance.toLocaleString()} remains. Momentum is healthy. Keep up the great work!`
      },
      finalReport: {
        campaignStatus: percentageComplete >= 100 ? "Goal Achieved" : "Active & Progressive",
        campaignHealth: percentageComplete >= 100 ? "Completed" : "Healthy",
        riskLevel: "Low",
        progress: `${Math.round(percentageComplete)}% (KES ${totalRaised.toLocaleString()} raised)`,
        estimatedCompletionDate: "25 days",
        topThreeRecommendations: [
          "Share the progress update card on WhatsApp.",
          "Coordinate matching contributions with church sponsors.",
          "Issue donor verification receipts to build confidence."
        ],
        nextMilestone: percentageComplete >= 100 ? "Complete audit report" : "Reach the next 10% milestone",
        suggestedCommunication: "WhatsApp Progress Broadcast",
        organizerActionRequired: "Treasury reconciliation & group broadcast"
      }
    };
    return res.json(fallbackReport);
  }

  try {
    const prompt = `You are HarambeeFlow AI Campaign Manager, an intelligent fundraising assistant built into HarambeeFlow.
Your purpose is to help churches, schools, welfare groups, chamas, NGOs, and community committees successfully raise funds while maintaining complete transparency, accountability, and donor trust.

You operate as a professional fundraising campaign manager available 24 hours a day.

Please analyze the following live campaign context and perform the 10-step continuous analysis loop:

CAMPAIGN CONTEXT:
- Campaign Title: "${proj.name}"
- Category: "${proj.category}"
- Description: "${proj.description}"
- Organizer: "${proj.organizer || "Harambee Committee"}"
- Committee: "${proj.motto || "Active Committee"}"
- Target Amount: KES ${targetAmount}
- Total Amount Raised: KES ${totalRaised}
- Remaining Balance: KES ${remainingBalance}
- Percentage Completed: ${percentageComplete.toFixed(1)}%
- Number of Contributors: ${contributorCount}
- Average Donation: KES ${averageDonation.toFixed(1)}
- Largest Donation: KES ${largestDonation}
- Days Since Last Donation: ${daysSinceLastDonation}
- Most Recent Donation: ${mostRecentDonation ? `KES ${mostRecentDonation.amount} from ${mostRecentDonation.senderName} on ${mostRecentDonation.timestamp}` : "None yet"}

Now, execute the 10-step analysis:
1. UNDERSTAND: State status, stage, missing info, and general context.
2. ANALYZE: Estimate daily rate, trend, momentum, success probability, risk level, and health (Excellent, Healthy, Needs Attention, Critical, Completed).
3. DETECT EVENTS: Find milestones like 25%, 50%, 75%, 90% reached, goal achieved, large donation, no recent donations, etc.
4. RECOMMEND: Identify high-impact next actions.
5. CREATE COMMUNICATIONS: Draft beautiful, encouraging, and clear updates for WhatsApp, SMS, and Email.
6. PREDICT: Calculate completion probability, estimate date, and recommend channel.
7. CELEBRATE: Write a warm, encouraging congratulatory message for recent milestones.
8. LEARN: (Assume memory of previous suggestions, noting that we have now initiated this session).
9. HUMAN APPROVAL: Detail that messages require treasurer's manual approval.
10. FINAL REPORT: Format the final scorecard exactly using the requested fields.

Return a JSON object matching exactly this JSON schema:
{
  "understand": {
    "currentStatus": "string",
    "campaignStage": "string",
    "missingInfo": ["string"],
    "contextSummary": "string"
  },
  "analyze": {
    "percentageCompleted": number,
    "remainingBalance": number,
    "dailyFundraisingRate": number,
    "weeklyTrend": "string",
    "donationMomentum": "string",
    "averageDonation": number,
    "estimatedCompletionDate": "string",
    "probabilityOfSuccess": number,
    "riskOfMissingDeadline": "string",
    "healthClassification": "string",
    "reasoning": "string"
  },
  "detectedEvents": [
    {
      "eventId": "string",
      "title": "string",
      "description": "string",
      "severity": "string",
      "timestamp": "string"
    }
  ],
  "recommendations": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "expectedImpact": "string",
      "priority": number
    }
  ],
  "communications": {
    "whatsapp": "string",
    "sms": "string",
    "email": "string"
  },
  "predict": {
    "probabilityOfSuccess": number,
    "estimatedCompletionDate": "string",
    "bestDayToCommunicate": "string",
    "bestCommunicationChannel": "string",
    "expectedFundraisingPace": "string",
    "additionalPromotionRequired": boolean,
    "reasoning": "string"
  },
  "celebration": {
    "isMilestoneReached": boolean,
    "milestoneTitle": "string",
    "celebrationText": "string"
  },
  "finalReport": {
    "campaignStatus": "string",
    "campaignHealth": "string",
    "riskLevel": "string",
    "progress": "string",
    "estimatedCompletionDate": "string",
    "topThreeRecommendations": ["string"],
    "nextMilestone": "string",
    "suggestedCommunication": "string",
    "organizerActionRequired": "string"
  }
}

Do not add markdown formatting inside the JSON keys. Output valid JSON only.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Gemini campaign analysis error:", error);
    res.status(500).json({ error: "Analysis failed", details: error instanceof Error ? error.message : String(error) });
  }
});

// POST /api/ai/coach - Interactive fundraising coach chat assistant
app.post("/api/ai/coach", async (req, res) => {
  const { projectId, question } = req.body;
  if (!projectId || !question) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project not found" });
  }

  const projContribs = contributions.filter(c => c.projectId === projectId && !c.hasDuplicates);
  const totalRaised = projContribs.reduce((sum, c) => sum + c.amount, 0);
  const targetAmount = proj.targetAmount || 0;
  const remainingBalance = Math.max(0, targetAmount - totalRaised);
  const percentageComplete = targetAmount > 0 ? (totalRaised / targetAmount) * 100 : 0;
  const contributorCount = projContribs.length;
  const averageDonation = contributorCount > 0 ? totalRaised / contributorCount : 0;
  const largestDonation = projContribs.reduce((max, c) => c.amount > max ? c.amount : max, 0);

  const sortedContribs = [...projContribs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const daysSinceLastDonation = sortedContribs[0] ? Math.floor((Date.now() - new Date(sortedContribs[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 999;

  const client = getGeminiClient();
  if (!client) {
    // Generate intelligent data-driven responses locally
    let reply = "";
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes("performing") || lowerQ.includes("progress") || lowerQ.includes("how are we")) {
      reply = `We are performing steadily. The campaign **"${proj.name}"** has raised **KES ${totalRaised.toLocaleString()}** against our target of **KES ${targetAmount.toLocaleString()}** which represents **${percentageComplete.toFixed(1)}%** completion. We have a remaining balance of **KES ${remainingBalance.toLocaleString()}** to raise from our **${contributorCount}** active supporters.`;
    } else if (lowerQ.includes("slowing") || lowerQ.includes("why")) {
      reply = `Donations are currently at a stable pace with the last donation recorded **${daysSinceLastDonation === 0 ? "today" : daysSinceLastDonation === 999 ? "never" : `${daysSinceLastDonation} days ago`}**. Slowdowns typically occur mid-week. Our analysis shows a recommendation to post a customized WhatsApp progress update to re-engage the community and trigger another wave of support.`;
    } else if (lowerQ.includes("do today") || lowerQ.includes("recommend") || lowerQ.includes("what should we")) {
      reply = `Today's top action is to **thank recent donors** and **share a visual progress flyer in your main WhatsApp group**. Giving them transparency builds trust. Let them know we only need **KES ${remainingBalance.toLocaleString()}** to cross the finish line!`;
    } else if (lowerQ.includes("who") || lowerQ.includes("members") || lowerQ.includes("not donated")) {
      reply = `We do not have a list of non-contributors because we respect privacy, but we do see that we have **${contributorCount}** unique supporters. We recommend checking your WhatsApp group members against the active contributors list in the Participation Tab to see who hasn't completed their pledge.`;
    } else if (lowerQ.includes("per day") || lowerQ.includes("how much do we need")) {
      const dailyNeeded = Math.round(remainingBalance / 15) || 1000;
      reply = `To hit our target within the typical 15-day window, we need approximately **KES ${dailyNeeded.toLocaleString()} per day**. Over a week, that equates to **KES ${(dailyNeeded * 7).toLocaleString()}**. We can reach this if we mobilize just 5 members to donate KES 2,000 each.`;
    } else if (lowerQ.includes("reach our goal") || lowerQ.includes("can we")) {
      const prob = percentageComplete >= 75 ? 90 : percentageComplete >= 50 ? 75 : 55;
      reply = `Yes, absolutely! We estimate a **${prob}% probability of success**. With **KES ${totalRaised.toLocaleString()}** already secured (${percentageComplete.toFixed(1)}%), we have shown strong momentum. Focusing on the remaining **KES ${remainingBalance.toLocaleString()}** with weekly progress reports will seal the goal.`;
    } else {
      reply = `Hello! As your HarambeeFlow AI Fundraising Coach, I can analyze the live ledger for **"${proj.name}"**. Currently, we have raised **KES ${totalRaised.toLocaleString()}** (${percentageComplete.toFixed(1)}% of goal) from **${contributorCount}** contributors, with a largest contribution of **KES ${largestDonation.toLocaleString()}**. Ask me anything about trends, goal completion, or daily requirements!`;
    }

    return res.json({ reply });
  }

  try {
    const prompt = `You are HarambeeFlow AI Campaign Manager, an intelligent fundraising assistant and expert coach built into HarambeeFlow.
Your purpose is to help Kenyan churches, schools, welfare groups, chamas, and NGOs raise funds successfully.

You are acting as an expert conversational AI Fundraising Coach talking directly to the campaign treasurer.
Here is the LIVE, REAL campaign context of the active drive:
- Campaign Title: "${proj.name}"
- Category: "${proj.category}"
- Description: "${proj.description}"
- Organizer: "${proj.organizer || "Harambee Committee"}"
- Target Amount: KES ${targetAmount}
- Total Amount Raised: KES ${totalRaised}
- Remaining Balance: KES ${remainingBalance}
- Percentage Completed: ${percentageComplete.toFixed(1)}%
- Number of Contributors: ${contributorCount}
- Average Donation: KES ${averageDonation.toFixed(1)}
- Largest Donation: KES ${largestDonation}
- Days Since Last Donation: ${daysSinceLastDonation}

A user (the treasurer) has asked you this question:
"${question}"

Answer the question clearly, professionally, and directly, using ONLY the real campaign statistics listed above. NEVER invent numbers, dates, or donors. If the data to answer a specific question is not available, state that clearly but offer a helpful fundraising recommendation based on what you *do* know. Keep your response encouraging, structured, and warm (Swahili/Kenyan context is appreciated, e.g., using "Harambee", "Lipa na M-PESA", or warm Swahili proverbs where relevant, but always keep it highly professional).

Format your output using clean markdown (bolding, lists, bullet points) for maximum readability. Return a JSON object in this format:
{
  "reply": "your markdown formatted answer"
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (err) {
    console.error("AI Coach conversation error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// POST to write a summary automatically onto the whatsapp group
app.post("/api/whatsapp/post-summary", async (req, res) => {
  const { projectId, summaryText } = req.body;
  if (!projectId || !summaryText) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project not found" });
  }

  const newWa = {
    id: `wm-${Date.now()}`,
    groupName: proj.whatsappGroupName,
    message: `📊 *Fundraiser Daily Summary Update* 📊\n\n${summaryText}`,
    timestamp: new Date().toISOString(),
    isSystem: false
  };

  whatsappMessages.push(newWa);

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "whatsappMessages", newWa.id), newWa);
    } catch (err) {
      console.error("Firestore post-summary error:", err);
    }
  }

  res.json({ success: true, message: newWa });
});


// FRONTEND AND ASSETS MOUNT
async function startServer() {
  // Pre-seed and synchronize database states from Google Cloud Firestore
  await seedAndLoadDatabase();

  // Register background task delegation for verified transactions (Stripe v2 compliant)
  registerEventQueueDelegates({
    aiClean: async (name, notes) => {
      return cleanNameWithAI(name, notes);
    },
    onSuccess: async (contribution, whatsappMsg) => {
      // Save to server local caches so they show up on developer dashboard live
      contributions.push(contribution);
      const proj = projects.find(p => p.id === contribution.projectId || p.accountReference === contribution.projectId);
      if (proj) {
        proj.currentAmount += contribution.amount;
      }
      whatsappMessages.push(whatsappMsg);

      if (useFirebase && db) {
        try {
          await setDoc(doc(db, "donations", contribution.id), contribution);
          if (proj) {
            await updateFundraiserAmountInFirestore(proj);
          }
          await setDoc(doc(db, "whatsappMessages", whatsappMsg.id), whatsappMsg);

          // Update or create donor profile in Firestore
          const donorPhone = contribution.phoneNumber || contribution.senderPhone;
          if (donorPhone) {
            const donorRef = doc(db, "donors", donorPhone);
            const donorSnap = await getDoc(donorRef);
            const nowIso = new Date().toISOString();
            if (donorSnap.exists()) {
              const donorData = donorSnap.data();
              const totalAmount = Number(donorData.totalAmount || 0) + Number(contribution.amount);
              const totalContributions = Number(donorData.totalContributions || 0) + 1;
              await setDoc(donorRef, {
                ...donorData,
                lastContribution: nowIso,
                totalContributions,
                totalAmount
              }, { merge: true });
              console.log(`[EVENT ENGINE] Updated returning donor stats for ${donorPhone}`);
            } else {
              const fName = contribution.firstName || "M-PESA";
              const mName = contribution.middleName || "";
              const lName = contribution.lastName || "Customer";
              const fullName = `${fName} ${mName} ${lName}`.replace(/\s+/g, " ").trim();
              await setDoc(donorRef, {
                firstName: fName,
                middleName: mName,
                lastName: lName,
                fullName,
                phoneNumber: donorPhone,
                firstContribution: nowIso,
                lastContribution: nowIso,
                totalContributions: 1,
                totalAmount: Number(contribution.amount)
              });
              console.log(`[EVENT ENGINE] Created new donor profile for ${donorPhone}`);
            }
          }
        } catch (err) {
          console.error("Failed to persist contribution in background thread:", err);
        }
      }
      console.log(`[STRIPE V2 EVENT ENGINE] Contribution resolved and published gracefully: ${contribution.transactionCode}`);
    }
  });

  // Vite dev server middleware / production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets from the compiled production directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Single Page Application (SPA) catch-all fallback (CRITICAL)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global listen
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
  });
}

startServer();
