"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase"; 
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Plane, 
  Dumbbell, 
  Pizza, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Users 
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 1. Check Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email?.endsWith("@srmist.edu.in")) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Handle Login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (email && email.endsWith("@srmist.edu.in")) {
        router.push("/dashboard"); 
      } else {
        await signOut(auth);
        alert("Access Denied: You must use your @srmist.edu.in email.");
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* --- NAVBAR --- */}
        <nav className="h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">SRM<span className="text-indigo-400">Social</span></span>
          </div>
          
          {/* Top Login Button (Visible on Desktop) */}
          {!user && (
            <button 
              onClick={handleLogin}
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Student Login <ArrowRight size={16} />
            </button>
          )}
        </nav>

        {/* --- HERO SECTION --- */}
        <main className="mt-12 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Exclusive for SRM Students
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
              Campus life is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                better together.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              Stop overpaying for airport cabs. Find a gym spotter. Split late-night food orders. 
              The all-in-one companion app for your daily campus needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleLogin}
                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
              >
                {user ? "Go to Dashboard" : "Join with SRM Email"}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
              </button>
              
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <ShieldCheck className="text-emerald-400" size={24} />
                <div className="text-xs text-slate-400">
                  <strong className="block text-white text-sm">Verified & Safe</strong>
                  @srmist.edu.in only
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard 
              icon={Plane} 
              color="text-orange-400" 
              bg="bg-orange-500/10"
              title="Cab Pools" 
              desc="Split airport rides. Save up to ₹500/trip." 
              delay={0.2} 
            />
            <FeatureCard 
              icon={Dumbbell} 
              color="text-blue-400" 
              bg="bg-blue-500/10"
              title="Gym Buddy" 
              desc="Find a spotter for your daily workout." 
              delay={0.3} 
            />
            <FeatureCard 
              icon={Pizza} 
              color="text-pink-400" 
              bg="bg-pink-500/10"
              title="Food Split" 
              desc="Order together. Save on delivery fees." 
              delay={0.4} 
            />
            <FeatureCard 
              icon={Users} 
              color="text-emerald-400" 
              bg="bg-emerald-500/10"
              title="Study Groups" 
              desc="Hackathons, exams, or library sessions." 
              delay={0.5} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT FOR CARDS ---
function FeatureCard({ icon: Icon, title, desc, color, bg, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${bg}`}>
        <Icon className={color} size={24} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}