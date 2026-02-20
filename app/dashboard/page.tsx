"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, deleteDoc, doc, where, setDoc, increment, limit, getDocs, deleteField, getDoc, arrayUnion, arrayRemove, runTransaction, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Dumbbell, Train, Pizza, BookOpen, Ticket, Calendar, MessageCircle, Check, Trophy, Crown, AlertTriangle, LogOut as LeaveIcon, Phone, Home, X, Trash2, User, Users, Info, Bell, Zap, Plus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastNotification";

import Footer from "../components/Footer";
import { Navbar, BottomNav } from "../components/Navigation";
import ChatWindow from "../components/ChatWindow";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// --- TYPES ---
type CategoryKey = "CAB" | "GYM" | "TRAIN" | "FOOD" | "STUDY" | "MOVIE" | "OTHER";

interface PlanRequest {
  id: string;
  type: CategoryKey;
  description: string;
  startLoc?: string;
  endLoc?: string;
  restaurant?: string;
  customType?: string;
  time: string;
  expiresAt?: { toDate: () => Date };
  capacity: number;
  participants: string[];
  status: "OPEN" | "FULL";
  createdAt: { toDate: () => Date } | null;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhoto: string;
  creatorUpi?: string;
}

interface AppNotification {
  id: string;
  receiverId: string;
  message: string;
  type: "ACCEPT" | "WITHDRAW" | string;
  read: boolean;
  senderName?: string;
  senderPhoto?: string;
  planLabel?: string;
  createdAt: { toDate: () => Date } | null;
}

interface LeaderboardEntry {
  id: string;
  displayName: string;
  photoURL?: string;
  points: number;
}

// --- CONFIG ---
const CATEGORIES: Record<CategoryKey, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  CAB: { label: "Cab", icon: Plane, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  GYM: { label: "Gym", icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  TRAIN: { label: "Train", icon: Train, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  FOOD: { label: "Food", icon: Pizza, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  STUDY: { label: "Study", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  MOVIE: { label: "Movie", icon: Ticket, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  OTHER: { label: "Other", icon: Plus, color: "text-slate-400", bg: "bg-white/5", border: "border-white/10" },
};

export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState<PlanRequest[]>([]); 
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [feedLimit, setFeedLimit] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"FEED" | "LEADERBOARD" | "ALERTS" | "PROFILE">("FEED");
  const [filter, setFilter] = useState<CategoryKey | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<PlanRequest | null>(null);
  
  // FORM
  const [formType, setFormType] = useState<CategoryKey>("CAB");
  const [formDesc, setFormDesc] = useState("");
  const [formStartLoc, setFormStartLoc] = useState("");
  const [formEndLoc, setFormEndLoc] = useState("");
  const [formRestaurant, setFormRestaurant] = useState("");
  const [formCustomType, setFormCustomType] = useState("");
  const [formDay, setFormDay] = useState<"TODAY" | "TOMORROW">("TODAY");
  const [formHour, setFormHour] = useState("12:00");
  const [formCapacity, setFormCapacity] = useState("2");
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const isReqInitialLoad = useRef(true);
  const isNotifInitialLoad = useRef(true);
  const router = useRouter();

  // HELPERS
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    addToast({ message: msg, type });
  }, [addToast]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Listen for notifications (join/leave alerts)
    // ADDED LIMIT(50) to prevent unbounded reads
    const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where("receiverId", "==", user.uid), orderBy("createdAt", "desc"), limit(50)), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
      
      // FIX: Use dedicated ref for notifications to prevent race condition with requests
      if (!isNotifInitialLoad.current) {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            
            // Determine toast type based on notification type
            const toastType = data.type === "WITHDRAW" ? "leave" 
                            : data.type === "CHAT" ? "chat" 
                            : "join";
            
            // Show in-app toast notification
            addToast({
              message: data.message,
              type: toastType,
              senderName: data.senderName || undefined,
              senderPhoto: data.senderPhoto || undefined,
              subtitle: data.planLabel || undefined,
            });
            
            // Also send browser notification
            sendBrowserNotification("New Activity update!", data.message);
          }
        });
      }
      isNotifInitialLoad.current = false;
    });
    
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(feedLimit));
    const unsubRequests = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanRequest)));
      setHasMore(snap.docs.length === feedLimit);
      setFetching(false);

      if (!isReqInitialLoad.current) {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (data.creatorId !== user.uid) {
              sendBrowserNotification(`New ${data.type} Plan!`, `${data.creatorName} just posted: ${data.description || data.customType || 'New plan'}`);
            }
          }
        });
      }
      isReqInitialLoad.current = false;
    });

    const unsubLeaderboard = onSnapshot(query(collection(db, "users"), orderBy("points", "desc"), limit(10)), (snap) => setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardEntry))));

    // REMOVED: potentially dangerous client-side cleanup. 
    // This logic should be moved to a scheduled backend function to prevent "ghost" requests.
    // const cleanup = async () => { ... } 

    return () => {
      unsubNotifications();
      unsubRequests();
      unsubLeaderboard();
    };
  }, [user, feedLimit, addToast]);

  const handleLoadMore = () => setFeedLimit(prev => prev + 12);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;

    // --- RATE LIMIT: max 3 active plans per user ---
    const activePlansSnap = await getDocs(
      query(collection(db, "requests"), where("creatorId", "==", user.uid), where("status", "in", ["OPEN", "FULL"]))
    );
    if (activePlansSnap.size >= 3) {
      addToast({ message: "You can only have 3 active plans at a time. Delete one first.", type: "error" });
      return;
    }

    const date = formDay === "TODAY" ? new Date() : addDays(new Date(), 1);
    const [h, m] = formHour.split(":");
    date.setHours(parseInt(h));
    date.setMinutes(parseInt(m));
    const combinedTime = date.toISOString();

    // Compute expiresAt = plan time + 3 hours (used for Firestore TTL auto-cleanup)
    const expiresAt = Timestamp.fromDate(new Date(date.getTime() + 3 * 60 * 60 * 1000));

    await addDoc(collection(db, "requests"), { 
      type: formType, 
      description: formDesc,
      startLoc: formStartLoc,
      endLoc: formEndLoc,
      restaurant: formRestaurant,
      customType: formCustomType,
      time: combinedTime, 
      expiresAt,
      capacity: Number(formCapacity), 
      participants: [], createdAt: serverTimestamp(), status: "OPEN", 
      creatorName: user.displayName, creatorEmail: user.email, creatorId: user.uid, creatorPhoto: user.photoURL,
      creatorUpi: userProfile?.upiId || ""
    });
    setIsModalOpen(false); 
    setFormDesc(""); setFormStartLoc(""); setFormEndLoc(""); setFormRestaurant(""); setFormCustomType(""); setFormDay("TODAY"); setFormHour("12:00"); setFormCapacity("2"); 
    setActiveTab("FEED");
    showToast("Plan created successfully!");
  };

  const handleJoin = async (req: PlanRequest) => {
    if (!user || req.creatorId === user.uid) return;
    if (req.participants?.includes(user.uid)) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, "requests", req.id);
        const requestSnap = await transaction.get(requestRef);
        
        if (!requestSnap.exists()) throw "Plan no longer exists";
        const data = requestSnap.data();
        const participants = data.participants || [];
        
        if (participants.length >= data.capacity) throw "This plan is already full!";
        if (participants.includes(user.uid)) throw "You already joined this plan";

        // Update request
        const newParticipants = [...participants, user.uid];
        const status = newParticipants.length >= data.capacity ? "FULL" : "OPEN";
        transaction.update(requestRef, { participants: newParticipants, status });

        // Build plan label for notification context
        const planLabel = data.type === "CAB" ? `${data.startLoc} → ${data.endLoc}` 
                        : data.type === "FOOD" ? `Food: ${data.restaurant}` 
                        : data.type === "OTHER" ? `${data.customType}` 
                        : `${data.type}: ${data.description}`;

        // Add notification with sender info for rich toast
        const notificationRef = doc(collection(db, "notifications"));
        transaction.set(notificationRef, { 
          receiverId: data.creatorId, 
          message: `${user.displayName} joined your ${data.type} group!`, 
          type: "ACCEPT", 
          read: false, 
          senderName: user.displayName,
          senderPhoto: user.photoURL || "",
          planLabel,
          createdAt: serverTimestamp() 
        });

        // Add points
        transaction.set(doc(db, "users", data.creatorId), { points: increment(50) }, { merge: true });
        transaction.set(doc(db, "users", user.uid), { points: increment(50) }, { merge: true });
      });
      // Micro-interaction celebration
      addToast({ message: "Joined the squad! 🚀", type: "success" });
    } catch (error) { addToast({ message: typeof error === 'string' ? error : "Failed to join", type: "error" }); }
  };

  const handleLeave = async (req: PlanRequest) => {
    if (!user) return;
    setConfirmDialog({
      message: "Leave this group? You will lose 50 XP.",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "requests", req.id);
            const requestSnap = await transaction.get(requestRef);
            
            if (!requestSnap.exists()) throw "Plan no longer exists";
            const data = requestSnap.data();
            const participants = data.participants || [];
            
            if (!participants.includes(user.uid)) throw "You are not in this group";

            // Update request
            const newParticipants = participants.filter((id: string) => id !== user.uid);
            transaction.update(requestRef, { participants: newParticipants, status: "OPEN" });

            // Build plan label for notification context
            const planLabel = data.type === "CAB" ? `${data.startLoc} → ${data.endLoc}` 
                            : data.type === "FOOD" ? `Food: ${data.restaurant}` 
                            : data.type === "OTHER" ? `${data.customType}` 
                            : `${data.type}: ${data.description}`;

            // Add notification with sender info for rich toast
            const notificationRef = doc(collection(db, "notifications"));
            transaction.set(notificationRef, { 
              receiverId: data.creatorId, 
              message: `${user.displayName} left your group.`, 
              type: "WITHDRAW", 
              read: false, 
              senderName: user.displayName,
              senderPhoto: user.photoURL || "",
              planLabel,
              createdAt: serverTimestamp() 
            });

            // Deduct points
            transaction.set(doc(db, "users", data.creatorId), { points: increment(-50) }, { merge: true });
            transaction.set(doc(db, "users", user.uid), { points: increment(-50) }, { merge: true });
          });
          addToast({ message: "Left group successfully", type: "success" });
        } catch (error) { addToast({ message: typeof error === 'string' ? error : "Error leaving", type: "error" }); }
      },
    });
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      message: "Delete this plan? This cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog(null);
        await deleteDoc(doc(db, "requests", id));
        showToast("Deleted plan");
      },
    });
  };
  const handleUpdateProfile = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!user) return;
    const fd = new FormData(e.target as HTMLFormElement); 
    await setDoc(doc(db, "users", user.uid), { 
      phoneNumber: fd.get("phone"), 
      address: fd.get("address"), 
      displayName: fd.get("name"),
      upiId: fd.get("upi")
    }, { merge: true }); 
    setIsProfileEditOpen(false); 
    showToast("Profile updated!"); 
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        showToast("Alerts enabled! 🔔");
        new Notification("Notifications Enabled", { body: "You will now receive alerts for new plans and joins." });
      }
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const handlePayment = (creatorUpi: string, desc: string) => {
    const upiUrl = `upi://pay?pa=${creatorUpi}&pn=SRMSocial&tn=Split for ${desc}&cu=INR`;
    window.location.href = upiUrl;
  };
  const setQuickDate = (d: number) => { 
    const date = addDays(new Date(), d); 
    const pad = (n: number) => n < 10 ? `0${n}` : n; 
    setFormDay(d === 0 ? "TODAY" : "TOMORROW");
    setFormHour(`${pad(date.getHours())}:${pad(date.getMinutes())}`); 
  };

  const filteredRequests = requests.filter(r => (filter === "ALL" || r.type === filter) && (!r.time || new Date() <= new Date(new Date(r.time).getTime() + (3 * 3600000))));

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30 pb-20">
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onOpenModal={() => setIsModalOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />
      
      {/* Toast notifications are now rendered by the global ToastProvider */}

      <main className="pt-28 max-w-7xl mx-auto px-4 md:px-6 min-h-[80vh]">
        
        {activeTab === "FEED" && (
          <>
            <div className="mb-14 space-y-8">
              <div className="flex justify-between items-end">
                  <div className="hidden md:block">
                      <h1 className="text-6xl font-extrabold mb-3 text-white tracking-tight">Feed.</h1>
                      <p className="text-slate-400 text-lg">Your campus network, live.</p>
                  </div>
                  <button onClick={requestNotificationPermission} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                      <Bell size={14} /> Enable Alerts
                  </button>
              </div>

              {/* QUICK ACTIONS: LIVE NOW */}
              <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Live Soon / Active</h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                      {requests.filter(r => r.time && new Date(r.time).getTime() - new Date().getTime() < 3600000 && new Date(r.time).getTime() > new Date().getTime()).length === 0 ? (
                          <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/5 text-xs text-slate-500 font-medium">No urgent plans right now.</div>
                      ) : (
                          requests.filter(r => r.time && new Date(r.time).getTime() - new Date().getTime() < 3600000 && new Date(r.time).getTime() > new Date().getTime()).map(r => (
                              <motion.div key={r.id} whileHover={{ scale: 1.05 }} className="flex-shrink-0 w-64 p-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 backdrop-blur-md">
                                  <div className="flex items-center gap-3 mb-2">
                                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><Zap size={14} className="text-yellow-400 fill-yellow-400" /></div>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-white">Starting Soon</span>
                                  </div>
                                  <p className="text-sm font-bold text-white truncate">{r.description}</p>
                                  <p className="text-[10px] text-indigo-300 font-bold mt-1">{format(new Date(r.time), 'h:mm a')}</p>
                              </motion.div>
                          ))
                      )}
                  </div>
              </div>

              {/* SMART FLOATING FILTER PILL */}
              <div className="sticky top-24 z-40 -mx-4 px-4 md:mx-0 md:px-0 pointer-events-none">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide pointer-events-auto bg-[#0f172a]/60 backdrop-blur-xl p-2 rounded-3xl border border-white/5 shadow-2xl w-fit mx-auto md:mx-0">
                    <button onClick={() => setFilter("ALL")} className={cn("px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", filter === "ALL" ? "bg-white text-black shadow-xl scale-110" : "bg-white/5 text-slate-500 hover:text-white")}>All</button>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button key={key} onClick={() => setFilter(key as CategoryKey)} className={cn("px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0", filter === key ? `bg-white/10 text-white border border-white/10` : "text-slate-500 hover:text-white hover:bg-white/5")}>
                        <cat.icon size={14} className={cn("transition-colors", filter === key ? cat.color : "text-slate-600")} />
                        {cat.label}
                    </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {fetching ? (
                  [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)
                ) : filteredRequests.length === 0 ? (
                    <div className="col-span-full text-center py-20 opacity-50">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Info size={32}/></div>
                        <p>No plans found. Be the first to create one!</p>
                    </div>
                ) : filteredRequests.map((req) => {
                  const Category = CATEGORIES[req.type as CategoryKey] || CATEGORIES.CAB;
                  const participants = req.participants || [];
                  const joinedCount = participants.length;
                  const capacity = req.capacity || 1;
                  const isFull = joinedCount >= capacity;
                  const isMine = req.creatorId === user?.uid;
                  const iJoined = participants.includes(user!.uid);
                  
                  // Seats Visualizer
                  const seats = Array.from({ length: capacity }).map((_, i) => i < joinedCount ? "filled" : "empty");

                  return (
                    <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("relative p-6 rounded-[2rem] border backdrop-blur-xl transition-all group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden", isFull ? "bg-[#0f172a]/50 border-white/5 opacity-75" : "bg-[#1e293b]/60 border-white/5")}>
                      
                      {/* CATEGORY MESH BACKGROUND */}
                      <div className={cn("absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity", Category.bg.split(" ")[0].replace("/10", ""))} />

                      {/* Top Row: User & Time */}
                      <div className="flex justify-between items-start mb-5 relative z-10">
                          <div className="flex items-center gap-3">
                               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", Category.bg, Category.border, "border")}><Category.icon size={20} className={Category.color} /></div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{req.type === "OTHER" ? (req.customType || "Other") : req.type}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                      {req.creatorPhoto ? <Image src={req.creatorPhoto} alt="" width={16} height={16} className="w-4 h-4 rounded-full" /> : <User size={12} className="text-slate-500"/>}
                                      <span className="text-xs text-slate-300 font-bold">{req.creatorName?.split(" ")[0]}</span>
                                  </div>
                              </div>
                          </div>
                          <span className="text-xs font-bold text-slate-400 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">{req.createdAt ? format(req.createdAt.toDate(), 'h:mm a') : 'Now'}</span>
                      </div>

                       {/* Content */}
                      {req.type === "CAB" ? (
                          <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                  <p className="text-white font-bold truncate">{req.startLoc || "Pickup"}</p>
                              </div>
                              <div className="ml-1 w-0.5 h-4 bg-white/10" />
                              <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                  <p className="text-white font-bold truncate">{req.endLoc || "Destination"}</p>
                              </div>
                          </div>
                      ) : (
                          <h3 className={cn("text-xl font-bold leading-tight mb-4 text-white", isFull && "text-slate-500 line-through decoration-slate-600")}>
                              {req.type === "FOOD" ? `Order from: ${req.restaurant}` : req.type === "OTHER" ? `${req.customType}: ${req.description}` : req.description}
                          </h3>
                      )}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 w-fit mb-6 border border-white/5">
                          <Calendar size={14} className="text-indigo-400" />
                          <span className="text-sm font-bold text-slate-200">{req.time ? format(new Date(req.time), 'MMM d, h:mm a') : 'Flexible Time'}</span>

                      </div>

                      {/* Footer: Seats & Action */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                          <div className="flex gap-1">
                              {seats.map((status, i) => (
                                  <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-colors", status === "filled" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/10")} />
                              ))}
                          </div>

                           <div className="flex gap-2">
                              {(isMine || iJoined) && (
                                  <button onClick={() => setActiveChat(req)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white border border-white/10 transition-colors"><MessageCircle size={18} /></button>
                              )}

                              {iJoined && !isMine && req.creatorUpi && (
                                  <button onClick={() => handlePayment(req.creatorUpi ?? '', req.description)} className="flex items-center gap-2 px-4 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-bold text-xs uppercase tracking-wider">
                                      Pay UPI
                                  </button>
                              )}

                              {isMine ? (
                                  <button onClick={() => handleDelete(req.id)} className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/20 transition-colors"><Trash2 size={18} /></button>
                              ) : iJoined ? (
                                  <button onClick={() => handleLeave(req)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center text-slate-400 border border-white/10 transition-colors"><LeaveIcon size={18} /></button>
                              ) : (
                                  <button onClick={() => handleJoin(req)} disabled={isFull} className={cn("px-5 py-2.5 rounded-full font-bold text-sm transition-all", isFull ? "bg-white/5 text-slate-500" : "bg-white text-black hover:bg-indigo-50")}>
                                      {isFull ? "Full" : "Join"}
                                  </button>
                              )}
                          </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {hasMore && filteredRequests.length > 0 && (
              <div className="mt-12 flex justify-center pb-20">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all"
                >
                  Load More Plans
                </button>
              </div>
            )}
          </>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "LEADERBOARD" && (
          <div className="max-w-xl mx-auto">
             <div className="text-center mb-10"><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-2">Campus Legends</h2><p className="text-slate-400">Earn 50 XP per meetup</p></div>
             <div className="space-y-4">{leaderboard.map((u, i) => (<div key={u.id} className={cn("flex items-center gap-5 p-5 rounded-[1.5rem] border bg-[#1e293b]/60 backdrop-blur-md border-white/5 transition-transform hover:scale-[1.02]")}><div className={cn("w-10 h-10 flex items-center justify-center font-bold rounded-xl text-lg", i===0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" : "text-slate-500 bg-white/5")}>{i + 1}</div><div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden border border-white/10">{u.photoURL ? <Image src={u.photoURL} alt="" width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={20}/></div>}</div><div className="flex-1"><h3 className="font-bold text-white text-base">{u.displayName}</h3><p className="text-xs text-indigo-400 font-bold tracking-wider">{u.points} XP</p></div>{i === 0 && <Crown size={24} className="text-yellow-500 fill-yellow-500 animate-pulse" />}</div>))}</div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === "ALERTS" && (
            <div className="max-w-xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-white">Notifications</h2>
                <div className="space-y-2">{notifications.length === 0 ? <div className="text-center text-slate-500 py-10">No new alerts</div> : notifications.map(n => (<div key={n.id} onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true })} className={cn("p-4 rounded-2xl border cursor-pointer flex gap-3 items-start backdrop-blur-md transition-colors", n.read ? "bg-white/5 border-white/5 opacity-50" : "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20")}><div className="mt-1">{n.type === "WITHDRAW" ? <AlertTriangle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}</div><div><p className="text-sm text-slate-200 font-medium">{n.message}</p><span className="text-xs text-slate-500 mt-1 block">{n.createdAt ? format(n.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}</span></div></div>))}</div>
            </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "PROFILE" && (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center"><div className="w-28 h-28 mx-auto rounded-full border-4 border-white/10 overflow-hidden mb-4 shadow-2xl">{user?.photoURL && <Image src={user.photoURL} alt="" width={112} height={112} className="w-full h-full object-cover" />}</div><h2 className="text-3xl font-bold text-white">{userProfile?.displayName || user?.displayName}</h2><p className="text-slate-400">{user?.email}</p><div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20"><Trophy size={16} /> {userProfile?.points || 0} XP</div></div>
                <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-[2rem] p-8 space-y-6 border border-white/5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><Phone size={18} /></div><div><p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Phone</p><p className="text-white font-medium">{userProfile?.phoneNumber || "Not set"}</p></div></div><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><Home size={18} /></div><div><p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Hostel</p><p className="text-white font-medium">{userProfile?.address || "Not set"}</p></div></div></div>
                <div className="grid grid-cols-2 gap-4"><button onClick={() => setIsProfileEditOpen(true)} className="py-4 rounded-2xl bg-white text-black font-bold hover:scale-[1.02] transition-transform">Edit Profile</button><button onClick={() => signOut(auth)} className="py-4 rounded-2xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">Sign Out</button></div>
            </div>
        )}

        <Footer />
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={notifications.filter(n => !n.read).length} onOpenModal={() => setIsModalOpen(true)} user={user} />

      {/* CREATE MODAL / BOTTOM SHEET */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#1e293b] w-full md:w-[500px] rounded-t-[2.5rem] md:rounded-[2.5rem] border-t md:border border-white/10 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
                <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold text-white">New Plan</h2><button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-full hover:bg-white/10"><X size={20} className="text-white" /></button></div>
                 <form onSubmit={handleCreateRequest} className="space-y-6 pb-10 md:pb-0">
                    <div className="grid grid-cols-3 gap-3">{Object.entries(CATEGORIES).map(([key, cat]) => (<button key={key} type="button" onClick={() => setFormType(key as CategoryKey)} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", formType === key ? `bg-white text-black shadow-lg scale-105 border-transparent` : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10")}><cat.icon size={24} className={formType === key ? "text-indigo-600" : ""} /><span className="text-xs font-bold">{cat.label}</span></button>))}</div>
                    <div className="space-y-4">
                        {formType === "CAB" ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                                    <input required placeholder="Start Location " value={formStartLoc} onChange={(e) => setFormStartLoc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-10 pr-5 text-white text-base focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                                </div>
                                <div className="ml-1 w-0.5 h-4 bg-white/10" />
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500" />
                                    <input required placeholder="End Location" value={formEndLoc} onChange={(e) => setFormEndLoc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-10 pr-5 text-white text-base focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                                </div>
                            </div>
                         ) : formType === "FOOD" ? (
                            <input required placeholder="Where are you ordering from? " value={formRestaurant} onChange={(e) => setFormRestaurant(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white text-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                        ) : formType === "OTHER" ? (
                            <div className="space-y-3">
                                <input required placeholder="Activity Name" value={formCustomType} onChange={(e) => setFormCustomType(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white text-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-bold" />
                                <input required placeholder="Details " value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white text-base focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                            </div>
                        ) : (
                            <input required placeholder="Short description of your plan..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white text-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                        )}

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 uppercase font-bold ml-2 mb-2 block">Day</label>
                                <div className="flex gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
                                    <button type="button" onClick={() => setFormDay("TODAY")} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", formDay === "TODAY" ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white")}>Today</button>
                                    <button type="button" onClick={() => setFormDay("TOMORROW")} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", formDay === "TOMORROW" ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white")}>Tomorrow</button>
                                </div>
                            </div>
                            <div className="flex-1 border-l border-white/5 pl-4">
                                <label className="text-xs text-slate-500 uppercase font-bold ml-2 mb-2 block">Time</label>
                                <input type="time" required value={formHour} onChange={(e) => setFormHour(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                            </div>
                            <div className="w-24 border-l border-white/5 pl-4">
                                <label className="text-xs text-slate-500 uppercase font-bold ml-2 mb-2 block">Seats</label>
                                <div className="relative">
                                    <Users size={14} className="absolute left-3 top-3.5 text-slate-500" />
                                    <input type="number" min="2" max="10" required value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-2.5 pl-8 pr-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-indigo-500/25 transition-all active:scale-95">Post Request</button>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL / BOTTOM SHEET */}
      <AnimatePresence>
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#1e293b] w-full md:w-96 rounded-t-[2.5rem] md:rounded-[2.5rem] border-t md:border border-white/10 p-8 shadow-2xl relative"
            >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
                <h2 className="text-2xl font-bold mb-8 text-center text-white">Edit Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4 pb-10 md:pb-0">
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-2">Display Name</label><input name="name" defaultValue={userProfile?.displayName} className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-2">Phone</label><input name="phone" defaultValue={userProfile?.phoneNumber} placeholder="+91 00000 00000" className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-2">Hostel/Address</label><input name="address" defaultValue={userProfile?.address}  className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-2">UPI ID (for bill splitting)</label><input name="upi" defaultValue={userProfile?.upiId} placeholder="username@upi" className="w-full bg-black/20 border border-indigo-500/20 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600 font-mono text-sm" /></div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsProfileEditOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors">Save Changes</button>
                    </div>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

      {activeChat && user && <ChatWindow request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}

      {/* CONFIRM DIALOG */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative z-10 w-full max-w-sm bg-[#1e293b] border border-white/10 rounded-3xl p-7 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={26} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Are you sure?</h3>
              <p className="text-sm text-slate-400 mb-7">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 rounded-2xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-300 font-bold border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SkeletonCard() {
    return (
        <div className="p-6 rounded-[2rem] border border-white/5 bg-[#1e293b]/40 animate-pulse">
            <div className="flex justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5" />
                    <div className="space-y-2">
                        <div className="h-2 w-16 bg-white/5 rounded" />
                        <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="h-6 w-16 bg-white/5 rounded-full" />
            </div>
            <div className="h-6 w-full bg-white/5 rounded-lg mb-4" />
            <div className="h-4 w-2/3 bg-white/5 rounded-lg mb-8" />
            <div className="flex justify-between pt-4 border-t border-white/5">
                <div className="flex gap-1 items-center">
                    {[1,2,3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/5" />)}
                </div>
                <div className="h-10 w-20 bg-white/5 rounded-full" />
            </div>
        </div>
    )
}
