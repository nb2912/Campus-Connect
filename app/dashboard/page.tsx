"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, deleteDoc, doc, where, setDoc, increment, limit, getDocs, deleteField } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { RideRequest } from "@/types"; 
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
// FIX: Added 'User' to the imports below
import { Plane, Dumbbell, Train, Pizza, BookOpen, Ticket, Calendar, MessageCircle, Check, Trophy, Crown, AlertTriangle, LogOut as LeaveIcon, Phone, Home, X, Trash2, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// IMPORT OUR NEW COMPONENTS
import Footer from "../components/Footer";
import { Navbar, BottomNav } from "../components/Navigation";
import ChatWindow from "../components/ChatWindow";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// -- CONSTANTS --
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
  
  const [activeTab, setActiveTab] = useState<"FEED" | "LEADERBOARD" | "ALERTS" | "PROFILE">("FEED");
  const [filter, setFilter] = useState<CategoryKey | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<RideRequest | null>(null);
  
  const [formType, setFormType] = useState<CategoryKey>("CAB");
  const [formDesc, setFormDesc] = useState("");
  const [formTime, setFormTime] = useState("");
  const router = useRouter();

  // 1. DATA SYNC & CLEANUP
  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (u) => {
      if (!u) router.push("/");
      else {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        onSnapshot(userRef, (docSnap) => { if (docSnap.exists()) setUserProfile(docSnap.data()); else setDoc(userRef, { displayName: u.displayName, email: u.email, points: 0, photoURL: u.photoURL }); });
        onSnapshot(query(collection(db, "notifications"), where("receiverId", "==", u.uid), orderBy("createdAt", "desc")), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });
    onSnapshot(query(collection(db, "requests"), orderBy("createdAt", "desc")), (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RideRequest[]));
    onSnapshot(query(collection(db, "users"), orderBy("points", "desc"), limit(10)), (snap) => setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => authUnsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const cleanup = async () => {
      const now = new Date();
      const snapshot = await getDocs(query(collection(db, "requests"), where("creatorId", "==", user.uid)));
      snapshot.forEach(async (d) => {
        const data = d.data();
        if (!data.time) return;
        if (now > new Date(new Date(data.time).getTime() + (3 * 3600000))) await deleteDoc(doc(db, "requests", d.id));
      });
    };
    cleanup();
  }, [user]);

  // 2. HANDLERS
  // Helper function to clear all messages from a request
  const clearMessages = async (requestId: string) => {
    try {
      const messagesRef = collection(db, "requests", requestId, "messages");
      const messagesSnap = await getDocs(messagesRef);
      messagesSnap.forEach(async (msgDoc) => {
        await deleteDoc(doc(db, "requests", requestId, "messages", msgDoc.id));
      });
    } catch (error) {
      console.error("Error clearing messages:", error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    await addDoc(collection(db, "requests"), { type: formType, description: formDesc, time: formTime, createdAt: serverTimestamp(), status: "OPEN", creatorName: user.displayName, creatorEmail: user.email, creatorId: user.uid });
    setIsModalOpen(false); setFormDesc(""); setFormTime(""); setActiveTab("FEED");
  };
  const handleAccept = async (req: RideRequest) => {
    if (!user || req.creatorId === user.uid || !confirm(`Connect with ${req.creatorName}?`)) return;
    await updateDoc(doc(db, "requests", req.id), { status: "ACCEPTED", acceptedBy: user.uid, acceptedByName: user.displayName, acceptedByEmail: user.email });
    await addDoc(collection(db, "notifications"), { receiverId: req.creatorId, message: `${user.displayName} accepted your ${req.type} request!`, type: "ACCEPT", read: false, createdAt: serverTimestamp() });
    await setDoc(doc(db, "users", req.creatorId), { points: increment(50) }, { merge: true });
    await setDoc(doc(db, "users", user.uid), { points: increment(50) }, { merge: true });
  };
  const handleWithdraw = async (req: RideRequest) => { 
    if (user && confirm("Withdraw?")) { 
      await updateDoc(doc(db, "requests", req.id), { status: "OPEN", acceptedBy: deleteField() }); 
      await clearMessages(req.id);
      await addDoc(collection(db, "notifications"), { receiverId: req.creatorId, message: `${user.displayName} withdrew.`, type: "WITHDRAW", read: false, createdAt: serverTimestamp() }); 
      await setDoc(doc(db, "users", req.creatorId), { points: increment(-50) }, { merge: true }); 
      await setDoc(doc(db, "users", user.uid), { points: increment(-50) }, { merge: true }); 
    }
  };
  const handleDelete = async (id: string) => { 
    if (confirm("Delete?")) {
      await clearMessages(id);
      await deleteDoc(doc(db, "requests", id)); 
    }
  };
  const handleUpdateProfile = async (e: React.FormEvent) => { e.preventDefault(); const fd = new FormData(e.target as HTMLFormElement); await setDoc(doc(db, "users", user.uid), { phoneNumber: fd.get("phone"), address: fd.get("address"), displayName: fd.get("name") }, { merge: true }); setIsProfileEditOpen(false); };
  const setQuickDate = (d: number) => { const date = addDays(new Date(), d); const pad = (n: number) => n < 10 ? `0${n}` : n; setFormTime(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`); };

  const filteredRequests = requests.filter(r => (filter === "ALL" || r.type === filter) && (!r.time || new Date() <= new Date(new Date(r.time).getTime() + (3 * 3600000))));

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* 1. NAVIGATION */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onOpenModal={() => setIsModalOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />
      
      <main className="pt-24 pb-32 md:pt-32 md:pb-20 max-w-7xl mx-auto px-4 md:px-6">
        
        {/* VIEW: FEED */}
        {activeTab === "FEED" && (
          <>
            <div className="mb-8 md:mb-12 space-y-6">
              <h1 className="hidden md:block text-5xl font-bold mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Find your squad.</h1>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button onClick={() => setFilter("ALL")} className={cn("px-5 py-2.5 rounded-full text-sm font-bold border shrink-0 transition-all", filter === "ALL" ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-transparent")}>All</button>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => setFilter(key as CategoryKey)} className={cn("px-5 py-2.5 rounded-full text-sm font-bold border flex items-center gap-2 shrink-0 transition-all", filter === key ? `bg-white/10 border-white/20 text-white` : "bg-white/5 text-slate-400 border-transparent")}><cat.icon size={16} />{cat.label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRequests.map((req) => {
                  const Category = CATEGORIES[req.type as CategoryKey] || CATEGORIES.CAB;
                  const isAccepted = req.status === "ACCEPTED";
                  const isMine = req.creatorId === user?.uid;
                  const canChat = isAccepted && (isMine || req.acceptedBy === user?.uid);
                  return (
                    <motion.div key={req.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("relative p-5 md:p-6 rounded-3xl border backdrop-blur-md transition-all", isAccepted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10")}>
                      <div className="flex justify-between items-start mb-4"><div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br", Category.gradient)}><Category.icon size={20} /></div><span className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded-lg">{req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'HH:mm') : 'Now'}</span></div>
                      <h3 className={cn("text-lg font-semibold mb-3", isAccepted && "text-emerald-400 line-through")}>{req.description}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 w-fit mb-5 text-sm text-slate-400"><Calendar size={14} />{req.time ? format(new Date(req.time), 'MMM d, h:mm a') : 'Flexible'}</div>
                      {isAccepted ? (
                         <div className="space-y-3"><div className="w-full py-2 text-emerald-400 text-xs font-bold text-center bg-emerald-500/10 rounded-xl">Matched: {req.acceptedByName?.split(" ")[0]}</div>{canChat && (<div className="flex gap-2"><button onClick={() => setActiveChat(req)} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold flex gap-2 justify-center"><MessageCircle size={18} /> Chat</button>{req.acceptedBy === user?.uid && <button onClick={() => handleWithdraw(req)} className="px-3 rounded-xl bg-red-500/10 text-red-400"><LeaveIcon size={18} /></button>}</div>)}</div>
                      ) : isMine ? (
                         <div className="flex gap-2"><div className="flex-1 py-3 rounded-xl border border-white/10 text-slate-500 text-sm font-medium text-center">Posted by You</div><button onClick={() => handleDelete(req.id)} className="px-4 rounded-xl bg-red-500/10 text-red-500"><Trash2 size={18} /></button></div>
                      ) : <button onClick={() => handleAccept(req)} className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm">Connect</button>}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* VIEW: LEADERBOARD */}
        {activeTab === "LEADERBOARD" && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-amber-400 mb-1">Campus Legends</h2><p className="text-sm text-slate-400">Earn 50 XP per meetup</p></div>
            <div className="space-y-3">{leaderboard.map((u, i) => (<div key={u.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border", i < 3 ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20" : "bg-white/5 border-white/10")}><div className={cn("w-8 h-8 flex items-center justify-center font-bold rounded-full text-sm", i===0 ? "bg-yellow-500 text-black" : "text-slate-500 bg-white/5")}>{i + 1}</div><div className="w-10 h-10 rounded-full bg-indigo-500/20 overflow-hidden">{u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={16}/></div>}</div><div className="flex-1"><h3 className="font-bold text-white text-sm">{u.displayName}</h3><p className="text-xs text-slate-500">{u.points} XP</p></div>{i === 0 && <Crown size={20} className="text-yellow-500 fill-yellow-500" />}</div>))}</div>
          </div>
        )}

        {/* VIEW: ALERTS */}
        {activeTab === "ALERTS" && (
            <div className="max-w-xl mx-auto"><h2 className="text-2xl font-bold mb-6">Notifications</h2><div className="space-y-2">{notifications.length === 0 ? <div className="text-center text-slate-500 py-10">No new alerts</div> : notifications.map(n => (<div key={n.id} onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true })} className={cn("p-4 rounded-2xl border cursor-pointer flex gap-3 items-start", n.read ? "bg-white/5 border-white/5 opacity-60" : "bg-indigo-500/10 border-indigo-500/30")}><div className="mt-1">{n.type === "WITHDRAW" ? <AlertTriangle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}</div><div><p className="text-sm text-slate-200 font-medium">{n.message}</p><span className="text-xs text-slate-500 mt-1 block">{n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}</span></div></div>))}</div></div>
        )}

        {/* VIEW: PROFILE */}
        {activeTab === "PROFILE" && (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center"><div className="w-24 h-24 mx-auto rounded-full border-4 border-indigo-500/20 overflow-hidden mb-4">{user?.photoURL ? <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-700"><User size={32}/></div>}</div><h2 className="text-2xl font-bold">{userProfile?.displayName || user?.displayName}</h2><p className="text-slate-400 text-sm">{user?.email}</p><div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold border border-amber-500/20"><Trophy size={14} /> {userProfile?.points || 0} XP</div></div>
                <div className="bg-white/5 rounded-3xl p-6 space-y-4 border border-white/10"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400"><Phone size={14} /></div><div><p className="text-xs text-slate-500 uppercase font-bold">Phone</p><p className="text-white">{userProfile?.phoneNumber || "Not set"}</p></div></div><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400"><Home size={14} /></div><div><p className="text-xs text-slate-500 uppercase font-bold">Hostel</p><p className="text-white">{userProfile?.address || "Not set"}</p></div></div></div>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setIsProfileEditOpen(true)} className="py-3 rounded-xl bg-white text-black font-bold text-sm">Edit Profile</button><button onClick={() => signOut(auth)} className="py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm border border-red-500/20">Sign Out</button></div>
            </div>
        )}
        
        <Footer />
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={notifications.filter(n => !n.read).length} onOpenModal={() => setIsModalOpen(true)} user={user} />

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#1e293b] w-full md:w-[500px] rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"><div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 md:hidden" /><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">New Plan</h2><button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-full"><X size={20} /></button></div><form onSubmit={handleCreateRequest} className="space-y-6"><div className="grid grid-cols-3 gap-3">{Object.entries(CATEGORIES).map(([key, cat]) => (<button key={key} type="button" onClick={() => setFormType(key as CategoryKey)} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", formType === key ? `bg-white/10 border-white/50 text-white` : "bg-white/5 border-transparent text-slate-400")}><cat.icon size={24} /><span className="text-xs font-medium">{cat.label}</span></button>))}</div><div className="space-y-4"><input required placeholder="What's the plan?" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white text-lg focus:outline-none focus:border-indigo-500" /><div className="flex gap-2"><button type="button" onClick={() => setQuickDate(0)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 text-sm font-bold text-slate-300">Today</button><button type="button" onClick={() => setQuickDate(1)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 text-sm font-bold text-slate-300">Tomorrow</button></div><input type="datetime-local" required value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" /></div><button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-4 rounded-xl text-lg mb-4 md:mb-0">Post It</button></form></motion.div></div>
      )}

      {isProfileEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#1e293b] w-full md:w-96 rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 shadow-2xl relative"><div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 md:hidden" /><h2 className="text-xl font-bold mb-6 text-center">Edit Profile</h2><form onSubmit={handleUpdateProfile} className="space-y-4"><input name="name" defaultValue={userProfile?.displayName} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" /><input name="phone" defaultValue={userProfile?.phoneNumber} placeholder="Phone" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" /><input name="address" defaultValue={userProfile?.address} placeholder="Hostel" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" /><div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsProfileEditOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold">Cancel</button><button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">Save</button></div></form></motion.div></div>
      )}

      {activeChat && user && <ChatWindow request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
}