// app/components/Footer.tsx
"use client";

import { Zap, X } from "lucide-react";
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-lg bg-[#1e293b] border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
          <div className="text-slate-400 text-sm leading-relaxed space-y-4">
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
      <footer className="mt-20 border-t border-white/5 py-10 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* BRANDING */}
          <div className="text-left">
             <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
                <Zap size={18} className="text-indigo-500 fill-indigo-500"/> SRM<span className="text-indigo-400">Social</span>
             </h3>
             <p className="text-xs text-slate-500 mt-1">Connecting campus, one plan at a time.</p>
          </div>

          {/* LINKS */}
          <div className="flex gap-6 text-sm font-medium text-slate-400">
             <button onClick={() => setModal("guidelines")} className="hover:text-white transition-colors">Guidelines</button>
             <button onClick={() => setModal("safety")} className="hover:text-white transition-colors">Safety</button>
             <Link href="/tos" className="hover:text-white transition-colors">Terms</Link>
             <a href="mailto:nihalbasaniwal2912@gmail.com" className="hover:text-white transition-colors">Support</a>
          </div>

          {/* COPYRIGHT */}
          <div className="text-xs text-slate-600">
             <p>© 2026 SRM Social. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* GUIDELINES MODAL */}
      {modal === "guidelines" && (
        <Modal title="Community Guidelines" onClose={() => setModal(null)}>
          <p>SRMSocial is an exclusive platform for verified SRM students. To keep the community safe and useful for everyone, please follow these guidelines:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-white font-semibold">Be respectful.</span> Treat every student with courtesy. Discrimination, harassment, or hate speech of any kind is not tolerated.</li>
            <li><span className="text-white font-semibold">Post genuine plans.</span> Only create plans you actually intend to follow through with. Fake or spam posts will result in account removal.</li>
            <li><span className="text-white font-semibold">No commercial activity.</span> SRMSocial is not a marketplace. Do not use it to sell products or services.</li>
            <li><span className="text-white font-semibold">Respect others' time.</span> If you join a plan and can't make it, leave the plan promptly so others can join.</li>
            <li><span className="text-white font-semibold">Keep it on-campus.</span> Plans must relate to student life at SRM — rides, food, gyms, study, events, etc.</li>
            <li><span className="text-white font-semibold">Protect privacy.</span> Do not share personal details of other students without their consent.</li>
          </ul>
          <p>Violations may result in permanent removal from the platform. If you see something that breaks these rules, use the Support link to report it.</p>
        </Modal>
      )}

      {/* SAFETY MODAL */}
      {modal === "safety" && (
        <Modal title="Your Safety" onClose={() => setModal(null)}>
          <p>Your safety is our top priority. Here are some tips to stay safe while using SRMSocial:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-white font-semibold">Verify who you're meeting.</span> Before joining a plan with someone new, check their SRM email and profile. All users are verified SRM students.</li>
            <li><span className="text-white font-semibold">Meet in public places.</span> For first-time meetups, prefer common campus areas like the library, cafeteria, or main block.</li>
            <li><span className="text-white font-semibold">Share your plans.</span> Let a friend or roommate know where you're going, especially for off-campus plans like cab rides.</li>
            <li><span className="text-white font-semibold">Trust your instincts.</span> If something feels off, you can leave any plan at any time — no questions asked.</li>
            <li><span className="text-white font-semibold">Never share passwords or OTPs.</span> No SRMSocial admin will ever ask for your login credentials.</li>
            <li><span className="text-white font-semibold">Report bad actors.</span> If a user is behaving inappropriately, report them immediately via the Support email.</li>
          </ul>
          <p>If you are in immediate danger, please contact SRM Campus Security or local emergency services. SRMSocial is a peer coordination tool and is not a replacement for official support systems.</p>
        </Modal>
      )}
    </>
  );
}