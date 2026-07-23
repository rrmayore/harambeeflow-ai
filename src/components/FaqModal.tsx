import React, { useState } from "react";
import { 
  X, Search, HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, 
  Smartphone, FileText, Users, CreditCard, ShieldCheck, CheckCircle2 
} from "lucide-react";

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  id: string;
  category: "Fundraising" | "Payments" | "Reports" | "Account" | "Security";
  question: string;
  answer: string;
  icon: any;
}

export default function FaqModal({ isOpen, onClose }: FaqModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>("faq-1");

  if (!isOpen) return null;

  const faqData: FaqItem[] = [
    {
      id: "faq-1",
      category: "Fundraising",
      question: "How do I create my first fundraiser?",
      answer: "Navigate to the Campaigns tab in your top menu and click the 'New Campaign' button. Our step-by-step registration wizard will prompt you to enter your campaign title, sector (e.g. Church, Medical, School, Welfare), target goal amount in KES, deadline, and committee members. Once submitted, your campaign becomes instantly active and shareable.",
      icon: Sparkles
    },
    {
      id: "faq-2",
      category: "Payments",
      question: "How do contributors pay using M-PESA?",
      answer: "Well-wishers visit your public campaign link or scan your printed QR code, enter their phone number and pledge amount, and click 'Contribute via M-PESA'. HarambeeFlow triggers an instant Safaricom M-PESA STK Push prompt directly to their phone screen. Upon entering their PIN, the contribution is instantly verified, allocated to your campaign ledger, and issued an automated PDF receipt.",
      icon: Smartphone
    },
    {
      id: "faq-3",
      category: "Reports",
      question: "How do I generate reports?",
      answer: "Go to the Reports tab in the top navigation. You can view executive ledger summaries, active collection percentages, and contribution breakdowns. Click 'Export CSV' for raw spreadsheet data or 'Download Audit Certificate' to generate a verified, printable PDF financial report for your committee meetings and audit reviews.",
      icon: FileText
    },
    {
      id: "faq-4",
      category: "Account",
      question: "How do I invite committee members?",
      answer: "Navigate to Settings > Organization or Campaign Management and locate the Committee Members panel. Click 'Add Committee Member', enter their name, phone number, and designated role (such as Treasurer, Secretary, Chairperson, or Patron). Once saved, they can access campaign audit logs and monitor real-time contributions.",
      icon: Users
    },
    {
      id: "faq-5",
      category: "Account",
      question: "How do I upgrade my subscription?",
      answer: "Open Settings > Billing & Subscription. Here you can inspect your current Community Edition quota and compare subscription tiers (Community, Professional, or Enterprise). Select your preferred billing cycle (Monthly or Annual with 20% savings) and click 'Upgrade to Professional'. Billing is handled seamlessly via automated M-PESA STK settlements.",
      icon: CreditCard
    },
    {
      id: "faq-6",
      category: "Security",
      question: "Is HarambeeFlow secure?",
      answer: "Yes! HarambeeFlow utilizes bank-grade SSL encryption, secure Firebase Authentication, encrypted payment callback processing, and CBK fintech data protection standards. All financial transactions are cryptographically logged in an immutable audit ledger to guarantee complete transparency and eliminate unauthorized tampering.",
      icon: ShieldCheck
    },
    {
      id: "faq-7",
      category: "Payments",
      question: "When will Live Daraja payments be available?",
      answer: "Live Safaricom Daraja M-PESA STK Push integration is fully active in sandbox testing and rolling out for production Paybill and Till numbers across all eligible Kenyan churches, schools, and welfare groups. You can toggle sandbox developer simulation mode in Settings at any time to dry-run M-PESA callbacks.",
      icon: CheckCircle2
    }
  ];

  const categories = ["All", "Fundraising", "Payments", "Reports", "Account", "Security"];

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-6 relative shadow-2xl animate-scale-up space-y-6 max-h-[90vh] flex flex-col"
        id="faq-modal-container"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HelpCircle className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/40 uppercase tracking-wider">
                Knowledge Base & Help
              </span>
              <h2 className="text-xl font-black text-white" id="faq-modal-title">
                Frequently Asked Questions
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            id="btn-close-faq-modal-x"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Box */}
        <div className="space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords (e.g. M-PESA, reports, upgrade)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
              id="faq-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1" id="faq-category-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1" id="faq-accordion-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              const FaqIcon = faq.icon;

              return (
                <div 
                  key={faq.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? "bg-slate-950/90 border-indigo-500/40 shadow-lg shadow-indigo-950/20" 
                      : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                    id={`btn-faq-accordion-${faq.id}`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isExpanded 
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                          : "bg-slate-900 text-slate-400 border border-slate-800"
                      }`}>
                        <FaqIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.2 text-[9px] font-bold font-mono bg-slate-800 text-slate-300 rounded uppercase">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <div className="p-1 text-slate-400 hover:text-white shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed animate-scale-up font-sans pl-13">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                No questions found matching "<strong className="text-slate-200">{searchQuery}</strong>".
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs shrink-0">
          <p className="text-[11px] text-slate-400">
            Need further help? Contact <strong className="text-emerald-400 font-mono">support@harambeeflow.org</strong>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
            id="btn-close-faq-modal-footer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
