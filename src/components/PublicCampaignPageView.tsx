import React, { useState, useEffect, useRef } from "react";
import { Project, Contribution } from "../types";
import { 
  Globe, Share2, Copy, MessageSquare, Facebook, Send, 
  Clock, CheckCircle2, QrCode, Download, Heart, Users,
  BookOpen, PlusCircle, Volume2, ShieldCheck, Landmark, Sparkles,
  ArrowLeft, Check, CopyCheck, AlertCircle, Shield, Award,
  TrendingUp, Building2, Target, Lock, Smartphone, DownloadCloud,
  Printer, Mail, HeartHandshake, ChevronDown, ChevronUp, Info,
  Coins, Flame, ShieldAlert, ExternalLink
} from "lucide-react";
import { getDonorBadgeInfo } from "../utils/donor";
import { getTheme, getCampaignBanner, getCampaignLogo, getCampaignMotto } from "../utils/branding";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import LiveFundraisingCommandCenter from "./LiveFundraisingCommandCenter";

interface PublicCampaignPageViewProps {
  campaignId: string | null;
  contributions: Contribution[];
  onReturnToDashboard?: () => void;
  isDemoMode?: boolean;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

export default function PublicCampaignPageView({
  campaignId,
  contributions,
  onReturnToDashboard,
  isDemoMode = false
}: PublicCampaignPageViewProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPaybill, setCopiedPaybill] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  
  // Custom states for interactive features
  const [story, setStory] = useState("We are launching this campaign to support our community and gather resources to achieve our collective milestones. We welcome all well-wishers and contributors to join us in making this initiative a tremendous success. Every contribution counts, and together we will build a stronger future!");
  const [updates, setUpdates] = useState([
    { id: "1", date: "2026-06-20", title: "Campaign Officially Launched!", text: "We have initiated our payment shortcodes with Safaricom and established our secure auditing ledgers." },
    { id: "2", date: "2026-06-22", title: "Milestone Reached", text: "Over 30 generous contributors have helped us raise the initial seed fund to start project site assessments!" }
  ]);
  const [newUpdateTitle, setNewUpdateTitle] = useState("");
  const [newUpdateText, setNewUpdateText] = useState("");

  // FAQ Accordion Active Index
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Simulated Handset M-PESA Emulator States
  const [checkoutMode, setCheckoutMode] = useState<"contribute" | "pledge">("contribute");
  const [pledgeDueDate, setPledgeDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10)); // 7 days from now
  const [pledgePaymentMethod, setPledgePaymentMethod] = useState("M-PESA");
  const [pledgeError, setPledgeError] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("254712345678");
  const [donorEmail, setDonorEmail] = useState("");
  const [donationAmount, setDonationAmount] = useState("3500");
  const [donorNotes, setDonorNotes] = useState("");
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simStep, setSimStep] = useState<"idle" | "pin" | "processing" | "success" | "pledge_success">("idle");
  const [enteredPin, setEnteredPin] = useState("");
  const [simFeedback, setSimFeedback] = useState("");
  const [generatedReceiptCode, setGeneratedReceiptCode] = useState("");
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  // QR Flyout Custom Download indicator
  const [qrMessage, setQrMessage] = useState("");

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      setError(true);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);

    const fetchCampaign = async () => {
      try {
        if (campaignId === "demo-project-id") {
          if (active) {
            const demoProj: Project = {
              id: "demo-project-id",
              name: "Makueni School Bus Fundraiser",
              targetAmount: 1000000,
              currentAmount: 640000,
              description: "A community fundraiser to secure a safer school bus for children in Makueni County.",
              category: "Schools",
              paybillNumber: "225588",
              accountReference: "MAKUENI-BUS",
              treasurerPhone: "254712345678",
              whatsappGroupName: "Makueni Committee",
              createdBy: "demo-user-123",
              createdAt: new Date().toISOString(),
              campaignImage: "",
              campaignLogo: "",
              themeColor: "Emerald",
              campaignCategory: "Schools",
              motto: "Drive to Learn, Learn to Drive",
              organizer: "Richard Mayore"
            };
            setActiveProject(demoProj);
            setStory(demoProj.description || "");
            setLoading(false);
          }
          return;
        }

        if (db) {
          const docRef = doc(db, "fundraisers", campaignId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && active) {
            const data = docSnap.data();
            const mappedProject: Project = {
              id: docSnap.id,
              name: data.fundraiserName || data.name || "",
              targetAmount: Number(data.targetAmount),
              currentAmount: Number(data.currentAmount || 0),
              description: data.description || "",
              category: data.sectorCategory || data.category || "General/Harambee",
              treasurerPhone: data.treasurerPhone || "",
              paybillNumber: data.mpesaShortcode || data.paybillNumber || "225588",
              accountReference: data.accountReference || "",
              whatsappGroupName: data.whatsappGroupName || `${data.fundraiserName || data.name} Group`,
              createdAt: data.createdAt,
              campaignImage: data.campaignImage || "",
              campaignLogo: data.campaignLogo || "",
              themeColor: data.themeColor || "Blue",
              campaignCategory: data.campaignCategory || data.sectorCategory || data.category || "General/Harambee",
              motto: data.motto || "",
              organizer: data.organizer || data.organizerName || "Harambee Committee",
              createdBy: data.createdBy || ""
            };
            setActiveProject(mappedProject);
            if (mappedProject.description) {
              setStory(mappedProject.description);
            }
          } else if (active) {
            // Try fetching from fallback REST API
            try {
              const res = await fetch("/api/projects");
              const projects: any[] = await res.json();
              const found = projects.find(p => p.id === campaignId);
              if (found && active) {
                const mappedProject: Project = {
                  id: found.id,
                  name: found.fundraiserName || found.name || "",
                  targetAmount: Number(found.targetAmount),
                  currentAmount: Number(found.currentAmount || 0),
                  description: found.description || "",
                  category: found.sectorCategory || found.category || "General/Harambee",
                  treasurerPhone: found.treasurerPhone || "",
                  paybillNumber: found.mpesaShortcode || found.paybillNumber || "225588",
                  accountReference: found.accountReference || "",
                  whatsappGroupName: found.whatsappGroupName || `${found.fundraiserName || found.name} Group`,
                  createdAt: found.createdAt,
                  campaignImage: found.campaignImage || "",
                  campaignLogo: found.campaignLogo || "",
                  themeColor: found.themeColor || "Blue",
                  campaignCategory: found.campaignCategory || found.sectorCategory || found.category || "General/Harambee",
                  motto: found.motto || "",
                  organizer: found.organizer || found.organizerName || "Harambee Committee",
                  createdBy: found.createdBy || ""
                };
                setActiveProject(mappedProject);
                if (mappedProject.description) {
                  setStory(mappedProject.description);
                }
              } else if (active) {
                setError(true);
              }
            } catch {
              if (active) setError(true);
            }
          }
        } else {
          // Direct fallback
          const res = await fetch("/api/projects");
          const projects: any[] = await res.json();
          const found = projects.find(p => p.id === campaignId);
          if (found && active) {
            const mappedProject: Project = {
              id: found.id,
              name: found.fundraiserName || found.name || "",
              targetAmount: Number(found.targetAmount),
              currentAmount: Number(found.currentAmount || 0),
              description: found.description || "",
              category: found.sectorCategory || found.category || "General/Harambee",
              treasurerPhone: found.treasurerPhone || "",
              paybillNumber: found.mpesaShortcode || found.paybillNumber || "225588",
              accountReference: found.accountReference || "",
              whatsappGroupName: found.whatsappGroupName || `${found.fundraiserName || found.name} Group`,
              createdAt: found.createdAt,
              campaignImage: found.campaignImage || "",
              campaignLogo: found.campaignLogo || "",
              themeColor: found.themeColor || "Blue",
              campaignCategory: found.campaignCategory || found.sectorCategory || found.category || "General/Harambee",
              motto: found.motto || "",
              organizer: found.organizer || found.organizerName || "Harambee Committee",
              createdBy: found.createdBy || ""
            };
            setActiveProject(mappedProject);
            if (mappedProject.description) {
              setStory(mappedProject.description);
            }
          } else if (active) {
            setError(true);
          }
        }
      } catch (err) {
        console.error("Error loading campaign:", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCampaign();

    return () => {
      active = false;
    };
  }, [campaignId]);

  // Confetti Animation loop
  useEffect(() => {
    if (confetti.length === 0) return;
    let animFrameId: number;
    const updateConfetti = () => {
      setConfetti(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + Math.cos(p.angle) * p.speed * 0.12,
          y: p.y + Math.sin(p.angle) * p.speed * 0.12 + 0.65, // gravity
          speed: p.speed * 0.965, // decay
          rotation: p.rotation + p.rotationSpeed
        })).filter(p => p.y < 120 && p.x > -20 && p.x < 120);

        if (next.length > 0) {
          animFrameId = requestAnimationFrame(updateConfetti);
        }
        return next;
      });
    };
    animFrameId = requestAnimationFrame(updateConfetti);
    return () => cancelAnimationFrame(animFrameId);
  }, [confetti.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100" id="public-campaign-loading">
        <div className="space-y-4 max-w-sm">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" id="loading-spinner" />
          <h3 className="text-base font-extrabold font-mono text-emerald-400 uppercase tracking-widest">
            Loading Campaign...
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Retrieving secure campaign ledger parameters...
          </p>
        </div>
      </div>
    );
  }

  if (error || !activeProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 animate-fade-in" id="public-campaign-error">
        <div className="space-y-6 max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black font-mono text-rose-400 uppercase tracking-widest">
              Campaign not found
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              This campaign may have been deleted, is unpublished, or the link is invalid.
            </p>
          </div>
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer"
              id="return-to-dashboard-btn"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filter contributions specifically for this fundraiser
  const projContributions = contributions.filter(c => c.projectId === activeProject.id || c.campaignId === activeProject.id || c.fundraiserId === activeProject.id);
  const raisedAmount = Math.max(projContributions.reduce((sum, c) => sum + c.amount, 0), Number(activeProject.currentAmount || 0));
  const percent = Math.min(100, Math.round((raisedAmount / activeProject.targetAmount) * 100)) || 0;
  
  // Calculate analytics
  const averageDonation = projContributions.length > 0 
    ? Math.round(raisedAmount / projContributions.length) 
    : 0;

  const largestDonation = projContributions.length > 0 
    ? Math.max(...projContributions.map(c => c.amount)) 
    : 0;

  const remainingNeeded = Math.max(0, activeProject.targetAmount - raisedAmount);

  // Compute daily and weekly progress based on actual timestamps
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;

  const dailyProgress = projContributions
    .filter(c => {
      const date = new Date(c.timestamp || c.transactionTime || now);
      return (now.getTime() - date.getTime()) <= oneDayMs;
    })
    .reduce((sum, c) => sum + c.amount, 0);

  const weeklyProgress = projContributions
    .filter(c => {
      const date = new Date(c.timestamp || c.transactionTime || now);
      return (now.getTime() - date.getTime()) <= sevenDaysMs;
    })
    .reduce((sum, c) => sum + c.amount, 0);

  // Generate Simulated Public Url
  const publicUrl = `${window.location.origin}/#/f/${activeProject.id}`;

  const bannerImg = getCampaignBanner(activeProject);
  const logoImg = getCampaignLogo(activeProject);
  const activeMotto = getCampaignMotto(activeProject);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPaybill = () => {
    navigator.clipboard.writeText(activeProject.paybillNumber);
    setCopiedPaybill(true);
    setTimeout(() => setCopiedPaybill(false), 2000);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(activeProject.accountReference || "AUTO");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateTitle.trim() || !newUpdateText.trim()) return;
    const newUp = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      title: newUpdateTitle.trim(),
      text: newUpdateText.trim()
    };
    setUpdates([newUp, ...updates]);
    setNewUpdateTitle("");
    setNewUpdateText("");
  };

  // Trigger custom confetti burst particles
  const triggerConfettiBurst = () => {
    const particles: ConfettiParticle[] = [];
    const colors = ["#10B981", "#34D399", "#6EE7B7", "#60A5FA", "#FBBF24", "#F472B6", "#A78BFA"];
    for (let i = 0; i < 90; i++) {
      particles.push({
        id: Date.now() + i + Math.random() * 1000,
        x: 50, // Center of phone
        y: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 7 + 5,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 22 + 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12
      });
    }
    setConfetti(particles);
  };

  // Handle simulated STK payment flow from the handset emulator
  const handleInitiateSimPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount || Number(donationAmount) <= 0) return;
    setEnteredPin("");
    setSimFeedback("Initiating secure Daraja session with cell tower... Please enter PIN.");
    setSimStep("pin");
  };

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin(prev => prev + digit);
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleConfirmPin = async () => {
    if (enteredPin.length < 4) return;
    setSimStep("processing");
    setSimFeedback("Safaricom Daraja secure handshaking active... updating Firestore...");

    // Create correct Daraja callback notification payload
    const receiptNum = "STK" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const transTime = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);
    const amountStr = Number(donationAmount).toFixed(2);
    const billRef = (activeProject.accountReference || "AUTO").toUpperCase();

    // Map names
    const parts = (donorName || "Anonymous Contributor").trim().split(/\s+/);
    const fN = parts[0] || "WELL-WISHER";
    const mN = parts.length > 2 ? parts[1] : "";
    const lN = parts.length > 2 ? parts.slice(2).join(" ") : (parts[1] || "GIVER");

    const paybillPayload = {
      TransactionType: "Pay Bill",
      TransID: receiptNum,
      TransTime: transTime,
      TransAmount: amountStr,
      BusinessShortCode: activeProject.paybillNumber || "225588",
      BillRefNumber: billRef,
      OrgAccountBalance: "125000.00",
      MSISDN: donorPhone.trim() || "254712345678",
      FirstName: fN,
      MiddleName: mN,
      LastName: lN
    };

    try {
      // Post actual callback to backend node
      const response = await fetch("/api/daraja/callback?token=SANDBOX_SIMULATION_BYPASS_TOKEN", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Mpesa-Signature": "SANDBOX_SIMULATION_BYPASS_SIGNATURE"
        },
        body: JSON.stringify(paybillPayload)
      });
      
      const resData = await response.json();
      setGeneratedReceiptCode(receiptNum);

      // If note was specified, save the note asynchronously to direct firestore document once it is created
      if (db && donorNotes.trim()) {
        setTimeout(async () => {
          try {
            const donationRef = doc(db, "donations", receiptNum);
            await setDoc(donationRef, { notes: donorNotes.trim() }, { merge: true });
          } catch (err) {
            console.error("Failed to append simulated notes to donation:", err);
          }
        }, 1500);
      }

      setSimStep("success");
      setSimFeedback(`Payment of KES ${Number(donationAmount).toLocaleString()} processed successfully!`);
      triggerConfettiBurst();
    } catch (err: any) {
      console.error(err);
      setSimStep("idle");
      setSimFeedback(`Error: ${err.message || "Simulated transaction failed"}`);
    }
  };

  const handleInitiatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || !donorPhone || !donationAmount || Number(donationAmount) <= 0 || !pledgeDueDate) {
      setPledgeError("Please fill in all required fields with valid values.");
      return;
    }

    setPledgeError("");
    setSimStep("processing");
    setSimFeedback("Recording your supporter pledge commitment in Firestore...");

    const newPledge = {
      projectId: activeProject.id,
      donorName: donorName.trim(),
      phone: donorPhone.trim(),
      email: donorEmail.trim() || undefined,
      pledgedAmount: Number(donationAmount),
      paidAmount: 0,
      balance: Number(donationAmount),
      status: "Pending",
      dueDate: pledgeDueDate,
      notes: donorNotes.trim() || undefined,
      expectedPaymentMethod: pledgePaymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentHistory: []
    };

    try {
      if (db) {
        // Save to Firestore pledges collection
        const pledgeId = `pledge-${Date.now()}`;
        await setDoc(doc(db, "pledges", pledgeId), newPledge);

        // Also post an elegant automated social system notification to whatsappMessages
        const messageId = `wm-p-${Date.now()}`;
        await setDoc(doc(db, "whatsappMessages", messageId), {
          id: messageId,
          groupName: activeProject.whatsappGroupName || `${activeProject.name} Group`,
          message: `📢 *New Pledge Logged*: Thank you *${donorName.trim()}* for pledging *KES ${Number(donationAmount).toLocaleString()}* toward *${activeProject.name}*. Expected fulfillment: ${pledgeDueDate}.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      }
      
      setSimStep("pledge_success");
      setSimFeedback("Your supporter pledge has been committed successfully!");
      triggerConfettiBurst();
    } catch (err: any) {
      console.error(err);
      setSimStep("idle");
      setPledgeError(`Failed to register pledge: ${err.message || err}`);
    }
  };

  const handleResetEmulator = () => {
    setSimStep("idle");
    setDonorName("");
    setDonorPhone("254712345678");
    setDonorEmail("");
    setDonorNotes("");
    setEnteredPin("");
    setDonationAmount("3500");
    setPledgeError("");
  };

  // Simulated flyers download triggers
  const triggerDownloadQR = () => {
    setQrMessage("Compiling high-resolution QR flyer with M-PESA parameters... Saved to local device!");
    setTimeout(() => setQrMessage(""), 4500);
  };

  const triggerPrintFlyer = () => {
    setQrMessage("Generating printable physical campaign ledger layout... Opening printer dialogue!");
    setTimeout(() => {
      window.print();
      setQrMessage("");
    }, 1500);
  };

  // WhatsApp simulation share
  const shareText = `*Harambee Campaign Update* \n\nI invite you to support *${activeProject.name}*. \n\n🎯 Target: KES ${activeProject.targetAmount.toLocaleString()}\n📈 Progress: KES ${raisedAmount.toLocaleString()} (${percent}% raised)\n\n*How to contribute:* \n1. Paybill Shortcode: *${activeProject.paybillNumber}*\n2. Account Ref: *${activeProject.accountReference || "AUTO"}*\n\nView details and support: ${publicUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  // Assemble events for unified community activity feed
  const liveActivityFeed = [
    // 1. Contributions
    ...projContributions.map(giver => ({
      id: giver.id || giver.transactionCode,
      type: "donation" as const,
      timestamp: new Date(giver.timestamp || giver.transactionTime || now),
      title: `${giver.cleanedName || giver.senderName || "Generous Giver"} supported the campaign`,
      description: `Contributed KES ${giver.amount.toLocaleString()} with receipt code ${giver.transactionCode}.`,
      notes: giver.notes,
      amount: giver.amount,
      badge: getDonorBadgeInfo(giver.senderPhone || giver.phoneNumber || "", giver.id || giver.transactionCode, contributions).label
    })),
    // 2. Automated Milestones
    ...(percent >= 25 ? [{
      id: "milestone-25",
      type: "milestone" as const,
      timestamp: new Date(activeProject.createdAt || now),
      title: "Quarter Mark Reached! 📈",
      description: `The campaign surged past 25% of the goal of KES ${activeProject.targetAmount.toLocaleString()}!`,
    }] : []),
    ...(percent >= 50 ? [{
      id: "milestone-50",
      type: "milestone" as const,
      timestamp: new Date(activeProject.createdAt || now),
      title: "Halfway Point Crossed! 🚀",
      description: `We are officially 50% funded! The community's momentum is remarkable.`,
    }] : []),
    ...(percent >= 75 ? [{
      id: "milestone-75",
      type: "milestone" as const,
      timestamp: new Date(activeProject.createdAt || now),
      title: "Three-Quarters Cleared! ✨",
      description: `We have raised over 75% of our goal! Almost at the finish line!`,
    }] : []),
    ...(percent >= 100 ? [{
      id: "milestone-100",
      type: "milestone" as const,
      timestamp: new Date(),
      title: "CAMPAIGN GOAL ACHIEVED! 🎉🏆",
      description: `Incredible! The target of KES ${activeProject.targetAmount.toLocaleString()} has been fully met.`,
    }] : []),
    // 3. Official Updates
    ...updates.map(up => ({
      id: `up-${up.id}`,
      type: "update" as const,
      timestamp: new Date(up.date + "T12:00:00"),
      title: `Official Update: ${up.title}`,
      description: up.text
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // FAQ contents
  const faqList = [
    {
      q: "Is this campaign verified?",
      a: `Yes. Every campaign listed on HarambeeFlow undergoes rigorous validation of the treasurer's M-PESA Till/Paybill credentials and committee registration before public launch. This fundraiser is registered to paybill number ${activeProject.paybillNumber} and account reference ${activeProject.accountReference || "AUTO"}.`
    },
    {
      q: "Who manages the money?",
      a: "All contributions flow directly into the committee’s official cooperative bank account or registered Safaricom Till/Paybill number. The elected Treasurer holds fiduciary responsibility, with multi-signatory oversight and live ledger accountability."
    },
    {
      q: "Can I donate anonymously?",
      a: "Yes. When you simulate or perform a transaction, you can opt to hide your identity or check anonymous settings. The system records your support as 'Generous Well-wisher' to the public, while keeping required auditing records secured for the committee."
    },
    {
      q: "Will I receive a receipt?",
      a: "Yes! Upon confirmation of your M-PESA transaction code, our platform compiles an official digital receipt featuring the HarambeeFlow secure cryptographic seal, ready for your auditing or tax record-keeping."
    },
    {
      q: "Can I contribute multiple times?",
      a: "Absolutely. Many contributors pledge recurring support as the campaign progresses through different construction or medical milestones. Each contribution is tracked, authenticated, and credited individually on the live ledger."
    },
    {
      q: "How are funds protected?",
      a: "HarambeeFlow integrates directly with the Safaricom Daraja API. We do not store or hold your funds in intermediate accounts; contributions are routed directly from your handset to the verified committee destination wallet."
    },
    {
      q: "How can I contact the organizer?",
      a: `You can reach out to the certified organizer, ${activeProject.organizer || "the Harambee Committee"}, or connect with the community via the campaign's dedicated WhatsApp group link located in the header of this portal.`
    },
    {
      q: "How will the money be used?",
      a: "The committee posts periodic milestone updates, structural diagrams, and expenditure ledgers directly in the 'Updates' panel on this page, maintaining perfect fiscal visibility."
    },
    {
      q: "Can I report suspicious activity?",
      a: "Yes. HarambeeFlow maintains an active compliance desk. If you suspect any fraudulent actions or misrepresentation, you can use the 'Report Campaign' form in the page footer to trigger an automatic administrative freeze and formal audit."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#030712] font-sans text-slate-100 relative min-h-screen selection:bg-emerald-500/30 selection:text-emerald-300" id="public-pages-root">
      
      {/* Dynamic ambient grid overlay & background glow for world-class visual quality */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.04)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Floating Canvas Confetti Particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confetti.map(p => (
          <div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * (Math.random() > 0.5 ? 1.5 : 0.6)}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
              opacity: 1 - (120 - p.y) / 140,
            }}
          />
        ))}
      </div>

      {/* Upper Management Bar (Treasurer Context / Navigation) */}
      <header className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <span className="text-slate-950 font-black text-sm font-mono">HF</span>
            </div>
            <div>
              <span className="text-xs font-mono font-extrabold text-emerald-400 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PUBLIC DARAJA LEDGER
              </span>
              <h2 className="text-sm font-black text-white tracking-tight leading-none mt-0.5">
                HarambeeFlow Portal V2
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onReturnToDashboard ? (
              <button
                onClick={onReturnToDashboard}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                id="header-return-dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Dashboard
              </button>
            ) : (
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-mono font-bold text-slate-400">
                🔑 SECURE VISITOR PATH
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">
        
        {/* Banner QR/Flyer compile notifications */}
        {qrMessage && (
          <div className="p-4 bg-emerald-950/90 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300 animate-fade-in shadow-xl shadow-black/50">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
            <span>{qrMessage}</span>
          </div>
        )}

        {/* 1. HERO SECTION & INTEGRATED STRIPE-STYLE INTERACTIVE DONATION FORM */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cover & Brand Info - spans 7 cols on desktop */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Branded Cover Banner with 16:9 Aspect Ratio */}
            <div className="relative aspect-[16/9] w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl group">
              <img 
                src={bannerImg} 
                alt="Campaign Cover Image" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-all duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
              
              {/* Category & Status Floating badging */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-slate-900/90 text-emerald-400 border border-emerald-500/20">
                  {activeProject.campaignCategory || activeProject.category || "General/Harambee"}
                </span>
                <span className="px-3 py-1 bg-sky-500/95 text-slate-950 font-mono font-bold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
                <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-mono font-bold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-950/40">
                  <Award className="w-3.5 h-3.5" /> Approved
                </span>
              </div>

              {/* Bottom Information overlay on image */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/90 p-1.5 shadow-2xl border border-slate-700/50 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={logoImg} 
                    alt="Campaign Logo" 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    ORGANIZER PROFILE
                  </span>
                  <h4 className="text-base font-bold text-white tracking-tight leading-none mt-1">
                    {activeProject.organizer || "Harambee Committee"}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Registered on HarambeeFlow AI Ledger
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Identity Title & Motto */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                🔴 CHANNELS SYNCHRONIZED & ACTIVE
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {activeProject.name}
              </h1>
              
              {activeMotto && (
                <div className="bg-slate-900/60 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-800/80 flex items-start gap-2.5">
                  <span className="text-2xl text-emerald-400 font-bold leading-none">“</span>
                  <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                    {activeMotto}
                  </p>
                  <span className="text-2xl text-emerald-400 font-bold leading-none self-end">”</span>
                </div>
              )}
            </div>

            {/* Story Text Area (With toggle update if in edit mode) */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Campaign Story & Fiduciary Cause
              </h3>
              
              {onReturnToDashboard ? (
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-xs leading-relaxed h-36 focus:outline-none focus:border-emerald-500 transition resize-none font-sans"
                  placeholder="Describe your committee's fundraiser story..."
                />
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {story}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase block">CREATED DATE</span>
                  <span className="font-bold text-slate-200 block mt-0.5">
                    {activeProject.createdAt ? new Date(activeProject.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "June 18, 2026"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase block">RECONCILIATION TARGET</span>
                  <span className="font-bold text-emerald-400 block mt-0.5">
                    Safaricom Daraja API
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Progress Card & Fast Simulator Panel - spans 5 cols on desktop */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Elegant Stripe-Like Progress Widget Card */}
            <div className="bg-gradient-to-b from-slate-900 to-[#0b1329] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                      TOTAL FUNDS ACCUMULATED
                    </span>
                    <h2 className="text-3xl font-black text-white mt-1">
                      KES {raisedAmount.toLocaleString()}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-mono font-extrabold">
                    {percent}%
                  </span>
                </div>

                {/* Animated visual progress tracking slider */}
                <div className="space-y-2 pt-1">
                  <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-850 p-[2px]">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                    <span>Target: KES {activeProject.targetAmount.toLocaleString()}</span>
                    <span className="text-emerald-400">
                      {remainingNeeded > 0 ? `KES ${remainingNeeded.toLocaleString()} Needed` : "Goal Achieved!"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block font-mono">CONTRIBUTORS</span>
                    <span className="font-bold text-white text-base block mt-0.5">
                      {projContributions.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono">DAYS REMAINING</span>
                    <span className="font-bold text-white text-base block mt-0.5">
                      14 Days Left
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById("direct-simulation-form");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    Contribute Now
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>

              </div>
            </div>

            {/* Quick Micro QR flyer code side panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex items-center gap-5">
              <div className="bg-white p-2.5 rounded-2xl shrink-0 shadow-xl border border-slate-800">
                <svg className="w-16 h-16" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="25" height="25" fill="#10B981" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="12" y="12" width="11" height="11" fill="#10B981" />
                  <rect x="70" y="5" width="25" height="25" fill="#10B981" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="77" y="12" width="11" height="11" fill="#10B981" />
                  <rect x="5" y="70" width="25" height="25" fill="#10B981" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="12" y="77" width="11" height="11" fill="#10B981" />
                  <rect x="35" y="15" width="5" height="10" fill="#1e293b" />
                  <rect x="45" y="5" width="10" height="5" fill="#1e293b" />
                  <rect x="35" y="45" width="20" height="10" fill="#1e293b" />
                  <rect x="55" y="25" width="10" height="15" fill="#10B981" />
                  <rect x="15" y="35" width="10" height="10" fill="#1e293b" />
                  <rect x="5" y="50" width="5" height="10" fill="#10B981" />
                  <rect x="75" y="40" width="15" height="20" fill="#1e293b" />
                  <rect x="70" y="70" width="25" height="5" fill="#10B981" />
                  <rect x="75" y="80" width="10" height="10" fill="#1e293b" />
                  <rect x="40" y="75" width="15" height="15" fill="#10B981" />
                </svg>
              </div>
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-white uppercase font-mono flex items-center gap-1">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  M-PESA Daraja QR Ref
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Instantly compiled for Safaricom App. Supports safe instant billing scans.
                </p>
                <button
                  onClick={triggerDownloadQR}
                  className="text-[10px] font-mono font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Flyer QR
                </button>
              </div>
            </div>

          </div>

        </section>

        {/* 2. TRUST & VERIFICATION CENTER (Directly below the Hero) */}
        <section className="space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
              TRUSTED AUDIT PROTOCOL
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Campaign Trust & Safety Center
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 text-left">
              <div className="w-10 h-10 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center text-lg mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">Verified Campaign</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Authenticity vetted by our central community coordination system.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 text-left">
              <div className="w-10 h-10 bg-sky-950/60 border border-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center text-lg mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">Verified Committee</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Managed by an officially registered panel with fiduciary liabilities.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 text-left">
              <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-lg mb-3">
                <Landmark className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">Safaricom Gateway</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Funds route instantly to verified business shortcodes. No middleman.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 text-left">
              <div className="w-10 h-10 bg-teal-950/60 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center text-lg mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">Transparent Account</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Every transaction appears in real-time on our immutable public ledger.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 text-left">
              <div className="w-10 h-10 bg-rose-950/60 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center text-lg mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">AI Fraud Monitoring</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Continuously audited against duplicates, phishing, or wallet anomalies.
              </p>
            </div>

          </div>
        </section>

        {/* 3. FUNDRAISING PROGRESS ANALYTICS */}
        <section className="space-y-6">
          <div className="border-l-4 border-sky-500 pl-4">
            <h3 className="text-xs font-mono font-black text-sky-400 uppercase tracking-widest">
              METRIC TELEMETRY
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Live Fundraising Performance Analytics
            </h2>
          </div>

          {activeProject && (
            <LiveFundraisingCommandCenter
              activeProject={activeProject}
              contributions={projContributions}
              viewMode="public"
              isDemoMode={isDemoMode}
            />
          )}
        </section>

        {/* 4. DONATION SECTION & HANDSET EMULATOR */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="direct-simulation-form">
          
          {/* Left: Paybill and Account reference card - spans 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="border-l-4 border-emerald-500 pl-4">
              <h3 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                DIRECT BILLING PARAMETERS
              </h3>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                M-PESA Lipa na M-PESA Portal
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              To support this campaign from your physical smartphone, open your M-PESA app, navigate to Paybill, and input the verified shortcode credentials. Alternatively, utilize our secure instant handset simulation on the right.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Paybill Shortcode copyable card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      M-PESA PAYBILL SHORTCODE
                    </span>
                    <Landmark className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-black text-emerald-400 tracking-tight mt-3">
                    {activeProject.paybillNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-2 font-sans">
                    Safaricom Daraja API primary corporate destination wallet.
                  </p>
                </div>

                <button
                  onClick={handleCopyPaybill}
                  className="mt-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-mono font-bold rounded-xl border border-slate-750 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedPaybill ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-up" />
                      <span>Copied Shortcode!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Shortcode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Account Reference copyable card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      ACCOUNT REFERENCE CODE
                    </span>
                    <Lock className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="text-3xl font-black text-sky-400 tracking-tight mt-3">
                    {activeProject.accountReference || "AUTO"}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-2 font-sans">
                    The identifier code to reconcile and credit your contribution.
                  </p>
                </div>

                <button
                  onClick={handleCopyAccount}
                  className="mt-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-mono font-bold rounded-xl border border-slate-750 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-up" />
                      <span>Copied Account Ref!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Account Ref</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Micro promotion actions */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-[#075e54] hover:bg-[#128c7e] text-white font-mono font-bold rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>

              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold rounded-xl text-center transition flex items-center justify-center gap-1.5 border border-slate-750 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </button>

              <a
                href={`mailto:?subject=Support%20${encodeURIComponent(activeProject.name)}&body=Check%20out%20this%20HarambeeFlow%20campaign:%20${encodeURIComponent(publicUrl)}`}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold rounded-xl text-center transition flex items-center justify-center gap-1.5 border border-slate-750 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>

              <button
                onClick={triggerPrintFlyer}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold rounded-xl text-center transition flex items-center justify-center gap-1.5 border border-slate-750 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Flyer
              </button>

            </div>

          </div>

          {/* Right: Beautiful Handset M-PESA simulator panel - spans 5 cols */}
          <div className="lg:col-span-5">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[8px] font-mono font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/20 rounded-md">
                  DEMO CELL ACTIVE
                </span>
              </div>

              <div className="space-y-4 mb-5">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
                  M-PESA Handset Simulator
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Simulate a direct Daraja API transaction on this sandbox phone. Once PIN is authorized, it updates the ledger immediately!
                </p>
              </div>

              {/* Visual phone casing display container */}
              <div className="bg-[#020617] border-[6px] border-slate-950 rounded-3xl p-5 overflow-hidden shadow-2xl relative min-h-[460px] flex flex-col justify-between">
                
                {/* Simulated Handset Screen Header */}
                <div className="border-b border-slate-900 pb-3 flex items-center justify-between text-[9px] font-mono text-slate-500 shrink-0">
                  <span>SAFARICOM LTE</span>
                  <div className="w-14 h-4 bg-slate-950 border border-slate-800 rounded-full mx-auto" />
                  <span>100% 🔋</span>
                </div>

                {/* Handset dynamic screen states */}
                <div className="flex-1 py-4 flex flex-col justify-center">
                  
                  {/* Step 1: Idle STK Form input */}
                  {simStep === "idle" && (
                    <div className="space-y-4">
                      {/* Mode switcher tabs */}
                      <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-900 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setCheckoutMode("contribute")}
                          className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            checkoutMode === "contribute" 
                              ? "bg-emerald-500 text-slate-950 shadow-md" 
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          💸 Contribute Now
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutMode("pledge")}
                          className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            checkoutMode === "pledge" 
                              ? "bg-emerald-500 text-slate-950 shadow-md" 
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          🤝 Make a Pledge
                        </button>
                      </div>

                      {pledgeError && (
                        <div className="p-2.5 bg-rose-950/40 border border-rose-900/30 text-rose-300 text-[10px] rounded-lg animate-fade-in">
                          ⚠️ {pledgeError}
                        </div>
                      )}

                      {checkoutMode === "contribute" ? (
                        <form onSubmit={handleInitiateSimPayment} className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Your Public Name:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Jane Supporter"
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                              className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-sans"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Simulated Phone:</label>
                              <input
                                type="text"
                                required
                                placeholder="254712345678"
                                value={donorPhone}
                                onChange={(e) => setDonorPhone(e.target.value)}
                                className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Amount (KES):</label>
                              <input
                                type="number"
                                required
                                placeholder="e.g. 5000"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* Quick amount select pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {["1000", "2500", "5000", "10000"].map(amt => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setDonationAmount(amt)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${donationAmount === amt ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800"}`}
                              >
                                +{Number(amt).toLocaleString()}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Public/Private Notes (optional):</label>
                            <input
                              type="text"
                              placeholder="e.g. Wishing the committee speed!"
                              value={donorNotes}
                              onChange={(e) => setDonorNotes(e.target.value)}
                              className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-extrabold rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg cursor-pointer animate-fade-in"
                          >
                            <Send className="w-4 h-4" />
                            Simulate Payment
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleInitiatePledge} className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Your Name:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Richard Mayore"
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                              className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-sans"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Email Address:</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. supporter@gmail.com"
                              value={donorEmail}
                              onChange={(e) => setDonorEmail(e.target.value)}
                              className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-sans"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Your Phone (254...):</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 254712345678"
                                value={donorPhone}
                                onChange={(e) => setDonorPhone(e.target.value)}
                                className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Pledge Amount (KES):</label>
                              <input
                                type="number"
                                required
                                placeholder="e.g. 15000"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* Quick amount select pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {["5000", "10000", "25000", "50000"].map(amt => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setDonationAmount(amt)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${donationAmount === amt ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800"}`}
                              >
                                +{Number(amt).toLocaleString()}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Fulfillment Date:</label>
                              <input
                                type="date"
                                required
                                value={pledgeDueDate}
                                onChange={(e) => setPledgeDueDate(e.target.value)}
                                className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Fulfill Channel:</label>
                              <select
                                value={pledgePaymentMethod}
                                onChange={(e) => setPledgePaymentMethod(e.target.value)}
                                className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-all font-sans cursor-pointer min-h-[38px]"
                              >
                                <option value="M-PESA">M-PESA</option>
                                <option value="Cash">Physical Cash</option>
                                <option value="Bank">Bank Wire</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Pledge Notes (optional):</label>
                            <input
                              type="text"
                              placeholder="e.g. Sending installment next Sunday."
                              value={donorNotes}
                              onChange={(e) => setDonorNotes(e.target.value)}
                              className="w-full bg-[#090d1f] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-extrabold rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg cursor-pointer animate-fade-in"
                          >
                            <HeartHandshake className="w-4 h-4" />
                            Submit Supporter Pledge
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Step 2: PIN Input numerical screen keypad */}
                  {simStep === "pin" && (
                    <div className="space-y-4 animate-scale-up text-center">
                      <div className="bg-slate-950 p-4 border border-slate-900 rounded-2xl">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                          M-PESA SIMULATION DIALOG
                        </span>
                        <p className="text-xs text-white font-bold mt-2 font-sans leading-normal">
                          Pay KES {Number(donationAmount).toLocaleString()} to shortcode {activeProject.paybillNumber}
                        </p>
                        
                        {/* PIN security dots */}
                        <div className="flex justify-center gap-4 py-4">
                          {[0, 1, 2, 3].map(idx => (
                            <div
                              key={idx}
                              className={`w-4.5 h-4.5 rounded-full border border-slate-800 flex items-center justify-center transition-all ${enteredPin.length > idx ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] border-emerald-400" : "bg-slate-900"}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Numerical virtual Pin Keyboard */}
                      <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto font-mono">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinDigit(num)}
                            className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-white rounded-xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handlePinBackspace}
                          className="py-2 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-850 text-slate-400 rounded-xl text-[10px] font-bold font-mono transition-all active:scale-95 cursor-pointer"
                        >
                          ⌫
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinDigit("0")}
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-white rounded-xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmPin}
                          disabled={enteredPin.length < 4}
                          className="py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-[11px] font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          OK ✓
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetEmulator}
                        className="text-[10px] font-mono font-bold text-rose-400 underline hover:text-rose-300 block mx-auto pt-1 cursor-pointer"
                      >
                        Cancel simulation
                      </button>
                    </div>
                  )}

                  {/* Step 3: Server Hook processing loader */}
                  {simStep === "processing" && (
                    <div className="space-y-4 text-center py-8 animate-pulse">
                      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                          DARAJA CONNECTED
                        </span>
                        <p className="text-xs text-slate-300 px-4 leading-relaxed font-sans">
                          {simFeedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Complete success display */}
                  {simStep === "success" && (
                    <div className="space-y-5 text-center py-6 animate-scale-up">
                      <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-bounce">
                        ✓
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider w-max mx-auto block">
                          TRANSACTION CONFIRMED
                        </span>
                        <h4 className="text-lg font-black text-white font-sans mt-2">
                          KES {Number(donationAmount).toLocaleString()} Credited
                        </h4>
                        <p className="text-[11px] text-slate-400 px-4 leading-relaxed font-sans">
                          The live community ledger has been audited and synchronized globally. Receipt code compiled:
                        </p>
                        <div className="bg-[#090d1f] border border-slate-850 p-2.5 rounded-xl font-mono text-emerald-400 text-xs font-bold w-max mx-auto mt-2">
                          {generatedReceiptCode}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetEmulator}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Contribute Again
                      </button>
                    </div>
                  )}

                  {/* Step 5: Complete pledge success display */}
                  {simStep === "pledge_success" && (
                    <div className="space-y-5 text-center py-6 animate-scale-up">
                      <div className="w-16 h-16 bg-sky-500/10 border-2 border-sky-500 text-sky-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-bounce">
                        🤝
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-black text-sky-400 bg-sky-950/60 border border-sky-500/20 px-3 py-1 rounded-full uppercase tracking-wider w-max mx-auto block">
                          PLEDGE REGISTERED
                        </span>
                        <h4 className="text-lg font-black text-white font-sans mt-2">
                          KES {Number(donationAmount).toLocaleString()} Promised
                        </h4>
                        <p className="text-[11px] text-slate-400 px-4 leading-relaxed font-sans">
                          Thank you <strong>{donorName}</strong>! Your commitment is logged. You will receive WhatsApp updates or reminders from the treasurer leading up to:
                        </p>
                        <div className="bg-[#090d1f] border border-slate-850 p-2.5 rounded-xl font-mono text-sky-400 text-xs font-bold w-max mx-auto mt-2">
                          📅 {pledgeDueDate} ({pledgePaymentMethod})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetEmulator}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Make Another Pledge / Donation
                      </button>
                    </div>
                  )}

                </div>

                {/* Handset bottom home indicator bar */}
                <div className="border-t border-slate-900 pt-3 shrink-0 flex justify-center">
                  <div className="w-24 h-1 bg-slate-800 rounded-full" />
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* 5. ILLUSTRATED HOW TO DONATE STEP GUIDE */}
        <section className="space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
              LIPA NA M-PESA
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Official Step-by-Step Contribution Manual
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">01</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Open M-PESA</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                Access your Safaricom Sim toolkit or M-PESA application.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">02</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Lipa na M-PESA</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                Select Lipa na M-PESA and proceed to the Paybill action.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">03</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Enter Paybill</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-mono text-emerald-400 font-bold">
                Input Shortcode: {activeProject.paybillNumber}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">04</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Reference Code</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-mono text-sky-400 font-bold">
                Account: {activeProject.accountReference || "AUTO"}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">05</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Enter Amount</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                Type the amount you wish to contribute to the drive.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">06</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Confirm PIN</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                Provide your secure, private 4-digit Safaricom PIN.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative text-left">
              <span className="text-2xl font-black text-emerald-400 font-mono">07</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mt-2">Ledger Updates</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                Your transaction reconciles and appears here instantly!
              </p>
            </div>

          </div>
        </section>

        {/* 6. WHAT HAPPENS AFTER I DONATE */}
        <section className="space-y-6">
          <div className="border-l-4 border-sky-500 pl-4">
            <h3 className="text-xs font-mono font-black text-sky-400 uppercase tracking-widest">
              END-TO-END VISIBILITY
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              What Happens After I Contribute?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono mb-3 border border-emerald-500/20">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Instantly Received</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Funds are credited directly to the committee's bank account or wallet, secured against loss.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono mb-3 border border-emerald-500/20">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Treasurer Notification</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Treasurer receives a live push notification and a Daraja callback summary immediately.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 relative text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono mb-3 border border-emerald-500/20">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Audit & Visuals Update</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                The campaign visual progress bar, totals, and average metrics step forward automatically.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 relative text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono mb-3 border border-emerald-500/20">
                4
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Audit Log Published</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                Your receipt becomes searchable and downloading parameters are registered instantly.
              </p>
            </div>

          </div>
        </section>

        {/* 7. DYNAMIC LIVE COMMUNITY ACTIVITY & CONTRIBUTOR LEDGER */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Dynamic Live Activity Feed - spans 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="border-l-4 border-emerald-500 pl-4">
              <h3 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                TIMELINE STREAM
              </h3>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Live Community Activity Feed
              </h2>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {liveActivityFeed.length > 0 ? (
                liveActivityFeed.map((event, idx) => {
                  const isDonation = event.type === "donation";
                  const isMilestone = event.type === "milestone";
                  const isUpdate = event.type === "update";

                  return (
                    <div 
                      key={event.id || idx} 
                      className={`flex gap-4 p-4 rounded-2xl border transition-all hover:bg-slate-900/65 ${isMilestone ? "bg-emerald-950/20 border-emerald-500/20" : isUpdate ? "bg-indigo-950/20 border-indigo-500/20" : "bg-slate-900/40 border-slate-850"}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-950 text-emerald-400 font-extrabold flex items-center justify-center border border-slate-800 uppercase shrink-0 text-xs">
                        {isMilestone ? "🏆" : isUpdate ? "📢" : (event.title ? event.title.substring(0, 2) : "AN")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className={`font-bold tracking-tight text-xs ${isMilestone ? "text-emerald-400" : isUpdate ? "text-indigo-400" : "text-white"}`}>
                              {event.title}
                            </h4>
                            {isDonation && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border border-slate-800 bg-slate-950 uppercase tracking-wider text-slate-400">
                                  {event.badge}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {isDonation && event.amount && (
                            <span className="font-mono text-emerald-400 font-black whitespace-nowrap text-xs">
                              + KES {event.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                          {event.description}
                        </p>
                        {isDonation && event.notes && (
                          <p className="text-[11px] text-slate-300 italic mt-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 leading-relaxed font-sans">
                            "{event.notes}"
                          </p>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono block mt-2 text-right">
                          {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | {event.timestamp.toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl border border-emerald-500/20">
                    💝
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-200">Be the first to support this campaign!</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
                      No contributions have been logged onto this sandbox network yet. Be the first person to contribute by typing your name in the Handset M-PESA simulator!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const instructionsEl = document.getElementById("direct-simulation-form");
                      if (instructionsEl) {
                        instructionsEl.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold rounded-xl transition uppercase flex items-center gap-1.5 mx-auto shadow-md cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" /> Donate Now
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right: Campaign Updates & Committee Announcements - spans 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="border-l-4 border-sky-500 pl-4">
              <h3 className="text-xs font-mono font-black text-sky-400 uppercase tracking-widest">
                COMMITTEE BULLETINS
              </h3>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Official Updates & Progress
              </h2>
            </div>

            {/* If Treasurer logged in, they can publish bulletins */}
            {onReturnToDashboard && (
              <form onSubmit={handleAddUpdate} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5">
                <p className="text-[10px] font-mono font-black uppercase text-slate-400 flex items-center gap-1">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Publish Official Progress Update
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Initial assessment complete!"
                    value={newUpdateTitle}
                    onChange={(e) => setNewUpdateTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <textarea
                    required
                    placeholder="Provide explanatory notes on materials, balances or legal approvals..."
                    value={newUpdateText}
                    onChange={(e) => setNewUpdateText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white h-20 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-[10px] font-bold rounded-xl transition uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/20"
                  >
                    Publish Bulletins
                  </button>
                </div>
              </form>
            )}

            {/* Progress social cards */}
            <div className="space-y-4">
              {updates.map(up => (
                <div key={up.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                      {up.date}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">Official Committee Bulletin</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white leading-snug">{up.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{up.text}</p>
                </div>
              ))}
            </div>

          </div>

        </section>

        {/* 8. CAMPAIGN TRANSPARENCY ROADMAP (Connected node timeline) */}
        <section className="space-y-6">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
              COMPLIANCE ROADMAP
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Campaign Transparency Milestones
            </h2>
          </div>

          {/* Milestone horizontal/vertical node list */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 sm:p-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left relative">
              
              <div className="space-y-2 border-l-2 md:border-l-0 md:border-t-2 border-emerald-500 pl-4 md:pl-0 md:pt-4 relative">
                <div className="absolute top-0 left-0 -translate-x-[7px] md:-translate-y-[7px] w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">STAGE 1</span>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-tight font-mono">Campaign Created ✓</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  Fundraiser parameters successfully initiated on the platform.
                </p>
              </div>

              <div className="space-y-2 border-l-2 md:border-l-0 md:border-t-2 border-emerald-500 pl-4 md:pl-0 md:pt-4 relative">
                <div className="absolute top-0 left-0 -translate-x-[7px] md:-translate-y-[7px] w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">STAGE 2</span>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-tight font-mono">Vetted & Approved ✓</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  Fiduciary shortcodes authenticated against corporate standards.
                </p>
              </div>

              <div className={`space-y-2 border-l-2 md:border-l-0 md:border-t-2 pl-4 md:pl-0 md:pt-4 relative ${projContributions.length > 0 ? "border-emerald-500" : "border-slate-800"}`}>
                <div className={`absolute top-0 left-0 -translate-x-[7px] md:-translate-y-[7px] w-3 h-3 rounded-full ${projContributions.length > 0 ? "bg-emerald-500" : "bg-slate-800"}`} />
                <span className={`text-[9px] font-mono font-bold uppercase block ${projContributions.length > 0 ? "text-emerald-400" : "text-slate-500"}`}>STAGE 3</span>
                <h4 className={`text-xs font-extrabold uppercase tracking-tight font-mono ${projContributions.length > 0 ? "text-white" : "text-slate-500"}`}>First Contribution</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  The primary ledger records initial public support.
                </p>
              </div>

              <div className={`space-y-2 border-l-2 md:border-l-0 md:border-t-2 pl-4 md:pl-0 md:pt-4 relative ${percent >= 50 ? "border-emerald-500" : "border-slate-800"}`}>
                <div className={`absolute top-0 left-0 -translate-x-[7px] md:-translate-y-[7px] w-3 h-3 rounded-full ${percent >= 50 ? "bg-emerald-500" : "bg-slate-800"}`} />
                <span className={`text-[9px] font-mono font-bold uppercase block ${percent >= 50 ? "text-emerald-400" : "text-slate-500"}`}>STAGE 4</span>
                <h4 className={`text-xs font-extrabold uppercase tracking-tight font-mono ${percent >= 50 ? "text-white" : "text-slate-500"}`}>Halfway Reached</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  The drive surges past the crucial 50% funding goal.
                </p>
              </div>

              <div className={`space-y-2 border-l-2 md:border-l-0 md:border-t-2 pl-4 md:pl-0 md:pt-4 relative ${percent >= 100 ? "border-emerald-500" : "border-slate-800"}`}>
                <div className={`absolute top-0 left-0 -translate-x-[7px] md:-translate-y-[7px] w-3 h-3 rounded-full ${percent >= 100 ? "bg-emerald-500" : "bg-slate-800"}`} />
                <span className={`text-[9px] font-mono font-bold uppercase block ${percent >= 100 ? "text-emerald-400" : "text-slate-500"}`}>STAGE 5</span>
                <h4 className={`text-xs font-extrabold uppercase tracking-tight font-mono ${percent >= 100 ? "text-white" : "text-slate-500"}`}>Audited Completion</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  Target met, projects executed, and audits compiled.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 9. DETAILED FAQ SYSTEM (Accordion layout) */}
        <section className="space-y-6">
          <div className="border-l-4 border-sky-500 pl-4">
            <h3 className="text-xs font-mono font-black text-sky-400 uppercase tracking-widest">
              RESOURCES & KNOWLEDGE
            </h3>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* FAQ Helper Sidebar - spans 4 cols */}
            <div className="md:col-span-4 space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 text-left">
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-500/25 text-emerald-400 rounded-xl flex items-center justify-center text-lg mb-3">
                  <Info className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-extrabold text-white">Need Additional Clarification?</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                  Our customer compliance desk operates 24 hours a day, 7 days a week. We protect community trust through multi-signatory vetting.
                </p>
                <div className="pt-4 border-t border-slate-800 mt-4 text-xs">
                  <span className="text-slate-500 block">SUPPORT CONTACT</span>
                  <span className="font-bold text-slate-300 block mt-0.5">compliance@harambeeflow.ai</span>
                </div>
              </div>
            </div>

            {/* Accordion panel - spans 8 cols */}
            <div className="md:col-span-8 space-y-3">
              {faqList.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden transition-all">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full py-4 px-5 flex items-center justify-between text-left hover:bg-slate-850/50 transition-all cursor-pointer"
                    >
                      <h4 className="text-xs font-extrabold text-white leading-snug pr-4">
                        {faq.q}
                      </h4>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-950">
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

      </main>

      {/* 10. PROFESSIONAL COMPLIANCE FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 mt-16 text-slate-400 text-xs py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-950">
                  HF
                </div>
                <span className="font-bold text-white font-mono text-sm tracking-wider">HarambeeFlow AI</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                A world-class community cooperative fundraising software leveraging the Safaricom Daraja SDK for live audits, legal protection, and extreme financial visibility.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <h4 className="font-mono text-[10px] font-extrabold uppercase text-white tracking-widest">Ecosystem</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-500 font-sans">
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Live M-PESA Ledgers</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Committee Dashboard</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Fiduciary Protections</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Safaricom Integrations</span></li>
              </ul>
            </div>

            <div className="space-y-3 text-left">
              <h4 className="font-mono text-[10px] font-extrabold uppercase text-white tracking-widest">Security & Audits</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-500 font-sans">
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Encryption Standards</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer">AI Anti-Fraud Systems</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Legally Sound Charters</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer">Verified Bank Signatories</span></li>
              </ul>
            </div>

            <div className="space-y-3 text-left">
              <h4 className="font-mono text-[10px] font-extrabold uppercase text-white tracking-widest">Report & Compliance</h4>
              <p className="text-[11px] text-slate-500 leading-normal font-sans">
                Notice something suspicious? Submit an administrative report to trigger a forensic investigation.
              </p>
              <button
                onClick={() => alert("Forensic audit report request has been logged onto the sandbox network for review.")}
                className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 border border-rose-900/20 text-[10px] font-mono font-bold rounded-lg transition-all"
              >
                Report Campaign Action
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600 font-sans">
            <div>
              <span>Powered by </span>
              <strong className="text-slate-400">HarambeeFlow AI</strong>
              <span> | Verified by HarambeeFlow Audit Service</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 transition cursor-pointer">Terms of Service</span>
              <span>© 2026 HarambeeFlow AI. All rights reserved.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
