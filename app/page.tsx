"use client";

import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { Plane, Dumbbell, Pizza, ShieldCheck, ArrowRight, Zap, Users, Star, ChevronRight, BookOpen, Film, Train, Sparkles, LogIn, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Footer from "./components/Footer";


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.email?.endsWith("@srmist.edu.in")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = () => {
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden relative">
      
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-50">
         <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzbmyxtz0/image/upload/v1716111100/grid_ubikq5.svg')] bg-center [mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        
        {/* Navbar */}
        <nav className="h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SRM<span className="text-slate-500 font-medium">Social</span></span>
          </div>
          
          {!user && (
            <div className="hidden md:flex items-center gap-3">
              <button onClick={handleLogin} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all text-sm font-bold text-slate-600 hover:text-slate-900">
                Login <ArrowRight size={14} className="opacity-50 text-slate-400" />
              </button>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <main className="mt-20 md:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[60vh]">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-indigo-600 shadow-sm text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} className="text-indigo-500" /> Verified Students Only
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
              The modern way to <br />
              <span className="text-indigo-600">coordinate campus.</span>
            </h1>
            
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed font-medium">
              SRMSocial is a secure platform to split airport cabs, find gym spotters, and sync study sessions instantly with verified peers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/auth"
                className="group relative px-8 py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-full hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all duration-300 text-center"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {user ? "Open Dashboard" : "Join the Network"} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-90"/>
                </span>
              </Link>
              <button 
                onClick={handleLogin}
                className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                  <LogIn size={16} className="opacity-50" /> Login
              </button>
            </div>
          </motion.div>

          {/* Right Visuals */}
          <div className="relative h-[400px] hidden lg:block">
             <FloatingCard 
                icon={Plane} title="Airport Cab" subtitle="3/4 Seats Filled" 
                className="absolute top-0 right-10 z-20"
                delay={0.2}
             />
             <FloatingCard 
                icon={Dumbbell} title="Chest Day" subtitle="Need Spotter" 
                className="absolute top-32 right-32 z-10 opacity-70 scale-95"
                delay={0.4}
             />
             <FloatingCard 
                icon={Pizza} title="Dominos Order" subtitle="Abode Valley Split" 
                className="absolute top-64 right-5 z-30"
                delay={0.6}
             />
          </div>
        </main>

        <div className="lg:hidden grid grid-cols-2 gap-3 pb-10 mt-10">
            <FeaturePill icon={Plane} label="Cab Pools" />
            <FeaturePill icon={Dumbbell} label="Gym Spotters" />
            <FeaturePill icon={Pizza} label="Food Split" />
            <FeaturePill icon={Users} label="Study Groups" />
        </div>
      </div>

      <ActivityTicker />
      <CategoryShowcase onLogin={handleLogin} />
      <HowItWorks onLogin={handleLogin} />
      <FooterCTA onLogin={handleLogin} />
      <Footer />
    </div>
  );
}

// --- TICKER ---
const TICKER_ITEMS = [
  { icon: Plane, text: "Cab to Chennai Airport • 3 seats open" },
  { icon: Dumbbell, text: "Chest day at SRM Gym • Spotter needed" },
  { icon: Pizza, text: "Dominos order from Block A • ₹150 split" },
  { icon: BookOpen, text: "DSA study group • Lib 2nd floor" },
  { icon: Film, text: "KGF 3 FDFS • 2 tickets available" },
];

function ActivityTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative z-10 overflow-hidden py-4 border-y border-slate-200 bg-white shadow-sm my-4">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-500 shrink-0">
            <item.icon size={14} className="text-indigo-400" />
            <span>{item.text}</span>
            <span className="text-slate-300 mx-2">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// --- CATEGORIES ---
const CATEGORIES = [
  { icon: Plane, label: "Cab Pools", desc: "Share rides to airport, station & beyond" },
  { icon: Dumbbell, label: "Gym Spotters", desc: "Find a workout partner who matches your schedule" },
  { icon: Pizza, label: "Food Splits", desc: "Split delivery costs from your favourite joints" },
  { icon: BookOpen, label: "Study Groups", desc: "Sync up for exams, projects & assignments" },
  { icon: Film, label: "Movie Plans", desc: "Catch the latest blockbusters together" },
  { icon: Sparkles, label: "Custom Plans", desc: "Cricket, hackathons, or anything else" },
];

function CategoryShowcase({ onLogin }: { onLogin: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative z-10 max-w-6xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }} className="mb-16"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Platform Capabilities</h2>
        <p className="text-slate-500 mt-2 font-medium">Everything you need to coordinate campus life.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            onClick={onLogin}
            className="group p-6 rounded-3xl border border-slate-200 bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <cat.icon size={16} className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{cat.label}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{cat.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- HOW IT WORKS ---
const STEPS = [
  { num: "01", title: "Authenticate", desc: "Sign in securely with your SRM email.", icon: ShieldCheck },
  { num: "02", title: "Coordinate", desc: "Post a plan or browse what others are organizing.", icon: Zap },
  { num: "03", title: "Connect", desc: "Join plans and use real-time chat to finalize details.", icon: Users },
  { num: "04", title: "Reputation", desc: "Earn trust points for successful interactions.", icon: Star },
];

function HowItWorks({ onLogin }: { onLogin: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative z-10 max-w-6xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }} className="mb-16"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">How it works</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="text-sm font-bold text-slate-400 mb-6">{step.num}</div>
            <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- FOOTER CTA ---
function FooterCTA({ onLogin }: { onLogin: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section ref={ref} className="relative z-10 max-w-6xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center text-center space-y-8 bg-indigo-600 rounded-[3rem] p-12 shadow-xl shadow-indigo-600/20"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Ready to join?
        </h2>
        <p className="text-indigo-100 max-w-md font-medium">Join hundreds of students already coordinating their campus life securely on SRMSocial.</p>
        <button onClick={onLogin} className="group px-8 py-3.5 bg-white text-indigo-600 font-bold text-sm rounded-full hover:scale-[1.02] shadow-sm transition-all">
          Get Started
        </button>
      </motion.div>
    </section>
  );
}

// --- UTILS ---
function FloatingCard({ icon: Icon, title, subtitle, className, delay }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8, ease: "easeOut" }}
            className={`w-72 p-5 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 ${className}`}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Icon className="text-indigo-600" size={16} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
                </div>
            </div>
        </motion.div>
    )
}

function FeaturePill({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Icon size={16} className="text-indigo-600" />
            <span className="font-bold text-sm text-slate-700">{label}</span>
        </div>
    )
}