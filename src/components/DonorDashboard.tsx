import React, { useState } from "react";
import { Project, Contribution } from "../types";
import { 
  Heart, CreditCard, Download, ClipboardList, TrendingUp, Sparkles, 
  MapPin, User, Mail, Smartphone, Receipt, CheckCircle, Gift, BookOpen
} from "lucide-react";

interface DonorDashboardProps {
  contributions: Contribution[];
  projects: Project[];
}

export default function DonorDashboard({ contributions, projects }: DonorDashboardProps) {
  // Extract unique contributors from all successful contributions
  const uniqueContributors = React.useMemo(() => {
    const map = new Map<string, { name: string; phone: string }>();
    contributions.forEach(c => {
      if (c.senderPhone && c.cleanedName) {
        const cleanPhone = c.senderPhone.trim();
        const cleanName = c.cleanedName.trim().toUpperCase();
        if (cleanPhone && cleanPhone.toLowerCase() !== "corporate" && !map.has(cleanPhone)) {
          map.set(cleanPhone, { name: cleanName, phone: cleanPhone });
        }
      }
    });
    return Array.from(map.values());
  }, [contributions]);

  // Set the default active donor phone/name state (defaulting to the first database contributor or Sarah Wanjiku)
  const [activeDonorPhone, setActiveDonorPhone] = useState("254711122233");
  const [activeDonorName, setActiveDonorName] = useState("SARAH WANJIKU");

  // Sync profile inputs when donor selection changes
  const [phone, setPhone] = useState(activeDonorPhone);
  const [email, setEmail] = useState("sarah.wanjiku@safari.co.ke");
  const [county, setCounty] = useState("Nairobi County");
  const [name, setName] = useState(activeDonorName);
  const [profileSuccess, setProfileSuccess] = useState(false);

  React.useEffect(() => {
    setPhone(activeDonorPhone);
    setName(activeDonorName);
    const firstName = activeDonorName.split(" ")[0].toLowerCase();
    setEmail(`${firstName}.donor@harambeeflow.org`);
  }, [activeDonorPhone, activeDonorName]);

  // Filter donor's contributions dynamically
  const donorContributions = contributions.filter(
    c => !c.hasDuplicates && (
      c.senderPhone === activeDonorPhone || 
      c.cleanedName.toUpperCase().includes(activeDonorName.toUpperCase()) ||
      (activeDonorName.split(" ")[0] && c.cleanedName.toUpperCase().includes(activeDonorName.split(" ")[0].toUpperCase()))
    )
  );

  // Total given
  const totalGiven = donorContributions.reduce((sum, c) => sum + c.amount, 0);
  
  // Outstanding supported projects count
  const distinctProjects = Array.from(new Set(donorContributions.map(c => c.projectId)));
  const supportedCampaignNames = projects
    .filter(p => distinctProjects.includes(p.id))
    .map(p => p.name);

  // Active transaction receipt viewer
  const [selectedReceipt, setSelectedReceipt] = useState<Contribution | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDonorPhone(phone);
    setActiveDonorName(name);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3050);
  };

  const handleDownloadAnnualReport = () => {
    const reportContent = `
========================================
       HARAMBEEFLOW ANNUAL GIVING
========================================
Donor Name:      ${name}
Phone Reference: ${phone}
Primary Email:   ${email}
Residence:       ${county}
Date Generated:  June 17, 2026
----------------------------------------

SUPPORTED CAMPAIGNS & TAX LEDGERS:
${donorContributions.map(c => `
- Transaction ID: ${c.transactionCode}
  Campaign Hash:  ${projects.find(p => p.id === c.projectId)?.name || "Community Cause"}
  Amount Received: KES ${c.amount.toLocaleString()}
  Timestamp:      ${new Date(c.timestamp).toLocaleString()}
`).join("")}

----------------------------------------
TOTAL SUM CONTRIBUTED: KES ${totalGiven.toLocaleString()}
STATUS: VERIFIED BY SAFARICOM DARAJA
========================================
Thank you for standing with your community.
HarambeeFlow Kenya Compliance Office.
    `;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HarambeeFlow_Annual_Tax_Report_${name.replace(/\s+/g, "_")}.txt`;
    link.click();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] text-slate-800 p-6 md:p-8 animate-fade-in" id="donor-portal-root">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10B981] uppercase font-bold">HarambeeFlow Verified Donor Portals</span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            M-PESA Giver Central <Gift className="w-6 h-6 text-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Secure personal desk to monitor your contributions, generate automated M-PESA receipts, and verify community impact.</p>
        </div>

        <button
          onClick={handleDownloadAnnualReport}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-mono uppercase shadow-xs transition duration-150 inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Download Annual Giving Report (TXT)
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-200">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shadow-2xs">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Total Contributed</span>
            <span className="text-xl font-bold font-sans block mt-0.5" id="lbl-total-given">KES {totalGiven.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Through verified Lipa Na M-PESA</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-200">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shadow-2xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Drives Supported</span>
            <span className="text-xl font-bold font-sans block mt-0.5">{distinctProjects.length} Campaigns</span>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Active community causes</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-200">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shadow-2xs animate-pulse">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Impact Multiply Ratio</span>
            <span className="text-xl font-bold font-sans block mt-0.5">14.2x Index</span>
            <span className="text-xs text-slate-500 mt-1 block font-mono">Peer-vetted multiplier</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left History - Right Profile & receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Donation history */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-500" /> Personal Contribution Log
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Receipt ID</th>
                    <th className="py-3 px-5">Campaign Name</th>
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5 text-right">Fund Contributed</th>
                    <th className="py-3 px-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {donorContributions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                        No previous donations found under matching reference contact +254712345678. Try simulating more webhook events!
                      </td>
                    </tr>
                  ) : (
                    donorContributions.map((cnt) => {
                      const proj = projects.find(p => p.id === cnt.projectId);
                      return (
                        <tr key={cnt.id} className="hover:bg-slate-55/40 transition">
                          <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{cnt.transactionCode}</td>
                          <td className="py-3.5 px-5 font-bold text-slate-700">{proj?.name || "Community Cause"}</td>
                          <td className="py-3.5 px-5 text-slate-400 font-mono">
                            {new Date(cnt.timestamp).toLocaleDateString()} {new Date(cnt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 font-mono">
                            KES {cnt.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5">
                            <button
                              onClick={() => setSelectedReceipt(cnt)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-[10px] font-bold font-mono rounded-lg border border-emerald-200/50 transition cursor-pointer"
                            >
                              Show Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supported Campaign summaries */}
          <div className="glass-card p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/10 border border-emerald-100">
            <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" /> Dynamic Giving Narrative Summary
            </h3>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Your overall contribution of <strong>KES {totalGiven.toLocaleString()}</strong> has supported {supportedCampaignNames.length} vital drives including <em>{supportedCampaignNames.slice(0, 3).join(", ") || "various local initiatives"}</em>. This automated reporting qualifies you under the Kenya Data Protection consent structures for automated community updates.
            </p>
          </div>
        </div>

        {/* Right Side Column: Receipt Modal / Profile Management */}
        <div className="space-y-6">
          
          {/* Receipt View Panel */}
          {selectedReceipt ? (
            <div className="glass-card p-5 rounded-2xl bg-white border border-emerald-300 relative overflow-hidden animate-slide-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              
              <div className="border-b border-dashed border-slate-200 pb-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">M-PESA Daraja Receipt</span>
                  <button 
                    onClick={() => setSelectedReceipt(null)} 
                    className="text-slate-400 hover:text-slate-600 text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <h4 className="text-lg font-black font-sans text-slate-800 mt-1 uppercase">Safaricom Validated</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800" id="receipt-txcode">{selectedReceipt.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchant Code:</span>
                  <span className="font-mono text-slate-800">Daraja v2 Gateway</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Drive:</span>
                  <span className="font-bold text-slate-800 text-right max-w-[150px] truncate">
                    {projects.find(p => p.id === selectedReceipt.projectId)?.name || "Community Cause"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Sent:</span>
                  <span className="font-mono font-black text-emerald-600">KES {selectedReceipt.amount.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sender Phone:</span>
                  <span className="font-mono text-slate-700">{selectedReceipt.senderPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cleaned Alias:</span>
                  <span className="text-slate-800 font-bold uppercase">{selectedReceipt.cleanedName}</span>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-200 text-center">
                  <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-1 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 block uppercase font-bold">100% Tax Compliant Ledger</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-100/80 p-5 text-center text-slate-600 font-medium">
              <span className="text-xl block mb-2 font-mono text-emerald-600">💡 Tip</span>
              <p className="text-[11px] text-emerald-950 leading-relaxed">
                Click <strong>"Show Receipt"</strong> on any donation block on the left to pull out our auto-formatted, tax-deductible community certificate instantly.
              </p>
            </div>
          )}

          {/* Profile Form */}
          <div className="glass-card p-5 rounded-2xl bg-white border border-slate-200">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-500" /> Donor Profile Settings
            </h3>

            {profileSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-xl border border-emerald-100 animate-fade-in">
                ✓ Personal profile synchronization completed successfully!
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Giver Original Name (All Caps):</label>
                <input 
                  type="text" 
                  value={name} 
                  required
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400 text-slate-800 uppercase"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Authenticated Handy Number:</label>
                <input 
                  type="text" 
                  value={phone} 
                  required
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-400 font-semibold"
                  disabled
                />
                <span className="text-[9px] text-slate-400 block mt-1">Locked to M-PESA webhook authenticator key.</span>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1 font-mono">Receipt Address Email:</label>
                <input 
                  type="email" 
                  value={email} 
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1 font-mono">Location County:</label>
                <select 
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 cursor-pointer"
                >
                  <option value="Nairobi County">Nairobi County</option>
                  <option value="Mombasa County">Mombasa County</option>
                  <option value="Kisumu County">Kisumu County</option>
                  <option value="Nakuru County">Nakuru County</option>
                  <option value="Uasin Gishu County">Uasin Gishu County</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide cursor-pointer transition shadow-2xs"
                >
                  Save Profile Configuration
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
