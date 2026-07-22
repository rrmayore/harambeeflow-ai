import React, { useState, useEffect, useRef } from "react";
import { WhatsAppMessage, Project } from "../types";
import { Send, Smartphone, MessageSquare, Trash2, ShieldAlert, Download } from "lucide-react";

interface SimulatedPhoneProps {
  activeProject: Project;
  whatsappMessages: WhatsAppMessage[];
  onAddSimulatedMessage: (messageText: string) => void;
  onClearMessages: () => void;
  onInstall: () => void;
  isInstallable: boolean;
}

export default function SimulatedPhone({
  activeProject,
  whatsappMessages,
  onAddSimulatedMessage,
  onClearMessages,
  onInstall,
  isInstallable
}: SimulatedPhoneProps) {
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter messages that belong to this project group
  const projectMessages = whatsappMessages.filter(
    (m) => m.groupName === activeProject.whatsappGroupName || m.isSystem
  );

  // Auto-scroll to bottom of chats when new message is posted
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [whatsappMessages]);

  const handleSubmitMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onAddSimulatedMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="w-full lg:w-96 shrink-0 flex flex-col items-center animate-fade-in select-none">
      <div className="w-full flex items-center justify-between px-3 border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-mono font-bold uppercase">WhatsApp Cloud Simulator</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onInstall}
            className="text-emerald-600 hover:text-emerald-750 hover:bg-emerald-50 px-2 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer"
            title="Install Web App on your Device"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
          
          <button 
            onClick={onClearMessages}
            className="text-slate-400 hover:text-red-500 text-xs font-mono font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Clear Simulator Feeds"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Feed
          </button>
        </div>
      </div>

      {/* Styled Smartphone skin */}
      <div className="w-full max-w-[340px] aspect-[9/19] bg-slate-950 border-[6px] border-slate-800 rounded-[3rem] shadow-xl overflow-hidden flex flex-col relative justify-between">
        
        {/* Notch and Screen top elements */}
        <div className="bg-slate-800 w-28 h-4 rounded-b-xl absolute left-1/2 -translate-x-1/2 z-30" />
        
        {/* Phone Info-Bar */}
        <div className="bg-emerald-800 text-[10px] text-white pt-5 pb-1 px-5 flex justify-between items-center shrink-0 font-sans z-10 font-bold select-none">
          <span>HarambeeFlow AI</span>
          <div className="flex items-center gap-1">
            <span>90%</span>
            <div className="w-4 h-2 bg-slate-300 rounded-xs border border-white" />
          </div>
        </div>

        {/* Whatsapp Group Header Details */}
        <div className="bg-emerald-700 text-white p-3.5 pt-2 flex items-center gap-3 shrink-0 select-none shadow">
          {/* Group Avatar */}
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm">
            HF
          </div>
          <div className="flex-1 truncate">
            <h4 className="text-xs font-bold leading-tight truncate">{activeProject.whatsappGroupName}</h4>
            <span className="text-[10px] text-emerald-250 italic">HarambeeFlow Bot online</span>
          </div>
        </div>

        {/* Chat message Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100 relative"
          style={{ backgroundImage: "radial-gradient(#ddd 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        >
          <div className="bg-indigo-50 border border-indigo-200/50 rounded-xl p-3 text-[10px] text-indigo-800 flex items-start gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Meta API Integration</strong>: Simulated cloud webhook posts transaction updates synchronously to WhatsApp groups in real-time.
            </span>
          </div>

          {projectMessages.map((msg) => {
            const isTreasurer = !msg.isSystem && !msg.message.startsWith("✅") && !msg.message.startsWith("📊");
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${
                  msg.isSystem ? "mx-auto bg-slate-205/80 text-slate-500 text-[10px] px-3 py-1 rounded-md text-center max-w-[90%] border border-slate-300/30" :
                  isTreasurer ? "ml-auto bg-emerald-100 text-slate-900 rounded-l-xl rounded-br-xl rounded-tr-none px-3 py-2 text-xs shadow-xs border border-emerald-200/10" :
                  "mr-auto bg-white text-slate-900 rounded-r-xl rounded-bl-xl rounded-tl-none px-3 py-2 text-xs shadow-xs border border-slate-250/30"
                }`}
              >
                {!msg.isSystem && (
                  <span className={`text-[9px] font-bold block mb-0.5 leading-none ${
                    isTreasurer ? "text-emerald-700 text-right" : "text-emerald-600"
                  }`}>
                    {isTreasurer ? "Treasurer (ME)" : "HarambeeFlow AI Bot"}
                  </span>
                )}
                
                {/* Parse Markdown-style bold e.g. *Sarah* -> strong */}
                <p className="whitespace-pre-line leading-relaxed">
                  {msg.isSystem ? msg.message : msg.message.split("*").map((part, index) => 
                    index % 2 === 1 ? <strong key={index} className="font-bold text-slate-950">{part}</strong> : part
                  )}
                </p>
                
                {!msg.isSystem && (
                  <span className={`text-[8px] text-slate-400 block mt-1 font-mono leading-none ${
                    isTreasurer ? "text-right" : ""
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* SMS/WhatsApp Input Send Field */}
        <form onSubmit={handleSubmitMsg} className="p-2.5 bg-slate-150 border-t border-slate-200 flex gap-2 items-center shrink-0">
          <input 
            type="text"
            placeholder="Type as member..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-white text-slate-800 border border-slate-250 rounded-full px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button 
            type="submit"
            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition transform hover:scale-105 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
      <p className="text-[11px] text-slate-400 text-center font-mono mt-2 leading-tight">
        Simulated physical smartphone layout.
      </p>
    </div>
  );
}
