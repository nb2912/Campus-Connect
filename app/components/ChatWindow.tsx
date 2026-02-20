import { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, writeBatch } from "firebase/firestore";
import { motion } from "framer-motion";
import { X, Send, User } from "lucide-react";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Image from "next/image";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Define types locally for now (should ideally move to types/index.ts)
interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  createdAt: any; // Firestore timestamp
}

interface ChatRequest {
  id: string;
  type: string;
  startLoc?: string; // Optional for non-CAB
  endLoc?: string;   // Optional for non-CAB
  restaurant?: string; // Optional for FOOD
  customType?: string; // Optional for OTHER
  description?: string;
  creatorId: string;
  creatorName?: string; // For 1-on-1 title logic
  acceptedByName?: string; // For 1-on-1 title logic
  capacity?: number;
  participants: string[];
}

interface ChatProps {
  request: ChatRequest;
  currentUser: any; // Ideally user type from context
  onClose: () => void;
}

export default function ChatWindow({ request, currentUser, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 1. Fetch Messages
  useEffect(() => { 
    const q = query(collection(db, "requests", request.id, "messages"), orderBy("createdAt", "asc")); 
    const unsub = onSnapshot(q, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() } as Message)))); 
    return () => unsub(); 
  }, [request.id]);
  
  // 2. Auto-scroll to bottom
  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages]);
  
  // 3. Send Message + Notify other participants (Atomic Batch)
  const sendMessage = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!newMessage.trim() || isSending) return;
    
    const messageText = newMessage.trim();
    // Optimistic UI: Don't clear until success, or clear and restore on error
    // Strategy: Clear input immediately to feel fast, restore if error
    setNewMessage("");
    setIsSending(true);

    try {
      const batch = writeBatch(db);
      
      // 3.1 Add Message to Subcollection
      const messageRef = doc(collection(db, "requests", request.id, "messages"));
      batch.set(messageRef, { 
        text: messageText, 
        senderId: currentUser.uid, 
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL, 
        createdAt: serverTimestamp() 
      });

      // 3.2 Build Notification Context
      const planLabel = request.type === "CAB" ? `${request.startLoc} → ${request.endLoc}` 
                      : request.type === "FOOD" ? `Food: ${request.restaurant}` 
                      : request.type === "OTHER" ? `${request.customType}` 
                      : `${request.type}: ${request.description || "Plan"}`;

      // 3.3 Add Notifications (Fan-out)
      const recipientIds = new Set<string>();
      if (request.creatorId && request.creatorId !== currentUser.uid) {
        recipientIds.add(request.creatorId);
      }
      (request.participants || []).forEach((pid: string) => {
        if (pid !== currentUser.uid) recipientIds.add(pid);
      });

      const truncatedMsg = messageText.length > 60 ? messageText.slice(0, 60) + "…" : messageText;
      
      recipientIds.forEach((rid) => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          receiverId: rid,
          message: truncatedMsg,
          type: "CHAT",
          read: false,
          senderName: currentUser.displayName,
          senderPhoto: currentUser.photoURL || "",
          planLabel,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setNewMessage(messageText);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };
  
  // --- FIXED HEADER LOGIC ---
  // A plan is a "Group" if capacity > 1 OR if it has a participants array
  const isGroup = (request.capacity && request.capacity > 1) || (request.participants?.length || 0) > 1;
  
  let headerTitle = "Chat";
  if (isGroup) {
      headerTitle = `${request.type} Squad`;
  } else {
      // 1-on-1 Logic
      if (request.creatorId === currentUser.uid) {
          // If I am Creator, show the Other Person's name (or "Buddy" if undefined)
          headerTitle = request.acceptedByName || "Future Buddy";
      } else {
          // If I am Joiner, show Creator's name
          headerTitle = request.creatorName || "Host";
      }
  }

  const subTitle = isGroup 
      ? `${request.participants?.length || 1} / ${request.capacity || "?"} members` 
      : request.description;
  // --------------------------

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#020617] w-full h-[90vh] md:h-[650px] md:max-w-md rounded-t-[2rem] md:rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative"
      >
        
        {/* --- 1. GLASS HEADER --- */}
        <div className="absolute top-0 inset-x-0 h-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
             {/* Header Avatar */}
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                {headerTitle?.[0] || <User size={18}/>}
             </div>
             <div>
                <h3 className="font-bold text-white text-base leading-tight">{headerTitle}</h3>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{subTitle}</p>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X size={20} />
             </button>
          </div>
        </div>
        
        {/* --- 2. MESSAGE AREA --- */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-24 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          {messages.length === 0 && (
            <div className="text-center mt-20 opacity-40">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👋</span>
                </div>
                <p className="text-sm text-slate-400">Say hello to the group!</p>
            </div>
          )}

          {messages.map((msg, i) => { 
            const isMe = msg.senderId === currentUser.uid; 
            const isSequential = i > 0 && messages[i-1].senderId === msg.senderId;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
              >
                {!isMe && !isSequential && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 mr-2 flex-shrink-0 overflow-hidden mt-1 relative">
                        {msg.senderPhoto ? <Image src={msg.senderPhoto} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={12}/></div>}
                    </div>
                )}
                {!isMe && isSequential && <div className="w-10" />}

                <div className={cn(
                    "max-w-[75%] px-5 py-3 text-sm relative group transition-all",
                    isMe 
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-indigo-500/10" 
                        : "bg-[#1e293b] border border-white/5 text-slate-200 rounded-2xl rounded-tl-sm shadow-md"
                )}>
                    {!isMe && !isSequential && <p className="text-[10px] font-bold text-indigo-400 mb-1">{msg.senderName}</p>}
                    <p className="leading-relaxed text-[15px]">{msg.text}</p>
                    <span className={cn("text-[9px] mt-1 block opacity-60", isMe ? "text-indigo-100" : "text-slate-500")}>
                        {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'h:mm a') : '...'}
                    </span>
                </div>
              </motion.div>
            ); 
          })}
        </div>
        
        {/* --- 3. FLOATING INPUT --- */}
        <div className="p-4 bg-[#020617] border-t border-white/5">
            <form onSubmit={sendMessage} className="flex gap-2 items-end bg-[#1e293b] border border-white/10 rounded-[1.5rem] p-1.5 pl-4 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1 bg-transparent text-white text-sm focus:outline-none py-3 placeholder:text-slate-500" 
            />
            <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-indigo-600 rounded-full text-white flex items-center justify-center hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all active:scale-90"
            >
                <Send size={18} className="ml-0.5" />
            </button>
            </form>
        </div>

      </motion.div>
    </div>
  );
}