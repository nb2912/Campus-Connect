import { Zap } from "lucide-react";

export default function Footer() {
  return (
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
           <a href="#" className="hover:text-white transition-colors">Guidelines</a>
           <a href="#" className="hover:text-white transition-colors">Safety</a>
           <a href="mailto:nihalbasaniwal2912@gmail.com" className="hover:text-white transition-colors">Support</a>
        </div>

        {/* COPYRIGHT & CREDIT */}
        <div className="text-xs text-slate-600">
           <p>© 2026 SRM Social. All rights reserved.</p>
          
        </div>
      </div>
    </footer>
  );
}