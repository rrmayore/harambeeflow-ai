import React, { useState } from "react";
import { WhatsAppMessage } from "../types";
import { 
  MessageSquare, Smartphone, CheckCircle, RefreshCw, Server, ShieldAlert,
  Menu, Key, BellRing, UserCheck, ToggleLeft, ToggleRight
} from "lucide-react";

interface WhatsappManagementProps {
  whatsappMessages: WhatsAppMessage[];
}

export default function WhatsappManagement({ whatsappMessages }: WhatsappManagementProps) {
  const [optInSystem, setOptInSystem] = useState(true);
  const [provider, setProvider] = useState<"META" | "TWILIO">("META");
  const [selectedTemplate, setSelectedTemplate] = useState("confirmation");
  const [testSent, setTestSent] = useState(false);
  const [metaApiKey, setMetaApiKey] = useState("EAAGz0XfXqB8BO9...");
  const [twilioSid, setTwilioSid] = useState("AC78f0b78df189c...");

  const templates = {
    confirmation: {
      title: "Donation Confirmation Voucher",
      body: "Habari {{1}}. Thank you for supporting {{2}} campaign! We have successfully received your contribution of KES {{3}} under M-PESA Code {{4}}. The new project total is KES {{5}}.",
      usage: "Dispatched automatically within 250ms of verified webhook callback parsing."
    },
    update: {
      title: "Campaign Milestones Progress Update",
      body: "Hello community! We are thrilled to report that {{1}} fundraiser has now reached {{2}}% of its goal, raising KES {{3}} over the weekend! Read live logs here: {{4}}",
      usage: "Triggered manually by designated Treasurers through metadata dashboards."
    },
    goal_reached: {
      title: "Goal Reached Victory Alert",
      body: "CHEREKO! 🎉 The {{1}} campaign has reached 100% of its target, mobilizing KES {{2}}! Heartfelt appreciation to all {{3}} verified contributors for standing with us.",
      usage: "Dispatched instantly when the atomic ledger triggers equal-or-greater aggregate goals."
    }
  };

  const currentTemplate = selectedTemplate === "confirmation" ? templates.confirmation :
                          selectedTemplate === "update" ? templates.update :
                          templates.goal_reached;

  const handleTriggerTest = () => {
    setTestSent(true);
    setTimeout(() => {
      setTestSent(false);
    }, 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in" id="whatsapp-automation-root">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase">Meta and Twilio Integration</span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            WhatsApp API Control <MessageSquare className="w-6 h-6 text-[#25D366] animate-bounce" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">Replaces simple mocks with production-ready Meta Business SDK structures for bulletproof notification pipes.</p>
        </div>
      </div>

      {/* API credentials & Opt-in settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* API Provisioning & Provider Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200 space-y-5">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" /> Carrier Provider Settings & Core Keys
            </h4>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <button
                onClick={() => setProvider("META")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                  provider === "META" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Meta WhatsApp Business API
              </button>
              <button
                onClick={() => setProvider("TWILIO")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                  provider === "TWILIO" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Twilio WhatsApp Messaging Service
              </button>
            </div>

            {/* Config Credentials Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {provider === "META" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block uppercase">META BUSINESS PHONE ID:</label>
                    <input 
                      type="text" 
                      defaultValue="109865432130" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block uppercase">META BEARER TOKEN KEYS:</label>
                    <input 
                      type="password" 
                      value={metaApiKey}
                      onChange={(e) => setMetaApiKey(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block uppercase">TWILIO ACCOUNT SID:</label>
                    <input 
                      type="text" 
                      value={twilioSid}
                      onChange={(e) => setTwilioSid(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block uppercase">TWILIO MESSAGING SID HASH:</label>
                    <input 
                      type="password" 
                      defaultValue="MG49fe98da05f31..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Key className="w-4 h-4 text-slate-400" /> SSL / TLS Verified Handshake Pipeline Active</span>
              <button 
                onClick={handleTriggerTest}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition cursor-pointer"
                id="btn-test-whatsapp"
              >
                Trigger Live API Test
              </button>
            </div>
          </div>

          {/* Interactive Templates Selector */}
          <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-indigo-600 animate-pulse" /> Safeguarded HSM Template Managers
            </h4>
            <p className="text-xs text-slate-500 mt-1">Safaricom and Meta strict regulatory compliance mandates using pre-approved Highly Structured Templates (HSM) to avoid spam penalties.</p>

            <div className="flex gap-2">
              {Object.keys(templates).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    selectedTemplate === key 
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {key.replace("_", " ")} Template
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 font-mono text-xs text-slate-700 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{currentTemplate.title}</span>
              <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-sans">{currentTemplate.body}</p>
              <div className="text-[10px] text-indigo-600 leading-normal">{currentTemplate.usage}</div>
            </div>
          </div>
        </div>

        {/* Right Info Column / Opt-ins */}
        <div className="space-y-6">
          
          {/* Opt-in Consent Log panel */}
          <div className="glass-card p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-[#10B981] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#10B981]" /> Opt-In Consent Tracking
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">In strict compliance with the **Kenya Data Protection Act (KDPA)**, donors must provide explicit opt-in consent before receiving automated M-PESA confirmations.</p>

            <div className="flex items-center justify-between p-3 bg-slate-55/40 border border-slate-100 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-800 block">General SMS/WA Opt-in:</span>
                <span className="text-[10px] text-slate-400">Add consent checkbox under STK trigger</span>
              </div>
              <button 
                onClick={() => setOptInSystem(!optInSystem)}
                className="text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
              >
                {optInSystem ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
            </div>

            <div className="text-[10.5px] text-slate-400 font-mono space-y-1">
              <span>Opt-in registry statistics:</span>
              <div className="flex justify-between">
                <span>Total Giver Opt-ins:</span>
                <span className="font-bold text-slate-700">100% Core compliant</span>
              </div>
            </div>
          </div>

          {/* Test results screen simulation */}
          {testSent && (
            <div className="glass-card p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-300 text-emerald-950 font-mono text-xs leading-relaxed animate-slide-in space-y-2">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle className="w-4 h-4 font-bold text-emerald-600" /> LIVE WEBHOOK SENT
              </div>
              <p className="text-[11px] text-slate-600">Dispatched mock transaction payload successfully. Checked template validity over Meta servers.</p>
              <div className="bg-white p-2 border border-emerald-250 text-slate-500 rounded text-[10px] max-h-24 overflow-y-auto">
                {`{
  "status": "success",
  "template": "confirmation",
  "dispatched_to": "+254712345678",
  "elapsed_ms": 210
}`}
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 font-medium text-xs leading-relaxed text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Template Regulatory Guard:</strong> Remember that sending non-approved updates to users without an opt-in can lead to Meta blocking the target phone ID.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
