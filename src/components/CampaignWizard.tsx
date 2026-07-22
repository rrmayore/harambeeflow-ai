import React, { useState, useRef } from "react";
import { 
  ArrowLeft, ArrowRight, Sparkles, Check, CheckCircle2, 
  HelpCircle, AlertTriangle, Users, Plus, Trash2, Calendar, 
  Coins, Smartphone, Landmark, Layout, Church, HeartPulse, GraduationCap, Flame, Users2, ShieldAlert,
  Camera, Upload
} from "lucide-react";
import { processLogoImage } from "../utils/logoStorage";
import { 
  cropAndCompressCoverImage, 
  cropAndCompressLogoImage, 
  getCategoryIllustration 
} from "../utils/branding";

interface CampaignWizardProps {
  onAddProject: (payload: any) => Promise<any>;
  onCancel: () => void;
  onComplete: (project: any) => void;
}

export default function CampaignWizard({
  onAddProject,
  onCancel,
  onComplete
}: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- WIZARD FORM STATE ---
  // Step 1: Campaign Name
  const [name, setName] = useState("");

  // Step 2: Category
  const [category, setCategory] = useState("Church");

  // Step 3: Fundraising Target
  const [target, setTarget] = useState("");

  // Step 4: Description
  const [description, setDescription] = useState("");

  // Step 5: Start Date
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Step 6: Closing Date
  const [closingDate, setClosingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  // Step 7: Organizer
  const [organizer, setOrganizer] = useState("");

  // Step 8: Committee Members
  const [committee, setCommittee] = useState<Array<{ name: string; role: string; phone: string }>>([
    { name: "Sarah Wanjiku", role: "Treasurer", phone: "254711223344" }
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Assistant Treasurer");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  // Step 9: Paybill/Till
  const [paybill, setPaybill] = useState("225588");

  // Step 10: Account Reference
  const [accountRef, setAccountRef] = useState("");

  // Step 11: Campaign Logo/Image Selection
  const [logoType, setLogoType] = useState("preset");
  const [selectedLogoUrl, setSelectedLogoUrl] = useState("");
  const [motto, setMotto] = useState("");
  const [themeColor, setThemeColor] = useState("Blue");

  // Cover Image States (Requirement 1)
  const [coverType, setCoverType] = useState<"preset" | "custom" | "illustration">("preset");
  const [selectedCoverUrl, setSelectedCoverUrl] = useState("");
  const [coverError, setCoverError] = useState("");
  const [coverSuccess, setCoverSuccess] = useState("");
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverCameraInputRef = useRef<HTMLInputElement>(null);

  // Logo Custom Uploading states (Requirement 1 & 9)
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const [srAnnouncement, setSrAnnouncement] = useState("");

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  // Prestyled options for step 11
  const logoPresets: Record<string, { label: string; logoUrl: string; bannerUrl: string; motto: string; color: string }> = {
    "Church": {
      label: "Church / Faith",
      logoUrl: getCategoryIllustration("Church", "logo"),
      bannerUrl: getCategoryIllustration("Church", "banner"),
      motto: "United in faith, building a brighter future.",
      color: "Blue"
    },
    "Medical": {
      label: "Medical Care",
      logoUrl: getCategoryIllustration("Medical", "logo"),
      bannerUrl: getCategoryIllustration("Medical", "banner"),
      motto: "Stand with us in healing and recovery.",
      color: "Green"
    },
    "School Fees": {
      label: "Education",
      logoUrl: getCategoryIllustration("Education", "logo"),
      bannerUrl: getCategoryIllustration("Education", "banner"),
      motto: "Education is the key to our tomorrow.",
      color: "Orange"
    },
    "Community": {
      label: "Community Dev",
      logoUrl: getCategoryIllustration("Community", "logo"),
      bannerUrl: getCategoryIllustration("Community", "banner"),
      motto: "Uniting as one to support our own.",
      color: "Blue"
    },
    "Funeral": {
      label: "Remembrance",
      logoUrl: getCategoryIllustration("Funeral", "logo"),
      bannerUrl: getCategoryIllustration("Funeral", "banner"),
      motto: "Rest in eternal peace. Always remembered.",
      color: "Purple"
    }
  };

  const defaultIllustrations = [
    { name: "Church", value: getCategoryIllustration("Church", "banner"), label: "Faith / Chapel" },
    { name: "Medical", value: getCategoryIllustration("Medical", "banner"), label: "Health / Care" },
    { name: "Education", value: getCategoryIllustration("Education", "banner"), label: "Learning / Book" },
    { name: "Funeral", value: getCategoryIllustration("Funeral", "banner"), label: "Memorial / Candle" },
    { name: "Sports", value: getCategoryIllustration("Sports", "banner"), label: "Sports / Trophy" },
    { name: "Emergency", value: getCategoryIllustration("Emergency", "banner"), label: "Crisis / Rescue" },
    { name: "Community", value: getCategoryIllustration("Community", "banner"), label: "People / Network" },
  ];

  // Preset logo selection helper
  const handleSelectPreset = (key: string) => {
    const preset = logoPresets[key] || logoPresets["Church"];
    setSelectedLogoUrl(preset.logoUrl);
    setMotto(preset.motto);
    setThemeColor(preset.color);
  };

  const handleUploadCoverFile = async (file: File) => {
    setCoverError("");
    setCoverSuccess("");
    
    // Size check: Max 8MB
    if (file.size > 8 * 1024 * 1024) {
      setCoverError("Image exceeds 8 MB size limit. Please select a smaller photo.");
      return;
    }
    
    // Type check
    const acceptedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      setCoverError("Invalid image type. Please select PNG, JPG, or WEBP.");
      return;
    }
    
    setIsProcessingCover(true);
    try {
      // Automatically crop to 16:9 and compress
      const coverDataUrl = await cropAndCompressCoverImage(file);
      setSelectedCoverUrl(coverDataUrl);
      setCoverType("custom");
      setCoverSuccess("Cover image uploaded and cropped successfully");
      setSrAnnouncement("Cover image uploaded and cropped successfully.");
    } catch (err: any) {
      console.error(err);
      setCoverError("An error occurred during cover image processing. Please retry.");
    } finally {
      setIsProcessingCover(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploadError("");
    setUploadSuccess("");
    
    // Size check: Max 8MB
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image exceeds 8 MB size limit. Please select a smaller photo.");
      return;
    }
    
    // Type check
    const acceptedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      setUploadError("Invalid image type. Please select PNG, JPG, or WEBP.");
      return;
    }
    
    setIsProcessing(true);
    try {
      // Automatically crop to 1:1 square (512x512) and compress
      const logoDataUrl = await cropAndCompressLogoImage(file);
      setSelectedLogoUrl(logoDataUrl);
      setLogoType("custom");
      setUploadSuccess("Campaign logo uploaded and resized successfully");
      
      // Accessibility and focus management
      setSrAnnouncement("Logo uploaded successfully. Save button available.");
      setTimeout(() => {
        nextBtnRef.current?.focus();
        
        // Auto Scroll after Logo Upload (Smooth scrolling, keep buttons visible)
        const mottoInput = document.getElementById("campaign-motto-input");
        if (mottoInput) {
          mottoInput.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }, 300);
    } catch (err: any) {
      console.error(err);
      setUploadError("An error occurred during file compression. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  // Form step navigation checks
  const handleNext = () => {
    setErrorMsg("");

    if (step === 1 && !name.trim()) {
      setErrorMsg("Campaign Name is required.");
      return;
    }
    if (step === 3) {
      if (!target.trim() || isNaN(Number(target)) || Number(target) <= 0) {
        setErrorMsg("Please enter a valid positive fundraising target amount.");
        return;
      }
    }
    if (step === 4 && !description.trim()) {
      setErrorMsg("Please write a short description explaining the campaign story.");
      return;
    }
    if (step === 7) {
      if (!organizer.trim()) {
        // Set fallback organizer if empty
        setOrganizer(`${name} Committee`);
      }
    }
    if (step === 10) {
      if (!accountRef.trim()) {
        // Set automatic reference matching prompt
        setAccountRef(name.substring(0, 7).toUpperCase().replace(/\s/g, ""));
      }
    }
    if (step === 11) {
      // Set default logo/cover if none are selected
      if (!selectedLogoUrl) {
        setSelectedLogoUrl(getCategoryIllustration(category, "logo"));
      }
      if (!selectedCoverUrl) {
        setSelectedCoverUrl(getCategoryIllustration(category, "banner"));
      }
      if (!motto) {
        const matchingPreset = logoPresets[category] || logoPresets["Church"];
        setMotto(matchingPreset.motto);
      }
    }

    setStep(prev => Math.min(12, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep(prev => Math.max(1, prev - 1));
  };

  // Add Committee Member helper
  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      setErrorMsg("Committee member name and phone number are required.");
      return;
    }
    setCommittee([...committee, { name: newMemberName.trim(), role: newMemberRole, phone: newMemberPhone.trim() }]);
    setNewMemberName("");
    setNewMemberPhone("");
    setErrorMsg("");
  };

  const handleRemoveMember = (idx: number) => {
    setCommittee(committee.filter((_, i) => i !== idx));
  };

  // Publish Campaign handler
  const handlePublish = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const gRef = accountRef.trim() || name.substring(0, 7).toUpperCase().replace(/\s/g, "");
      
      const payload = {
        name: name.trim(),
        targetAmount: Number(target),
        description: description.trim(),
        category: category,
        paybillNumber: paybill.trim(),
        accountReference: gRef,
        treasurerPhone: committee[0]?.phone || "254712345678",
        whatsappGroupName: `${name.trim()} Info Group`,
        trackingMethod: "live_daraja",
        healthScore: 100,
        organizer: organizer.trim() || "Harambee Committee",
        themeColor: themeColor,
        motto: motto.trim().substring(0, 80),
        campaignImage: selectedCoverUrl || getCategoryIllustration(category, "banner"),
        campaignLogo: selectedLogoUrl || getCategoryIllustration(category, "logo"),
        campaignCategory: category,
        startDate: startDate,
        closingDate: closingDate,
        committee: committee
      };

      const result = await onAddProject(payload);
      onComplete({ ...payload, id: result.id });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to publish fundraising campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col min-h-screen"
      id="campaign-wizard-container"
    >
      {/* Screen Reader Live Region for Accessibility (Requirement 10) */}
      <div className="sr-only" role="status" aria-live="polite">
        {srAnnouncement}
      </div>

      {/* Main naturally scrollable viewport block (Requirement 1 & 2) */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-12"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up flex flex-col">
          
          {/* Wizard Header Banner */}
          <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">New Fundraising Campaign</h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Step {step} of 12 • Smart Setup</p>
              </div>
            </div>
            <button 
              onClick={onCancel}
              className="text-xs font-mono font-bold text-slate-400 hover:text-white px-2.5 py-1.5 hover:bg-slate-850 rounded-lg transition"
            >
              Cancel
            </button>
          </div>

          {/* Form body */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            {errorMsg && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DYNAMIC STEPS RENDER BLOCK */}
            <div className="space-y-4">
              
              {/* Step 1: Campaign Name */}
              {step === 1 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Give your fundraising campaign a clear, specific name:</label>
                  <input
                    type="text"
                    placeholder="e.g. St. Jude Sanctuary Construction drive"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-medium focus:outline-hidden transition"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Tips: Keep it short and descriptive so community members can find it instantly.
                  </p>
                </div>
              )}

              {/* Step 2: Category */}
              {step === 2 && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Select the sector category for your campaign:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {["Church", "Medical", "Education", "School Fees", "Funeral", "Community", "Sports", "Emergency", "NGO"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-3 px-3.5 rounded-xl text-xs font-bold border transition text-left flex items-center gap-2 cursor-pointer ${
                          category === cat 
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                            : "bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-300"
                        }`}
                      >
                        {cat === "Church" && <Church className="w-4 h-4 text-slate-400" />}
                        {cat === "Medical" && <HeartPulse className="w-4 h-4 text-slate-400" />}
                        {cat === "Education" && <GraduationCap className="w-4 h-4 text-slate-400" />}
                        {cat === "School Fees" && <GraduationCap className="w-4 h-4 text-slate-400" />}
                        {cat === "Funeral" && <Flame className="w-4 h-4 text-slate-400" />}
                        {cat === "Community" && <Users2 className="w-4 h-4 text-slate-400" />}
                        {cat === "Sports" && <Layout className="w-4 h-4 text-slate-400" />}
                        {cat === "Emergency" && <ShieldAlert className="w-4 h-4 text-slate-400" />}
                        {cat === "NGO" && <Landmark className="w-4 h-4 text-slate-400" />}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Fundraising Target */}
              {step === 3 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">What is your total target goal fundraising amount (KES)?</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold text-sm">KES</span>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      onFocus={handleInputFocus}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-14 pr-4 py-3 text-sm font-mono font-bold focus:outline-hidden transition"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tip: Goal will appear as a live percentage meter tracking contribution logs.
                  </p>
                </div>
              )}

              {/* Step 4: Description / Campaign Story */}
              {step === 4 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Tell the story / purpose of this fundraiser:</label>
                  <textarea
                    rows={4}
                    placeholder="Provide context about why you are raising funds, how the contributions will be utilized, and key deadlines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-normal focus:outline-hidden transition resize-none"
                    autoFocus
                  />
                </div>
              )}

              {/* Step 5: Start Date */}
              {step === 5 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Campaign Start Date:</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onFocus={handleInputFocus}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-12 pr-4 py-3 text-sm font-mono focus:outline-hidden transition"
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Closing Date */}
              {step === 6 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Expected Closing Date:</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="date"
                      value={closingDate}
                      onChange={(e) => setClosingDate(e.target.value)}
                      onFocus={handleInputFocus}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-12 pr-4 py-3 text-sm font-mono focus:outline-hidden transition"
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Organizer */}
              {step === 7 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Organizer or Host Committee Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. St. Jude Sanctuary Development Committee"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-medium focus:outline-hidden transition"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400">
                    This represents the name givers see as the driving host of the drive.
                  </p>
                </div>
              )}

              {/* Step 8: Committee Members */}
              {step === 8 && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Assign Host Committee Roles:</label>
                  
                  {/* Current Committee List - Removed nested scrolling (Requirement 2) */}
                  <div className="space-y-2 pr-1">
                    {committee.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.role} • {member.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="p-1 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Member Form Mini */}
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onFocus={handleInputFocus}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                      />
                      <input
                        type="text"
                        placeholder="Phone (e.g. 2547...)"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        onFocus={handleInputFocus}
                        className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg px-2 py-1 focus:outline-hidden"
                      >
                        <option value="Treasurer">Treasurer</option>
                        <option value="Assistant Treasurer">Assistant Treasurer</option>
                        <option value="Committee Chair">Committee Chair</option>
                        <option value="Auditor">Auditor</option>
                        <option value="Secretary">Secretary</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Member
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 9: Paybill/Till */}
              {step === 9 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Safaricom M-PESA Paybill or Till Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. 225588 (Sandbox default)"
                    value={paybill}
                    onChange={(e) => setPaybill(e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-hidden transition"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enter your official Lipa Na M-PESA code. You may use our sandbox shortcode <span className="text-emerald-400 font-mono">225588</span> for full automated simulated testing.
                  </p>
                </div>
              )}

              {/* Step 10: Account Reference */}
              {step === 10 && (
                <div className="space-y-3.5 animate-fade-in">
                  <label className="text-sm font-bold text-slate-200 block">Safaricom Paybill Account Reference (e.g. Giver key):</label>
                  <input
                    type="text"
                    placeholder="e.g. STJUDE"
                    value={accountRef}
                    onChange={(e) => setAccountRef(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    onFocus={handleInputFocus}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-hidden transition"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400">
                    The keyword givers will type as the account reference on their phones.
                  </p>
                </div>
              )}

              {/* Step 11: Logo/Image selection (Requirement 1: Campaign Identity Section Redesign) */}
              {step === 11 && (
                <div className="space-y-6 animate-fade-in text-left animate-slide-up">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 uppercase tracking-wide text-emerald-400">
                    Campaign Identity Setup
                  </h3>
                  
                  {/* SECTION A: Campaign Cover Image */}
                  <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">SECTION A: Campaign Cover Image</span>
                      <span className="text-[9px] bg-emerald-500/10 font-bold text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                        {coverType === "custom" ? "Custom Photo" : "Default Illustration"}
                      </span>
                    </div>

                    {/* Aspect Ratio 16:9 Cover Preview */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img 
                        src={selectedCoverUrl || getCategoryIllustration(category, "banner")} 
                        alt="Cover Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 backdrop-blur-xs p-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-[9px] text-slate-400 font-mono">16:9 Aspect Ratio Preview</span>
                        {coverType === "custom" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCoverUrl("");
                              setCoverType("preset");
                              setCoverSuccess("");
                              setCoverError("");
                            }}
                            className="text-[9px] font-bold text-rose-400 bg-rose-950/40 border border-rose-900/20 px-2 py-0.5 rounded-md hover:bg-rose-950/80 transition"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cover File Selector */}
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleUploadCoverFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => coverFileInputRef.current?.click()}
                      className={`border border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center cursor-pointer min-h-[96px] relative ${
                        isDragActive 
                          ? "border-emerald-500 bg-emerald-500/5" 
                          : "border-slate-800 bg-slate-950/45 hover:border-slate-700 hover:bg-slate-950/80"
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={coverFileInputRef} 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadCoverFile(e.target.files[0]);
                          }
                        }} 
                        accept="image/png, image/jpg, image/jpeg, image/webp" 
                        className="hidden" 
                      />
                      <input 
                        type="file" 
                        ref={coverCameraInputRef} 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadCoverFile(e.target.files[0]);
                          }
                        }} 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                      />

                      {isProcessingCover ? (
                        <div className="space-y-2 text-xs font-mono font-bold text-emerald-400 flex flex-col items-center">
                          <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          <span>Processing Cover...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                          <p className="text-[11px] font-bold text-slate-300">
                            Drag cover image here or click to upload
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            PNG, JPG, WEBP (Max 8 MB • Auto-crops to 16:9)
                          </p>
                        </>
                      )}
                    </div>

                    {/* Camera Control & Defaults Label */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => coverCameraInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-slate-300 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" /> Take Photo (Mobile Camera)
                      </button>

                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Or Choose Default Illustration</span>
                    </div>

                    {/* Default Illustrations Selector Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {defaultIllustrations.map((ill) => (
                        <button
                          key={ill.name}
                          type="button"
                          onClick={() => {
                            setSelectedCoverUrl(ill.value);
                            setCoverType("preset");
                            setCoverSuccess(`Selected ${ill.label}`);
                          }}
                          className={`relative aspect-video rounded-lg overflow-hidden border transition cursor-pointer group ${
                            selectedCoverUrl === ill.value && coverType !== "custom"
                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                          title={ill.label}
                        >
                          <img src={ill.value} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <span className="text-[8px] font-bold text-slate-200 truncate px-1">{ill.label}</span>
                          </div>
                          {selectedCoverUrl === ill.value && coverType !== "custom" && (
                            <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {coverError && <p className="text-[10px] text-rose-400 font-semibold text-center">{coverError}</p>}
                    {coverSuccess && <p className="text-[10px] text-emerald-400 font-semibold text-center">✓ {coverSuccess}</p>}
                  </div>

                  {/* SECTION B: Campaign Logo */}
                  <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">SECTION B: Campaign Logo</span>
                      <span className="text-[9px] bg-indigo-500/10 font-bold text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">
                        {logoType === "custom" ? "Custom Active" : "Preset Active"}
                      </span>
                    </div>

                    {/* Hidden Inputs for Logo Upload (Requirement 1 & 9) */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/png, image/jpg, image/jpeg, image/webp" 
                      className="hidden" 
                    />
                    <input 
                      type="file" 
                      ref={cameraInputRef} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadFile(e.target.files[0]);
                        }
                      }} 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                    />

                    {/* Preview Area & Upload / Replace / Remove Controls */}
                    <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl">
                      <div className="relative">
                        <img 
                          src={selectedLogoUrl || getCategoryIllustration(category, "logo")} 
                          alt="Logo Preview" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-900 object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                          Format: PNG, JPG, WEBP. Resized automatically to 512x512 pixels.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1.5 text-[10px] font-bold uppercase font-mono bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg cursor-pointer transition animate-scale-up"
                          >
                            {selectedLogoUrl ? "Replace Logo" : "Upload Logo"}
                          </button>

                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="px-2.5 py-1.5 text-[10px] font-bold uppercase font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg cursor-pointer transition flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-emerald-400" /> Camera
                          </button>
                          
                          {selectedLogoUrl && logoType === "custom" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLogoUrl("");
                                setLogoType("preset");
                                setUploadSuccess("");
                                setUploadError("");
                              }}
                              className="px-2.5 py-1.5 text-[10px] font-bold uppercase font-mono bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg cursor-pointer transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {uploadError && <p className="text-[10px] text-rose-400 font-semibold text-center">{uploadError}</p>}
                    {uploadSuccess && <p className="text-[10px] text-emerald-400 font-semibold text-center">✓ {uploadSuccess}</p>}
                  </div>

                  {/* SECTION C: Campaign Motto */}
                  <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">SECTION C: Campaign Motto</span>
                      <span className="text-[10px] font-mono text-slate-500">{motto.length} / 80 characters</span>
                    </div>
                    
                    <input
                      id="campaign-motto-input"
                      type="text"
                      maxLength={80}
                      placeholder="e.g. Galatians 6:2 - Carry each other's burdens"
                      value={motto}
                      onChange={(e) => setMotto(e.target.value.substring(0, 80))}
                      onFocus={handleInputFocus}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden"
                    />

                    {/* Slogan Live Preview */}
                    {motto && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-center">
                        <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Live Motto Slogan Preview</p>
                        <p className="text-xs italic text-emerald-400 font-semibold">“{motto}”</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 12: Review & Publish */}
              {step === 12 && (
                <div className="space-y-3 animate-fade-in text-left">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Review & Publish Campaign Details
                  </h3>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs bg-slate-950/40 p-4 border border-slate-850 rounded-2xl font-sans">
                    <div>
                      <span className="text-slate-500 font-mono block">Campaign Name:</span>
                      <span className="font-bold text-slate-200 truncate block">{name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block">Category:</span>
                      <span className="font-bold text-slate-200 block">{category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block">Fundraising Target:</span>
                      <span className="font-bold text-emerald-400 font-mono block">KES {Number(target).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block">Closing Date:</span>
                      <span className="font-bold text-slate-200 font-mono block">{closingDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block">Lipa Na M-PESA Code:</span>
                      <span className="font-bold text-slate-200 font-mono block">Paybill {paybill}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block">Account Reference:</span>
                      <span className="font-bold text-slate-200 font-mono block">{accountRef}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-mono block">Committee Members:</span>
                      <span className="font-medium text-slate-300 block">
                        {committee.map(m => `${m.name} (${m.role})`).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* Sticky Bottom Action Bar with Safe Area supports (Requirement 3 & 6) */}
      <div 
        className="sticky bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-850 px-6 py-4 flex items-center justify-between z-40 shrink-0 shadow-2xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 disabled:opacity-30 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {step < 12 ? (
          <button
            type="button"
            ref={nextBtnRef}
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition"
          >
            Next Step <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            ref={nextBtnRef}
            onClick={handlePublish}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 cursor-pointer transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" /> Publish Campaign
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
