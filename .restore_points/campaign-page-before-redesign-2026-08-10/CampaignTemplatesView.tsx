import React, { useState } from "react";
import { Project } from "../types";
import { 
  Sparkles, Landmark, MessageSquare, ShieldCheck, 
  Coins, Plus, CheckCircle2, ChevronRight, HelpCircle 
} from "lucide-react";

interface CampaignTemplatesViewProps {
  onAddProject: (newProj: any) => Promise<any>;
  onComplete: () => void;
}

interface Template {
  id: string;
  name: string;
  category: string;
  suggestedGoal: number;
  description: string;
  messaging: string;
  reportingStructure: string;
  mpesaShortcode: string;
  accountRef: string;
}

export default function CampaignTemplatesView({
  onAddProject,
  onComplete
}: CampaignTemplatesViewProps) {
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const templates: Template[] = [
    {
      id: "t1",
      name: "Church Building Project",
      category: "Community/Church",
      suggestedGoal: 1000000,
      description: "Raising funds to expand the sanctuary, purchase construction materials, and lay structural pillars for our local fellowship building expansion.",
      messaging: "Shalom family! We welcome you to back our local Church Building expansion. Help us purchase bricks, cement, and structural components.",
      reportingStructure: "Weekly detailed PDF audits to committee, daily WhatsApp ledger snapshots",
      mpesaShortcode: "222111",
      accountRef: "BUILD"
    },
    {
      id: "t2",
      name: "Pathfinder Camporee Fund",
      category: "Community/Church",
      suggestedGoal: 150000,
      description: "Supporting our youth to travel, register, and acquire uniforms & camping gear for the regional Pathfinder camporee convention.",
      messaging: "Dear church members! Let's support our pathfinders and youth to attend the annual camporee. KES 1,500 sponsors one child's tent and registration.",
      reportingStructure: "Bi-weekly progress summaries on Sundays, direct parent disclosures",
      mpesaShortcode: "222333",
      accountRef: "CAMPOREE"
    },
    {
      id: "t3",
      name: "Church Evangelism Campaign",
      category: "Community/Church",
      suggestedGoal: 300000,
      description: "Funding logistics, sound systems, tents, and transport for our upcoming outreach evangelism crusades and community welfare missions.",
      messaging: "Be part of our outreach missions. Support our Evangelism Campaign to provide tents, community feeding, and educational material.",
      reportingStructure: "Daily audit of crusades expenses matched with ledger",
      mpesaShortcode: "222444",
      accountRef: "EVANGELISM"
    },
    {
      id: "t4",
      name: "Medical Appeal Drive",
      category: "Medical/Family",
      suggestedGoal: 500000,
      description: "Urgent emergency medical response fundraiser to settle hospital bills, surgical operations, and post-treatment pharmaceutical requirements.",
      messaging: "Urgent Medical Appeal: Our brother/sister is hospitalized and needs emergency medical support. Help us offset the accrued bills.",
      reportingStructure: "Real-time ledger updates, 100% transparent live public board for family confidence",
      mpesaShortcode: "333111",
      accountRef: "MEDICAL"
    },
    {
      id: "t5",
      name: "Funeral Support Drive",
      category: "Medical/Family",
      suggestedGoal: 250000,
      description: "Pooling funds to support our family in meeting bereavement costs, casket acquisitions, transport logistics, and final funeral expenses.",
      messaging: "During this heavy bereavement, let us stand with our beloved family to offer comfort and offset the logistics & funeral expenses.",
      reportingStructure: "Post-closure permanent registers delivered directly to next of kin",
      mpesaShortcode: "333222",
      accountRef: "FAREWELL"
    },
    {
      id: "t6",
      name: "School Fees Appeal",
      category: "Education/Chama",
      suggestedGoal: 100000,
      description: "Raising tuition fees and material support to enable our bright and deserving children to complete their secondary and tertiary education.",
      messaging: "Invest in our children's future. Join us in raising school fees to clear tuition and ensure our children stay in school.",
      reportingStructure: "Direct school-bursar verified statements, quarterly committee disclosures",
      mpesaShortcode: "444111",
      accountRef: "FEES"
    },
    {
      id: "t7",
      name: "Family Harambee Support",
      category: "General/Harambee",
      suggestedGoal: 200000,
      description: "Gathering direct support, welfare pools, and social resources to help family members build projects or overcome seasonal milestones.",
      messaging: "Family is our foundation. Support our collective family milestone harambee drive to accomplish our target objectives.",
      reportingStructure: "Weekly WhatsApp digest, direct chat reconciliations",
      mpesaShortcode: "555111",
      accountRef: "FAMILY"
    },
    {
      id: "t8",
      name: "Chama Monthly Collection",
      category: "Education/Chama",
      suggestedGoal: 80000,
      description: "Standard monthly savings, welfare pools, merry-go-round matching funds, and investment capital pools for our chama members.",
      messaging: "Chama Members! It's time for our monthly collections and merry-go-round contribution. Let's send to our secure paybill code.",
      reportingStructure: "Instant real-time ledger verification, automatic member ledger logs",
      mpesaShortcode: "444222",
      accountRef: "CHAMA"
    },
    {
      id: "t9",
      name: "Welfare Emergency Fund",
      category: "General/Harambee",
      suggestedGoal: 150000,
      description: "Disaster management, seasonal support, emergency response, and community welfare funds matching for chama and workmate groups.",
      messaging: "Stand with our friends in times of emergency. Contribute to our group's Welfare Emergency Fund to help members during unexpected crises.",
      reportingStructure: "Immediate board oversight, monthly detailed balance sheets",
      mpesaShortcode: "555222",
      accountRef: "WELFARE"
    },
    {
      id: "t10",
      name: "Alumni Project Fundraiser",
      category: "Education/Chama",
      suggestedGoal: 400000,
      description: "Alumni pooling to construct science labs, deliver computer stations, award student scholarships, and support high-school infrastructure.",
      messaging: "Calling all Class Alumni! Help us build the modern science block / award brilliant scholarships. Together we give back to our school.",
      reportingStructure: "Detailed quarterly audits compiled with project progress registers",
      mpesaShortcode: "444333",
      accountRef: "ALUMNI"
    }
  ];

  const handleInstantlyLaunch = async (temp: Template) => {
    setLoadingTemplateId(temp.id);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const payload = {
        name: temp.name,
        targetAmount: temp.suggestedGoal,
        description: temp.description,
        category: temp.category,
        paybillNumber: temp.mpesaShortcode,
        accountReference: temp.accountRef + "-" + Math.floor(100 + Math.random() * 900),
        treasurerPhone: "254712345678",
        whatsappGroupName: `${temp.name} WhatsApp Group`
      };
      
      const res = await onAddProject(payload);
      if (res?.success) {
        setSuccessMsg(`Launched! '${temp.name}' is now live with Paybill ${temp.mpesaShortcode}.`);
        setTimeout(() => {
          onComplete(); // back to overview
        }, 1500);
      } else {
        throw new Error("Creation returned unsuccessful state");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not launch fundraiser. Try again.");
    } finally {
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans" id="campaign-templates-root">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase border border-indigo-100 flex items-center gap-1 w-max">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> Fundraiser Template Library
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-2 tracking-tight">
            Launch Professional Campaigns Under 60 Seconds
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose from 10 industry-standard configurations pre-populated with optimal targets, stories, and reporting structures.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl mb-6 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl mb-6 flex items-center gap-2 animate-fade-in">
          <span className="text-rose-600 font-bold">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of 10 templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((temp) => (
          <div 
            key={temp.id} 
            className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                    SECTOR: {temp.category}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-0.5 group-hover:text-indigo-600 transition">
                    {temp.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Suggested Target</span>
                  <span className="text-sm font-mono font-black text-emerald-600 whitespace-nowrap">
                    KES {temp.suggestedGoal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed mt-4">
                {temp.description}
              </p>

              {/* Messaging preview */}
              <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-150">
                <span className="text-[8px] font-mono font-bold uppercase text-slate-400 block mb-1">
                  PRECONF PRE-POPULATED MESSAGE:
                </span>
                <p className="text-[11px] text-slate-600 italic line-clamp-2">
                  "{temp.messaging}"
                </p>
              </div>

              {/* Reporting structure */}
              <div className="mt-4 flex items-start gap-2 text-xs">
                <span className="text-indigo-600 font-mono font-bold uppercase text-[9px] mt-0.5 shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                  REPORTING:
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {temp.reportingStructure}
                </p>
              </div>
            </div>

            {/* Launch button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] font-mono text-slate-400">
                Code Ref: {temp.accountRef}-XXX
              </div>

              <button
                onClick={() => handleInstantlyLaunch(temp)}
                disabled={!!loadingTemplateId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {loadingTemplateId === temp.id ? (
                  <>Launching...</>
                ) : (
                  <>
                    Launch Instantly <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
