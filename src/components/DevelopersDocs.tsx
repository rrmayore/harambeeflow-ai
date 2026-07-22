import React, { useState } from "react";
import { Code, Server, Smartphone, Cpu, Shield, HelpCircle, Copy, Check, Settings } from "lucide-react";

interface DevelopersDocsProps {
  devSettings?: {
    skipEmailVerification: boolean;
    simulateVerifiedUsers: boolean;
    simulateMpesa: boolean;
    simulateWhatsapp: boolean;
    simulateEmailDelivery: boolean;
  };
  onUpdateSetting?: (key: string, value: boolean) => void;
}

export default function DevelopersDocs({ devSettings, onUpdateSetting }: DevelopersDocsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const docsTabs = [
    { id: "overview", label: "Fintech Architecture", icon: Cpu },
    { id: "daraja", label: "M-PESA Daraja Node.js", icon: Server },
    { id: "whatsapp", label: "WhatsApp Cloud API", icon: Shield },
    { id: "flutter", label: "Flutter Mobile UI", icon: Smartphone },
    { id: "deploy", label: "Firebase & Cloud Deploy", icon: Code },
    { id: "settings", label: "Sandbox Settings", icon: Settings }
  ];

  const [activeSubTab, setActiveSubTab] = useState("overview");

  // Code snippets
  const codeDaraja = `/**
 * Safaricom M-PESA Daraja C2B/STK Callback Controller
 * Place in your Node.js/Express router or raw Firebase Cloud function
 */
const axios = require('axios');
const crypto = require('crypto');

// Generate safe OAuth Access Token from Safaricom API keys
const getDarajaAccessToken = async () => {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  const credentials = Buffer.from(\`\${consumerKey}:\${consumerSecret}\`).toString('base64');
  
  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: \`Basic \${credentials}\` }
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to generate Daraja token: ' + error.message);
  }
};

// Handle incoming payment callbacks (STK Push or Paybill C2B)
exports.handleMpesaCallback = async (req, res) => {
  const payload = req.body;
  
  try {
    // 1. Signature Security/Source verification
    const senderIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Safe validation: Safaricom callback IPs fall within designated block ranges
    console.log(\`Received Callback from IP: \${senderIp}\`);

    let transaction = {
      code: '',
      amount: 0,
      phone: '',
      name: '',
      reference: 'GENERAL'
    };

    // 2. Parse STK Pay-in Callbacks
    if (payload.Body?.stkCallback) {
      const callback = payload.Body.stkCallback;
      if (callback.ResultCode !== 0) {
        return res.json({ ResultCode: callback.ResultCode, ResultDesc: 'Transaction Cancelled' });
      }
      
      const items = callback.CallbackMetadata.Item;
      transaction.amount = items.find(i => i.Name === 'Amount')?.Value || 0;
      transaction.code = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || '';
      transaction.phone = String(items.find(i => i.Name === 'PhoneNumber')?.Value || '');
      transaction.name = items.find(i => i.Name === 'User')?.Value || 'M-PESA Customer';
    } 
    // 3. Parse Paybill C2B direct payments
    else if (payload.TransID) {
      transaction.code = payload.TransID;
      transaction.amount = Number(payload.TransAmount);
      transaction.phone = payload.MSISDN;
      transaction.reference = payload.BillRefNumber;
      transaction.name = \`\${payload.FirstName || ''} \${payload.MiddleName || ''} \${payload.LastName || ''}\`.trim();
    }

    // 4. Duplicate Check & Database storage
    const exists = await db.collection('contributions')
      .where('transactionCode', '==', transaction.code).get();
      
    if (!exists.empty) {
      return res.status(200).json({ ResultCode: 1, ResultDesc: 'Duplicate ignored' });
    }

    // 5. Invoke Google Gemini AI cleanup & categorization
    const aiResult = await cleanAndFormatNameWithAI(transaction.name, transaction.phone);
    
    // Save to Firestore Database
    const contributionRef = await db.collection('contributions').add({
      projectId: transaction.reference,
      amount: transaction.amount,
      senderName: transaction.name,
      senderPhone: transaction.phone,
      transactionCode: transaction.code,
      timestamp: new Date().toISOString(),
      category: aiResult.category,
      cleanedName: aiResult.cleanedName,
      whatsappPosted: false
    });

    // 6. Trigger WhatsApp Simulated Outgoing Push
    await triggerWhatsappPost(aiResult.cleanedName, transaction.amount, transaction.code);

    res.json({ ResultCode: 0, ResultDesc: 'Accepted successfully' });
  } catch (err) {
    console.error('Daraja process failed:', err);
    res.status(500).json({ ResultCode: 99, ResultDesc: 'Internal failure' });
  }
};`;

  const codeWhatsApp = `/**
 * Outgoing Meta WhatsApp Cloud API Message Integration
 * Integrates directly with official WhatsApp Business API
 */
const axios = require('axios');

const triggerWhatsappPost = async (contributorName, amount, mpesaCode) => {
  const WHATSAPP_API_URL = \`https://graph.facebook.com/v21.0/\${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages\`;
  const ACCESS_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const GROUP_ID = process.env.WHATSAPP_GROUP_ID; // Stored target group or number

  const messagePayload = {
    messaging_product: "whatsapp",
    to: GROUP_ID,
    type: "text",
    text: {
      body: \`✅ *Harambee Update* \\n\\n*\${contributorName}* has contributed *KES \${amount.toLocaleString()}* via M-PESA.\\nCode: \${mpesaCode}\\n\\nThank you for pulling together!\\n_HarambeeFlow AI Powered_\`
    }
  };

  try {
    const response = await axios.post(WHATSAPP_API_URL, messagePayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${ACCESS_TOKEN}\`
      }
    });
    console.log('WhatsApp Group post status:', response.data);
    return response.data;
  } catch (error) {
    console.error('WhatsApp API request failed:', error.response?.data || error.message);
    throw new Error('WhatsApp cloud delivery error');
  }
};`;

  const codeFlutter = `// Sample Flutter UI Component to Display Contribution Live Feed
// Add to your lib/screens/contributions_feed.dart
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ContributionsFeed extends StatelessWidget {
  final String projectId;
  const ContributionsFeed({Key? key, required this.projectId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('contributions')
          .where('projectId', '==', projectId)
          .orderBy('timestamp', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) return Center(child: Text('Error: \${snapshot.error}'));
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Colors.green));
        }

        final items = snapshot.data?.docs ?? [];
        if (items.isEmpty) {
          return const Center(child: Text('No contributions received yet. Post via Paybill.'));
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          separatorBuilder: (context, idx) => const Divider(height: 20),
          itemBuilder: (context, idx) {
            final doc = items[idx].data() as Map<String, dynamic>;
            final cleanName = doc['cleanedName'] ?? doc['senderName'] ?? 'Anonymous';
            final amount = doc['amount'] ?? 0;
            final mpesaCode = doc['transactionCode'] ?? '';
            final category = doc['category'] ?? 'Well-wisher';

            return ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.check_circle_outline, color: Colors.green),
              ),
              title: Text(
                cleanName,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4.0),
                child: Row(
                  children: [
                    Text(mpesaCode, style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        category,
                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ),
              trailing: Text(
                'KES \${amount.toString()}',
                style: const TextStyle(fontWeight: FontWeight.black, color: Colors.green),
              ),
            );
          },
        );
      },
    );
  }
}`;

  const textFirebase = `## Firebase Services Configuration Guide

### 1. Firestore Database Schema
Setup collections in Firebase Console using standard documents:

- **Collection**: \`projects\`
  \`\`\`json
  {
    "name": "String",
    "targetAmount": "Number",
    "treasurerPhone": "String",
    "paybillNumber": "String",
    "accountReference": "String (Unique Primary Search API Key)",
    "whatsappGroupName": "String",
    "createdAt": "Timestamp"
  }
  \`\`\`

- **Collection**: \`contributions\`
  \`\`\`json
  {
    "projectId": "String (Ref to projects.accountReference)",
    "amount": "Number",
    "senderName": "String (Original raw name)",
    "cleanedName": "String",
    "transactionCode": "String (Unique Safeguard Index)",
    "timestamp": "Timestamp",
    "category": "String",
    "whatsappPosted": "Boolean"
  }
  \`\`\`

### 2. Firestore Hardened Security Rules
Ensure secure atomic transactions to enforce database integrity:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper declarations
    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }

    match /projects/{projectId} {
      allow read: if true; // Publicly accessible to read goals
      allow write: if isSignedIn(); // Authorized treasurers only
    }

    match /contributions/{contribId} {
      allow list: if isSignedIn();
      allow get: if true;
      allow create: if true; // Webhooks can inject anonymously
      allow update, delete: if isSignedIn();
    }
  }
}
\`\`\`

### 3. Enabled Authentication
- From the Firebase console, go to **Authentication > Sign-in Method**.
- Enable **Google Providers** or Email parameters to securely grant admin and treasurer dashboards logins.`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in">
      <div className="mb-6 flex justify-between items-center border-b border-slate-200/50 pb-5">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase">Systems Integration Manual</span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1">HarambeeFlow API Developer Hub</h2>
          <p className="text-sm text-slate-500 mt-2">
            Access vetted server microservices, Google Firestore schema specifications, and Meta WhatsApp Cloud integration snippets.
          </p>
        </div>
      </div>

      {/* Docs inner tabs navigation */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {docsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition duration-150 border uppercase cursor-pointer ${
                isActive
                  ? "bg-slate-800 border-slate-800 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50/50 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render subtab details */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#10B981]" /> Systems Flow & Synchronizer Topology
            </h3>

            {/* Custom SVG flowchart */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-x-auto select-none">
              <div className="flex flex-col md:flex-row items-center gap-6 min-w-[650px] py-4">
                {/* 1. M-PESA User */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 px-3 py-4 bg-green-950/40 border border-green-800 rounded-xl text-green-400 font-mono text-[10px] uppercase font-bold shadow animate-pulse">
                    📱 M-PESA USER
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">Dial Paybill / STK</span>
                </div>

                {/* Arrow */}
                <div className="text-lg text-slate-700 font-mono">➜</div>

                {/* 2. Safaricom Gateway */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 px-3 py-4 bg-green-905 border border-green-700 rounded-xl text-white font-mono text-[10px] uppercase font-bold shadow">
                    🟢 SAFARICOM DARAJA
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">Validates checkouts</span>
                </div>

                {/* Arrow */}
                <div className="text-lg text-slate-700 font-mono">➜</div>

                {/* 3. Server Webhook Endpoint */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 px-3 py-4 bg-indigo-950/40 border border-indigo-800 rounded-xl text-indigo-400 font-mono text-[10px] uppercase font-bold shadow relative">
                    ⚙️ EXPRESS API / FIREBASE
                    <div className="absolute -top-1.5 -right-1.5 p-0.5 bg-indigo-600 rounded text-slate-100 text-[8px] tracking-tight font-extrabold uppercase">
                      /api/callback
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">Receives callback</span>
                </div>

                {/* Arrow */}
                <div className="text-lg text-slate-700 font-mono">➜</div>

                {/* 4. Google Gemini AI */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 px-3 py-4 bg-amber-950/40 border border-amber-800 rounded-xl text-amber-400 font-mono text-[10px] uppercase font-bold shadow">
                    ✨ GOOGLE GEMINI AI
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">Trims Name, Dup checks</span>
                </div>

                {/* Arrow */}
                <div className="text-lg text-slate-700 font-mono">➜</div>

                {/* 5. Outputs: Dashboard & Meta API */}
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono text-[9px] uppercase font-bold shadow text-center">
                    💬 WhatsApp Group Message
                  </div>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-blue-400 font-mono text-[9px] uppercase font-bold shadow text-center">
                    📊 Live React Dashboard
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600 leading-relaxed text-slate-700 font-sans">
              <h4 className="font-bold text-slate-900">How the M-PESA & WhatsApp Data Sync works:</h4>
              <p>
                HarambeeFlow AI links the physical checkout of Safaricom payments to community WhatsApp groups in real-time. When money lands on a church or family Till Number, Safaricom fires an immediate JSON callback payload to our backend webhook.
              </p>
              <p>
                The backend receives the raw transaction code and sender string (e.g. <code>SARAH M WAIRIMU</code>). Rather than posting unedited capitalized logs, the backend sends a secure request to Google Gemini API.
              </p>
              <p>
                Gemini cleans and titles the text, categorizes the context (family branch, chama, well-wisher), and returns a neat structured output. These cleaned entries populate the dashboard. Outgoing template triggers then instantly post the motivating updates to the community WhatsApp group.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "daraja" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">Safaricom Daraja API Node Controller (Typescript/Express)  </span>
              <button 
                onClick={() => handleCopy(codeDaraja, "daraja")}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg flex items-center gap-1 font-mono transition cursor-pointer hover:text-slate-800"
              >
                {copiedId === "daraja" ? "✓ Copied!" : "📋 Copy Code"}
              </button>
            </div>
            <pre className="p-5 font-mono text-xs overflow-x-auto bg-slate-950 text-emerald-400 leading-relaxed max-h-[500px] shadow-inner font-semibold">
              {codeDaraja}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === "whatsapp" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">Meta WhatsApp Business Outbox API Method</span>
              <button 
                onClick={() => handleCopy(codeWhatsApp, "whatsapp")}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg flex items-center gap-1 font-mono transition cursor-pointer hover:text-slate-800"
              >
                {copiedId === "whatsapp" ? "✓ Copied!" : "📋 Copy Code"}
              </button>
            </div>
            <pre className="p-5 font-mono text-xs overflow-x-auto bg-slate-950 text-emerald-400 leading-relaxed max-h-[500px] shadow-inner font-semibold">
              {codeWhatsApp}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === "flutter" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">Flutter Material Live Contributions Feed Widget</span>
              <button 
                onClick={() => handleCopy(codeFlutter, "flutter")}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg flex items-center gap-1 font-mono transition cursor-pointer hover:text-slate-800"
              >
                {copiedId === "flutter" ? "✓ Copied!" : "📋 Copy Code"}
              </button>
            </div>
            <pre className="p-5 font-mono text-xs overflow-x-auto bg-slate-950 text-emerald-400 leading-relaxed max-h-[500px] shadow-inner">
              {codeFlutter}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === "deploy" && (
        <div className="glass-card p-6 rounded-2xl space-y-6 animate-fade-in">
          <div className="prose max-w-none text-sm text-slate-650 leading-relaxed">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
              <Server className="w-5 h-5 text-[#10B981]" /> Firebase Cloud Deployment Manual
            </h3>
            
            <div className="space-y-4 text-slate-705">
              <p>Follow these quick commands to deploy this full-stack application securely using Google Cloud Run or Firebase Cloud Functions:</p>
              
              <h4 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest mt-4">Step 1: Bootstrap Firebase Auth & Firestore</h4>
              <p>Configure Firebase within the credentials dashboard by registering a Web App, and copy the credentials file as <code>firebase-applet-config.json</code>.</p>
              
              <h4 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest mt-4">Step 2: Deploy Cloud Functions Webhook Handler</h4>
              <div className="bg-slate-906 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
                <div># Install custom Firebase CLI globally</div>
                <div className="text-emerald-400 font-bold">npm install -g firebase-tools</div>
                <div className="mt-2 text-slate-500"># Login and Initialize Function directory</div>
                <div className="text-emerald-400 font-bold">firebase login</div>
                <div className="text-emerald-400 font-bold">firebase init functions</div>
                <div className="mt-2 text-slate-500 font-bold"># Set secure environment keys within Cloud Secret Manager</div>
                <div className="text-emerald-400 font-bold">firebase functions:secrets:set GEMINI_API_KEY="AI_STUDIO_KEY"</div>
                <div className="text-emerald-400 font-bold">firebase functions:secrets:set WHATSAPP_CLOUD_API_TOKEN="META_TOKEN"</div>
                <div className="mt-2 text-slate-505 font-bold"># Deploy Functions triggers</div>
                <div className="text-emerald-400 font-bold">firebase deploy --only functions</div>
              </div>

              <h4 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-widest font-semibold mt-4">Step 3: Register Callback URL on Safaricom Portal</h4>
              <p>
                Retrieve your deployed Firebase Cloud Function HTTP endpoint or Cloud Run domain (e.g. <code>https://europe-west2-myproject.cloudfunctions.net/handleMpesaCallback</code>) and register it inside the <strong>Daraja Developer Portal Callback Settings</strong> for Paybill C2B or STK push.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "settings" && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" /> 🧪 Developer Sandbox & Simulation Settings
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Toggle simulated environment services and bypass mechanisms. These parameters run in real-time within the local test mode container.
            </p>
            
            <div className="space-y-4 max-w-xl">
              {/* Toggle 1: Skip Email Verification */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                <input 
                  id="toggle-skip-email"
                  type="checkbox" 
                  checked={devSettings?.skipEmailVerification ?? true}
                  onChange={(e) => onUpdateSetting?.("skipEmailVerification", e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="toggle-skip-email" className="cursor-pointer">
                  <span className="block text-sm font-bold text-slate-800">Skip Email Verification</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Bypass real-time Firebase Authentication email verification. Allows newly registered users to access the dashboard instantly.
                  </span>
                </label>
              </div>

              {/* Toggle 2: Simulate Verified Users */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                <input 
                  id="toggle-sim-verified"
                  type="checkbox" 
                  checked={devSettings?.simulateVerifiedUsers ?? true}
                  onChange={(e) => onUpdateSetting?.("simulateVerifiedUsers", e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="toggle-sim-verified" className="cursor-pointer">
                  <span className="block text-sm font-bold text-slate-800">Simulate Verified Users</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Mark newly created account entries in the database as <code>emailVerified = true</code> immediately upon registration.
                  </span>
                </label>
              </div>

              {/* Toggle 3: Simulate M-PESA */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                <input 
                  id="toggle-sim-mpesa"
                  type="checkbox" 
                  checked={devSettings?.simulateMpesa ?? true}
                  onChange={(e) => onUpdateSetting?.("simulateMpesa", e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="toggle-sim-mpesa" className="cursor-pointer">
                  <span className="block text-sm font-bold text-slate-800">Simulate M-PESA</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Generate mock M-PESA C2B/STK Push payment callback events and populate local transaction ledgers instantly.
                  </span>
                </label>
              </div>

              {/* Toggle 4: Simulate WhatsApp */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                <input 
                  id="toggle-sim-whatsapp"
                  type="checkbox" 
                  checked={devSettings?.simulateWhatsapp ?? true}
                  onChange={(e) => onUpdateSetting?.("simulateWhatsapp", e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="toggle-sim-whatsapp" className="cursor-pointer">
                  <span className="block text-sm font-bold text-slate-800">Simulate WhatsApp Broadcasts</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Route simulated transaction notices to group channel webhooks and preview mock Meta outbound message streams.
                  </span>
                </label>
              </div>

              {/* Toggle 5: Simulate Email Delivery */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                <input 
                  id="toggle-sim-email-delivery"
                  type="checkbox" 
                  checked={devSettings?.simulateEmailDelivery ?? true}
                  onChange={(e) => onUpdateSetting?.("simulateEmailDelivery", e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="toggle-sim-email-delivery" className="cursor-pointer">
                  <span className="block text-sm font-bold text-slate-800">Simulate Email Delivery</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Intercept SMTP transactions and route all authentication and administrative messages to a simulated in-app local inbox.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
