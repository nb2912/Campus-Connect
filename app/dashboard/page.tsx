"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase"; 
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  updateDoc, deleteDoc, doc, where, setDoc, increment, limit, getDoc, deleteField,
  getDocs // <--- 1. ADDED getDocs IMPORT
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { RideRequest } from "@/types"; 
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Dumbbell, Train, Pizza, BookOpen, Ticket, 
  Calendar, MapPin, User, Zap, X, LogOut, Trash2, 
  MessageCircle, Send, Bell, Check, Trophy, Crown, AlertTriangle, 
  LogOut as LeaveIcon, Phone, Home, Plus, Settings
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const CATEGORIES = {
  CAB: { label: "Cab", icon: Plane, color: "bg-orange-500", gradient: "from-orange-400 to-red-500" },
  GYM: { label: "Gym", icon: Dumbbell, color: "bg-blue-500", gradient: "from-blue-400 to-indigo-500" },
  TRAIN: { label: "Train", icon: Train, color: "bg-emerald-500", gradient: "from-emerald-400 to-teal-500" },
  FOOD: { label: "Food", icon: Pizza, color: "bg-pink-500", gradient: "from-pink-400 to-rose-500" },
  STUDY: { label: "Study", icon: BookOpen, color: "bg-violet-500", gradient: "from-violet-400 to-purple-500" },
  MOVIE: { label: "Movie", icon: Ticket, color: "bg-yellow-500", gradient: "from-yellow-400 to-amber-500" },
};

type CategoryKey = keyof typeof CATEGORIES;

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>({});
  
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // View States
  const [activeTab, setActiveTab] = useState<"FEED" | "LEADERBOARD" | "ALERTS" | "PROFILE">("FEED");
  const [filter, setFilter] = useState<CategoryKey | "ALL">("ALL");
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<RideRequest | null>(null);
  
  const [formType, setFormType] = useState<CategoryKey>("CAB");
  const [formDesc, setFormDesc] = useState("");
  const [formTime, setFormTime] = useState("");
  const router = useRouter();

  // 1. Auth & Data Sync
  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) setUserProfile(docSnap.data());
            else setDoc(userRef, { displayName: u.displayName, email: u.email, points: 0, photoURL: u.photoURL });
        });
        const notifQuery = query(collection(db, "notifications"), where("receiverId", "==", u.uid), orderBy("createdAt", "desc"));
        onSnapshot(notifQuery, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });

    const reqQuery = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    onSnapshot(reqQuery, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RideRequest[]));

    const lbQuery = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    onSnapshot(lbQuery, (snap) => setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { authUnsub(); };
  }, [router]);
// --- 2. NEW: AUTO-DELETE OLD REQUESTS (Lazy Cleanup) ---
  useEffect(() => {
    if (!user) return; // Wait for user to log in

    const cleanupExpiredRequests = async () => {
      const now = new Date();
      
      // FIX: Only query *MY* requests (creatorId == user.uid)
      // This prevents the "Permission Denied" error because you own these docs.
      const q = query(
        collection(db, "requests"), 
        where("creatorId", "==", user.uid)
      );
      
      const snapshot = await getDocs(q);

      snapshot.forEach(async (document) => {
        const data = document.data();
        
        if (!data.time) return;

        // Calculate Expiration (Event Time + 3 Hours)
        const eventTime = new Date(data.time);
        const expirationTime = new Date(eventTime.getTime() + (3 * 60 * 60 * 1000)); 

        // Delete if expired
        if (now > expirationTime) {
          console.log(`Deleting my expired request: ${document.id}`);
          await deleteDoc(doc(db, "requests", document.id));
        }
      });
    };

    cleanupExpiredRequests();
  }, [user]); // Run whenever user changes

  // --- ACTIONS ---
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, "requests"), {
      type: formType, description: formDesc, time: formTime,
      createdAt: serverTimestamp(), status: "OPEN",
      creatorName: user.displayName, creatorEmail: user.email, creatorId: user.uid,
    });
    setIsModalOpen(false); setFormDesc(""); setFormTime(""); setActiveTab("FEED");
  };

  const handleAccept = async (req: RideRequest) => {
    if (!user || req.creatorId === user.uid) return;
    if (!confirm(`Connect with ${req.creatorName}?`)) return;
    try {
        await updateDoc(doc(db, "requests", req.id), { status: "ACCEPTED", acceptedBy: user.uid, acceptedByName: user.displayName, acceptedByEmail: user.email });
        await addDoc(collection(db, "notifications"), { receiverId: req.creatorId, message: `${user.displayName} accepted your ${req.type} request!`, type: "ACCEPT", read: false, createdAt: serverTimestamp(), requestId: req.id });
        await setDoc(doc(db, "users", req.creatorId), { points: increment(50), displayName: req.creatorName, email: req.creatorEmail }, { merge: true });
        await setDoc(doc(db, "users", user.uid), { points: increment(50), displayName: user.displayName, email: user.email, photoURL: user.photoURL }, { merge: true });
    } catch (error) { console.error(error); alert("Failed to connect."); }
  };

  const handleWithdraw = async (req: RideRequest) => {
    if (!user || !confirm("Withdraw application? You will lose points.")) return;
    try {
        await updateDoc(doc(db, "requests", req.id), { status: "OPEN", acceptedBy: deleteField(), acceptedByName: deleteField(), acceptedByEmail: deleteField() });
        await addDoc(collection(db, "notifications"), { receiverId: req.creatorId, message: `${user.displayName} withdrew from your plan.`, type: "WITHDRAW", read: false, createdAt: serverTimestamp(), requestId: req.id });
        await setDoc(doc(db, "users", req.creatorId), { points: increment(-50) }, { merge: true });
        await setDoc(doc(db, "users", user.uid), { points: increment(-50) }, { merge: true });
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => { if (confirm("Delete?")) { await deleteDoc(doc(db, "requests", id)); }};
  const markNotificationRead = async (id: string) => await updateDoc(doc(db, "notifications", id), { read: true });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
        await setDoc(doc(db, "users", user.uid), { phoneNumber: formData.get("phone"), address: formData.get("address"), displayName: formData.get("name") }, { merge: true });
        setIsProfileEditOpen(false);
    } catch (err) { alert("Failed to update."); }
  };

  const setQuickDate = (d: number) => {
    const date = addDays(new Date(), d);
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    setFormTime(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`);
  };

  // --- 3. UPDATED: FILTERING LOGIC (Hides expired items instantly) ---
  const filteredRequests = requests.filter(r => {
    // A. Category Filter
    if (filter !== "ALL" && r.type !== filter) return false;

    // B. Time Filter (Hide if Event Time + 3 Hours is in the past)
    if (r.time) {
      const eventTime = new Date(r.time);
      const expirationTime = new Date(eventTime.getTime() + (3 * 60 * 60 * 1000));
      if (new Date() > expirationTime) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* --- DESKTOP NAVBAR (Hidden on Mobile) --- */}
      <nav className="hidden md:block fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("FEED")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"><Zap className="text-white fill-white" size={20} /></div>
            <span className="text-xl font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTab("FEED")} className={cn("text-sm font-bold transition-colors", activeTab === "FEED" ? "text-white" : "text-slate-400")}>Feed</button>
             <button onClick={() => setActiveTab("LEADERBOARD")} className={cn("text-sm font-bold transition-colors", activeTab === "LEADERBOARD" ? "text-amber-400" : "text-slate-400")}>Leaders</button>
             <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">+ New Plan</button>
             <button onClick={() => setActiveTab("PROFILE")} className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-white transition-colors">
                {user?.photoURL ? <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-600 flex items-center justify-center"><User size={16} /></div>}
             </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE TOP HEADER (Logo Only) --- */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-center z-40">
         <div className="flex items-center gap-2">
            <Zap className="text-indigo-500 fill-indigo-500" size={20} />
            <span className="text-lg font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
         </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="pt-24 pb-32 md:pt-32 md:pb-20 max-w-7xl mx-auto px-4 md:px-6">
        
        {/* VIEW 1: FEED */}
        {activeTab === "FEED" && (
          <>
            <div className="mb-8 md:mb-12 space-y-6">
              <div className="hidden md:block">
                  <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Find your squad.</h1>
              </div>
              {/* Filter Chips - Horizontal Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button onClick={() => setFilter("ALL")} className={cn("px-5 py-2.5 rounded-full text-sm font-bold transition-all border shrink-0", filter === "ALL" ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-transparent")}>All</button>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => setFilter(key as CategoryKey)} className={cn("px-5 py-2.5 rounded-full text-sm font-bold transition-all border flex items-center gap-2 shrink-0", filter === key ? `bg-white/10 border-white/20 text-white shadow-[0_0_15px_${cat.color.replace('bg-', '')}]` : "bg-white/5 text-slate-400 border-transparent")}>
                    <cat.icon size={16} />{cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRequests.map((req) => {
                  const Category = CATEGORIES[req.type as CategoryKey] || CATEGORIES.CAB;
                  const isAccepted = req.status === "ACCEPTED";
                  const isMine = req.creatorId === user?.uid;
                  const iAcceptedIt = req.acceptedBy === user?.uid;
                  const canChat = isAccepted && (isMine || iAcceptedIt);

                  return (
                    <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("relative p-5 md:p-6 rounded-3xl border backdrop-blur-md transition-all", isAccepted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10")}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg", Category.gradient)}><Category.icon size={20} /></div>
                        <span className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded-lg">{req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'HH:mm') : 'Now'}</span>
                      </div>
                      <h3 className={cn("text-lg md:text-xl font-semibold leading-snug mb-3", isAccepted && "text-emerald-400 line-through")}>{req.description}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 w-fit mb-5 text-sm text-slate-400"><Calendar size={14} />{req.time ? format(new Date(req.time), 'MMM d, h:mm a') : 'Flexible'}</div>
                      
                      {isAccepted ? (
                        <div className="space-y-3">
                          <div className="w-full py-2 text-emerald-400 text-xs font-bold text-center bg-emerald-500/10 rounded-xl uppercase tracking-wider">Matched: {req.acceptedByName?.split(" ")[0]}</div>
                          {canChat && (
                            <div className="flex gap-2">
                                <button onClick={() => setActiveChat(req)} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2"><MessageCircle size={18} /> Chat</button>
                                {iAcceptedIt && (<button onClick={() => handleWithdraw(req)} className="px-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><LeaveIcon size={18} /></button>)}
                            </div>
                          )}
                        </div>
                      ) : isMine ? (
                        <div className="flex gap-2"><div className="flex-1 py-3 rounded-xl border border-white/10 text-slate-500 text-sm font-medium text-center">Posted by You</div><button onClick={() => handleDelete(req.id)} className="px-4 rounded-xl bg-red-500/10 text-red-500"><Trash2 size={18} /></button></div>
                      ) : <button onClick={() => handleAccept(req)} className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm active:scale-95 transition-transform">Connect</button>}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* VIEW 2: LEADERBOARD */}
        {activeTab === "LEADERBOARD" && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-amber-400 mb-1">Campus Legends</h2>
                <p className="text-sm text-slate-400">Earn 50 XP per meetup</p>
            </div>
            <div className="space-y-3">
                {leaderboard.map((u, index) => (
                    <div key={u.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border", index < 3 ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20" : "bg-white/5 border-white/10")}>
                        <div className={cn("w-8 h-8 flex items-center justify-center font-bold rounded-full text-sm", index === 0 ? "bg-yellow-500 text-black" : "text-slate-500 bg-white/5")}>{index + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 overflow-hidden">
                            {u.photoURL ? <img src={u.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={16}/></div>}
                        </div>
                        <div className="flex-1"><h3 className="font-bold text-white text-sm">{u.displayName}</h3><p className="text-xs text-slate-500">{u.points} XP</p></div>
                        {index === 0 && <Crown size={20} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 3: ALERTS */}
        {activeTab === "ALERTS" && (
            <div className="max-w-xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                <div className="space-y-2">
                    {notifications.length === 0 ? <div className="text-center text-slate-500 py-10">No new alerts</div> : notifications.map(n => (
                        <div key={n.id} onClick={() => markNotificationRead(n.id)} className={cn("p-4 rounded-2xl border cursor-pointer flex gap-3 items-start", n.read ? "bg-white/5 border-white/5 opacity-60" : "bg-indigo-500/10 border-indigo-500/30")}>
                             <div className="mt-1">{n.type === "WITHDRAW" ? <AlertTriangle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}</div>
                             <div><p className="text-sm text-slate-200 leading-snug font-medium">{n.message}</p><span className="text-xs text-slate-500 mt-1 block">{n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* VIEW 4: PROFILE */}
        {activeTab === "PROFILE" && (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-indigo-500/20 overflow-hidden mb-4">
                        {user?.photoURL ? <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : null}
                    </div>
                    <h2 className="text-2xl font-bold">{userProfile?.displayName || user?.displayName}</h2>
                    <p className="text-slate-400 text-sm">{user?.email}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold border border-amber-500/20">
                        <Trophy size={14} /> {userProfile?.points || 0} XP
                    </div>
                </div>
                
                <div className="bg-white/5 rounded-3xl p-6 space-y-4 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Phone</p><p className="text-white">{userProfile?.phoneNumber || "Not set"}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400"><Home size={14} /></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Hostel</p><p className="text-white">{userProfile?.address || "Not set"}</p></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsProfileEditOpen(true)} className="py-3 rounded-xl bg-white text-black font-bold text-sm">Edit Profile</button>
                    <button onClick={() => signOut(auth)} className="py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm border border-red-500/20">Sign Out</button>
                </div>
            </div>
        )}
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION (Sticky) --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 pb-safe pt-2 z-50">
        <div className="flex justify-around items-center h-16">
            <NavIcon icon={Zap} label="Feed" isActive={activeTab === "FEED"} onClick={() => setActiveTab("FEED")} />
            <NavIcon icon={Trophy} label="Leaders" isActive={activeTab === "LEADERBOARD"} onClick={() => setActiveTab("LEADERBOARD")} />
            
            {/* CENTER ADD BUTTON */}
            <button onClick={() => setIsModalOpen(true)} className="mb-8 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-4 border-[#0f172a]">
                <Plus size={28} />
            </button>
            
            <NavIcon icon={Bell} label="Alerts" count={unreadCount} isActive={activeTab === "ALERTS"} onClick={() => setActiveTab("ALERTS")} />
            <NavIcon icon={User} label="Profile" isActive={activeTab === "PROFILE"} onClick={() => setActiveTab("PROFILE")} />
        </div>
        {/* iPhone Home Indicator Spacing */}
        <div className="h-4 w-full bg-[#0f172a]/95" />
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. CREATE PLAN (Bottom Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#1e293b] w-full md:w-[500px] rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 md:hidden" />
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">New Plan</h2>
                 <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="grid grid-cols-3 gap-3">{Object.entries(CATEGORIES).map(([key, cat]) => (<button key={key} type="button" onClick={() => setFormType(key as CategoryKey)} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", formType === key ? `bg-white/10 border-white/50 text-white shadow-[0_0_15px_${cat.color.replace('bg-', '')}]` : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10")}><cat.icon size={24} /><span className="text-xs font-medium">{cat.label}</span></button>))}</div>
              <div className="space-y-4"><input required placeholder="What's the plan?" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white text-lg focus:outline-none focus:border-indigo-500" /><div className="flex gap-2"><button type="button" onClick={() => setQuickDate(0)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 text-sm font-bold text-slate-300">Today</button><button type="button" onClick={() => setQuickDate(1)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 text-sm font-bold text-slate-300">Tomorrow</button></div><input type="datetime-local" required value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" /></div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-4 rounded-xl text-lg mb-4 md:mb-0">Post It</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. EDIT PROFILE (Bottom Sheet on Mobile) */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#1e293b] w-full md:w-96 rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 shadow-2xl relative">
             <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 md:hidden" />
             <h2 className="text-xl font-bold mb-6 text-center">Edit Profile</h2>
             <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500 ml-1">Name</label><input name="name" defaultValue={userProfile?.displayName || user?.displayName} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500 ml-1">Phone</label><input name="phone" type="tel" defaultValue={userProfile?.phoneNumber} placeholder="+91..." className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500 ml-1">Hostel</label><input name="address" defaultValue={userProfile?.address} placeholder="Room No..." className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" /></div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsProfileEditOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">Save</button>
                </div>
             </form>
          </motion.div>
        </div>
      )}

      {/* 3. CHAT WINDOW (Full Screen on Mobile) */}
      {activeChat && user && <ChatWindow request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavIcon({ icon: Icon, label, isActive, onClick, count }: any) {
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center w-16 gap-1 relative">
            <Icon size={24} className={cn("transition-colors", isActive ? "text-indigo-400 fill-indigo-400/20" : "text-slate-500")} />
            <span className={cn("text-[10px] font-bold", isActive ? "text-indigo-400" : "text-slate-500")}>{label}</span>
            {count > 0 && <span className="absolute top-0 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a]" />}
        </button>
    )
}

function ChatWindow({ request, currentUser, onClose }: { request: RideRequest, currentUser: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { const q = query(collection(db, "requests", request.id, "messages"), orderBy("createdAt", "asc")); const unsub = onSnapshot(q, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); }, [request.id]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  
  const sendMessage = async (e: React.FormEvent) => { e.preventDefault(); if (!newMessage.trim()) return; await addDoc(collection(db, "requests", request.id, "messages"), { text: newMessage, senderId: currentUser.uid, senderName: currentUser.displayName, createdAt: serverTimestamp() }); setNewMessage(""); };
  const otherPersonName = request.creatorId === currentUser.uid ? request.acceptedByName : request.creatorName;
  
  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a] md:bg-black/60 md:backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1e293b] w-full h-full md:h-[600px] md:max-w-md md:rounded-3xl border-none md:border border-white/10 shadow-2xl flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0f172a] pt-safe">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="md:hidden mr-2"><X size={24} /></button>
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{otherPersonName?.[0]}</div>
             <div><h3 className="font-bold text-white">{otherPersonName}</h3><p className="text-xs text-slate-400">{request.description}</p></div>
          </div>
          <button onClick={onClose} className="hidden md:block text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f172a]/50">
          {messages.map((msg) => { const isMe = msg.senderId === currentUser.uid; return (<div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}><div className={cn("max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed", isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/10 text-slate-200 rounded-tl-sm")}>{msg.text}</div></div>); })}
        </div>
        
        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 bg-[#0f172a] border-t border-white/10 flex gap-2 pb-safe md:pb-3">
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-base text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          <button type="submit" className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors"><Send size={20} /></button>
        </form>
      </motion.div>
    </div>
  );
}