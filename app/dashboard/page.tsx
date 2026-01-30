"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase"; 
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  updateDoc, deleteDoc, doc, where, setDoc, increment, limit, getDoc, deleteField 
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { RideRequest } from "@/types"; 
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Dumbbell, Train, Pizza, BookOpen, Ticket, 
  Plus, Calendar, MapPin, User, Zap, X, LogOut, Trash2, 
  MessageCircle, Send, Bell, Check, Trophy, Crown, AlertTriangle, LogOut as LeaveIcon
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const CATEGORIES = {
  CAB: { label: "Cab Share", icon: Plane, color: "bg-orange-500", gradient: "from-orange-400 to-red-500" },
  GYM: { label: "Gym Buddy", icon: Dumbbell, color: "bg-blue-500", gradient: "from-blue-400 to-indigo-500" },
  TRAIN: { label: "Train", icon: Train, color: "bg-emerald-500", gradient: "from-emerald-400 to-teal-500" },
  FOOD: { label: "Food Split", icon: Pizza, color: "bg-pink-500", gradient: "from-pink-400 to-rose-500" },
  STUDY: { label: "Study/Hack", icon: BookOpen, color: "bg-violet-500", gradient: "from-violet-400 to-purple-500" },
  MOVIE: { label: "Movies", icon: Ticket, color: "bg-yellow-500", gradient: "from-yellow-400 to-amber-500" },
};

type CategoryKey = keyof typeof CATEGORIES;

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"FEED" | "LEADERBOARD">("FEED");
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [filter, setFilter] = useState<CategoryKey | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<RideRequest | null>(null);
  
  const [formType, setFormType] = useState<CategoryKey>("CAB");
  const [formDesc, setFormDesc] = useState("");
  const [formTime, setFormTime] = useState("");
  const router = useRouter();

  // 1. Auth & Initial Data Sync
  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, { displayName: u.displayName, email: u.email, points: 0, photoURL: u.photoURL });
        }
        const notifQuery = query(collection(db, "notifications"), where("receiverId", "==", u.uid), orderBy("createdAt", "desc"));
        onSnapshot(notifQuery, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });

    const reqQuery = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const dbUnsub = onSnapshot(reqQuery, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RideRequest[]));

    const lbQuery = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    const lbUnsub = onSnapshot(lbQuery, (snap) => setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { authUnsub(); dbUnsub(); lbUnsub(); };
  }, [router]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, "requests"), {
      type: formType, description: formDesc, time: formTime,
      createdAt: serverTimestamp(), status: "OPEN",
      creatorName: user.displayName, creatorEmail: user.email, creatorId: user.uid,
    });
    setIsModalOpen(false); setFormDesc(""); setFormTime("");
  };

  const handleAccept = async (req: RideRequest) => {
    if (!user || req.creatorId === user.uid) return;
    if (!confirm(`Connect with ${req.creatorName}?`)) return;

    await updateDoc(doc(db, "requests", req.id), {
      status: "ACCEPTED", acceptedBy: user.uid, acceptedByName: user.displayName, acceptedByEmail: user.email
    });

    await addDoc(collection(db, "notifications"), {
      receiverId: req.creatorId, message: `${user.displayName} accepted your ${req.type} request!`,
      type: "ACCEPT", read: false, createdAt: serverTimestamp(), requestId: req.id
    });

    // Award Points
    await updateDoc(doc(db, "users", req.creatorId), { points: increment(50) });
    await updateDoc(doc(db, "users", user.uid), { points: increment(50) });
  };

  // --- NEW: HANDLE WITHDRAW ---
  const handleWithdraw = async (req: RideRequest) => {
    if (!user) return;
    if (!confirm("Are you sure? You will lose the points and the slot will open for others.")) return;

    // 1. Reset Request to OPEN and clear acceptor fields
    await updateDoc(doc(db, "requests", req.id), {
      status: "OPEN",
      acceptedBy: deleteField(),
      acceptedByName: deleteField(),
      acceptedByEmail: deleteField()
    });

    // 2. Notify Creator
    await addDoc(collection(db, "notifications"), {
      receiverId: req.creatorId,
      message: `${user.displayName} withdrew from your plan. It is now open again.`,
      type: "WITHDRAW",
      read: false,
      createdAt: serverTimestamp(),
      requestId: req.id
    });

    // 3. Reverse Points (Deduct 50 from both)
    await updateDoc(doc(db, "users", req.creatorId), { points: increment(-50) });
    await updateDoc(doc(db, "users", user.uid), { points: increment(-50) });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    setRequests(prev => prev.filter(r => r.id !== id));
    await deleteDoc(doc(db, "requests", id));
  };
  
  const markNotificationRead = async (id: string) => await updateDoc(doc(db, "notifications", id), { read: true });

  const setQuickDate = (d: number) => {
    const date = addDays(new Date(), d);
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    setFormTime(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`);
  };

  const filteredRequests = filter === "ALL" ? requests : requests.filter(r => r.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("FEED")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-white/5 rounded-full p-1 border border-white/10 mr-4">
              <button onClick={() => setActiveTab("FEED")} className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all", activeTab === "FEED" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}>Feed</button>
              <button onClick={() => setActiveTab("LEADERBOARD")} className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2", activeTab === "LEADERBOARD" ? "bg-amber-500 text-black font-bold shadow-lg" : "text-slate-400 hover:text-white")}><Trophy size={14} /> Leaders</button>
            </div>

            <div className="relative">
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>}
              </button>
              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-80 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
                    <div className="p-3 border-b border-white/10 bg-white/5 font-bold text-sm">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? <div className="p-4 text-center text-slate-500 text-xs">No new updates.</div> : notifications.map(n => (
                        <div key={n.id} onClick={() => markNotificationRead(n.id)} className={cn("p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-3", n.read ? "opacity-50" : "bg-indigo-500/10")}>
                          <div className="mt-1">{n.type === "WITHDRAW" ? <AlertTriangle size={14} className="text-red-400" /> : <Check size={14} className="text-emerald-400" />}</div>
                          <div><p className="text-sm text-slate-200 leading-snug">{n.message}</p><span className="text-[10px] text-slate-500">{n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}</span></div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white transition-colors p-2"><LogOut size={20} /></button>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] hidden sm:block">+ Plan</button>
          </div>
        </div>
        
        <div className="md:hidden flex border-t border-white/5">
          <button onClick={() => setActiveTab("FEED")} className={cn("flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors", activeTab === "FEED" ? "border-indigo-500 text-white" : "border-transparent text-slate-500")}>FEED</button>
          <button onClick={() => setActiveTab("LEADERBOARD")} className={cn("flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors", activeTab === "LEADERBOARD" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-500")}>LEADERBOARD</button>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        
        {activeTab === "FEED" ? (
          <>
            <div className="mb-12 space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Find your squad.</h1>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setFilter("ALL")} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border", filter === "ALL" ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-transparent")}>All</button>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => setFilter(key as CategoryKey)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 whitespace-nowrap", filter === key ? `bg-white/10 border-white/20 text-white shadow-[0_0_15px_${cat.color.replace('bg-', '')}]` : "bg-white/5 text-slate-400 border-transparent")}><cat.icon size={14} />{cat.label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRequests.map((req) => {
                  const Category = CATEGORIES[req.type as CategoryKey] || CATEGORIES.CAB;
                  const isAccepted = req.status === "ACCEPTED";
                  const isMine = req.creatorId === user?.uid;
                  const iAcceptedIt = req.acceptedBy === user?.uid;
                  const canChat = isAccepted && (isMine || iAcceptedIt);

                  return (
                    <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("group relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-300", isAccepted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10 hover:bg-white/10 hover:shadow-2xl")}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg", Category.gradient)}><Category.icon size={20} /></div>
                        <span className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded-lg">{req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'HH:mm') : 'Now'}</span>
                      </div>
                      <h3 className={cn("text-xl font-semibold leading-snug mb-4", isAccepted && "text-emerald-400 line-through")}>{req.description}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 w-fit mb-6 text-sm text-slate-400"><Calendar size={14} />{req.time ? format(new Date(req.time), 'MMM d, HH:mm') : 'Flexible'}</div>
                      
                      {/* --- ACTIONS --- */}
                      {isAccepted ? (
                        <div className="space-y-3">
                          <div className="w-full py-2 text-emerald-400 text-xs font-medium text-center bg-emerald-500/10 rounded-lg">Matched with {req.acceptedByName?.split(" ")[0]}</div>
                          {canChat && (
                            <div className="flex gap-2">
                                <button onClick={() => setActiveChat(req)} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                                    <MessageCircle size={18} /> Chat
                                </button>
                                {/* WITHDRAW BUTTON (Only for the person who joined) */}
                                {iAcceptedIt && (
                                    <button onClick={() => handleWithdraw(req)} className="px-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" title="Withdraw Application">
                                        <LeaveIcon size={18} />
                                    </button>
                                )}
                            </div>
                          )}
                        </div>
                      ) : isMine ? (
                        <div className="flex gap-2"><div className="flex-1 py-3 rounded-xl border border-white/10 text-slate-500 text-sm font-medium text-center">Posted by You</div><button onClick={() => handleDelete(req.id)} className="px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"><Trash2 size={18} /></button></div>
                      ) : <button onClick={() => handleAccept(req)} className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-indigo-50 transition-colors">Connect</button>}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            <button onClick={() => setIsModalOpen(true)} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 z-50"><Plus size={24} /></button>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10"><h2 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent mb-2">Campus Legends</h2><p className="text-slate-400">Earn 50 XP for every successful meetup.</p></div>
            <div className="space-y-4">{leaderboard.map((u, index) => (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={u.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border", index < 3 ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20" : "bg-white/5 border-white/10")}><div className={cn("w-10 h-10 flex items-center justify-center font-bold text-lg rounded-full", index === 0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/50" : index === 1 ? "bg-slate-300 text-black" : index === 2 ? "bg-amber-700 text-white" : "text-slate-500")}>{index + 1}</div><div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30 overflow-hidden">{u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : u.displayName?.[0]}</div><div className="flex-1"><h3 className="font-bold text-white flex items-center gap-2">{u.displayName}{index === 0 && <Crown size={16} className="text-yellow-500 fill-yellow-500" />}</h3><p className="text-xs text-slate-500">{u.email?.split("@")[0]}</p></div><div className="text-right"><span className="block text-xl font-bold text-indigo-400">{u.points || 0}</span><span className="text-[10px] text-slate-500 uppercase tracking-widest">Points</span></div></motion.div>))}</div>
          </div>
        )}
      </main>

      {/* MODAL & CHAT WINDOW (Same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1e293b] w-full max-w-lg rounded-3xl border border-white/10 p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-6">Create New Plan</h2>
            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="grid grid-cols-3 gap-3">{Object.entries(CATEGORIES).map(([key, cat]) => (<button key={key} type="button" onClick={() => setFormType(key as CategoryKey)} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", formType === key ? `bg-white/10 border-white/50 text-white shadow-[0_0_15px_${cat.color.replace('bg-', '')}]` : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10")}><cat.icon size={20} /><span className="text-xs font-medium">{cat.label}</span></button>))}</div>
              <div className="space-y-4"><input required placeholder="What's the plan?" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500" /><div className="flex gap-2"><button type="button" onClick={() => setQuickDate(0)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-slate-300">Today</button><button type="button" onClick={() => setQuickDate(1)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-slate-300">Tomorrow</button></div><input type="datetime-local" required value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" /></div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-4 rounded-xl">Post Request</button>
            </form>
          </motion.div>
        </div>
      )}
      {activeChat && user && <ChatWindow request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1e293b] w-full max-w-md h-[500px] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0f172a]"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{otherPersonName?.[0]}</div><div><h3 className="font-bold text-white text-sm">{otherPersonName}</h3><p className="text-xs text-slate-400">{request.description}</p></div></div><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f172a]/50">{messages.map((msg) => { const isMe = msg.senderId === currentUser.uid; return (<div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}><div className={cn("max-w-[80%] px-4 py-2 rounded-2xl text-sm", isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/10 text-slate-200 rounded-tl-sm")}>{msg.text}</div></div>); })}</div>
        <form onSubmit={sendMessage} className="p-3 bg-[#0f172a] border-t border-white/10 flex gap-2"><input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" /><button type="submit" className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors"><Send size={18} /></button></form>
      </motion.div>
    </div>
  );
}