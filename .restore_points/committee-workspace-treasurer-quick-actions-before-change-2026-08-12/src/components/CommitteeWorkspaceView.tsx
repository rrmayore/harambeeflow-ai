import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, UserPlus, Shield, MessageSquare, FileText, ClipboardList, 
  Send, Copy, Share2, Plus, Check, Trash2, ShieldAlert, ShieldCheck,
  Search, Filter, AlertTriangle, Play, CheckCircle2, UserCheck, Bell, Pin, Paperclip,
  Activity, RefreshCw, Radio, Lock, HelpCircle, Eye, UserX, Clock, ChevronRight,
  MoreVertical, Ban, Info, X, ExternalLink
} from "lucide-react";
import { 
  collection, doc, setDoc, addDoc, getDocs, onSnapshot, 
  query, orderBy, limit, serverTimestamp, deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase";

// Roles enum
export enum UserRole {
  OWNER = "Owner",
  ADMIN = "Administrator",
  TREASURER = "Treasurer",
  ASSISTANT_TREASURER = "Assistant Treasurer",
  AUDITOR = "Auditor",
  VIEWER = "Viewer"
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "Online" | "Away" | "Offline" | "Pending" | "Expired" | "Suspended";
  joinedAt: string;
  lastActive?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  object: string;
  result: "Success" | "Failed";
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  timestamp: string;
  isPinned?: boolean;
  attachmentName?: string;
  attachmentType?: string;
}

export interface CommitteeNotification {
  id: string;
  text: string;
  type: "invite" | "role" | "milestone" | "review";
  timestamp: string;
  read: boolean;
}

interface CommitteeWorkspaceViewProps {
  activeProject: any;
  currentUser: any;
  isDemoMode: boolean;
}

// Initial seed members if database is empty
const SEED_MEMBERS: Member[] = [
  { id: "seed-1", name: "Rev. Dr. Joseph Mwangi", email: "mwangi@harambeeflow.org", phone: "254711222333", role: UserRole.OWNER, status: "Online", joinedAt: "2026-06-01T08:00:00Z", lastActive: "2026-08-12T00:15:00Z" },
  { id: "seed-2", name: "Mary Amina", email: "mary.amina@gmail.com", phone: "254722333444", role: UserRole.TREASURER, status: "Online", joinedAt: "2026-06-02T10:30:00Z", lastActive: "2026-08-11T22:30:00Z" },
  { id: "seed-3", name: "Grace Wambui", email: "grace.w@alumni.org", phone: "254733444555", role: UserRole.ADMIN, status: "Away", joinedAt: "2026-06-05T14:15:00Z" },
  { id: "seed-4", name: "David Omwamba", email: "david.o@chama.co.ke", phone: "254744555666", role: UserRole.ASSISTANT_TREASURER, status: "Offline", joinedAt: "2026-06-10T11:00:00Z" },
  { id: "seed-5", name: "Audrey Cherotich", email: "audrey.c@auditors.or.ke", phone: "254755666777", role: UserRole.AUDITOR, status: "Online", joinedAt: "2026-06-12T09:45:00Z" }
];

const SEED_LOGS: AuditLog[] = [
  { id: "log-1", user: "Rev. Dr. Joseph Mwangi", role: "Owner", action: "User login", object: "Ecosystem dashboard", result: "Success", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "log-2", user: "Mary Amina", role: "Treasurer", action: "Contribution recorded", object: "Ksh 15,000 M-PESA Cash Reconciled", result: "Success", timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString() },
  { id: "log-3", user: "Grace Wambui", role: "Administrator", action: "Fundraiser created", object: "Sound System Project", result: "Success", timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: "log-4", user: "David Omwamba", role: "Assistant Treasurer", action: "Pledge updated", object: "Assigned reminder to Elder Kamau", result: "Success", timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  { id: "log-5", user: "Audrey Cherotich", role: "Auditor", action: "Report exported", object: "June Audit Ledger PDF", result: "Success", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() }
];

const SEED_CHAT: ChatMessage[] = [
  { id: "chat-1", sender: "Rev. Dr. Joseph Mwangi", role: "Owner", text: "Welcome everyone to our internal committee workspace! We will coordinate everything related to our new Sound System fundraising project here.", timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), isPinned: true },
  { id: "chat-2", sender: "Mary Amina", role: "Treasurer", text: "Great to be here! I have successfully generated our June financial spreadsheet. I am pinning it below.", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), isPinned: false, attachmentName: "June_Ledger_Final.xlsx", attachmentType: "document" },
  { id: "chat-3", sender: "Audrey Cherotich", role: "Auditor", text: "Excellent work, Mary. The double-entry ledger is reconciled perfectly against our Safaricom statement webhook log. Keep it up!", timestamp: new Date(Date.now() - 3600000 * 3).toISOString() }
];

const SEED_NOTIFS: CommitteeNotification[] = [
  { id: "notif-1", text: "Rev. Dr. Joseph Mwangi welcomed you to the internal team workspace.", type: "invite", timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: "notif-2", text: "The primary fundraising target is 65% complete. Milestone alert!", type: "milestone", timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), read: true }
];

// Role descriptions matching actual application authorization logic
const ROLE_PERMISSIONS_INFO = [
  {
    role: UserRole.OWNER,
    badgeColor: "bg-indigo-950 text-indigo-400 border-indigo-800/40",
    description: "Full committee and campaign administration. Can add/remove members, assign/change all roles, manage settings, and access financial logs.",
    privileges: ["Add & remove members", "Modify member roles", "Full financial & settings management", "Access unalterable audit trail"]
  },
  {
    role: UserRole.ADMIN,
    badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-800/40",
    description: "Manage committee members and operational settings.",
    privileges: ["Invite new committee members", "Manage campaign operational settings", "Create & publish updates", "View financial summaries"]
  },
  {
    role: UserRole.TREASURER,
    badgeColor: "bg-amber-950 text-amber-400 border-amber-800/40",
    description: "Manage financial records and treasury operations.",
    privileges: ["Record & reconcile manual cash payments", "Manage pledge tracking & reminders", "Export treasury reconciliation reports", "Query Safaricom statement webhooks"]
  },
  {
    role: UserRole.ASSISTANT_TREASURER,
    badgeColor: "bg-sky-950 text-sky-400 border-sky-800/40",
    description: "Assist with assigned fundraising operations.",
    privileges: ["Record manual contribution logs", "Track supporter pledge status", "Draft WhatsApp communication templates", "View workspace dashboard"]
  },
  {
    role: UserRole.AUDITOR,
    badgeColor: "bg-purple-950 text-purple-400 border-purple-800/40",
    description: "Review financial records and audit activity.",
    privileges: ["Read-only access to all financial ledgers", "Verify Safaricom transaction webhooks", "Download PDF audit statement certificates", "Inspect complete committee activity log"]
  },
  {
    role: UserRole.VIEWER,
    badgeColor: "bg-slate-900 text-slate-400 border-slate-700/40",
    description: "Read-only access to campaign workspace dashboard.",
    privileges: ["View high-level campaign stats", "Read announcements & updates", "No editing or financial modification rights"]
  }
];

export default function CommitteeWorkspaceView({
  activeProject,
  currentUser,
  isDemoMode
}: CommitteeWorkspaceViewProps) {
  // Active viewing/testing role (Owner by default, customizable ONLY in sandbox/demo mode)
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.OWNER);

  // States
  const [subTab, setSubTab] = useState<"overview" | "invite" | "logs" | "chat" | "notifications">("overview");
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_LOGS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(SEED_CHAT);
  const [notifications, setNotifications] = useState<CommitteeNotification[]>(SEED_NOTIFS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Drawer States
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<Member | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "remove" | "suspend" | "reactivate" | "cancelInvite";
    member: Member;
  } | null>(null);
  const [showRoleGuideModal, setShowRoleGuideModal] = useState<boolean>(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Form states for invitation
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.TREASURER);
  const [inviteMsg, setInviteMsg] = useState("");

  // Chat input
  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState<{ name: string; type: string } | null>(null);
  
  // Permission restriction modal
  const [restrictedAction, setRestrictedAction] = useState<{ action: string; requiredRole: string[] } | null>(null);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [logFilter, setLogFilter] = useState("all");

  const orgId = activeProject?.organizationId || activeProject?.id || "org-default";
  const orgName = activeProject?.organizer || activeProject?.fundraiserName ? `${activeProject.organizer || activeProject.fundraiserName} Committee` : "Harambee Committee";

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    if (subTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, subTab]);

  // Firestore bindings
  useEffect(() => {
    if (isDemoMode || !db) return;

    // Listen for members
    const membersQuery = collection(db, "organizations", orgId, "members");
    const unsubMembers = onSnapshot(membersQuery, (snap) => {
      if (!snap.empty) {
        const list: Member[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Member);
        });
        setMembers(list);
      } else {
        // Seed if empty
        SEED_MEMBERS.forEach(async (m) => {
          await setDoc(doc(db, "organizations", orgId, "members", m.id), m);
        });
      }
    });

    // Listen for audit logs
    const logsQuery = query(collection(db, "organizations", orgId, "auditLogs"), orderBy("timestamp", "desc"), limit(100));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      if (!snap.empty) {
        const list: AuditLog[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        setAuditLogs(list);
      } else {
        SEED_LOGS.forEach(async (l) => {
          await setDoc(doc(db, "organizations", orgId, "auditLogs", l.id), l);
        });
      }
    });

    // Listen for chat
    const chatQuery = query(collection(db, "organizations", orgId, "activity"), orderBy("timestamp", "asc"), limit(100));
    const unsubChat = onSnapshot(chatQuery, (snap) => {
      if (!snap.empty) {
        const list: ChatMessage[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        setChatMessages(list);
      } else {
        SEED_CHAT.forEach(async (c) => {
          await setDoc(doc(db, "organizations", orgId, "activity", c.id), c);
        });
      }
    });

    // Listen for notifications
    const notifQuery = query(collection(db, "organizations", orgId, "notifications"), orderBy("timestamp", "desc"));
    const unsubNotif = onSnapshot(notifQuery, (snap) => {
      if (!snap.empty) {
        const list: CommitteeNotification[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CommitteeNotification);
        });
        setNotifications(list);
      } else {
        SEED_NOTIFS.forEach(async (n) => {
          await setDoc(doc(db, "organizations", orgId, "notifications", n.id), n);
        });
      }
    });

    return () => {
      unsubMembers();
      unsubLogs();
      unsubChat();
      unsubNotif();
    };
  }, [orgId, isDemoMode]);

  // Check roles permissions
  const checkPermission = (action: string, allowedRoles: UserRole[]): boolean => {
    if (allowedRoles.includes(activeRole)) {
      return true;
    }
    setRestrictedAction({ action, requiredRole: allowedRoles });
    return false;
  };

  // Log action automatically
  const logAuditAction = async (action: string, object: string, result: "Success" | "Failed") => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: currentUser?.email || "Ecosystem Admin",
      role: activeRole,
      action,
      object,
      result,
      timestamp: new Date().toISOString()
    };

    if (!isDemoMode && db) {
      try {
        await addDoc(collection(db, "organizations", orgId, "auditLogs"), newLog);
      } catch (e) {
        console.error(e);
      }
    } else {
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Add notification
  const triggerNotification = async (text: string, type: "invite" | "role" | "milestone" | "review") => {
    const notif: CommitteeNotification = {
      id: `notif-${Date.now()}`,
      text,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (!isDemoMode && db) {
      try {
        await addDoc(collection(db, "organizations", orgId, "notifications"), notif);
      } catch (e) {
        console.error(e);
      }
    } else {
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Invitation handlers
  const handleSendInvitation = async () => {
    // Permission: Only Owner or Admin can invite members
    if (!checkPermission("Invite new members", [UserRole.OWNER, UserRole.ADMIN])) {
      return;
    }

    if (!inviteName.trim() || !inviteEmail.trim() || !invitePhone.trim()) {
      alert("Please fill out all primary invitation fields.");
      return;
    }

    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim(),
      role: inviteRole,
      status: "Pending",
      joinedAt: new Date().toISOString()
    };

    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "organizations", orgId, "members", newMember.id), newMember);
      } catch (e) {
        console.error(e);
      }
    } else {
      setMembers(prev => [...prev, newMember]);
    }

    await logAuditAction("Member invited", `${inviteName} (${inviteRole})`, "Success");
    await triggerNotification(`New member ${inviteName} invited as ${inviteRole}`, "invite");

    // Reset Form
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteMsg("");
    
    // Switch back to overview tab
    setSubTab("overview");
  };

  // Confirm and Execute Destructive Actions
  const executeConfirmedAction = async () => {
    if (!confirmModal) return;
    const { type, member } = confirmModal;

    if (type === "remove") {
      if (!checkPermission("Remove committee members", [UserRole.OWNER])) {
        setConfirmModal(null);
        return;
      }
      if (!isDemoMode && db) {
        try {
          await deleteDoc(doc(db, "organizations", orgId, "members", member.id));
        } catch (e) {
          console.error(e);
        }
      }
      setMembers(prev => prev.filter(m => m.id !== member.id));
      await logAuditAction("Member removed", member.name, "Success");
    } else if (type === "suspend") {
      if (!checkPermission("Suspend committee members", [UserRole.OWNER, UserRole.ADMIN])) {
        setConfirmModal(null);
        return;
      }
      const updatedStatus: Member["status"] = "Suspended";
      if (!isDemoMode && db) {
        try {
          await setDoc(doc(db, "organizations", orgId, "members", member.id), { status: updatedStatus }, { merge: true });
        } catch (e) {
          console.error(e);
        }
      }
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: updatedStatus } : m));
      await logAuditAction("Member suspended", member.name, "Success");
      await triggerNotification(`${member.name}'s account access was suspended`, "role");
    } else if (type === "reactivate") {
      if (!checkPermission("Reactivate committee members", [UserRole.OWNER, UserRole.ADMIN])) {
        setConfirmModal(null);
        return;
      }
      const updatedStatus: Member["status"] = "Offline";
      if (!isDemoMode && db) {
        try {
          await setDoc(doc(db, "organizations", orgId, "members", member.id), { status: updatedStatus }, { merge: true });
        } catch (e) {
          console.error(e);
        }
      }
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: updatedStatus } : m));
      await logAuditAction("Member access reactivated", member.name, "Success");
    } else if (type === "cancelInvite") {
      if (!checkPermission("Cancel invitation", [UserRole.OWNER, UserRole.ADMIN])) {
        setConfirmModal(null);
        return;
      }
      if (!isDemoMode && db) {
        try {
          await deleteDoc(doc(db, "organizations", orgId, "members", member.id));
        } catch (e) {
          console.error(e);
        }
      }
      setMembers(prev => prev.filter(m => m.id !== member.id));
      await logAuditAction("Invitation cancelled", `${member.name} (${member.email})`, "Success");
    }

    setConfirmModal(null);
  };

  // Change Role handler
  const handleModifyMemberRole = async (memberId: string, memberName: string, newRole: UserRole) => {
    if (!checkPermission("Modify roles of committee members", [UserRole.OWNER])) {
      return;
    }

    if (!isDemoMode && db) {
      try {
        await setDoc(doc(db, "organizations", orgId, "members", memberId), { role: newRole }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    }

    await logAuditAction("Role changed", `${memberName} to ${newRole}`, "Success");
    await triggerNotification(`${memberName}'s role was updated to ${newRole}`, "role");
  };

  // Send Chat message
  const handleSendChatMessage = async () => {
    if (!checkPermission("Send workspace chat messages", [UserRole.OWNER, UserRole.ADMIN, UserRole.TREASURER, UserRole.ASSISTANT_TREASURER, UserRole.AUDITOR])) {
      return;
    }

    if (!chatInput.trim() && !chatAttachment) return;

    const msg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: currentUser?.email ? currentUser.email.split("@")[0] : "Ecosystem Admin",
      role: activeRole,
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    if (chatAttachment) {
      msg.attachmentName = chatAttachment.name;
      msg.attachmentType = chatAttachment.type;
    }

    if (!isDemoMode && db) {
      try {
        await addDoc(collection(db, "organizations", orgId, "activity"), msg);
      } catch (e) {
        console.error(e);
      }
    } else {
      setChatMessages(prev => [...prev, msg]);
    }

    setChatInput("");
    setChatAttachment(null);

    // Dynamic response from other member in demo mode
    setTimeout(() => {
      const response: ChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: "Mary Amina",
        role: UserRole.TREASURER,
        text: `Got your update! I am checking the ledger records now. Let me know if we need to reconcile any manual payments immediately.`,
        timestamp: new Date().toISOString()
      };
      if (isDemoMode) {
        setChatMessages(prev => [...prev, response]);
      }
    }, 2000);
  };

  const handleCopyInviteLink = () => {
    const link = `https://harambeeflow.org/join?org=${orgId}&ref=committee`;
    navigator.clipboard.writeText(link);
    setCopiedId("link");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsAppInvite = () => {
    const text = `Hi, you have been invited to join the ${orgName} committee on HarambeeFlow as a ${inviteRole}. Join here: https://harambeeflow.org/join?org=${orgId}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Mock upload attachment
  const handleSimulateAttachment = () => {
    setChatAttachment({
      name: `Reconciliation_Receipt_Ksh_${Math.floor(Math.random() * 5000 + 1000)}.pdf`,
      type: "document"
    });
  };

  // Derived Operational Summary Metrics
  const totalMembersCount = members.length;
  const onlineMembers = members.filter(m => m.status === "Online");
  const onlineCount = onlineMembers.length;
  const pendingCount = members.filter(m => m.status === "Pending" || m.status === "Expired").length;
  const suspendedCount = members.filter(m => m.status === "Suspended").length;

  const roleCounts = {
    Owner: members.filter(m => m.role === UserRole.OWNER).length,
    Admin: members.filter(m => m.role === UserRole.ADMIN).length,
    Treasurer: members.filter(m => m.role === UserRole.TREASURER).length,
    Assistant: members.filter(m => m.role === UserRole.ASSISTANT_TREASURER).length,
    Auditor: members.filter(m => m.role === UserRole.AUDITOR).length,
    Viewer: members.filter(m => m.role === UserRole.VIEWER).length,
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.object.toLowerCase().includes(searchTerm.toLowerCase());
    if (logFilter === "all") return matchesSearch;
    return matchesSearch && log.result.toLowerCase() === logFilter.toLowerCase();
  });

  const activeUserRoleDisplay = currentUser?.role || activeRole || UserRole.OWNER;

  return (
    <div className="flex-1 bg-slate-950 p-4 md:p-6 text-slate-100 min-h-full space-y-6 overflow-y-auto" id="committee-workspace">
      
      {/* Header Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/30">
              🟢 Enterprise Active
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Shortcode: {activeProject?.mpesaShortcode || "222111"}
            </span>
            <button
              onClick={() => setShowRoleGuideModal(true)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 transition cursor-pointer flex items-center gap-1"
            >
              <Info className="w-3 h-3 text-indigo-400" />
              Role Permissions Guide
            </button>
          </div>
          <h1 className="text-xl md:text-2xl font-sans font-black tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400 shrink-0" />
            {orgName} Workspace
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Invite, organize and securely manage the same fundraiser alongside trusted treasurers, auditors, and administrators with clear role division and complete, unalterable accountability logs.
          </p>
        </div>

        {/* Persona Switcher / Role View */}
        {isDemoMode ? (
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-1 shrink-0">
            <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
              🧪 Sandbox Persona Switcher:
            </label>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <select
                value={activeRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setActiveRole(newRole);
                  logAuditAction("Role changed", `Switched tester view to ${newRole}`, "Success");
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer font-sans font-medium"
              >
                {Object.values(UserRole).map(r => (
                  <option key={r} value={r}>{r} Mode</option>
                ))}
              </select>
            </div>
            <p className="text-[9px] text-slate-500 font-mono leading-tight">
              Test restrictions live in sandbox mode.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                Authenticated Access
              </span>
              <p className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                Your role: <span className="text-emerald-400 font-extrabold">{activeUserRoleDisplay}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Operational Summary + Role Composition Stats */}
      <div className="space-y-3">
        {/* Row 1: Key Operational Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 font-sans flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Total Members</p>
              <p className="text-2xl font-black text-white mt-1">{totalMembersCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 font-sans flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400">Online Now</p>
              <p className="text-2xl font-black text-emerald-300 mt-1">{onlineCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-900/40 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-amber-900/40 bg-amber-950/20 font-sans flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-400">Pending Invitations</p>
              <p className="text-2xl font-black text-amber-300 mt-1">{pendingCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-900/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-rose-900/40 bg-rose-950/20 font-sans flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-rose-400">Suspended Members</p>
              <p className="text-2xl font-black text-rose-300 mt-1">{suspendedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-900/40 flex items-center justify-center text-rose-400">
              <Ban className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Row 2: Role Composition Counters */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          {[
            { label: "Owners", count: roleCounts.Owner, color: "border-indigo-500/30 text-indigo-400 bg-indigo-950/20" },
            { label: "Administrators", count: roleCounts.Admin, color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20" },
            { label: "Treasurers", count: roleCounts.Treasurer, color: "border-amber-500/30 text-amber-400 bg-amber-950/20" },
            { label: "Assistants", count: roleCounts.Assistant, color: "border-sky-500/30 text-sky-400 bg-sky-950/20" },
            { label: "Auditors", count: roleCounts.Auditor, color: "border-purple-500/30 text-purple-400 bg-purple-950/20" },
            { label: "Viewers", count: roleCounts.Viewer, color: "border-slate-600/30 text-slate-400 bg-slate-900/20" },
          ].map((item, index) => (
            <div key={index} className={`p-2.5 rounded-xl border text-center font-sans ${item.color}`}>
              <p className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-80">{item.label}</p>
              <p className="text-lg font-bold mt-0.5">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace Navigation Shell */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[500px]">
        {/* Sub-tab navigation */}
        <div className="bg-slate-950/50 border-b border-slate-800 px-4 pt-2 flex flex-wrap gap-1.5">
          {[
            { id: "overview", label: "Committee Overview", icon: Users },
            { id: "invite", label: "Invite Member", icon: UserPlus, count: pendingCount },
            { id: "logs", label: "Audit Log Trail", icon: ClipboardList },
            { id: "chat", label: "Internal Chat Room", icon: MessageSquare },
            { id: "notifications", label: "Notifications Feed", icon: Bell, count: notifications.filter(n => !n.read).length },
          ].map(t => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer -mb-[1px] ${
                  isActive 
                    ? "bg-slate-900 text-emerald-400 border-slate-800" 
                    : "bg-transparent text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                {t.label}
                {t.count && t.count > 0 ? (
                  <span className="w-4.5 h-4.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse shrink-0">
                    {t.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {subTab === "overview" && (
              <motion.div
                key="overview-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Active Members Grid */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white font-sans uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="w-4.5 h-4.5 text-emerald-400" /> Active Committee Roster
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        Total enrolled: {members.length} members
                      </span>
                      <button
                        onClick={() => setShowRoleGuideModal(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer ml-2"
                      >
                        Permissions Matrix
                      </button>
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                      No committee members found in this workspace. Click "Invite Member" to add your team.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.map((member) => (
                        <div key={member.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-700 transition relative">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center text-sm font-bold border border-slate-700 text-white">
                                  {member.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                                </div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                                  member.status === "Online" ? "bg-emerald-500" :
                                  member.status === "Away" ? "bg-amber-500" :
                                  member.status === "Pending" ? "bg-sky-400 animate-pulse" :
                                  member.status === "Suspended" ? "bg-rose-500" : "bg-slate-500"
                                }`} title={`Status: ${member.status}`} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-bold text-white truncate">{member.name}</h4>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold shrink-0 ${
                                    member.role === UserRole.OWNER ? "bg-indigo-950 text-indigo-400 border border-indigo-800/30" :
                                    member.role === UserRole.ADMIN ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30" :
                                    member.role === UserRole.TREASURER ? "bg-amber-950 text-amber-400 border border-amber-800/30" :
                                    member.role === UserRole.ASSISTANT_TREASURER ? "bg-sky-950 text-sky-400 border border-sky-800/30" :
                                    member.role === UserRole.AUDITOR ? "bg-purple-950 text-purple-400 border border-purple-800/30" :
                                    "bg-slate-900 text-slate-400 border border-slate-700/30"
                                  }`}>
                                    {member.role}
                                  </span>
                                </div>

                                <p className="text-[10px] text-slate-400 mt-1 truncate">
                                  {member.email} {member.phone ? `• ${member.phone}` : ""}
                                </p>

                                <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-500 font-mono flex-wrap">
                                  <span>Joined: {new Date(member.joinedAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>
                                    {member.lastActive 
                                      ? `Active: ${new Date(member.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                      : "Activity not available."}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Pill Badge */}
                            <div className="shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                                member.status === "Online" ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/30" :
                                member.status === "Away" ? "bg-amber-950/60 text-amber-400 border-amber-800/30" :
                                member.status === "Pending" ? "bg-sky-950/60 text-sky-400 border-sky-800/30" :
                                member.status === "Suspended" ? "bg-rose-950/60 text-rose-400 border-rose-800/30" :
                                "bg-slate-900 text-slate-400 border-slate-800"
                              }`}>
                                {member.status}
                              </span>
                            </div>
                          </div>

                          {/* Action Footer Bar */}
                          <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedMemberProfile(member)}
                              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Profile
                            </button>

                            <div className="flex items-center gap-1.5">
                              {/* Role Selector (Owner only) */}
                              {activeRole === UserRole.OWNER && member.role !== UserRole.OWNER && (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleModifyMemberRole(member.id, member.name, e.target.value as UserRole)}
                                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                                  title="Change Role"
                                >
                                  <option value={UserRole.ADMIN}>Admin</option>
                                  <option value={UserRole.TREASURER}>Treasurer</option>
                                  <option value={UserRole.ASSISTANT_TREASURER}>Assistant</option>
                                  <option value={UserRole.AUDITOR}>Auditor</option>
                                  <option value={UserRole.VIEWER}>Viewer</option>
                                </select>
                              )}

                              {/* View Activity */}
                              <button
                                onClick={() => {
                                  setSearchTerm(member.name);
                                  setSubTab("logs");
                                }}
                                className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded transition cursor-pointer"
                                title="Filter activity logs"
                              >
                                Activity
                              </button>

                              {/* Suspend / Reactivate Action */}
                              {member.role !== UserRole.OWNER && (
                                member.status === "Suspended" ? (
                                  <button
                                    onClick={() => setConfirmModal({ type: "reactivate", member })}
                                    className="p-1 text-emerald-400 hover:bg-emerald-950/30 rounded transition cursor-pointer"
                                    title="Reactivate Access"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setConfirmModal({ type: "suspend", member })}
                                    className="p-1 text-slate-500 hover:text-amber-400 rounded transition hover:bg-amber-950/20 cursor-pointer"
                                    title="Suspend Access"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}

                              {/* Remove Member Action */}
                              {member.role !== UserRole.OWNER && (
                                <button
                                  onClick={() => setConfirmModal({ type: "remove", member })}
                                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition hover:bg-rose-950/20 cursor-pointer"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Committee Activity Summary (Compact) */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Recent Committee Activity
                    </h4>
                    <button
                      onClick={() => setSubTab("logs")}
                      className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Audit Trail <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No recent committee activity recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs gap-3">
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="font-bold text-white truncate shrink-0">{log.user}</span>
                            <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded shrink-0">{log.role}</span>
                            <span className="text-slate-400 truncate">— {log.action}: <span className="text-slate-200">{log.object}</span></span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workspace Presence Panel */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Live Workspace Presence</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Active team members logged into this fundraiser:</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {onlineMembers.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono italic">No other committee members currently online.</span>
                    ) : (
                      onlineMembers.map((m) => (
                        <span key={m.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-[10px] font-mono text-slate-300 border border-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {m.name} ({m.role})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* INVITATION FORM TAB */}
            {subTab === "invite" && (
              <motion.div
                key="invite-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <div className="space-y-1 text-center">
                  <h3 className="text-sm font-bold text-white font-sans uppercase tracking-wider">
                    Invite New Committee Member
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add administrators, treasurers, and auditors to securely help manage statement ledgers and campaign goals.
                  </p>
                </div>

                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Full Name:</label>
                      <input 
                        type="text"
                        placeholder="e.g. Richard Mwenda"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 rounded-xl transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Email Address:</label>
                      <input 
                        type="email"
                        placeholder="e.g. mwenda@school.org"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 rounded-xl transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Phone Number (Safaricom):</label>
                      <input 
                        type="tel"
                        placeholder="e.g. 254712345678"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 rounded-xl transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Committee Role:</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 rounded-xl transition cursor-pointer"
                      >
                        <option value={UserRole.ADMIN}>Administrator (Create, Edit, Settings)</option>
                        <option value={UserRole.TREASURER}>Treasurer (Reconcile, Reports, Manual Logs)</option>
                        <option value={UserRole.ASSISTANT_TREASURER}>Assistant Treasurer (Manual Logs, Pledges, SMS)</option>
                        <option value={UserRole.AUDITOR}>Auditor (Read-only reports, Audit trail)</option>
                        <option value={UserRole.VIEWER}>Viewer (Dashboard read-only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Welcome Greeting (Optional):</label>
                    <textarea 
                      placeholder="e.g. Welcome to the treasury committee. Let's build accountability!"
                      rows={2.5}
                      value={inviteMsg}
                      onChange={(e) => setInviteMsg(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 rounded-xl transition resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={handleSendInvitation}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <UserPlus className="w-4.5 h-4.5" />
                      Send Committee Invite
                    </button>
                    
                    <button
                      onClick={handleCopyInviteLink}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-slate-200"
                    >
                      {copiedId === "link" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedId === "link" ? "Copied!" : "Copy Link"}
                    </button>

                    <button
                      onClick={handleSendWhatsAppInvite}
                      className="px-4 py-3 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/20 text-emerald-400 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      WhatsApp Invite
                    </button>
                  </div>
                </div>

                {/* Pending & Expired Invitations List */}
                <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Pending Committee Invitations
                  </h4>

                  {members.filter(m => m.status === "Pending" || m.status === "Expired").length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No pending committee invitations.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {members.filter(m => m.status === "Pending" || m.status === "Expired").map((pendingMem) => (
                        <div key={pendingMem.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-bold text-white">{pendingMem.name} <span className="text-[10px] font-mono text-amber-400">({pendingMem.role})</span></p>
                            <p className="text-[10px] text-slate-400 font-mono">{pendingMem.email} • Sent: {new Date(pendingMem.joinedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmModal({ type: "cancelInvite", member: pendingMem })}
                              className="px-2.5 py-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-900/40 rounded transition cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role descriptions cheat-sheet cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Treasurer Privileges
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Complete visibility into contributions, logs manual cash transactions, manages pledge alerts, exports official reconciliation sheets, and queries Safaricom API status logs.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Auditor Privileges
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Completely read-only sandbox. Access ledger balances, verify incoming transactional webhooks, generate audit reviews and download PDF statements. Absolute lock-down preventing editing.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUDIT LOG TRAIL TAB */}
            {subTab === "logs" && (
              <motion.div
                key="logs-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Search/Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="Search audit trail logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl focus:outline-none"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")} 
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">Result Filter:</span>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {["all", "success", "failed"].map(f => (
                        <button
                          key={f}
                          onClick={() => setLogFilter(f)}
                          className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md uppercase transition cursor-pointer ${
                            logFilter === f 
                              ? "bg-slate-850 text-emerald-400" 
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="border border-slate-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">User Profile</th>
                        <th className="p-3.5">Committee Role</th>
                        <th className="p-3.5">Audit Event / Action</th>
                        <th className="p-3.5">Target Scope Object</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/30 transition">
                          <td className="p-3.5 font-bold text-white">{log.user}</td>
                          <td className="p-3.5 font-mono text-[10px] text-slate-300">{log.role}</td>
                          <td className="p-3.5 font-medium">{log.action}</td>
                          <td className="p-3.5 text-slate-400 italic">{log.object}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                              log.result === "Success" 
                                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20" 
                                : "bg-rose-950/40 text-rose-400 border border-rose-800/20"
                            }`}>
                              {log.result}
                            </span>
                          </td>
                          <td className="p-3.5 text-right text-slate-500 font-mono text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                            No matching audit trail events found in database logs.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* INTERNAL CHAT ROOM TAB */}
            {subTab === "chat" && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col h-[420px] justify-between"
              >
                {/* Pinned message bar */}
                <div className="bg-indigo-950/30 border border-indigo-800/20 px-3 py-2 rounded-xl flex items-start gap-2.5 mb-3">
                  <Pin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-indigo-300 font-mono uppercase tracking-wider">Pinned Announcement</p>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      "Welcome everyone to our internal committee workspace! We will coordinate everything..."
                    </p>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4 scrollbar-thin scrollbar-thumb-slate-800">
                  {chatMessages.map((msg) => {
                    const isCurrentUser = msg.sender === (currentUser?.email ? currentUser.email.split("@")[0] : "Ecosystem Admin");
                    const hasProfilePhoto = currentUser?.photoURL || currentUser?.profilePhotoURL;
                    return (
                      <div key={msg.id} className="flex gap-2.5">
                        {isCurrentUser && hasProfilePhoto ? (
                          <img 
                            src={currentUser.photoURL || currentUser.profilePhotoURL} 
                            alt="User Avatar" 
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0 text-slate-300">
                            {msg.sender.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1 bg-slate-950/50 border border-slate-850 p-3 rounded-2xl max-w-[85%]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">{msg.sender}</span>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {msg.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{msg.text}</p>
                        
                        {/* File Attachment preview */}
                        {msg.attachmentName && (
                          <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 max-w-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">{msg.attachmentName}</p>
                                <p className="text-[9px] text-slate-500 font-mono">Simulated document attachment</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                alert(`Simulating file download of: ${msg.attachmentName}`);
                                logAuditAction("Report exported", msg.attachmentName, "Success");
                              }}
                              className="px-2.5 py-1 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded hover:bg-emerald-900 cursor-pointer shrink-0"
                            >
                              Download
                            </button>
                          </div>
                        )}

                        <p className="text-[9px] text-slate-500 text-right font-mono mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="space-y-2 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                  {chatAttachment && (
                    <div className="px-3 py-1.5 bg-emerald-950/30 border border-emerald-900/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-300 truncate">{chatAttachment.name}</span>
                      </div>
                      <button 
                        onClick={() => setChatAttachment(null)}
                        className="text-slate-500 hover:text-rose-400 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleSimulateAttachment}
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition cursor-pointer shrink-0"
                      title="Attach receipt or document"
                    >
                      <Paperclip className="w-4.5 h-4.5" />
                    </button>

                    <input 
                      type="text"
                      placeholder="Type a message internally to the committee..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                      className="flex-1 bg-transparent px-2.5 py-1.5 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500"
                    />

                    <button
                      onClick={handleSendChatMessage}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {subTab === "notifications" && (
              <motion.div
                key="notifs-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Recent Workspace Notifications
                  </h3>
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      logAuditAction("Notifications read", "Marked all as read", "Success");
                    }}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer underline"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                      n.read 
                        ? "bg-slate-950/20 border-slate-850 opacity-60" 
                        : "bg-slate-950/80 border-slate-800 shadow-sm"
                    }`}>
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        n.type === "invite" ? "bg-indigo-950 text-indigo-400" :
                        n.type === "role" ? "bg-amber-950 text-amber-400" :
                        n.type === "milestone" ? "bg-emerald-950 text-emerald-400" : "bg-purple-950 text-purple-400"
                      }`}>
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 leading-relaxed">{n.text}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-1">
                          {new Date(n.timestamp).toLocaleDateString()} at {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                          }}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-[10px] rounded cursor-pointer border border-slate-800"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      No workspace notifications pending.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>

      {/* MEMBER PROFILE MODAL */}
      <AnimatePresence>
        {selectedMemberProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedMemberProfile(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {selectedMemberProfile.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{selectedMemberProfile.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                    {selectedMemberProfile.role}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-200 font-bold">{selectedMemberProfile.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-200 font-bold">{selectedMemberProfile.phone || "Not recorded"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Joined Workspace:</span>
                  <span className="text-slate-200 font-bold">{new Date(selectedMemberProfile.joinedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Account Status:</span>
                  <span className={`font-bold uppercase ${
                    selectedMemberProfile.status === "Online" ? "text-emerald-400" :
                    selectedMemberProfile.status === "Away" ? "text-amber-400" :
                    selectedMemberProfile.status === "Suspended" ? "text-rose-400" : "text-slate-400"
                  }`}>
                    {selectedMemberProfile.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Active:</span>
                  <span className="text-slate-200 font-bold">
                    {selectedMemberProfile.lastActive 
                      ? new Date(selectedMemberProfile.lastActive).toLocaleString() 
                      : "Activity not available."}
                  </span>
                </div>
              </div>

              {/* Role Permissions Summary */}
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-indigo-300 font-mono uppercase tracking-wider">
                  Role Authorization Overview
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ROLE_PERMISSIONS_INFO.find(r => r.role === selectedMemberProfile.role)?.description || "Standard workspace permissions."}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedMemberProfile(null)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-xl border border-slate-800 cursor-pointer transition"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DESTRUCTIVE ACTION MODAL */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-950/60 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-800/30">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {confirmModal.type === "remove" ? "Remove Committee Member?" :
                   confirmModal.type === "suspend" ? "Suspend Member Access?" :
                   confirmModal.type === "reactivate" ? "Reactivate Member Access?" : "Revoke Committee Invitation?"}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {confirmModal.type === "remove" 
                    ? `Are you sure you want to permanently remove ${confirmModal.member.name} from the ${orgName} workspace? They will lose access to internal committee chat and ledgers.`
                    : confirmModal.type === "suspend"
                    ? `Are you sure you want to suspend access for ${confirmModal.member.name}? Their login will be revoked until reactivated.`
                    : confirmModal.type === "reactivate"
                    ? `Reactivate workspace access for ${confirmModal.member.name}?`
                    : `Cancel pending invitation sent to ${confirmModal.member.name} (${confirmModal.member.email})?`}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md ${
                    confirmModal.type === "reactivate" 
                      ? "bg-emerald-600 hover:bg-emerald-500" 
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {confirmModal.type === "remove" ? "Yes, Remove Member" :
                   confirmModal.type === "suspend" ? "Yes, Suspend Access" :
                   confirmModal.type === "reactivate" ? "Yes, Reactivate" : "Yes, Revoke Invitation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROLE PERMISSIONS GUIDE MATRIX MODAL */}
      <AnimatePresence>
        {showRoleGuideModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowRoleGuideModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Committee Role Permissions Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Authorization boundaries enforced across the HarambeeFlow workspace.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ROLE_PERMISSIONS_INFO.map((rInfo) => (
                  <div key={rInfo.role} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${rInfo.badgeColor}`}>
                        {rInfo.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{rInfo.description}</p>
                    <div className="pt-1 space-y-1">
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Granted Privileges:</p>
                      <ul className="space-y-0.5">
                        {rInfo.privileges.map((p, idx) => (
                          <li key={idx} className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            <span className="text-emerald-400">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowRoleGuideModal(false)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-xl border border-slate-800 cursor-pointer transition"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACCESS DENIED MODAL */}
      <AnimatePresence>
        {restrictedAction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-950/60 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-800/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Access Restricted by Permission Engine
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are currently active as <strong className="text-amber-400">{activeRole}</strong>.
                </p>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-2 text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>Action Attempted:</span>
                    <strong className="text-slate-200">{restrictedAction.action}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Required Roles:</span>
                    <strong className="text-emerald-400">{restrictedAction.requiredRole.join(", ")}</strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Contact your committee Owner or Administrator to adjust your role access level.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setRestrictedAction(null)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-xl border border-slate-800 cursor-pointer transition"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
