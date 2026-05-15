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
  CAB: { label: "Cab", icon: Plane, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  GYM: { label: "Gym", icon: Dumbbell, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  TRAIN: { label: "Train", icon: Train, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  FOOD: { label: "Food", icon: Pizza, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  STUDY: { label: "Study", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  MOVIE: { label: "Movie", icon: Ticket, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  OTHER: { label: "Other", icon: Plus, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-24">
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} userProfile={userProfile} onOpenModal={() => setIsModalOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />
      
      {/* Toast notifications are now rendered by the global ToastProvider */}

      <main className="pt-28 max-w-7xl mx-auto px-4 md:px-6 min-h-[80vh]">
        
        {activeTab === "FEED" && (
          <>
            <div className="mb-14 space-y-8">
              <div className="flex justify-between items-end border-b border-neutral-900 pb-6">
                  <div className="hidden md:block">
                      <h1 className="text-4xl font-extrabold mb-1 text-slate-900 tracking-tight">Live Feed</h1>
                      <p className="text-slate-500 text-sm font-medium">Your campus network, updating in real-time.</p>
                  </div>
                  <button onClick={requestNotificationPermission} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                      <Bell size={14} /> Enable Alerts
                  </button>
              </div>

              {/* QUICK ACTIONS: LIVE NOW */}
              <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Starting Soon</h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                      {requests.filter(r => r.time && new Date(r.time).getTime() - new Date().getTime() < 3600000 && new Date(r.time).getTime() > new Date().getTime()).length === 0 ? (
                          <div className="px-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-slate-500 font-semibold">No urgent plans right now.</div>
                      ) : (
                          requests.filter(r => r.time && new Date(r.time).getTime() - new Date().getTime() < 3600000 && new Date(r.time).getTime() > new Date().getTime()).map(r => (
                              <motion.div key={r.id} whileHover={{ scale: 1.02 }} className="flex-shrink-0 w-64 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center"><Zap size={12} className="text-indigo-600" /></div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Next 60 Mins</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-900 truncate">{r.description}</p>
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">{format(new Date(r.time), 'h:mm a')}</p>
                              </motion.div>
                          ))
                      )}
                  </div>
              </div>

              {/* SMART FLOATING FILTER PILL */}
              <div className="sticky top-20 z-40 -mx-4 px-4 md:mx-0 md:px-0 pointer-events-none">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide pointer-events-auto bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-slate-200 shadow-xl shadow-slate-200/50 w-fit mx-auto md:mx-0">
                    <button onClick={() => setFilter("ALL")} className={cn("px-5 py-2 rounded-full text-xs font-bold transition-all", filter === "ALL" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-transparent text-slate-500 hover:text-slate-900")}>All</button>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button key={key} onClick={() => setFilter(key as CategoryKey)} className={cn("px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shrink-0", filter === key ? `bg-slate-100 text-indigo-600` : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>
                        <cat.icon size={14} className={cn("transition-colors", filter === key ? "text-indigo-600" : "text-slate-400")} />
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
                    <div className="col-span-full text-center py-20 flex flex-col items-center">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mb-4"><Zap size={32}/></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">It's a bit quiet here...</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm">No plans are happening right now. Why not be the pioneer and post the first one?</p>
                        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-600/20 hover:scale-105 transition-transform">Create a Plan</button>
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
                    <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("relative p-6 rounded-3xl border transition-all group hover:-translate-y-1 overflow-hidden flex flex-col", isFull ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm hover:shadow-lg hover:shadow-slate-200/50")}>

                      {/* Top Row: User & Time */}
                      <div className="flex justify-between items-start mb-5 relative z-10">
                          <div className="flex items-center gap-3">
                               <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", Category.bg, Category.border)}><Category.icon size={16} className={Category.color} /></div>
                              <div>
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{req.type === "OTHER" ? (req.customType || "Other") : req.type}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                      {req.creatorPhoto ? <Image src={req.creatorPhoto} alt="" width={16} height={16} className="w-4 h-4 rounded-full" /> : <User size={12} className="text-slate-400"/>}
                                      <span className="text-xs text-slate-700 font-medium">{req.creatorName?.split(" ")[0]}</span>
                                  </div>
                              </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{req.createdAt ? format(req.createdAt.toDate(), 'h:mm a') : 'Now'}</span>
                      </div>

                       {/* Content */}
                      {req.type === "CAB" ? (
                          <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                                  <p className="text-slate-900 font-semibold truncate">{req.startLoc || "Pickup"}</p>
                              </div>
                              <div className="ml-1 w-px h-4 bg-slate-200" />
                              <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                                  <p className="text-slate-600 font-medium truncate">{req.endLoc || "Destination"}</p>
                              </div>
                          </div>
                      ) : (
                          <h3 className={cn("text-lg font-semibold leading-tight mb-4 text-slate-900", isFull && "text-slate-400 line-through decoration-slate-300")}>
                              {req.type === "FOOD" ? `Order from: ${req.restaurant}` : req.type === "OTHER" ? `${req.customType}: ${req.description}` : req.description}
                          </h3>
                      )}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 w-fit mb-6 border border-slate-100">
                          <Calendar size={14} className="text-slate-500" />
                          <span className="text-sm font-semibold text-slate-700">{req.time ? format(new Date(req.time), 'MMM d, h:mm a') : 'Flexible Time'}</span>
                      </div>

                      {/* Footer: Seats & Action */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                          <div className="flex gap-1.5">
                              {seats.map((status, i) => (
                                  <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", status === "filled" ? "bg-indigo-600" : "bg-slate-200")} />
                              ))}
                          </div>

                           <div className="flex gap-2">
                              {(isMine || iJoined) && (
                                  <button onClick={() => setActiveChat(req)} className="w-9 h-9 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 transition-colors shadow-sm"><MessageCircle size={16} /></button>
                              )}

                              {iJoined && !isMine && req.creatorUpi && (
                                  <button onClick={() => handlePayment(req.creatorUpi ?? '', req.description)} className="flex items-center gap-2 px-3 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition-all font-semibold text-xs shadow-sm">
                                      Pay
                                  </button>
                              )}

                              {isMine ? (
                                  <button onClick={() => handleDelete(req.id)} className="w-9 h-9 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 border border-red-100 transition-colors shadow-sm"><Trash2 size={16} /></button>
                              ) : iJoined ? (
                                  <button onClick={() => handleLeave(req)} className="w-9 h-9 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 transition-colors shadow-sm"><LeaveIcon size={16} /></button>
                              ) : (
                                  <button onClick={() => handleJoin(req)} disabled={isFull} className={cn("px-4 py-2 rounded-md font-semibold text-sm transition-all shadow-sm", isFull ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700")}>
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
             <div className="text-center mb-10"><h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">Top Users</h2><p className="text-slate-500">Earn 50 XP per meetup</p></div>
             <div className="space-y-3">{leaderboard.map((u, i) => (<div key={u.id} className={cn("flex items-center gap-5 p-4 rounded-2xl border bg-white border-slate-200 transition-transform hover:scale-[1.02] shadow-sm")}><div className={cn("w-8 h-8 flex items-center justify-center font-bold rounded-lg text-sm", i===0 ? "bg-amber-100 text-amber-600" : "text-slate-500 bg-slate-100")}>{i + 1}</div><div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">{u.photoURL ? <Image src={u.photoURL} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-slate-400"/></div>}</div><div className="flex-1"><h3 className="font-bold text-slate-900 text-sm">{u.displayName}</h3><p className="text-xs text-slate-500 font-medium mt-0.5">{u.points} XP</p></div>{i === 0 && <Crown size={20} className="text-amber-500" />}</div>))}</div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === "ALERTS" && (
            <div className="max-w-xl mx-auto">
                <h2 className="text-2xl font-bold tracking-tight mb-6 text-slate-900">Notifications</h2>
                <div className="space-y-2">{notifications.length === 0 ? <div className="text-center text-slate-500 font-medium py-10">No new alerts</div> : notifications.map(n => (<div key={n.id} onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true })} className={cn("p-4 rounded-xl border cursor-pointer flex gap-3 items-start transition-colors", n.read ? "bg-transparent border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm hover:shadow-md")}><div className="mt-0.5">{n.type === "WITHDRAW" ? <AlertTriangle size={16} className="text-slate-400" /> : <Check size={16} className="text-indigo-600" />}</div><div><p className="text-sm font-semibold text-slate-800">{n.message}</p><span className="text-xs font-medium text-slate-500 mt-1 block">{n.createdAt ? format(n.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}</span></div></div>))}</div>
            </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "PROFILE" && (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center"><div className="w-24 h-24 mx-auto rounded-full border border-slate-200 shadow-sm overflow-hidden mb-4 bg-slate-100">{user?.photoURL ? <Image src={user.photoURL} alt="" width={96} height={96} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={32} className="text-slate-400"/></div>}</div><h2 className="text-2xl font-bold tracking-tight text-slate-900">{userProfile?.displayName || user?.displayName}</h2><p className="text-slate-500 font-medium text-sm">{user?.email}</p><div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200"><Trophy size={14} className="text-amber-500" /> {userProfile?.points || 0} XP</div></div>
                <div className="bg-white shadow-sm rounded-2xl p-6 space-y-6 border border-slate-200"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600"><Phone size={16} /></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Phone</p><p className="text-slate-900 font-semibold text-sm mt-0.5">{userProfile?.phoneNumber || "Not set"}</p></div></div><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600"><Home size={16} /></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hostel</p><p className="text-slate-900 font-semibold text-sm mt-0.5">{userProfile?.address || "Not set"}</p></div></div></div>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setIsProfileEditOpen(true)} className="py-3 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-bold text-sm hover:bg-indigo-700 transition-colors">Edit Profile</button><button onClick={() => signOut(auth)} className="py-3 rounded-xl bg-white text-red-600 font-bold text-sm border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm">Sign Out</button></div>
            </div>
        )}

        <Footer />
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={notifications.filter(n => !n.read).length} onOpenModal={() => setIsModalOpen(true)} user={user} />

      {/* CREATE MODAL / BOTTOM SHEET */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 md:p-4">
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full md:w-[480px] rounded-t-3xl md:rounded-3xl border-t md:border border-slate-200 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold tracking-tight text-slate-900">Create Plan</h2><button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={16} className="text-slate-500 hover:text-slate-900" /></button></div>
                 <form onSubmit={handleCreateRequest} className="space-y-5 pb-10 md:pb-0">
                    <div className="grid grid-cols-4 gap-2">{Object.entries(CATEGORIES).map(([key, cat]) => (<button key={key} type="button" onClick={() => setFormType(key as CategoryKey)} className={cn("flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all", formType === key ? `bg-indigo-50 border-indigo-200 text-indigo-700` : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><cat.icon size={18} className={formType === key ? "text-indigo-600" : ""} /><span className="text-[10px] font-bold">{cat.label}</span></button>))}</div>
                    <div className="space-y-4">
                        {formType === "CAB" ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900" />
                                    <input required placeholder="Start Location" value={formStartLoc} onChange={(e) => setFormStartLoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 transition-colors" />
                                </div>
                                <div className="ml-4 w-px h-2 bg-slate-200" />
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400" />
                                    <input required placeholder="End Location" value={formEndLoc} onChange={(e) => setFormEndLoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 transition-colors" />
                                </div>
                            </div>
                         ) : formType === "FOOD" ? (
                            <input required placeholder="Where are you ordering from?" value={formRestaurant} onChange={(e) => setFormRestaurant(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 transition-colors" />
                        ) : formType === "OTHER" ? (
                            <div className="space-y-3">
                                <input required placeholder="Activity Name" value={formCustomType} onChange={(e) => setFormCustomType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 font-semibold transition-colors" />
                                <input required placeholder="Details" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 transition-colors" />
                            </div>
                        ) : (
                            <input required placeholder="Short description of your plan..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 transition-colors" />
                        )}

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1.5 block">Day</label>
                                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
                                    <button type="button" onClick={() => setFormDay("TODAY")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", formDay === "TODAY" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}>Today</button>
                                    <button type="button" onClick={() => setFormDay("TOMORROW")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", formDay === "TOMORROW" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}>Tomorrow</button>
                                </div>
                            </div>
                            <div className="w-28">
                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1.5 block">Time</label>
                                <input type="time" required value={formHour} onChange={(e) => setFormHour(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            <div className="w-20">
                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1.5 block">Seats</label>
                                <div className="relative">
                                    <Users size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="number" min="2" max="10" required value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-2 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 font-bold py-3.5 rounded-xl text-sm transition-colors active:scale-95">Post Request</button>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL / BOTTOM SHEET */}
      <AnimatePresence>
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 md:p-4">
            <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-3xl border-t md:border border-slate-200 p-6 shadow-2xl relative"
            >
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
                <h2 className="text-lg font-bold mb-6 text-center text-slate-900 tracking-tight">Edit Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4 pb-10 md:pb-0">
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Display Name</label><input name="name" defaultValue={userProfile?.displayName} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none transition-colors" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Phone</label><input name="phone" defaultValue={userProfile?.phoneNumber} placeholder="+91 00000 00000" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none transition-colors" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Hostel/Address</label><input name="address" defaultValue={userProfile?.address}  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none transition-colors" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">UPI ID (for bill splitting)</label><input name="upi" defaultValue={userProfile?.upiId} placeholder="username@upi" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-slate-400 font-mono transition-colors" /></div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => setIsProfileEditOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">Save</button>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setConfirmDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative z-10 w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Are you sure?</h3>
              <p className="text-sm text-slate-500 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
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
        <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm animate-pulse">
            <div className="flex justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100" />
                    <div className="space-y-2">
                        <div className="h-2 w-16 bg-slate-100 rounded" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                    </div>
                </div>
                <div className="h-6 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-6 w-full bg-slate-100 rounded-lg mb-4" />
            <div className="h-4 w-2/3 bg-slate-100 rounded-lg mb-8" />
            <div className="flex justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-1 items-center">
                    {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-100" />)}
                </div>
                <div className="h-9 w-20 bg-slate-100 rounded-md" />
            </div>
        </div>
    )
}
