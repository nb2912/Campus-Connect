// app/components/Footer.tsx
"use client";

import { Zap, X, Github, Instagram, Linkedin, Twitter, Mail, ShieldCheck, ExternalLink, Globe, Heart, MessageCircle, ShieldAlert, BookText, HelpCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={onClose}
        />
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <div className="text-slate-600 text-[15px] leading-relaxed space-y-5 font-medium">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function Footer() {
  const [modal, setModal] = useState<"guidelines" | "safety" | null>(null);

  return (
    <>
      <footer className="relative mt-40 bg-slate-950 pt-24 pb-12 overflow-hidden">
        {/* Decorative Gradient Flare */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
            
            {/* BRANDING COLUMN */}
            <div className="space-y-6 text-center md:text-left">
              <div className="flex items-center gap-2.5 justify-center md:justify-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Zap size={20} className="text-white fill-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">SRM<span className="text-slate-400 font-medium">Social</span></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium mx-auto md:mx-0">
                The premier campus coordination network for SRM students. Secure, verified, and community-driven.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={12} className="text-indigo-400" /> Verified Student Network
              </div>
            </div>

            {/* PRODUCT COLUMN */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold text-xs mb-8 uppercase tracking-[0.2em] opacity-50">Platform</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group"><MessageCircle size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Live Feed</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group"><Zap size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Leaderboard</Link></li>
                <li><button onClick={() => setModal("guidelines")} className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group w-full md:w-auto"><BookText size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Guidelines</button></li>
                <li><button onClick={() => setModal("safety")} className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group w-full md:w-auto"><ShieldAlert size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Safety Guide</button></li>
              </ul>
            </div>

            {/* RESOURCES COLUMN */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold text-xs mb-8 uppercase tracking-[0.2em] opacity-50">Resources</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-400">
                <li><a href="mailto:nihalbasaniwal2912@gmail.com" className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group"><Mail size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Help & Support</a></li>
                <li><Link href="/tos" className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group"><ExternalLink size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Terms of Service</Link></li>
                <li><Link href="/tos" className="hover:text-white transition-colors flex items-center gap-2 justify-center md:justify-start group"><ShieldCheck size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Privacy Policy</Link></li>
                <li className="flex items-center gap-2 text-emerald-500/80 pt-2 justify-center md:justify-start">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold">Systems Operational</span>
                </li>
              </ul>
            </div>

            {/* CONNECT COLUMN */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold text-xs mb-8 uppercase tracking-[0.2em] opacity-50">Connect</h4>
              <div className="flex gap-3 mb-8 justify-center md:justify-start">
                <SocialLink href="#" icon={Github} />
                <SocialLink href="#" icon={Twitter} />
                <SocialLink href="#" icon={Instagram} />
                <SocialLink href="#" icon={Linkedin} />
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-left">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><HelpCircle size={12}/> Feedback?</p>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Spotted a bug or have a feature idea? Let us know!</p>
              </div>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
               <p className="text-slate-500 text-xs font-semibold">
                © 2026 SRM Social. All rights reserved.
              </p>
              <span className="hidden md:block text-slate-800">•</span>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Made with <Heart size={10} className="inline text-red-500 fill-red-500 mx-1 mb-0.5" /> in SRM KTR
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <button className="hover:text-white transition-colors flex items-center gap-1.5"><Globe size={14} className="text-slate-600"/> English (IN)</button>
              <p className="text-slate-700">Not affiliated with SRMIST</p>
            </div>
          </div>
        </div>
      </footer>

      {/* GUIDELINES MODAL */}
      {modal === "guidelines" && (
        <Modal title="Community Guidelines" onClose={() => setModal(null)}>
          <p>SRMSocial is an exclusive platform for verified SRM students. To keep the community safe and useful for everyone, please follow these guidelines:</p>
          <ul className="space-y-4">
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               <p><span className="text-slate-900 font-bold">Be respectful.</span> Treat every student with courtesy. Discrimination, harassment, or hate speech is not tolerated.</p>
            </li>
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               <p><span className="text-slate-900 font-bold">Post genuine plans.</span> Only create plans you actually intend to follow through with. Spam results in removal.</p>
            </li>
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               <p><span className="text-slate-900 font-bold">No commercial activity.</span> SRMSocial is not a marketplace. Do not use it to sell products or services.</p>
            </li>
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               <p><span className="text-slate-900 font-bold">Respect others' time.</span> If you join a plan and can't make it, leave promptly so others can join.</p>
            </li>
          </ul>
          <p className="pt-6 text-xs text-slate-400 border-t border-slate-100 italic">Violations may result in permanent removal from the platform.</p>
        </Modal>
      )}

      {/* SAFETY MODAL */}
      {modal === "safety" && (
        <Modal title="Your Safety" onClose={() => setModal(null)}>
          <p className="mb-2">Your safety is our top priority. Here are some tips to stay safe while using SRMSocial:</p>
          <ul className="space-y-4">
             <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <p><span className="text-slate-900 font-bold">Verify who you're meeting.</span> Before joining a plan with someone new, check their SRM email and profile.</p>
            </li>
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <p><span className="text-slate-900 font-bold">Meet in public places.</span> For first-time meetups, prefer common campus areas like the library or cafeteria.</p>
            </li>
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <p><span className="text-slate-900 font-bold">Share your plans.</span> Let a friend or roommate know where you're going, especially for off-campus plans.</p>
            </li>
            <li className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <p><span className="text-slate-900 font-bold">Trust your instincts.</span> If something feels off, you can leave any plan at any time — no questions asked.</p>
            </li>
          </ul>
          <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-100">
             <p className="text-xs text-slate-500 leading-relaxed">In case of immediate danger, please contact <span className="text-slate-900 font-bold">SRM Campus Security</span> or local emergency services.</p>
          </div>
        </Modal>
      )}
    </>
  );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all active:scale-95 group"
    >
      <Icon size={18} className="group-hover:scale-110 transition-transform" />
    </a>
  );
}