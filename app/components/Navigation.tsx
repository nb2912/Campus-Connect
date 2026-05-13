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
            "relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200", 
            isActive ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        )}
      >
          <Icon size={20} className={cn("transition-colors", isActive && "fill-indigo-600/10")} />
          {count > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />}
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
      <nav className="hidden md:block fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl transition-all">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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

          <button onClick={onOpenModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
            <Plus size={16} /> Plan
          </button>
        </div>
      </nav>

      {/* MOBILE TOP HEADER */}
      <div className="md:hidden fixed top-0 inset-x-0 h-20 bg-gradient-to-b from-white to-white/0 z-40 pointer-events-none flex justify-center pt-3">
         <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Zap className="text-white fill-white" size={12} />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">SRM<span className="text-slate-500 font-medium">Social</span></span>
         </div>
      </div>
    </>
  );
}

export function BottomNav({ activeTab, setActiveTab, unreadCount, onOpenModal }: NavProps) {
  return (
    <div className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-slate-200 p-1.5 rounded-2xl shadow-xl pointer-events-auto">
          <NavIcon icon={Zap} label="Feed" isActive={activeTab === "FEED"} onClick={() => setActiveTab("FEED")} />
          <NavIcon icon={Trophy} label="Leaders" isActive={activeTab === "LEADERBOARD"} onClick={() => setActiveTab("LEADERBOARD")} />
          
          <button onClick={onOpenModal} className="mx-1 w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-indigo-600/20">
              <Plus size={24} />
          </button>
          
          <NavIcon icon={Bell} label="Alerts" count={unreadCount} isActive={activeTab === "ALERTS"} onClick={() => setActiveTab("ALERTS")} />
          <NavIcon icon={User} label="Profile" isActive={activeTab === "PROFILE"} onClick={() => setActiveTab("PROFILE")} />
      </div>
    </div>
  );
}