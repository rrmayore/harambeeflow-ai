import React, { useState } from "react";
import { Project } from "../types";
import { 
  Sparkles, CheckCircle2, Coins, ArrowRight, ArrowLeft, 
  Settings, MessageSquare, Users, ShieldCheck, Landmark, 
  Smartphone, FileText, Check, Plus, Trash2, Loader2, Play, AlertTriangle,
  Camera, Upload, Image as ImageIcon, HeartPulse, Flame, GraduationCap, Gift, Tent, Globe
} from "lucide-react";
import { compressImageFile, getBrandingForCategory, CAMPAIGN_THEMES } from "../utils/branding";

interface TreasurerOnboardingWizardProps {
  onAddProject: (newProj: any) => Promise<any>;
  onComplete: () => void;
}

export default function TreasurerOnboardingWizard({
  onAddProject,
  onComplete
}: TreasurerOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Create Fundraiser
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Community/Church");
  const [paybill, setPaybill] = useState("222111");
  const [accountRef, setAccountRef] = useState("");

  // Step 2: Campaign Identity & Branding
  const [organizer, setOrganizer] = useState("");
  const [themeColor, setThemeColor] = useState("Blue");
  const [motto, setMotto] = useState("");
  const [campaignImage, setCampaignImage] = useState("");
  const [campaignLogo, setCampaignLogo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Step 3: Choose Tracking Method
  const [trackingMethod, setTrackingMethod] = useState<"live_daraja" | "statement_import" | "manual_entry">("live_daraja");

  // Step 4: Configure WhatsApp updates
  const [whatsappGroup, setWhatsappGroup] = useState("");
  const [postInstantReceipt, setPostInstantReceipt] = useState(true);
  const [postWeeklyDigest, setPostWeeklyDigest] = useState(true);

  // Step 5: Invite Committee Members
  const [committee, setCommittee] = useState<Array<{ name: string; role: string; phone: string }>>([
    { name: "Sarah Wanjiku", role: "Treasurer", phone: "254711223344" }
  ]);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("Assistant Treasurer");
  const [memberPhone, setMemberPhone] = useState("");

  const handleAddMember = () => {
    if (!memberName || !memberPhone) return;
    setCommittee([...committee, { name: memberName, role: memberRole, phone: memberPhone }]);
    setMemberName("");
    setMemberPhone("");
  };

  const handleRemoveMember = (idx: number) => {
    setCommittee(committee.filter((_, i) => i !== idx));
  };

  const handleLaunchCampaign = async () => {
    if (!name || !target || !description) {
      setErrorMsg("Please complete Step 1 with campaign name, goal target, and purpose.");
      setStep(1);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const generatedRef = accountRef.trim() || name.substring(0, 7).toUpperCase().replace(/\s/g, "");
      const newProjPayload = {
        name: name.trim(),
        targetAmount: Number(target),
        description: description.trim(),
        category: category,
        paybillNumber: paybill.trim(),
        accountReference: generatedRef,
        treasurerPhone: committee[0]?.phone || "254712345678",
        whatsappGroupName: whatsappGroup.trim() || `${name.trim()} Group`,
        trackingMethod: trackingMethod,
        healthScore: 100,
        organizer: organizer.trim() || "Harambee Committee",
        themeColor: themeColor,
        motto: motto.trim(),
        campaignImage: campaignImage,
        campaignLogo: campaignLogo,
        campaignCategory: category
      };

      await onAddProject(newProjPayload);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to launch campaign. Permissions error.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!name || !target || !description) {
        setErrorMsg("Please fill out all required fundraiser fields.");
        return;
      }
      // Populate defaults for Organizer and Motto if not set yet
      if (!organizer) {
        setOrganizer(`${name} Committee`);
      }
      const branding = getBrandingForCategory(category);
      if (!motto) {
        setMotto(branding.motto);
      }
    }
    if (step === 2) {
      if (!organizer.trim()) {
        setErrorMsg("Please enter an Organizer or Committee name to represent this campaign.");
        return;
      }
    }
    setStep(prev => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-3xl mx-auto overflow-hidden">
      
      {/* Top Wizard Steps Status Banner */}
      <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-black tracking-tight text-base">HarambeeFlow Onboarding Wizard</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Launches in under 5 minutes for non-technical treasurers</p>
          </div>
        </div>

        {/* Dynamic Progress indicator */}
        <div className="mt-5 grid grid-cols-6 gap-2 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
          {[
            { id: 1, label: "Campaign Info" },
            { id: 2, label: "Campaign Identity" },
            { id: 3, label: "Tracking Method" },
            { id: 4, label: "WhatsApp Setup" },
            { id: 5, label: "Committee Roles" },
            { id: 6, label: "Review & Launch" }
          ].map((s) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={isActive ? "text-indigo-400" : isCompleted ? "text-emerald-400" : "text-slate-500"}>
                    {s.id}. {s.label.split(" ")[0]}
                  </span>
                  {isCompleted && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                </div>
                <div className={`h-1 rounded-full ${isActive ? "bg-indigo-500" : isCompleted ? "bg-emerald-500" : "bg-slate-800"}`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        
        {errorMsg && (
          <div className="p-3 mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Success Completed Splash Screen */}
        {success ? (
          <div className="py-8 text-center space-y-5 max-w-md mx-auto animate-scale-up">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-sans font-black text-slate-900">Campaign Activated Successfully!</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your fundraiser <strong>"{name}"</strong> is now live on our secure Safaricom Daraja ledger. Live committee updates, statement audits, and double contribution preventers are fully operational.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign shortcode:</span>
                <span className="font-bold text-slate-800">Paybill {paybill}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Reference:</span>
                <span className="font-bold text-slate-800">{accountRef || name.substring(0, 7).toUpperCase().replace(/\s/g, "")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tracking engine:</span>
                <span className="font-bold text-indigo-600 uppercase text-[10px]">
                  {trackingMethod === "live_daraja" ? "Daraja API Webhook" : trackingMethod === "statement_import" ? "Excel/Statement Parser" : "Manual Audits"}
                </span>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Enter Dashboard Console
            </button>
          </div>
        ) : (
          <div>
            
            {/* Step 1: Campaign details */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Coins className="w-4.5 h-4.5 text-indigo-600" /> Enter Fundraiser Details
                  </h4>
                  <p className="text-[11px] text-slate-500">Provide the central description, financial target, and Safaricom merchant settings.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Fundraiser Name / Campaign:</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Macedonia Church Roof Project"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Target Goal Amount (KES):</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 500000"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Brief Description of Purpose:</label>
                  <textarea 
                    required
                    placeholder="Provide a small overview. This text is appended to automatic WhatsApp committee templates."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Sector Category:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Community/Church">Church / Faith Ministries</option>
                      <option value="Medical/Family">Medical / Patient Support</option>
                      <option value="Funeral/Memorial">Funeral / Memorial Drive</option>
                      <option value="Education/Chama">Education Fees & Chama Funds</option>
                      <option value="Wedding/Social">Wedding & Social Events</option>
                      <option value="Youth/Pathfinders">Youth & Pathfinder Camporee</option>
                      <option value="Community/NGO">Community Projects & NGO</option>
                      <option value="General/Harambee">General Community Harambee</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">M-PESA Paybill/Till No:</label>
                    <input 
                      type="text"
                      placeholder="e.g. 222111"
                      value={paybill}
                      onChange={(e) => setPaybill(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Account Ref (Optional):</label>
                    <input 
                      type="text"
                      placeholder="e.g. MACEDONIA"
                      value={accountRef}
                      onChange={(e) => setAccountRef(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Campaign Identity */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4.5 h-4.5 text-indigo-600" /> Customize Campaign Identity
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Give your drive a visual brand that inspires trust. Upload custom logos and choose colors that style the entire donor experience.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Organizer / Committee / Ministry Name:</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Macedonia SDA Church Board"
                        value={organizer}
                        onChange={(e) => setOrganizer(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Short Motto or Bible Verse (Optional):</label>
                      <textarea 
                        placeholder="e.g. Bear one another's burdens..."
                        value={motto}
                        onChange={(e) => setMotto(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 italic"
                      />
                    </div>

                    {/* Theme Color Circle Swatches */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Campaign Theme Color:</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.keys(CAMPAIGN_THEMES).map((colorKey) => {
                          const theme = CAMPAIGN_THEMES[colorKey];
                          const isActive = themeColor === colorKey;
                          
                          // Quick color map for swatches
                          const colorMap: Record<string, string> = {
                            Blue: "bg-blue-600",
                            Green: "bg-emerald-600",
                            Purple: "bg-purple-600",
                            Maroon: "bg-rose-900",
                            Orange: "bg-orange-600",
                            Gold: "bg-amber-600",
                            Red: "bg-red-600",
                            Gray: "bg-slate-600"
                          };

                          return (
                            <button
                              key={colorKey}
                              type="button"
                              onClick={() => setThemeColor(colorKey)}
                              className={`group relative flex items-center justify-center p-0.5 rounded-full border-2 transition ${
                                isActive ? "border-slate-900 scale-110 shadow" : "border-transparent hover:scale-105"
                              }`}
                            >
                              <span className={`w-5.5 h-5.5 rounded-full block ${colorMap[colorKey]}`} />
                              <span className="sr-only">{colorKey}</span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">Styles buttons, badges, progress bars, and PDF reports in <span className="font-bold text-slate-600">{themeColor}</span></span>
                    </div>
                  </div>

                  {/* Brand Uploads & Live Preview Card */}
                  <div className="space-y-4">
                    {/* Logo & Banner Row */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Logo Drop/Click Upload */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Campaign Logo:</label>
                        <div 
                          className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 text-center hover:bg-slate-100 transition cursor-pointer relative h-24 flex flex-col justify-center items-center gap-1 overflow-hidden group"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files?.[0]) {
                              setUploadingLogo(true);
                              try {
                                const base64 = await compressImageFile(e.dataTransfer.files[0], 250, 0.7);
                                setCampaignLogo(base64);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setUploadingLogo(false);
                              }
                            }
                          }}
                        >
                          {campaignLogo ? (
                            <>
                              <img src={campaignLogo} alt="Logo Preview" className="w-full h-full object-contain" />
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCampaignLogo(""); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition text-[8px] font-bold"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                              <span className="text-[9px] font-semibold text-slate-500">Drop/Click Logo</span>
                              <input 
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    setUploadingLogo(true);
                                    try {
                                      const base64 = await compressImageFile(e.target.files[0], 250, 0.7);
                                      setCampaignLogo(base64);
                                    } catch (err) {
                                      console.error(err);
                                    } finally {
                                      setUploadingLogo(false);
                                    }
                                  }
                                }}
                              />
                            </>
                          )}
                          {uploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] text-slate-600">Scaling...</div>}
                        </div>
                      </div>

                      {/* Cover Banner Drop/Click Upload */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cover Banner Image:</label>
                        <div 
                          className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 text-center hover:bg-slate-100 transition cursor-pointer relative h-24 flex flex-col justify-center items-center gap-1 overflow-hidden group"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files?.[0]) {
                              setUploadingBanner(true);
                              try {
                                const base64 = await compressImageFile(e.dataTransfer.files[0], 450, 0.75);
                                setCampaignImage(base64);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setUploadingBanner(false);
                              }
                            }
                          }}
                        >
                          {campaignImage ? (
                            <>
                              <img src={campaignImage} alt="Banner Preview" className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCampaignImage(""); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition text-[8px] font-bold"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                              <span className="text-[9px] font-semibold text-slate-500">Drop/Click Photo</span>
                              <input 
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    setUploadingBanner(true);
                                    try {
                                      const base64 = await compressImageFile(e.target.files[0], 450, 0.75);
                                      setCampaignImage(base64);
                                    } catch (err) {
                                      console.error(err);
                                    } finally {
                                      setUploadingBanner(false);
                                    }
                                  }
                                }}
                              />
                            </>
                          )}
                          {uploadingBanner && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] text-slate-600 font-mono">Compressing...</div>}
                        </div>
                      </div>

                    </div>

                    {/* Smart Fallback Information */}
                    {(!campaignLogo || !campaignImage) && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-tight">
                          No upload? We will automatically apply a premium <strong className="text-slate-700">{category}</strong> themed artwork and smart vector icon!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instant Branding Preview Banner Mockup */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white text-slate-800">
                  <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Live Platform Branding Preview</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono text-[8px] font-bold">HarambeeFlow Verified</span>
                  </div>
                  <div className="relative">
                    {/* Banner Image */}
                    <div className="h-28 w-full bg-slate-100 relative">
                      <img 
                        src={campaignImage || getBrandingForCategory(category).image} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover brightness-[0.7]" 
                      />
                      
                      {/* Logo Overlay */}
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          <img 
                            src={campaignLogo || getBrandingForCategory(category).logo} 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        <div className="text-white drop-shadow-md">
                          <h5 className="font-sans font-black text-xs leading-none">{name || "Your Campaign Name"}</h5>
                          <p className="text-[9px] text-slate-200 mt-0.5 font-sans">Organizer: <strong className="font-bold">{organizer || `${name || "Campaign"} Committee`}</strong></p>
                        </div>
                      </div>

                      {/* Theme color indicator badge */}
                      <div className="absolute top-2.5 right-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${CAMPAIGN_THEMES[themeColor].badge}`}>
                          {themeColor} Theme Active
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Motto block inside mockup */}
                  <div className="p-3 bg-slate-50/50 text-center text-[10px] text-slate-500 italic font-medium leading-relaxed font-sans border-t border-slate-100/50">
                    {motto || getBrandingForCategory(category).motto}
                  </div>
                </div>

              </div>
            )}

            {/* Step 3: Choose Tracking Method */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Landmark className="w-4.5 h-4.5 text-indigo-600" /> Choose Tracking Method
                  </h4>
                  <p className="text-[11px] text-slate-500">Pick the best reconciliation mode that matches your technical setup.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTrackingMethod("live_daraja")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-44 cursor-pointer transition-all ${
                      trackingMethod === "live_daraja" 
                        ? "border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10" 
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className={`w-6 h-6 ${trackingMethod === "live_daraja" ? "text-indigo-600" : "text-slate-400"}`} />
                    <div className="space-y-1 mt-3">
                      <span className="text-xs font-extrabold text-slate-950 block">Option A: Daraja Integration</span>
                      <span className="text-[10px] text-slate-500 block leading-normal">Live instant updates via Safaricom Paybill C2B callback webhooks.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackingMethod("statement_import")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-44 cursor-pointer transition-all ${
                      trackingMethod === "statement_import" 
                        ? "border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10" 
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className={`w-6 h-6 ${trackingMethod === "statement_import" ? "text-indigo-600" : "text-slate-400"}`} />
                    <div className="space-y-1 mt-3">
                      <span className="text-xs font-extrabold text-slate-950 block">Option B: Statement Import</span>
                      <span className="text-[10px] text-slate-500 block leading-normal">Treasurer copy-pastes raw M-PESA SMS statements or uploads CSV ledgers.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackingMethod("manual_entry")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-44 cursor-pointer transition-all ${
                      trackingMethod === "manual_entry" 
                        ? "border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10" 
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <Settings className={`w-6 h-6 ${trackingMethod === "manual_entry" ? "text-indigo-600" : "text-slate-400"}`} />
                    <div className="space-y-1 mt-3">
                      <span className="text-xs font-extrabold text-slate-950 block">Option C: Manual Recording</span>
                      <span className="text-[10px] text-slate-500 block leading-normal">Enter payments manually with automated name cleaning and audit trails.</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Configure WhatsApp Updates */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4.5 h-4.5 text-indigo-600" /> Configure WhatsApp updates
                  </h4>
                  <p className="text-[11px] text-slate-500">Enable automatic template dispatches to keep campaign trustees informed without manual overhead.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">WhatsApp Group Name:</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. St. Joseph Funeral Welfare Forum"
                      value={whatsappGroup}
                      onChange={(e) => setWhatsappGroup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                    />
                  </div>

                  <div className="space-y-2.5 pt-1.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={postInstantReceipt}
                        onChange={(e) => setPostInstantReceipt(e.target.checked)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Dispatch Instant Payment Receipts</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">As soon as an M-PESA webhook is dispatched, post an instant thank-you receipt to the WhatsApp group.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={postWeeklyDigest}
                        onChange={(e) => setPostWeeklyDigest(e.target.checked)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Automate Sunday Summary Bulletins</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">Every Sunday evening, compile totals raised and share a structured updates summary bulletin automatically.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Invite Committee Members */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-indigo-600" /> Invite Committee Members
                  </h4>
                  <p className="text-[11px] text-slate-500">Assign roles to other committee trustees. They gain secure, customized viewing permissions.</p>
                </div>

                {/* Form to add member */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase">Member Name:</label>
                    <input 
                      type="text"
                      placeholder="e.g. Sarah Nduta"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase">Assign Role:</label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 cursor-pointer"
                    >
                      <option value="Assistant Treasurer">Assistant Treasurer</option>
                      <option value="Auditor">Auditor (Read-Only reconciler)</option>
                      <option value="Chairman">Chairman (Approver)</option>
                      <option value="Secretary">Committee Secretary</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-slate-400 uppercase">Phone Number:</label>
                    <input 
                      type="text"
                      placeholder="e.g. 2547XXXXXXXX"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 font-mono text-slate-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Member
                  </button>
                </div>

                {/* Table of active invites */}
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 font-mono text-[9px] border-b border-slate-100">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Committee Role</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {committee.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold font-mono text-[9px] rounded uppercase">
                              {item.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.phone}</td>
                          <td className="py-2 px-3 text-center">
                            {index === 0 ? (
                              <span className="text-[9px] text-slate-400 font-mono italic">Primary (You)</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(index)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 6: Review & Launch Campaign */}
            {step === 6 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" /> Review and Launch campaign
                  </h4>
                  <p className="text-[11px] text-slate-500">Review your automated fundraising parameters before launching the campaign ledger.</p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-4.5 bg-slate-50/50 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">Campaign Name</span>
                      <span className="font-extrabold text-slate-900">{name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">Financial Target Goal</span>
                      <span className="font-extrabold text-emerald-600 font-mono">KES {Number(target).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">Organizer / Committee</span>
                      <span className="font-bold text-slate-800">{organizer || `${name} Committee`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">Campaign Theme Color</span>
                      <span className={`px-2 py-0.5 font-bold font-mono text-[9px] rounded uppercase ${CAMPAIGN_THEMES[themeColor].badge}`}>
                        {themeColor}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">M-PESA shortcode</span>
                      <span className="font-bold font-mono text-slate-850">Paybill {paybill}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">Reconciliation Engine</span>
                      <span className="font-bold text-indigo-600 uppercase font-mono text-[10px]">
                        {trackingMethod === "live_daraja" ? "Option A: Daraja Live Webhook" : trackingMethod === "statement_import" ? "Option B: Excel Statements" : "Option C: Manual Books"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">WhatsApp group integration</span>
                      <span className="font-bold text-slate-850">{whatsappGroup || `${name} Group`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[9px] mb-0.5">Weekly Bulletins Auto-Schedule</span>
                      <span className="font-bold text-slate-800">{postWeeklyDigest ? "Enabled (Every Sunday)" : "Disabled"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-mono text-[9px] mb-1">Committee Board Invited</span>
                    <div className="flex flex-wrap gap-2">
                      {committee.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-medium font-sans">
                          {item.name} ({item.role})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step navigation controls */}
            <div className="flex justify-between items-center pt-5 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous step
              </button>

              {step < 6 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer text-white shadow-sm hover:shadow-indigo-500/10"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunchCampaign}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer text-white shadow-sm shadow-emerald-500/10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Provisioning ledger...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" /> Launch Fundraiser Drive
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
