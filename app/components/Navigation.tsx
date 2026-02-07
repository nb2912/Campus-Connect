import { Zap, Trophy, Plus, Bell, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Sub-component for icons
function NavIcon({ icon: Icon, label, isActive, onClick, count }: any) {
  return (
      <button onClick={onClick} className="flex flex-col items-center justify-center w-16 gap-1 relative">
          <Icon size={24} className={cn("transition-colors", isActive ? "text-indigo-400 fill-indigo-400/20" : "text-slate-500")} />
          <span className={cn("text-[10px] font-bold", isActive ? "text-indigo-400" : "text-slate-500")}>{label}</span>
          {count > 0 && <span className="absolute top-0 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a]" />}
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
      <nav className="hidden md:block fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("FEED")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTab("FEED")} className={cn("text-sm font-bold transition-colors", activeTab === "FEED" ? "text-white" : "text-slate-400")}>Feed</button>
             <button onClick={() => setActiveTab("LEADERBOARD")} className={cn("text-sm font-bold transition-colors", activeTab === "LEADERBOARD" ? "text-amber-400" : "text-slate-400")}>Leaders</button>
             <button onClick={onOpenModal} className="bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">+ New Plan</button>
             <button onClick={() => setActiveTab("PROFILE")} className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-white transition-colors">
                {user?.photoURL ? <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-600 flex items-center justify-center"><User size={16} /></div>}
             </button>
          </div>
        </div>
      </nav>

      {/* MOBILE TOP HEADER (Logo Only) */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-center z-40">
         <div className="flex items-center gap-2">
            <Zap className="text-indigo-500 fill-indigo-500" size={20} />
            <span className="text-lg font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
         </div>
      </div>
    </>
  );
}

export function BottomNav({ activeTab, setActiveTab, unreadCount, onOpenModal }: NavProps) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 pb-safe pt-2 z-50">
      <div className="flex justify-around items-center h-16">
          <NavIcon icon={Zap} label="Feed" isActive={activeTab === "FEED"} onClick={() => setActiveTab("FEED")} />
          <NavIcon icon={Trophy} label="Leaders" isActive={activeTab === "LEADERBOARD"} onClick={() => setActiveTab("LEADERBOARD")} />
          
          <button onClick={onOpenModal} className="mb-8 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-4 border-[#0f172a]">
              <Plus size={28} />
          </button>
          
          <NavIcon icon={Bell} label="Alerts" count={unreadCount} isActive={activeTab === "ALERTS"} onClick={() => setActiveTab("ALERTS")} />
          <NavIcon icon={User} label="Profile" isActive={activeTab === "PROFILE"} onClick={() => setActiveTab("PROFILE")} />
      </div>
      <div className="h-4 w-full bg-[#0f172a]/95" />
    </div>
  );
}