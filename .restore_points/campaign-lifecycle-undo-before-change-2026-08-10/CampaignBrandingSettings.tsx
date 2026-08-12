import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, Trash2, Check, AlertCircle, Camera, Loader2, Save, X 
} from "lucide-react";
import { Project } from "../types";
import { 
  cropAndCompressCoverImage,
  cropAndCompressLogoImage,
  getCategoryIllustration
} from "../utils/branding";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { verifyCampaignWritePermission } from "../utils/logoStorage";

interface CampaignBrandingSettingsProps {
  project: Project | null;
  onUpdateProject: (updatedProj: Partial<Project>) => void;
}

interface SavingProgress {
  isSaving: boolean;
  progress: number;
  statusText: string;
}

export default function CampaignBrandingSettings({ 
  project, 
  onUpdateProject 
}: CampaignBrandingSettingsProps) {
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Editable fields initialized to current values
  const [editedName, setEditedName] = useState("");
  const [editedMotto, setEditedMotto] = useState("");
  const [editedLogoUrl, setEditedLogoUrl] = useState("");
  const [editedCoverUrl, setEditedCoverUrl] = useState("");

  // Tracking pending files to upload
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);

  // File Inputs
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const logoCameraInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverCameraInputRef = useRef<HTMLInputElement>(null);

  // UI state feedback
  const [savingState, setSavingState] = useState<SavingProgress>({
    isSaving: false,
    progress: 0,
    statusText: ""
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [logoDragActive, setLogoDragActive] = useState(false);
  const [coverDragActive, setCoverDragActive] = useState(false);

  // Sync internal state when project changes
  useEffect(() => {
    if (project) {
      setEditedName(project.name || "");
      setEditedMotto(project.motto || "");
      setEditedLogoUrl(project.campaignLogo || "");
      setEditedCoverUrl(project.campaignImage || "");
      setPendingLogoFile(null);
      setPendingCoverFile(null);
      
      if (project.id) {
        verifyCampaignWritePermission(project.id).then(setIsAuthorized);
      }
    }
  }, [project]);

  if (!project) return null;

  // Has anything changed?
  const hasChanges = 
    editedName.trim() !== (project.name || "").trim() ||
    editedMotto.trim() !== (project.motto || "").trim() ||
    editedLogoUrl !== (project.campaignLogo || "") ||
    editedCoverUrl !== (project.campaignImage || "") ||
    pendingLogoFile !== null ||
    pendingCoverFile !== null;

  // Drag and drop cover events
  const handleCoverDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCoverDragActive(true);
    } else if (e.type === "dragleave") {
      setCoverDragActive(false);
    }
  };

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCoverDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedCoverFile(e.dataTransfer.files[0]);
    }
  };

  // Drag and drop logo events
  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setLogoDragActive(false);
    }
  };

  const handleLogoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedLogoFile(e.dataTransfer.files[0]);
    }
  };

  // Process selected files client side
  const processSelectedCoverFile = async (file: File) => {
    setErrorMsg("");
    setSuccessMsg("");

    const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported image file. Please upload a PNG, JPG, or WEBP.");
      return;
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("Cover image is too large (maximum size is 8 MB).");
      return;
    }

    try {
      setSavingState({
        isSaving: true,
        progress: 10,
        statusText: "Processing cover image..."
      });

      const compressedUrl = await cropAndCompressCoverImage(file);
      setEditedCoverUrl(compressedUrl);
      setPendingCoverFile(file);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process cover photo. Please try another image.");
    } finally {
      setSavingState({ isSaving: false, progress: 0, statusText: "" });
    }
  };

  const processSelectedLogoFile = async (file: File) => {
    setErrorMsg("");
    setSuccessMsg("");

    const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported image file. Please upload a PNG, JPG, or WEBP.");
      return;
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("Logo image is too large (maximum size is 8 MB).");
      return;
    }

    try {
      setSavingState({
        isSaving: true,
        progress: 10,
        statusText: "Processing logo..."
      });

      const compressedUrl = await cropAndCompressLogoImage(file);
      setEditedLogoUrl(compressedUrl);
      setPendingLogoFile(file);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process logo. Please try another image.");
    } finally {
      setSavingState({ isSaving: false, progress: 0, statusText: "" });
    }
  };

  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleSaveChanges = async () => {
    if (!project.id) return;
    setErrorMsg("");
    setSuccessMsg("");

    const authorized = await verifyCampaignWritePermission(project.id);
    if (!authorized) {
      setErrorMsg("Access Denied: You do not have permission to modify this campaign.");
      return;
    }

    const previousState = {
      name: project.name,
      motto: project.motto,
      campaignLogo: project.campaignLogo,
      campaignImage: project.campaignImage
    };

    setSavingState({
      isSaving: true,
      progress: 5,
      statusText: "Saving updates..."
    });

    try {
      let finalCoverUrl = editedCoverUrl;
      let finalLogoUrl = editedLogoUrl;

      // 1. Cover Upload Workflow
      if (pendingCoverFile && editedCoverUrl.startsWith("data:image")) {
        setSavingState({
          isSaving: true,
          progress: 25,
          statusText: "Uploading Cover Image..."
        });

        try {
          const storage = getStorage();
          const coverBlob = await dataUrlToBlob(editedCoverUrl);
          const coverRef = ref(storage, `campaigns/${project.id}/cover.webp`);
          
          await uploadBytes(coverRef, coverBlob);
          finalCoverUrl = await getDownloadURL(coverRef);
        } catch (storageErr) {
          console.warn("Storage upload failed, falling back to secure local state:", storageErr);
          finalCoverUrl = editedCoverUrl;
        }
      }

      // 2. Logo Upload Workflow
      if (pendingLogoFile && editedLogoUrl.startsWith("data:image")) {
        setSavingState({
          isSaving: true,
          progress: 55,
          statusText: "Uploading Logo..."
        });

        try {
          const storage = getStorage();
          const logoBlob = await dataUrlToBlob(editedLogoUrl);
          const logoRef = ref(storage, `campaigns/${project.id}/logo.webp`);
          
          await uploadBytes(logoRef, logoBlob);
          finalLogoUrl = await getDownloadURL(logoRef);
        } catch (storageErr) {
          console.warn("Storage upload failed, falling back to secure local state:", storageErr);
          finalLogoUrl = editedLogoUrl;
        }
      }

      // 3. Document Save
      setSavingState({
        isSaving: true,
        progress: 80,
        statusText: "Saving changes to database..."
      });

      const docRef = doc(db, "fundraisers", project.id);
      const updateData = {
        name: editedName.trim() || project.name,
        fundraiserName: editedName.trim() || project.name,
        motto: editedMotto.trim(),
        campaignImage: finalCoverUrl,
        campaignLogo: finalLogoUrl,
        logoUrl: finalLogoUrl
      };

      await updateDoc(docRef, updateData);

      // 4. Synchronize state
      setSavingState({
        isSaving: true,
        progress: 95,
        statusText: "Completing changes..."
      });

      onUpdateProject({
        name: editedName.trim() || project.name,
        motto: editedMotto.trim(),
        campaignImage: finalCoverUrl,
        campaignLogo: finalLogoUrl
      });

      setSuccessMsg("✓ Campaign changes saved successfully");
      setPendingCoverFile(null);
      setPendingLogoFile(null);
    } catch (saveErr: any) {
      console.error("Save failed:", saveErr);
      setErrorMsg(`Failed to save changes: ${saveErr?.message || "Please check your network connection."}`);
      
      // Rollback to previous state
      setEditedName(previousState.name || "");
      setEditedMotto(previousState.motto || "");
      setEditedLogoUrl(previousState.campaignLogo || "");
      setEditedCoverUrl(previousState.campaignImage || "");
      setPendingCoverFile(null);
      setPendingLogoFile(null);
    } finally {
      setSavingState({
        isSaving: false,
        progress: 100,
        statusText: ""
      });
    }
  };

  const handleCancelChanges = () => {
    setEditedName(project.name || "");
    setEditedMotto(project.motto || "");
    setEditedLogoUrl(project.campaignLogo || "");
    setEditedCoverUrl(project.campaignImage || "");
    setPendingLogoFile(null);
    setPendingCoverFile(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const previewBannerUrl = editedCoverUrl || getCategoryIllustration(project.campaignCategory || project.category, "banner");
  const previewLogoUrl = editedLogoUrl || getCategoryIllustration(project.campaignCategory || project.category, "logo");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6" id="campaign-branding-settings-panel">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-base font-black text-white" id="settings-section-campaign-title">Campaign</h3>
        <p className="text-xs text-slate-400 mt-1">Manage your campaign name, motto, banner, and logo.</p>
      </div>

      {!isAuthorized && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-start gap-2 animate-scale-up">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            You currently have Read-Only access to this campaign.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-scale-up">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
          <p className="flex-1 font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 animate-scale-up">
          <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <p className="flex-1 font-bold">{successMsg}</p>
        </div>
      )}

      {/* Saving / Processing overlay */}
      {savingState.isSaving && (
        <div className="bg-slate-950/90 border border-emerald-500/20 rounded-xl p-4 space-y-3 animate-scale-up">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              {savingState.statusText}
            </span>
            <span>{savingState.progress}%</span>
          </div>
          <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${savingState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Hidden inputs for cover & logo */}
      <input 
        type="file" 
        ref={coverFileInputRef} 
        onChange={(e) => e.target.files?.[0] && processSelectedCoverFile(e.target.files[0])} 
        accept="image/png, image/jpg, image/jpeg, image/webp" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={coverCameraInputRef} 
        onChange={(e) => e.target.files?.[0] && processSelectedCoverFile(e.target.files[0])} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={logoFileInputRef} 
        onChange={(e) => e.target.files?.[0] && processSelectedLogoFile(e.target.files[0])} 
        accept="image/png, image/jpg, image/jpeg, image/webp" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={logoCameraInputRef} 
        onChange={(e) => e.target.files?.[0] && processSelectedLogoFile(e.target.files[0])} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      <div className="space-y-6">
        {/* Campaign Name Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">Campaign Name</label>
          <input 
            type="text" 
            value={editedName} 
            onChange={(e) => setEditedName(e.target.value)}
            disabled={!isAuthorized || savingState.isSaving}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none transition font-medium min-h-[44px]"
            placeholder="Enter campaign title"
            id="settings-input-campaign-name"
          />
        </div>

        {/* Campaign Motto Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-300 block">Campaign Motto</label>
            <span className="text-[10px] text-slate-500">{editedMotto.length} / 80 characters</span>
          </div>
          <input 
            type="text" 
            maxLength={80}
            value={editedMotto} 
            onChange={(e) => setEditedMotto(e.target.value)}
            disabled={!isAuthorized || savingState.isSaving}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none transition font-medium italic min-h-[44px]"
            placeholder="e.g. United in faith, building a brighter tomorrow."
            id="settings-input-campaign-motto"
          />
        </div>

        {/* Cover Banner Image Field */}
        <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 block">Cover Banner</span>
            <span className="text-[10px] text-slate-500">16:9 ratio</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-28 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
              <img 
                src={previewBannerUrl} 
                alt="Cover Preview" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={!isAuthorized || savingState.isSaving}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition min-h-[36px]"
                  id="settings-btn-replace-cover"
                >
                  Replace Cover
                </button>
                <button
                  type="button"
                  onClick={() => coverCameraInputRef.current?.click()}
                  disabled={!isAuthorized || savingState.isSaving}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 min-h-[36px]"
                  id="settings-btn-camera-cover"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" /> Use Camera
                </button>
                {editedCoverUrl !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedCoverUrl("");
                      setPendingCoverFile(null);
                    }}
                    disabled={!isAuthorized || savingState.isSaving}
                    className="px-3 py-1.5 bg-rose-950/10 hover:bg-rose-950/25 border border-rose-950/20 text-rose-300 text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 min-h-[36px]"
                    id="settings-btn-remove-cover"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Remove Cover
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Drag Zone Cover */}
          {isAuthorized && !savingState.isSaving && (
            <div 
              onDragEnter={handleCoverDrag}
              onDragLeave={handleCoverDrag}
              onDragOver={handleCoverDrag}
              onDrop={handleCoverDrop}
              onClick={() => coverFileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[64px] ${
                coverDragActive 
                  ? "border-emerald-500 bg-emerald-500/5" 
                  : "border-slate-850 bg-slate-950/20 hover:border-slate-800 hover:bg-slate-950/40"
              }`}
            >
              <Upload className="w-4 h-4 text-slate-500 mb-1" />
              <p className="text-[10px] text-slate-400">
                Drag and drop a new cover image here, or click to browse
              </p>
            </div>
          )}
        </div>

        {/* Campaign Logo Field */}
        <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 block">Campaign Logo</span>
            <span className="text-[10px] text-slate-500">1:1 ratio</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 p-1 flex items-center justify-center">
              <img 
                src={previewLogoUrl} 
                alt="Logo Preview" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={!isAuthorized || savingState.isSaving}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition min-h-[36px]"
                  id="settings-btn-replace-logo"
                >
                  Replace Logo
                </button>
                <button
                  type="button"
                  onClick={() => logoCameraInputRef.current?.click()}
                  disabled={!isAuthorized || savingState.isSaving}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 min-h-[36px]"
                  id="settings-btn-camera-logo"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" /> Use Camera
                </button>
                {editedLogoUrl !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedLogoUrl("");
                      setPendingLogoFile(null);
                    }}
                    disabled={!isAuthorized || savingState.isSaving}
                    className="px-3 py-1.5 bg-rose-950/10 hover:bg-rose-950/25 border border-rose-950/20 text-rose-300 text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 min-h-[36px]"
                    id="settings-btn-remove-logo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Drag Zone Logo */}
          {isAuthorized && !savingState.isSaving && (
            <div 
              onDragEnter={handleLogoDrag}
              onDragLeave={handleLogoDrag}
              onDragOver={handleLogoDrag}
              onDrop={handleLogoDrop}
              onClick={() => logoFileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[64px] ${
                logoDragActive 
                  ? "border-emerald-500 bg-emerald-500/5" 
                  : "border-slate-850 bg-slate-950/20 hover:border-slate-800 hover:bg-slate-950/40"
              }`}
            >
              <Upload className="w-4 h-4 text-slate-500 mb-1" />
              <p className="text-[10px] text-slate-400">
                Drag and drop a new logo badge here, or click to browse
              </p>
            </div>
          )}
        </div>

        {/* Action Controllers */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasChanges || !isAuthorized || savingState.isSaving}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold uppercase transition flex items-center gap-1.5 shadow-md min-h-[44px] ${
              hasChanges && isAuthorized && !savingState.isSaving
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
            }`}
            id="settings-btn-save-changes"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={savingState.isSaving}
              className="px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 min-h-[44px]"
              id="settings-btn-cancel-changes"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
