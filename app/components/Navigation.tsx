import { Zap, Trophy, Plus, Bell, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Floating Icon Component
function NavIcon({ icon: Icon, label, isActive, onClick, count }: any) {
  return (
      <button 
        onClick={onClick} 
        className={cn(
            "relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300", 
            isActive ? "text-white bg-white/10 scale-110" : "text-slate-400 hover:text-slate-200"
        )}
      >
          <Icon size={22} className={cn("transition-colors", isActive && "fill-current/20")} />
          {count > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0f172a]" />}
      </button>
  )
}

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  unreadCount: number;
  onOpenModal: () => void;
}

export function Navbar({ activeTab, setActiveTab, user, onOpenModal }: NavProps) {
  return (
    <>
      {/* DESKTOP NAVBAR */}
      <nav className="hidden md:block fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0f172a]/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab("FEED")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SRM<span className="text-indigo-400">Social</span></span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/5">
             {['FEED', 'LEADERBOARD', 'PROFILE'].map((tab) => (
               <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-5 py-2 rounded-full text-xs font-bold transition-all", activeTab === tab ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white")}>
                 {tab}
               </button>
             ))}
          </div>
          <button onClick={onOpenModal} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-95">+ Plan</button>
        </div>
      </nav>

      {/* MOBILE TOP HEADER (Floating Glass Pill) */}
      <div className="md:hidden fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-[#0f172a] to-transparent z-40 pointer-events-none flex justify-center pt-6">
         <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
            <Zap className="text-indigo-500 fill-indigo-500" size={16} />
            <span className="text-sm font-bold tracking-tight text-white">SRM<span className="text-indigo-400">Social</span></span>
         </div>
      </div>
    </>
  );
}

export function BottomNav({ activeTab, setActiveTab, unreadCount, onOpenModal }: NavProps) {
  return (
    <div className="md:hidden fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="flex items-center gap-1 bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl shadow-black/50 pointer-events-auto">
          <NavIcon icon={Zap} label="Feed" isActive={activeTab === "FEED"} onClick={() => setActiveTab("FEED")} />
          <NavIcon icon={Trophy} label="Leaders" isActive={activeTab === "LEADERBOARD"} onClick={() => setActiveTab("LEADERBOARD")} />
          
          <button onClick={onOpenModal} className="mx-2 w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border border-white/10 active:scale-90 transition-transform">
              <Plus size={28} />
          </button>
          
          <NavIcon icon={Bell} label="Alerts" count={unreadCount} isActive={activeTab === "ALERTS"} onClick={() => setActiveTab("ALERTS")} />
          <NavIcon icon={User} label="Profile" isActive={activeTab === "PROFILE"} onClick={() => setActiveTab("PROFILE")} />
      </div>
    </div>
  );
}