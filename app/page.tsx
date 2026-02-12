"use client";

import { useAuth } from "./context/AuthContext";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase"; 
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plane, Dumbbell, Pizza, ShieldCheck, ArrowRight, Zap, Users, Star, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if logged in with correct domain
  useEffect(() => {
    if (user && user.email?.endsWith("@srmist.edu.in")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Handle Login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (!email || !email.endsWith("@srmist.edu.in")) {
        await signOut(auth);
        alert("Access Denied: You must use your @srmist.edu.in email.");
      } else {
        router.push("/dashboard"); 
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* --- NAVBAR --- */}
        <nav className="h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
          </div>
          
          {!user && (
            <button onClick={handleLogin} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-semibold text-slate-300 hover:text-white">
              Student Login <ArrowRight size={16} />
            </button>
          )}
        </nav>

        {/* --- HERO SECTION --- */}
        <main className="mt-8 md:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
          
          {/* Left: Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 relative"
          >
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e293b]/50 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-indigo-900/20">
              <ShieldCheck size={14} className="text-indigo-400" /> Official Student ID Required
            </div>

            <h1 className="text-6xl md:text-8xl font-extrabold leading-[1.1] tracking-tight">
              Campus life, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-white">
                Synchronized.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed">
              The exclusive social network for SRM. Split airport cabs, find gym spotters, and sync study sessions instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button 
                onClick={handleLogin}
                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-[1.02] transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                   {user ? "Open Dashboard" : "Join Network"} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-700 flex items-center justify-center text-[10px] z-${10-i}`}>🎓</div>)}
                </div>
                <div className="text-xs text-slate-400">
                  <strong className="block text-white text-sm">250+ Students</strong>
                  Joined this week
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Floating UI Cards (Visual) */}
          <div className="relative h-[500px] hidden lg:block">
             <FloatingCard 
                icon={Plane} title="Airport Cab" subtitle="Leaving in 2h • 3/4 Seats" 
                className="absolute top-10 right-10 z-20 rotate-[-6deg]"
                delay={0.2} color="text-orange-400" bg="bg-orange-500/20"
             />
             <FloatingCard 
                icon={Dumbbell} title="Chest Day" subtitle="Tech Park Gym • Spotter needed" 
                className="absolute top-48 right-32 z-10 rotate-[4deg]"
                delay={0.4} color="text-blue-400" bg="bg-blue-500/20"
             />
             <FloatingCard 
                icon={Pizza} title="Dominos Order" subtitle="Abode Valley • ₹150 split" 
                className="absolute top-80 right-10 z-30 rotate-[-3deg]"
                delay={0.6} color="text-pink-400" bg="bg-pink-500/20"
             />
             
             {/* Glow Effect behind cards */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-[80px]" />
          </div>
        </main>

        {/* --- MOBILE FEATURES GRID --- */}
        <div className="lg:hidden grid grid-cols-2 gap-3 pb-20">
            <FeaturePill icon={Plane} label="Cab Pools" />
            <FeaturePill icon={Dumbbell} label="Gym Bros" />
            <FeaturePill icon={Pizza} label="Food Split" />
            <FeaturePill icon={Users} label="Study Gang" />
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FloatingCard({ icon: Icon, title, subtitle, className, delay, color, bg }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.6, type: "spring" }}
            className={`w-64 p-5 rounded-3xl border border-white/10 bg-[#1e293b]/80 backdrop-blur-xl shadow-2xl ${className}`}
        >
            <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>
                    <Icon className={color} size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-base">{title}</h3>
                    <p className="text-xs text-slate-400">Request Open</p>
                </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <span className="text-xs font-medium text-slate-300">{subtitle}</span>
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors"><ChevronRight size={16}/></button>
            </div>
        </motion.div>
    )
}

function FeaturePill({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
            <Icon size={20} className="text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">{label}</span>
        </div>
    )
}