"use client";

import { useAuth } from "./context/AuthContext";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase"; 
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { Plane, Dumbbell, Pizza, ShieldCheck, ArrowRight, Zap, Users, Star, ChevronRight, BookOpen, Film, Train, Sparkles, LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Redirect if logged in with correct domain
  useEffect(() => {
    if (user && user.email?.endsWith("@srmist.edu.in")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Handle Login
  const handleLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (!email || !email.endsWith("@srmist.edu.in")) {
        await signOut(auth);
        setLoginError("Access denied. Please use your @srmist.edu.in Google account.");
      } else {
        router.push("/dashboard"); 
      }
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        setLoginError("Login failed. Please try again.");
      }
      console.error("Login failed", error);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      
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
            <button onClick={handleLogin} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 transition-all text-sm font-semibold text-slate-300 hover:text-white group">
              <LogIn size={15} className="group-hover:text-indigo-400 transition-colors" /> Student Login <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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

            {/* Access Denied Error Banner */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
              >
                <ShieldCheck size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-red-300">Access Denied</p>
                  <p className="text-red-400/80 text-xs mt-0.5">{loginError}</p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button 
                onClick={handleLogin}
                disabled={loginLoading}
                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-[1.02] transition-all duration-300 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loginLoading ? (
                    <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Connecting...</>
                  ) : (
                    <>{user ? "Open Dashboard" : "Join Network"} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
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
                icon={Dumbbell} title="Chest Day" subtitle="Gym spotter needed" 
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
        <div className="lg:hidden grid grid-cols-2 gap-3 pb-10">
            <FeaturePill icon={Plane} label="Cab Pools" />
            <FeaturePill icon={Dumbbell} label="Gym Bros" />
            <FeaturePill icon={Pizza} label="Food Split" />
            <FeaturePill icon={Users} label="Study Gang" />
        </div>

      </div>

      {/* --- SCROLLING ACTIVITY TICKER --- */}
      <ActivityTicker />


      {/* --- CATEGORY SHOWCASE --- */}
      <CategoryShowcase onLogin={handleLogin} />

      {/* --- HOW IT WORKS --- */}
      <HowItWorks onLogin={handleLogin} />

      {/* --- FOOTER CTA --- */}
      <FooterCTA onLogin={handleLogin} />

    </div>
  );
}

// --- SCROLLING TICKER ---
const TICKER_ITEMS = [
  { icon: Plane, text: "Cab to Chennai Airport • 3 seats open" },
  { icon: Dumbbell, text: "Chest day at SRM Gym • Spotter needed" },
  { icon: Pizza, text: "Dominos order from Block A • ₹150 split" },
  { icon: BookOpen, text: "DSA study group • Lib 2nd floor" },
  { icon: Film, text: "KGF 3 FDFS • 2 tickets available" },
  { icon: Train, text: "Train to Chennai Central • 4 seats" },
  { icon: Users, text: "Cricket match • 3 players needed" },
  { icon: Sparkles, text: "Hackathon team • 2 members needed" },
];

function ActivityTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative z-10 overflow-hidden py-6 border-y border-white/5 bg-white/[0.015] my-4">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-slate-400 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <item.icon size={13} className="text-indigo-400" />
            </div>
            <span>{item.text}</span>
            <span className="text-slate-700 mx-2">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// --- STATS ITEM ---
function StatItem({ count, suffix = "", label }: { count: number; suffix?: string; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
    </div>
  );
}

// --- CATEGORY SHOWCASE ---
const CATEGORIES = [
  { icon: Plane, label: "Cab Pools", desc: "Share rides to airport, station & beyond", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", glow: "shadow-orange-500/10" },
  { icon: Dumbbell, label: "Gym Spotters", desc: "Find a workout partner who matches your schedule", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
  { icon: Pizza, label: "Food Splits", desc: "Split delivery costs from your favourite joints", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", glow: "shadow-pink-500/10" },
  { icon: BookOpen, label: "Study Groups", desc: "Sync up for exams, projects & assignments", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", glow: "shadow-green-500/10" },
  { icon: Film, label: "Movie Plans", desc: "Catch the latest blockbusters together", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "shadow-yellow-500/10" },
  { icon: Sparkles, label: "Custom Plans", desc: "Cricket, hackathons, or anything else on your mind", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "shadow-violet-500/10" },
];

function CategoryShowcase({ onLogin }: { onLogin: () => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }} className="text-center mb-12"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">What you can do</p>
        <h2 className="text-4xl md:text-5xl font-extrabold">Every kind of campus plan,<br /><span className="text-slate-500">covered.</span></h2>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.label}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            onHoverStart={() => setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            onClick={onLogin}
            className={`relative group text-left p-5 rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer
              ${hovered === i ? `${cat.bg} ${cat.border} shadow-xl ${cat.glow} scale-[1.02]` : "bg-white/[0.03] border-white/5 scale-100"}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${hovered === i ? cat.bg : "bg-white/5"}`}>
              <cat.icon size={22} className={hovered === i ? cat.color : "text-slate-500"} />
            </div>
            <h3 className="font-bold text-base text-white mb-1">{cat.label}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
            <motion.div 
              className={`absolute bottom-4 right-4 w-7 h-7 rounded-full flex items-center justify-center ${cat.bg}`}
              initial={{ opacity: 0, scale: 0.5 }} animate={hovered === i ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={14} className={cat.color} />
            </motion.div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// --- HOW IT WORKS ---
const STEPS = [
  { num: "01", title: "Login with SRM ID", desc: "Sign in securely with your @srmist.edu.in Google account. No outsiders allowed.", icon: ShieldCheck },
  { num: "02", title: "Post or Browse Plans", desc: "Create a plan in seconds or browse what your fellow students are already organizing.", icon: Zap },
  { num: "03", title: "Join & Chat", desc: "Jump into a plan and chat directly with participants to coordinate the details.", icon: Users },
  { num: "04", title: "Earn Points", desc: "Complete plans to earn points, climb the leaderboard, and flex on your campus network.", icon: Star },
];

function HowItWorks({ onLogin }: { onLogin: () => void }) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }} className="text-center mb-14"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Simple by design</p>
        <h2 className="text-4xl md:text-5xl font-extrabold">How it works</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            onHoverStart={() => setActiveStep(i)}
            onHoverEnd={() => setActiveStep(null)}
            className={`relative p-6 rounded-3xl border cursor-default transition-all duration-300
              ${activeStep === i ? "bg-indigo-600/10 border-indigo-500/30 shadow-xl shadow-indigo-900/20 scale-[1.03]" : "bg-white/[0.03] border-white/5"}`}
          >
            <div className={`text-6xl font-black mb-4 transition-all duration-300 ${activeStep === i ? "text-indigo-500/60" : "text-white/5"}`}>
              {step.num}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${activeStep === i ? "bg-indigo-500/20" : "bg-white/5"}`}>
              <step.icon size={18} className={activeStep === i ? "text-indigo-400" : "text-slate-500"} />
            </div>
            <h3 className="font-bold text-base text-white mb-2">{step.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6 }} className="text-center mt-12"
      >
        <button onClick={onLogin} className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all hover:scale-105 shadow-lg shadow-indigo-500/25">
          Get Started Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </section>
  );
}

// --- FOOTER CTA ---
function FooterCTA({ onLogin }: { onLogin: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-900/40 to-purple-900/20 p-14 text-center"
      >
        {/* BG Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="relative z-10 space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Your campus awaits</p>
          <h2 className="text-4xl md:text-6xl font-extrabold max-w-2xl mx-auto leading-tight">
            Ready to sync up with SRM?
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">Join hundreds of students already coordinating their campus life on SRMSocial.</p>
          <button onClick={onLogin} className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-extrabold text-lg hover:scale-[1.03] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)] transition-all duration-300">
            Join with SRM ID <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// --- SUB-COMPONENTS ---

function FloatingCard({ icon: Icon, title, subtitle, className, delay, color, bg }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.6, type: "spring" }}
            whileHover={{ scale: 1.05, rotate: 0 }}
            className={`w-64 p-5 rounded-3xl border border-white/10 bg-[#1e293b]/80 backdrop-blur-xl shadow-2xl cursor-pointer ${className}`}
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
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer active:scale-95">
            <Icon size={20} className="text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">{label}</span>
        </div>
    )
}