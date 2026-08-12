import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Search, Filter, Plus, Phone, Mail, Coins, TrendingUp, 
  Clock, ShieldCheck, Heart, FileText, ChevronRight, MessageSquare, AlertCircle, 
  Trash2, Edit, CheckCircle2, UserCheck, Calendar, MapPin, Building2, UserPlus, 
  Download, ArrowUpRight, ExternalLink, X, RotateCcw, Award, Check, Sparkles, Layers
} from "lucide-react";
import { Project, Contribution, Pledge } from "../types";
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface SupporterRelationshipCenterProps {
  activeProject: Project;
  projects?: Project[];
  contributions: Contribution[];
  pledges?: Pledge[];
  isDemoMode?: boolean;
  currentUser?: any;
  onNavigateToCampaign?: (campaignId: string) => void;
}

interface SupporterProfile {
  id: string; // phoneNumber
  fullName: string;
  phone: string;
  email?: string;
  organizationName?: string;
  location?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
}

interface CRMCommunication {
  id: string;
  supporterPhone: string;
  type: "whatsapp" | "sms" | "email" | "call";
  summary: string;
  timestamp: string;
  status?: string;
}

export interface CombinedSupporter {
  phone: string;
  fullName: string;
  email: string;
  location: string;
  notes: string;
  tags: string[];
  totalContributed: number;
  contributionCount: number;
  campaignsSupportedCount: number;
  campaignIds: string[];
  lastContributionAmount: number;
  lastContributionDate: string;
  contributions: Contribution[];
  profileId?: string;
}

export default function SupporterRelationshipCenter({
  activeProject,
  projects = [],
  contributions = [],
  pledges = [],
  isDemoMode = false,
  currentUser,
  onNavigateToCampaign
}: SupporterRelationshipCenterProps) {
  // Profiles state from Firestore
  const [profiles, setProfiles] = useState<SupporterProfile[]>([]);
  const [communications, setCommunications] = useState<CRMCommunication[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Filters & Selected Supporter State
  const [topCampaignFilter, setTopCampaignFilter] = useState<string>("all");
  const [directoryCampaignFilter, setDirectoryCampaignFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupporterPhone, setSelectedSupporterPhone] = useState<string | null>(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Forms
  const [addForm, setAddForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    location: "",
    notes: ""
  });

  // Toast Helper
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Campaign Lookup Map (id -> Project)
  const campaignMap = useMemo(() => {
    const map = new Map<string, Project>();
    if (activeProject) map.set(activeProject.id, activeProject);
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [activeProject, projects]);

  // All Available Campaigns for Filters
  const allCampaignList = useMemo(() => {
    const campaignMapSet = new Map<string, string>();
    if (activeProject) {
      campaignMapSet.set(activeProject.id, activeProject.name);
    }
    projects.forEach(p => campaignMapSet.set(p.id, p.name));
    
    // Also include any campaign names in contributions
    contributions.forEach(c => {
      const cId = c.projectId || c.campaignId || c.fundraiserId;
      if (cId && !campaignMapSet.has(cId)) {
        campaignMapSet.set(cId, `Campaign (${cId.substring(0, 6)})`);
      }
    });

    return Array.from(campaignMapSet.entries()).map(([id, name]) => ({ id, name }));
  }, [activeProject, projects, contributions]);

  // Fetch Firestore Profiles & Comms
  useEffect(() => {
    if (isDemoMode || !db) return;

    const unsubscribeProfiles = onSnapshot(
      collection(db, "supporterProfiles"),
      (snap) => {
        const list: SupporterProfile[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SupporterProfile));
        setProfiles(list);
      },
      (err) => console.error("Error listening to supporterProfiles:", err)
    );

    const unsubscribeComms = onSnapshot(
      collection(db, "communicationHistory"),
      (snap) => {
        const list: CRMCommunication[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CRMCommunication));
        setCommunications(list);
      },
      (err) => console.error("Error listening to communicationHistory:", err)
    );

    return () => {
      unsubscribeProfiles();
      unsubscribeComms();
    };
  }, [isDemoMode]);

  // Combine Contributions & Profiles into unified Supporters List
  const allSupporters = useMemo<CombinedSupporter[]>(() => {
    const supportersMap = new Map<string, CombinedSupporter>();

    // 1. Process all contributions
    contributions.forEach(c => {
      const phone = (c.senderPhone || c.phoneNumber || "").trim();
      if (!phone) return;

      const cId = c.projectId || c.campaignId || c.fundraiserId || activeProject?.id || "general";
      const cDate = c.timestamp || c.transactionTime || new Date().toISOString();

      let existing = supportersMap.get(phone);
      if (!existing) {
        // Resolve best initial name from contribution
        const rawName = c.cleanedName || c.senderName || "Supporter";
        existing = {
          phone,
          fullName: rawName,
          email: "",
          location: "",
          notes: "",
          tags: ["Contributor"],
          totalContributed: 0,
          contributionCount: 0,
          campaignsSupportedCount: 0,
          campaignIds: [],
          lastContributionAmount: c.amount,
          lastContributionDate: cDate,
          contributions: []
        };
        supportersMap.set(phone, existing);
      }

      existing.totalContributed += c.amount || 0;
      existing.contributionCount += 1;
      existing.contributions.push(c);

      if (!existing.campaignIds.includes(cId)) {
        existing.campaignIds.push(cId);
      }

      // Update latest date & amount if newer
      if (new Date(cDate) >= new Date(existing.lastContributionDate)) {
        existing.lastContributionDate = cDate;
        existing.lastContributionAmount = c.amount;
        if (c.cleanedName || c.senderName) {
          existing.fullName = c.cleanedName || c.senderName;
        }
      }
    });

    // 2. Overlay explicit Firestore Profiles or add profile-only supporters
    profiles.forEach(p => {
      const phone = (p.phone || p.id || "").trim();
      if (!phone) return;

      let existing = supportersMap.get(phone);
      if (existing) {
        if (p.fullName) existing.fullName = p.fullName;
        if (p.email) existing.email = p.email;
        if (p.location) existing.location = p.location;
        if (p.notes) existing.notes = p.notes;
        if (p.tags) existing.tags = p.tags;
        existing.profileId = p.id;
      } else {
        supportersMap.set(phone, {
          phone,
          fullName: p.fullName || "Supporter",
          email: p.email || "",
          location: p.location || "",
          notes: p.notes || "",
          tags: p.tags || ["Supporter"],
          totalContributed: 0,
          contributionCount: 0,
          campaignsSupportedCount: 0,
          campaignIds: [],
          lastContributionAmount: 0,
          lastContributionDate: p.createdAt || new Date().toISOString(),
          contributions: [],
          profileId: p.id
        });
      }
    });

    // Set final campaign count
    const result: CombinedSupporter[] = Array.from(supportersMap.values()).map(s => ({
      ...s,
      campaignsSupportedCount: s.campaignIds.length
    }));

    // Sort by total contributed descending
    return result.sort((a, b) => b.totalContributed - a.totalContributed);
  }, [contributions, profiles, activeProject]);

  // Overall Metrics Calculations
  const metrics = useMemo(() => {
    const totalSupporters = allSupporters.length;
    const totalContributions = contributions.length;
    const totalRaised = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const repeatSupporters = allSupporters.filter(s => s.contributionCount > 1).length;

    return {
      totalSupporters,
      totalContributions,
      totalRaised,
      repeatSupporters
    };
  }, [allSupporters, contributions]);

  // Top Supporters Filtered Calculation
  const topSupporters = useMemo(() => {
    let filteredContribs = contributions;
    if (topCampaignFilter !== "all") {
      filteredContribs = contributions.filter(c => 
        (c.projectId || c.campaignId || c.fundraiserId) === topCampaignFilter
      );
    }

    // Group by supporter phone
    const topMap = new Map<string, { phone: string; fullName: string; total: number; count: number; campaignCount: number }>();

    filteredContribs.forEach(c => {
      const phone = (c.senderPhone || c.phoneNumber || "").trim();
      if (!phone) return;

      const profile = profiles.find(p => p.phone === phone);
      const name = profile?.fullName || c.cleanedName || c.senderName || "Supporter";

      const current = topMap.get(phone) || { phone, fullName: name, total: 0, count: 0, campaignCount: 0 };
      current.total += c.amount || 0;
      current.count += 1;
      topMap.set(phone, current);
    });

    const sorted = Array.from(topMap.values()).sort((a, b) => b.total - a.total);
    const highestTotal = sorted[0]?.total || 1;

    return sorted.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      relativePercent: Math.min(100, Math.max(12, Math.round((item.total / highestTotal) * 100)))
    }));
  }, [contributions, topCampaignFilter, profiles]);

  // Supporter Directory Filtered List
  const directorySupporters = useMemo(() => {
    return allSupporters.filter(supporter => {
      // Campaign Filter
      if (directoryCampaignFilter !== "all") {
        if (!supporter.campaignIds.includes(directoryCampaignFilter)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        const matchesName = supporter.fullName.toLowerCase().includes(queryLower);
        const matchesPhone = supporter.phone.includes(queryLower);
        const matchesMpesa = supporter.contributions.some(c => 
          (c.transactionCode || c.receiptNumber || "").toLowerCase().includes(queryLower)
        );
        const matchesCampaign = supporter.campaignIds.some(cId => {
          const name = campaignMap.get(cId)?.name || "";
          return name.toLowerCase().includes(queryLower);
        });

        if (!matchesName && !matchesPhone && !matchesMpesa && !matchesCampaign) {
          return false;
        }
      }

      return true;
    });
  }, [allSupporters, directoryCampaignFilter, searchQuery, campaignMap]);

  // Currently Selected Supporter Object
  const selectedSupporter = useMemo(() => {
    if (!selectedSupporterPhone) return null;
    return allSupporters.find(s => s.phone === selectedSupporterPhone) || null;
  }, [selectedSupporterPhone, allSupporters]);

  // Selected Supporter Communications
  const supporterComms = useMemo(() => {
    if (!selectedSupporterPhone) return [];
    return communications.filter(c => c.supporterPhone === selectedSupporterPhone);
  }, [selectedSupporterPhone, communications]);

  // Formatting Helpers
  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString("en-KE")}`;
  };

  const formatShortKES = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return `KES ${amount.toLocaleString("en-KE")}`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "SP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Add / Save Supporter Profile
  const handleSaveAddSupporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.phone || !addForm.fullName) {
      triggerToast("Please provide at least Name and Phone Number", "error");
      return;
    }

    const newProfile: SupporterProfile = {
      id: addForm.phone.trim(),
      fullName: addForm.fullName.trim(),
      phone: addForm.phone.trim(),
      email: addForm.email.trim(),
      location: addForm.location.trim(),
      notes: addForm.notes.trim(),
      tags: ["Supporter"],
      createdAt: new Date().toISOString()
    };

    if (isDemoMode || !db) {
      setProfiles(prev => [...prev.filter(p => p.phone !== newProfile.phone), newProfile]);
      triggerToast("Supporter added successfully!", "success");
    } else {
      try {
        await setDoc(doc(db, "supporterProfiles", newProfile.id), newProfile);
        triggerToast("Supporter record saved successfully!", "success");
      } catch (err) {
        triggerToast("Failed to save supporter record", "error");
        return;
      }
    }

    setAddForm({ fullName: "", phone: "", email: "", location: "", notes: "" });
    setShowAddModal(false);
  };

  // Start Edit Existing Supporter Profile
  const handleStartEdit = (supporter: CombinedSupporter) => {
    setAddForm({
      fullName: supporter.fullName,
      phone: supporter.phone,
      email: supporter.email || "",
      location: supporter.location || "",
      notes: supporter.notes || ""
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 p-3 sm:p-5 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
              toast.type === "error" 
                ? "bg-rose-50 border-rose-200 text-rose-800" 
                : toast.type === "info"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">SUPPORTERS</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
              Verified Donors
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage contributors, giving history, and supporter relationships
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAddForm({ fullName: "", phone: "", email: "", location: "", notes: "" });
              setIsEditing(false);
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs min-h-[44px] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supporter</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TOTAL SUPPORTERS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold tracking-wider uppercase">
            <span>TOTAL SUPPORTERS</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.totalSupporters.toLocaleString("en-KE")}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Unique contributor profiles
          </p>
        </div>

        {/* TOTAL CONTRIBUTIONS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold tracking-wider uppercase">
            <span>TOTAL CONTRIBUTIONS</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.totalContributions.toLocaleString("en-KE")}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Total M-PESA transaction records
          </p>
        </div>

        {/* TOTAL RAISED */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold tracking-wider uppercase">
            <span>TOTAL RAISED</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-emerald-700">
            {formatShortKES(metrics.totalRaised)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Across all active campaigns
          </p>
        </div>

        {/* REPEAT SUPPORTERS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold tracking-wider uppercase">
            <span>REPEAT SUPPORTERS</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.repeatSupporters.toLocaleString("en-KE")}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Contributed 2+ times
          </p>
        </div>
      </div>

      {/* TOP SUPPORTERS SECTION */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>TOP SUPPORTERS</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ranked by total contribution — {
                topCampaignFilter === "all" 
                  ? "all campaigns" 
                  : (allCampaignList.find(c => c.id === topCampaignFilter)?.name || "selected campaign")
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={topCampaignFilter}
              onChange={(e) => setTopCampaignFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-h-[40px]"
            >
              <option value="all">All Campaigns ▼</option>
              {allCampaignList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TOP SUPPORTERS RANKED LIST */}
        {topSupporters.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No contribution records found for this campaign filter.
          </div>
        ) : (
          <div className="space-y-3">
            {topSupporters.map((item) => (
              <div
                key={item.phone}
                onClick={() => setSelectedSupporterPhone(item.phone)}
                className="group p-3.5 sm:p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                    item.rank === 1 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                    item.rank === 2 ? "bg-slate-200 text-slate-800 border border-slate-300" :
                    item.rank === 3 ? "bg-amber-800/10 text-amber-900 border border-amber-700/20" :
                    "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    #{item.rank}
                  </div>

                  {/* Avatar Initials */}
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(item.fullName)}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                      {item.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      {item.phone} • {item.count} contribution{item.count > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Relative Progress Bar & Total */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <div className="w-28 sm:w-36 bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.relativePercent}%` }}
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-emerald-800">
                      {formatKES(item.total)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Total Contributed
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition shrink-0 hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUPPORTER DIRECTORY SECTION */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>SUPPORTER DIRECTORY</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Search and manage individual supporters across all campaigns
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Box */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone or M-PESA ref..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Campaign Filter Dropdown */}
            <select
              value={directoryCampaignFilter}
              onChange={(e) => setDirectoryCampaignFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-h-[40px]"
            >
              <option value="all">All Campaigns ▼</option>
              {allCampaignList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DIRECTORY LIST TABLE / CARDS */}
        {directorySupporters.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-3 border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            {allSupporters.length === 0 ? (
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-900">No supporters yet.</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Once contributions are received, supporters will appear here with their giving history and campaign relationships.
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-900">NO SUPPORTERS FOUND</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Try a different name, phone number, M-PESA reference, or campaign filter.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">SUPPORTER</div>
              <div className="col-span-2 text-center">CAMPAIGNS</div>
              <div className="col-span-2 text-right">TOTAL CONTRIBUTED</div>
              <div className="col-span-2 text-right">LAST CONTRIBUTION</div>
              <div className="col-span-2 text-right">ACTION</div>
            </div>

            {directorySupporters.map((s) => (
              <div
                key={s.phone}
                className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-xl p-4 transition shadow-2xs hover:shadow-xs flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center"
              >
                {/* Supporter Info */}
                <div className="md:col-span-4 flex items-center gap-3 w-full min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    {getInitials(s.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {s.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                      <span>{s.phone}</span>
                      {s.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{s.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Campaigns Count */}
                <div className="md:col-span-2 flex md:justify-center items-center gap-1 w-full md:w-auto">
                  <span className="text-[11px] md:hidden font-bold text-slate-400 mr-2">Campaigns:</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200/60">
                    {s.campaignsSupportedCount} Campaign{s.campaignsSupportedCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Total Contributed */}
                <div className="md:col-span-2 md:text-right w-full md:w-auto flex md:block justify-between items-center">
                  <span className="text-[11px] md:hidden font-bold text-slate-400">Total Contributed:</span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-emerald-800">
                      {formatKES(s.totalContributed)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {s.contributionCount} contribution{s.contributionCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Last Contribution */}
                <div className="md:col-span-2 md:text-right w-full md:w-auto flex md:block justify-between items-center">
                  <span className="text-[11px] md:hidden font-bold text-slate-400">Last Contribution:</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {s.lastContributionAmount ? formatKES(s.lastContributionAmount) : "—"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {formatDate(s.lastContributionDate)}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="md:col-span-2 md:text-right w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => setSelectedSupporterPhone(s.phone)}
                    className="w-full md:w-auto px-3.5 py-2 bg-slate-900 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] ml-auto active:scale-95"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUPPORTER PROFILE DRAWER / SLIDE-OVER PANEL */}
      <AnimatePresence>
        {selectedSupporter && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                    {getInitials(selectedSupporter.fullName)}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">{selectedSupporter.fullName}</h2>
                    <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{selectedSupporter.phone}</span>
                      {selectedSupporter.email && (
                        <>
                          <span>•</span>
                          <span>{selectedSupporter.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(selectedSupporter)}
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                    title="Edit Supporter Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedSupporterPhone(null)}
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* Profile Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">TOTAL CONTRIBUTED</div>
                    <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
                      {formatKES(selectedSupporter.totalContributed)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">CONTRIBUTIONS</div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {selectedSupporter.contributionCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">CAMPAIGNS</div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {selectedSupporter.campaignsSupportedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">LAST CONTRIBUTION</div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {formatKES(selectedSupporter.lastContributionAmount)}
                    </div>
                  </div>
                </div>

                {/* Supporter Notes / Location if available */}
                {(selectedSupporter.location || selectedSupporter.notes) && (
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-1 text-xs">
                    {selectedSupporter.location && (
                      <div className="text-slate-700 font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Location: {selectedSupporter.location}</span>
                      </div>
                    )}
                    {selectedSupporter.notes && (
                      <p className="text-slate-600 font-medium italic">
                        "{selectedSupporter.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* CONTRIBUTION HISTORY SECTION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>CONTRIBUTION HISTORY</span>
                  </h3>

                  {selectedSupporter.contributions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No M-PESA contribution records registered for this supporter phone.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedSupporter.contributions.map((c) => {
                        const campaign = campaignMap.get(c.projectId || c.campaignId || c.fundraiserId || "");
                        const campaignName = campaign?.name || "Church & Community Fundraiser";

                        return (
                          <div
                            key={c.id}
                            className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {campaignName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                                <span>{formatDate(c.timestamp || c.transactionTime)}</span>
                                <span>•</span>
                                <span className="font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                                  Ref: {c.transactionCode || c.receiptNumber || "MPESA-CONF"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-black text-emerald-800 text-sm">
                                {formatKES(c.amount)}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Confirmed</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CAMPAIGNS SUPPORTED SECTION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>CAMPAIGNS SUPPORTED</span>
                  </h3>

                  <div className="space-y-2">
                    {selectedSupporter.campaignIds.map((cId) => {
                      const campaign = campaignMap.get(cId);
                      const campaignName = campaign?.name || `Campaign (${cId.substring(0, 8)})`;
                      const campaignContribs = selectedSupporter.contributions.filter(c => 
                        (c.projectId || c.campaignId || c.fundraiserId) === cId
                      );
                      const campaignTotal = campaignContribs.reduce((sum, c) => sum + c.amount, 0);

                      return (
                        <div
                          key={cId}
                          className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {campaignName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {campaignContribs.length} contribution{campaignContribs.length !== 1 ? "s" : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold text-slate-900">
                                {formatKES(campaignTotal)}
                              </div>
                            </div>

                            {onNavigateToCampaign && campaign && (
                              <button
                                onClick={() => {
                                  setSelectedSupporterPhone(null);
                                  onNavigateToCampaign(cId);
                                }}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                                title="Go to Campaign"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COMMUNICATION HISTORY SECTION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>COMMUNICATION HISTORY</span>
                  </h3>

                  {supporterComms.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Automated WhatsApp confirmation delivered</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Official M-PESA receipt and thank-you confirmation sent via WhatsApp bot upon payment verification.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {supporterComms.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
                            <span className="font-bold text-emerald-700 uppercase">{comm.type}</span>
                            <span>{formatDate(comm.timestamp)}</span>
                          </div>
                          <p className="text-slate-800 font-medium">{comm.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
                <a
                  href={`https://wa.me/${selectedSupporter.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Message</span>
                </a>

                <button
                  onClick={() => setSelectedSupporterPhone(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer min-h-[40px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT SUPPORTER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Edit Supporter Record" : "Add New Supporter"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddSupporter} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="e.g. Eng. James Mwangi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="e.g. +254 712 345 678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="e.g. james.mwangi@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location / City</label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="e.g. Nairobi, Kiambu, Diaspora"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    placeholder="Key notes or committee relationship details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] shadow-xs active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? "Save Changes" : "Create Supporter"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
