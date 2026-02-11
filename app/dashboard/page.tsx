"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, deleteDoc, doc, where, setDoc, increment, limit, getDocs, deleteField, getDoc, arrayUnion, arrayRemove, runTransaction } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Dumbbell, Train, Pizza, BookOpen, Ticket, Calendar, MessageCircle, Check, Trophy, Crown, AlertTriangle, LogOut as LeaveIcon, Phone, Home, X, Trash2, User, Users, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

import Footer from "../components/Footer";
import { Navbar, BottomNav } from "../components/Navigation";
import ChatWindow from "../components/ChatWindow";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// --- CONFIG ---
const CATEGORIES = {
  CAB: { label: "Cab", icon: Plane, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  GYM: { label: "Gym", icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  TRAIN: { label: "Train", icon: Train, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  FOOD: { label: "Food", icon: Pizza, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  STUDY: { label: "Study", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  MOVIE: { label: "Movie", icon: Ticket, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
};
type CategoryKey = keyof typeof CATEGORIES;

export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]); 
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [feedLimit, setFeedLimit] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"FEED" | "LEADERBOARD" | "ALERTS" | "PROFILE">("FEED");
  const [filter, setFilter] = useState<CategoryKey | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  
  // FORM
  const [formType, setFormType] = useState<CategoryKey>("CAB");
  const [formDesc, setFormDesc] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formCapacity, setFormCapacity] = useState("2");
  const router = useRouter();

  // HELPERS
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Listen for data
    const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where("receiverId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(feedLimit));
    const unsubRequests = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setHasMore(snap.docs.length === feedLimit);
    });

    const unsubLeaderboard = onSnapshot(query(collection(db, "users"), orderBy("points", "desc"), limit(10)), (snap) => setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

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

    return () => {
      unsubNotifications();
      unsubRequests();
      unsubLeaderboard();
    };
  }, [user, feedLimit]);

  const handleLoadMore = () => setFeedLimit(prev => prev + 12);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    await addDoc(collection(db, "requests"), { 
      type: formType, description: formDesc, time: formTime, capacity: Number(formCapacity), 
      participants: [], createdAt: serverTimestamp(), status: "OPEN", 
      creatorName: user.displayName, creatorEmail: user.email, creatorId: user.uid, creatorPhoto: user.photoURL 
    });
    setIsModalOpen(false); setFormDesc(""); setFormTime(""); setFormCapacity("2"); setActiveTab("FEED");
    showToast("Plan created successfully!");
  };

  const handleJoin = async (req: any) => {
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

        // Add notification
        const notificationRef = doc(collection(db, "notifications"));
        transaction.set(notificationRef, { 
          receiverId: data.creatorId, 
          message: `${user.displayName} joined your ${data.type} group!`, 
          type: "ACCEPT", 
          read: false, 
          createdAt: serverTimestamp() 
        });

        // Add points
        transaction.set(doc(db, "users", data.creatorId), { points: increment(50) }, { merge: true });
        transaction.set(doc(db, "users", user.uid), { points: increment(50) }, { merge: true });
      });
      showToast("Joined the group!");
    } catch (error) { showToast(typeof error === 'string' ? error : "Failed to join", "error"); }
  };

  const handleLeave = async (req: any) => {
    if (!user || !confirm("Leave this group? You will lose points.")) return;
    try {
        await updateDoc(doc(db, "requests", req.id), { participants: arrayRemove(user.uid), status: "OPEN" });
        await addDoc(collection(db, "notifications"), { receiverId: req.creatorId, message: `${user.displayName} left your group.`, type: "WITHDRAW", read: false, createdAt: serverTimestamp() });
        await setDoc(doc(db, "users", req.creatorId), { points: increment(-50) }, { merge: true });
        await setDoc(doc(db, "users", user.uid), { points: increment(-50) }, { merge: true });
        showToast("Left group successfully");
    } catch (error) { showToast("Error leaving", "error"); }
  };

  const handleDelete = async (id: string) => { if (confirm("Delete?")) { await deleteDoc(doc(db, "requests", id)); showToast("Deleted plan"); }};
  const handleUpdateProfile = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!user) return;
    const fd = new FormData(e.target as HTMLFormElement); 
    await setDoc(doc(db, "users", user.uid), { 
      phoneNumber: fd.get("phone"), 
      address: fd.get("address"), 
      displayName: fd.get("name") 
    }, { merge: true }); 
    setIsProfileEditOpen(false); 
    showToast("Profile updated!"); 
  };
  const setQuickDate = (d: number) => { const date = addDays(new Date(), d); const pad = (n: number) => n < 10 ? `0${n}` : n; setFormTime(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`); };

  const filteredRequests = requests.filter(r => (filter === "ALL" || r.type === filter) && (!r.time || new Date() <= new Date(new Date(r.time).getTime() + (3 * 3600000))));

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30 pb-20">
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onOpenModal={() => setIsModalOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border", toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                <span className="text-sm font-bold">{toast.msg}</span>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-28 max-w-7xl mx-auto px-4 md:px-6 min-h-[80vh]">
        
        {activeTab === "FEED" && (
          <>
            <div className="mb-10 space-y-6">
              <div className="hidden md:block">
                  <h1 className="text-5xl font-bold mb-2 text-white">Find your squad.</h1>
                  <p className="text-slate-400">Join a group or create your own plan instantly.</p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button onClick={() => setFilter("ALL")} className={cn("px-5 py-2.5 rounded-full text-sm font-bold border shrink-0 transition-all", filter === "ALL" ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10")}>All</button>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => setFilter(key as CategoryKey)} className={cn("px-5 py-2.5 rounded-full text-sm font-bold border flex items-center gap-2 shrink-0 transition-all", filter === key ? `bg-white/10 border-white/20 text-white` : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10")}><cat.icon size={16} className={filter === key ? cat.color : ""} />{cat.label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRequests.length === 0 ? (
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
                  const iJoined = participants.includes(user?.uid);
                  
                  // Seats Visualizer
                  const seats = Array.from({ length: capacity }).map((_, i) => i < joinedCount ? "filled" : "empty");

                  return (
                    <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("relative p-6 rounded-[2rem] border backdrop-blur-xl transition-all group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10", isFull ? "bg-[#0f172a]/50 border-white/5 opacity-75" : "bg-[#1e293b]/60 border-white/5")}>
                      
                      {/* Top Row: User & Time */}
                      <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-3">
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", Category.bg, Category.border, "border")}><Category.icon size={20} className={Category.color} /></div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{req.type}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                      {req.creatorPhoto ? <Image src={req.creatorPhoto} alt="" width={16} height={16} className="w-4 h-4 rounded-full" /> : <User size={12} className="text-slate-500"/>}
                                      <span className="text-xs text-slate-300 font-bold">{req.creatorName?.split(" ")[0]}</span>
                                  </div>
                              </div>
                          </div>
                          <span className="text-xs font-bold text-slate-400 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">{req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'h:mm a') : 'Now'}</span>
                      </div>

                      {/* Content */}
                      <h3 className={cn("text-xl font-bold leading-tight mb-4 text-white", isFull && "text-slate-500 line-through decoration-slate-600")}>{req.description}</h3>
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
                <div className="space-y-2">{notifications.length === 0 ? <div className="text-center text-slate-500 py-10">No new alerts</div> : notifications.map(n => (<div key={n.id} onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true })} className={cn("p-4 rounded-2xl border cursor-pointer flex gap-3 items-start backdrop-blur-md transition-colors", n.read ? "bg-white/5 border-white/5 opacity-50" : "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20")}><div className="mt-1">{n.type === "WITHDRAW" ? <AlertTriangle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}</div><div><p className="text-sm text-slate-200 font-medium">{n.message}</p><span className="text-xs text-slate-500 mt-1 block">{n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}</span></div></div>))}</div>
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

      {/* CREATE MODAL */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#1e293b] w-full md:w-[500px] rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold text-white">New Plan</h2><button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-full hover:bg-white/10"><X size={20} className="text-white" /></button></div>
                <form onSubmit={handleCreateRequest} className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">{Object.entries(CATEGORIES).map(([key, cat]) => (<button key={key} type="button" onClick={() => setFormType(key as CategoryKey)} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", formType === key ? `bg-white text-black shadow-lg scale-105 border-transparent` : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10")}><cat.icon size={24} className={formType === key ? "text-indigo-600" : ""} /><span className="text-xs font-bold">{cat.label}</span></button>))}</div>
                    <div className="space-y-4">
                        <input required placeholder="Where are you going?" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white text-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
                        <div className="flex gap-4">
                            <div className="flex-1"><label className="text-xs text-slate-500 uppercase font-bold ml-2 mb-1 block">When</label><input type="datetime-local" required value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" /></div>
                            <div className="w-24"><label className="text-xs text-slate-500 uppercase font-bold ml-2 mb-1 block">Seats</label><div className="relative"><Users size={16} className="absolute left-3 top-3.5 text-slate-500" /><input type="number" min="2" max="10" required value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-9 pr-2 text-white focus:outline-none focus:border-indigo-500" /></div></div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-indigo-500/25 transition-all active:scale-95">Post Request</button>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#1e293b] w-full md:w-96 rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 p-6 shadow-2xl relative"><div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 md:hidden" /><h2 className="text-xl font-bold mb-6 text-center text-white">Edit Profile</h2><form onSubmit={handleUpdateProfile} className="space-y-4"><input name="name" defaultValue={userProfile?.displayName} className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none" /><input name="phone" defaultValue={userProfile?.phoneNumber} placeholder="Phone" className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none" /><input name="address" defaultValue={userProfile?.address} placeholder="Hostel" className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 focus:outline-none" /><div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsProfileEditOpen(false)} className="flex-1 py-3 rounded-2xl bg-white/5 text-white font-bold">Cancel</button><button type="submit" className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold">Save</button></div></form></motion.div></div>
      )}

      {activeChat && user && <ChatWindow request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
}