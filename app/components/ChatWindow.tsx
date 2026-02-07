import { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RideRequest } from "@/types"; // Make sure types.ts exists

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface ChatProps {
  request: RideRequest;
  currentUser: any;
  onClose: () => void;
}

export default function ChatWindow({ request, currentUser, onClose }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    const q = query(collection(db, "requests", request.id, "messages"), orderBy("createdAt", "asc")); 
    const unsub = onSnapshot(q, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })))); 
    return () => unsub(); 
  }, [request.id]);
  
  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages]);
  
  const sendMessage = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!newMessage.trim()) return; 
    await addDoc(collection(db, "requests", request.id, "messages"), { 
      text: newMessage, 
      senderId: currentUser.uid, 
      senderName: currentUser.displayName, 
      createdAt: serverTimestamp() 
    }); 
    setNewMessage(""); 
  };
  
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