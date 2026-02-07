import { Zap, Github, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#020617] border-t border-white/5 pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- TOP SECTION: GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* COL 1: BRAND IDENTITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Zap className="text-white fill-white" size={16} />
               </div>
               <span className="text-lg font-bold tracking-tight text-white">SRM<span className="text-indigo-400">Social</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              The exclusive social network for SRM Institute of Science and Technology. Connect, share, and collaborate with your campus peers securely.
            </p>
            <div className="flex gap-3">
              <SocialIcon icon={Twitter} href="#" />
              <SocialIcon icon={Github} href="#" />
              <SocialIcon icon={Linkedin} href="#" />
              <SocialIcon icon={Instagram} href="#" />
            </div>
          </div>

          {/* COL 2: PLATFORM LINKS */}
          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Campus Feed</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Leaderboard</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Cab Pooling</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Study Groups</a></li>
            </ul>
          </div>

          {/* COL 3: SUPPORT & LEGAL */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Safety Center</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Report an Issue</a></li>
              <li><a href="mailto:support@srmsocial.com" className="hover:text-indigo-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* COL 4: NEWSLETTER / CTA */}
          <div>
            <h4 className="text-white font-bold mb-6">Stay Updated</h4>
            <p className="text-sm text-slate-400 mb-4">Get the latest campus news, feature updates, and event alerts.</p>
            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* --- DIVIDER --- */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* --- BOTTOM SECTION: COPYRIGHT & CREDITS --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span>© 2026 SRM Social. All rights reserved.</span>
            <div className="flex gap-4">
                <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Cookie Policy</a>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span>Designed & Built by</span>
            <span className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer">
              Nihal Basaniwal
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

// Helper Component for Social Icons
function SocialIcon({ icon: Icon, href }: any) {
  return (
    <a href={href} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/20 hover:-translate-y-1">
      <Icon size={16} />
    </a>
  );
}