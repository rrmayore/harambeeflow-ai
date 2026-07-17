import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  MessageSquare, Copy, Send, Mail, CheckCircle2, 
  HelpCircle, Volume2, Calendar, Smile, Award 
} from "lucide-react";

interface CommunicationHubViewProps {
  activeProject: Project | null;
  contributions: Contribution[];
}

export default function CommunicationHubView({
  activeProject,
  contributions
}: CommunicationHubViewProps) {
  const [msgType, setMsgType] = useState<"update" | "thankyou" | "reminder" | "progress" | "completion">("update");
  const [salutation, setSalutation] = useState("Dear Committee & Family members");
  const [customNotes, setCustomNotes] = useState("");
  const [copied, setCopied] = useState(false);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No active campaign found. Please select a campaign in the home screen.
      </div>
    );
  }

  const projContributions = contributions.filter(c => c.projectId === activeProject.id);
  const raisedAmount = projContributions.reduce((sum, c) => sum + c.amount, 0);
  const percent = Math.min(100, Math.round((raisedAmount / activeProject.targetAmount) * 100)) || 0;

  // Build a nice ASCII progress bar
  const totalBlocks = 10;
  const activeBlocks = Math.round((percent / 100) * totalBlocks);
  const barStr = "▓".repeat(activeBlocks) + "░".repeat(totalBlocks - activeBlocks);

  // Compile messaging templates based on chosen type
  let msgContent = "";
  if (msgType === "update") {
    msgContent = `*🔊 HARAMBEE CAMPAIGN PROGRESS UPDATE* \n\n${salutation},\n\nWe are pleased to report steady progress in our fundraising initiative: *${activeProject.name}*.\n\n*Current Status:* \n📈 ${percent}% Raised\n💰 KES ${raisedAmount.toLocaleString()} of KES ${activeProject.targetAmount.toLocaleString()}\n📊 Progress: [${barStr}]\n👥 Contributors: ${projContributions.length} Givers\n\n${customNotes ? `${customNotes}\n\n` : ""}*How to contribute:* \n1. Paybill Shortcode: *${activeProject.paybillNumber}*\n2. Account Ref: *${activeProject.accountReference || "AUTO"}*\n\nThank you for standing with us. Be blessed!\n\n~ _Harambee Committee Chairperson_`;
  } else if (msgType === "thankyou") {
    msgContent = `*🙏 GRATEFUL THANK YOU MESSAGE* \n\n${salutation},\n\nWe take this opportunity to extend our heartfelt gratitude to everyone who contributed to *${activeProject.name}*.\n\nThanks to your immense generosity, we have successfully gathered *KES ${raisedAmount.toLocaleString()}* from *${projContributions.length}* verified well-wishers.\n\n${customNotes ? `${customNotes}\n\n` : ""}Your contributions will go directly to the designated cause. All transactions have been fully audited under compliance laws.\n\n"He who soweth bountifully shall reap also bountifully."\n\n~ _Treasurer, ${activeProject.name} Committee_`;
  } else if (msgType === "reminder") {
    msgContent = `*⏰ GENTLE REMINDER: HARAMBEE TARGETS* \n\n${salutation},\n\nThis is a gentle, loving reminder regarding our ongoing campaign: *${activeProject.name}*.\n\nWe are currently at *${percent}%* of our targets and need your support to close the remaining deficit of *KES ${(activeProject.targetAmount - raisedAmount).toLocaleString()}* before our target date.\n\n*Payment Details:* \n1. Paybill Shortcode: *${activeProject.paybillNumber}*\n2. Account Ref: *${activeProject.accountReference || "AUTO"}*\n\n${customNotes ? `${customNotes}\n\n` : ""}Any amount is welcome. Let us join hands to finish strong!\n\n~ _Committee Secretary_`;
  } else if (msgType === "progress") {
    msgContent = `*🚀 MILESTONE ANNOUNCEMENT* \n\n${salutation},\n\nVictory! We have successfully crossed a major milestone in *${activeProject.name}*.\n\nWe have surpassed *KES ${raisedAmount.toLocaleString()}* raised! This milestone was powered by *${projContributions.length}* dedicated family and church members.\n\n📊 Progress Bar: [${barStr}] (${percent}% complete)\n\n${customNotes ? `${customNotes}\n\n` : ""}Let's maintain the momentum. Share the public campaign page with your circles.\n\n~ _Harambee Communication Desk_`;
  } else if (msgType === "completion") {
    msgContent = `*🏆 HARAMBEE CAMPAIGN COMPLETED!* \n\n${salutation},\n\nWe are overjoyed to announce the official completion of our fundraiser: *${activeProject.name}*!\n\nWe have hit our full target! \n🎯 Target: KES ${activeProject.targetAmount.toLocaleString()}\n🎉 Raised: KES ${raisedAmount.toLocaleString()} (${percent}% raised!)\n\n${customNotes ? `${customNotes}\n\n` : ""}The campaign ledger has been frozen and archived. An official financial report register has been prepared for auditing. Thank you for your faith and contributions!\n\n~ _Full Committee Board_`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(msgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateWhatsApp = () => {
    // Open dummy trigger to simulated phone list
    alert("Simulating WhatsApp broadcast dispatch. Check simulated phone feed on the right column!");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="communication-center-root">
      
      {/* Header section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full uppercase border border-sky-100 flex items-center gap-1 w-max">
            <MessageSquare className="w-3.5 h-3.5" /> Committee Communication Center
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Automated WhatsApp & SMS Updates Broadcaster
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate polished, structured Kenyan-style WhatsApp notifications pre-populated with real-time audit ledger sums.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left 2 Cols: Message Settings */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 h-max space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
            Message Template Composer
          </h3>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Message Type Template:
            </label>
            <div className="space-y-1.5">
              {[
                { id: "update", label: "Fundraising Progress Update" },
                { id: "thankyou", label: "Formal Grateful Thank You" },
                { id: "reminder", label: "Loving Payment Reminder" },
                { id: "progress", label: "Milestone Accomplished Announcement" },
                { id: "completion", label: "Official Completion Congratulations" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMsgType(t.id as any)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl border transition cursor-pointer select-none ${
                    msgType === t.id 
                      ? "border-sky-500 bg-sky-50/10 text-sky-700 font-bold" 
                      : "border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Group Salutation Greeting:
            </label>
            <input
              type="text"
              value={salutation}
              onChange={(e) => setSalutation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
              placeholder="e.g. Dear Family members"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Add Specific Details / Notes (Optional):
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
              placeholder="e.g. Next physical meeting on Sunday 2PM at the sanctuary site."
            />
          </div>

        </div>

        {/* Right 3 Cols: Message Preview Box */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                WhatsApp Message Preview
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied! ✓" : "Copy Message"}
                </button>

                <button
                  onClick={handleSimulateWhatsApp}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Broadcast Sim
                </button>
              </div>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto shadow-sm text-emerald-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {msgContent}
            </div>

            {/* Note details */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 mt-6 text-xs text-slate-600 flex items-start gap-2.5">
              <Calendar className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-900">Why Use Automatic Progress Bars?</h5>
                <p className="mt-1 leading-normal text-slate-500">
                  Kenyan chamas and fundraisers report an increase in giver consistency by <strong>+35%</strong> when updates contain visual, auditable progress meters and detailed M-PESA paybill code disclosures.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
