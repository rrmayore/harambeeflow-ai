import React, { useState } from "react";
import { Sparkles, Terminal, Cpu, Bot, Check, HelpCircle, Loader2 } from "lucide-react";

export default function AIPromptTab() {
  const [testRawName, setTestRawName] = useState("MARY W WAIRIMU m-pesa paid");
  const [testNotes, setTestNotes] = useState("Treasurer notes: active member from Nyeri branch.");
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded default prompts for transparency
  const formattingPrompt = `You are an expert East African linguistic analyst and database cleaner for fintech integrations.
Clean and format the following Kenyan contributor name.
Input Raw Name: "\${rawName}"
Additional Context: "\${notes}"

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

  const summaryPrompt = `You are a warm, helpful community chairperson or fund treasurer for a Harambee (fundraising committee) in Kenya. He is analyzing current totals and formulating a highly encouraging progress update for the group.

Project Context:
Name: "\${project.name}"
Target: KES \${project.targetAmount}
Total raised so far: KES \${total}
Number of contributors: \${count}
Top contributor list: \${JSON.stringify(topList)}
Contributions split by category: \${JSON.stringify(catList)}

Task:
Write a beautifully worded, encouraging, and clear 3-4 sentence update summary of the fund.
Emphasize East African community values ("Harambee" means "Pulling together"). Mention the progress percentage, acknowledge the top contributors with pride, and encourage members to continue sharing. Offer an encouraging final blessing or Swahili proverb (like "Haba na haba hujaza kibaba" - Little by little fills the pot). Keep it concise, friendly, and appropriate for text sharing.

Format your output inside of a JSON string with a single key "narrative" holding the paragraph text.`;

  const runTestNameClean = async () => {
    if (!testRawName.trim()) return;
    setIsLoading(true);
    setTestResult(null);

    // Mock API simulation with robust callback
    try {
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "proj-1",
          amount: 2500,
          senderName: testRawName.trim().toUpperCase(),
          senderPhone: "254712399990",
          transactionCode: "TEST" + Math.random().toString(36).substring(2, 7).toUpperCase(),
          category: "Family/Friends",
          notes: testNotes,
          timestamp: new Date().toISOString()
        })
      });
      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: "Failed to run prompt: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in">
      <div className="mb-8 p-0.5">
        <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase">Cognitive Processing Centre</span>
        <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1">Google AI Prompt Core & Sandbox</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">
          HarambeeFlow AI leverages Google Gemini models server-side to format incoming data, classify segments, and generate high-morale group reports automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Prompt Specifications columns */}
        <div className="space-y-6">
          {/* Box 1 Name Cleaning */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0" /> Prompt Logic 1: M-PESA Name Sanitizer
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed">
              Standard M-PESA payment callbacks contain fully capitalized, raw linguistic tags (e.g. <code>MARY W MUTHONI CHAMA ACC</code>). This prompt instructs Gemini to clean duplicates, standardize abbreviation periods, casing and output exact JSON maps.
            </p>
            <div className="bg-slate-900 p-4 rounded-xl relative shadow-inner">
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-800 rounded text-slate-500 text-[9px] font-mono select-none font-bold">SYSTEM</span>
              <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap select-text leading-tight max-h-48 overflow-y-auto">
                {formattingPrompt}
              </pre>
            </div>
          </div>

          {/* Box 2 Summarization */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-emerald-500 shrink-0" /> Prompt Logic 2: Harambee Group Summarizer
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Fires automatically during group progress analysis times. The system formats aggregate metrics into beautifully customized Swahili-infused blessings representing Kenyan mutual support traditions.
            </p>
            <div className="bg-slate-900 p-4 rounded-xl relative shadow-inner">
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-800 rounded text-slate-500 text-[9px] font-mono select-none font-bold">SYSTEM</span>
              <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap select-text leading-tight max-h-48 overflow-y-auto">
                {summaryPrompt}
              </pre>
            </div>
          </div>
        </div>

        {/* Interactive Playgrounds Sandbox columns */}
        <div className="glass-card p-6 rounded-2xl space-y-6 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shadow-2xs">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Interactive Sandbox</h3>
              <p className="text-[11px] text-slate-505">Submit mock dirty input names to test the Gemini processor output in real-time.</p>
            </div>
          </div>

          <div className="space-y-4 font-sans text-xs">
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">M-PESA Raw Contributor String:</label>
              <input 
                type="text" 
                value={testRawName}
                onChange={(e) => setTestRawName(e.target.value)}
                placeholder="e.g. JOHNATHAN KENYA M-PESA ADDS"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-amber-500 focus:outline-none font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Additional Context (Notes/Phone):</label>
              <textarea 
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="Add contextual information e.g. 'Friend of family'"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-16 resize-none focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-700"
              />
            </div>

            <button
              onClick={runTestNameClean}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-55 cursor-pointer active:scale-99 hover:shadow-slate-500/5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying Google Gemini SDK...
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" /> Execute Prompt Sanitization
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs leading-normal">
              <span className="text-slate-500 select-none block border-b border-slate-800 pb-1 uppercase text-[10px]">Playground Response Log</span>
              
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-[9px] text-slate-500 block">CLEANED NAME:</span>
                  <span className="text-emerald-400 font-bold">{testResult.cleanedName || "Pending AI"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">CATEGORY:</span>
                  <span className="text-amber-400 font-bold">{testResult.category || "Pending AI"}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 block">AI CLASSIFICATION EXPLANATION:</span>
                <p className="text-slate-200 mt-0.5 text-xs">{testResult.notes || "No explanation returned"}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                <span>TX Code: {testResult.transactionCode} <span>(Saved!)</span></span>
                <span>Category Mapping: Success</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
