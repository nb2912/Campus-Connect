import { Zap, Trophy, Plus, Bell, User, Search, Flame } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Floating Icon Component
function NavIcon({ icon: Icon, label, isActive, onClick, count }: any) {
  return (
      <button 
        onClick={onClick} 
        className={cn(
            "relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300", 
            isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
        )}
      >
          {isActive && (
            <motion.div 
              layoutId="nav-bg"
              className="absolute inset-2 bg-indigo-50 rounded-xl -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Icon size={22} className={cn("transition-all duration-300", isActive && "scale-110")} />
          {count > 0 && (
            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
          {isActive && (
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-1 text-[10px] font-bold"
            >
              {label}
            </motion.span>
          )}
      </button>
  )
}

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  unreadCount: number;
  onOpenModal: () => void;
  userProfile?: any; // Added userProfile for XP display
}

export function Navbar({ activeTab, setActiveTab, user, onOpenModal, userProfile }: NavProps) {
  return (
    <>
      {/* DESKTOP NAVBAR */}
      <nav className="hidden md:block fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab("FEED")}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">SRM<span className="text-slate-500 font-medium">Social</span></span>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
             {['FEED', 'LEADERBOARD', 'PROFILE'].map((tab) => (
               <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-5 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                 {tab}
               </button>
             ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
              <Plus size={16} /> Plan
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE TOP HEADER - REDESIGNED */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 px-4 pt-4">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("FEED")}>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap className="text-white fill-white" size={14} />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">SRM<span className="text-slate-400 font-medium italic">buddy</span></span>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100">
                <Flame size={12} className="text-amber-600 fill-amber-600" />
                <span className="text-[10px] font-bold text-amber-700">{userProfile?.points || 0}</span>
              </div>
              <button 
                onClick={() => setActiveTab("PROFILE")}
                className={cn(
                  "w-9 h-9 rounded-full overflow-hidden border-2 transition-all",
                  activeTab === "PROFILE" ? "border-indigo-600 scale-105" : "border-white shadow-sm"
                )}
              >
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                )}
              </button>
           </div>
        </div>
      </div>
    </>
  );
}

export function BottomNav({ activeTab, setActiveTab, unreadCount, onOpenModal }: NavProps) {
  return (
    <div className="md:hidden fixed bottom-6 inset-x-0 z-50 flex justify-center px-6 pointer-events-none">
      <div className="flex items-center justify-between w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-slate-200/60 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto ring-1 ring-black/5">
          <NavIcon icon={Zap} label="Feed" isActive={activeTab === "FEED"} onClick={() => setActiveTab("FEED")} />
          <NavIcon icon={Trophy} label="Leaders" isActive={activeTab === "LEADERBOARD"} onClick={() => setActiveTab("LEADERBOARD")} />
          
          <div className="relative group">
            <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-active:opacity-100 transition-opacity" />
            <button 
              onClick={onOpenModal} 
              className="relative mx-1 w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-indigo-600/30 overflow-hidden"
            >
                <Plus size={28} />
                <motion.div 
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
            </button>
          </div>
          
          <NavIcon icon={Bell} label="Alerts" count={unreadCount} isActive={activeTab === "ALERTS"} onClick={() => setActiveTab("ALERTS")} />
          <NavIcon icon={User} label="Profile" isActive={activeTab === "PROFILE"} onClick={() => setActiveTab("PROFILE")} />
      </div>
    </div>
  );
}