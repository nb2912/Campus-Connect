// app/tos/page.tsx
import Link from "next/link";
import { Zap, ArrowLeft, Shield, Users, AlertTriangle, Lock, RefreshCw, Scale, Trash2, Mail } from "lucide-react";

export const metadata = {
  title: "Terms of Service — SRM Social",
  description: "Read the Terms of Service for SRM Social, the exclusive student coordination platform for SRM Institute of Science and Technology.",
};

const LAST_UPDATED = "February 20, 2026";
const CONTACT_EMAIL = "nihalbasaniwal2912@gmail.com";

interface Section {
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    icon: Users,
    title: "1. Eligibility & Access",
    content: (
      <>
        <p>SRM Social is exclusively available to currently enrolled students of <strong className="text-white font-medium">SRM Institute of Science and Technology (SRMIST)</strong>. Access requires an account created with a valid <code className="text-neutral-300 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-xs">ab1234@srmist.edu.in</code> email.</p>
        <p>By signing in, you confirm that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You are a current SRMIST student with a valid institutional email.</li>
          <li>You are at least 18 years of age, or have parental consent where applicable.</li>
          <li>You will not share your account credentials with anyone.</li>
          <li>Your access ends when your SRMIST enrollment ends.</li>
        </ul>
      </>
    ),
  },
  {
    icon: Shield,
    title: "2. Acceptable Use",
    content: (
      <>
        <p>SRM Social is a peer-coordination tool for campus life. You agree to use the platform only for its intended purpose — organizing and joining student activities such as shared cab rides, study sessions, gym partnerships, food runs, and events.</p>
        <p>The following are strictly prohibited:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Creating fake, spam, or misleading plans you do not intend to fulfil.</li>
          <li>Using the platform for commercial activity, advertising, or solicitation.</li>
          <li>Harassing, threatening, or discriminating against any user.</li>
          <li>Impersonating another student, staff member, or official body.</li>
          <li>Attempting to manipulate the XP/points system through fraudulent joins and leaves.</li>
          <li>Scraping, crawling, or automating interactions with the platform.</li>
        </ul>
        <p>Violations may result in immediate, permanent account suspension without notice.</p>
      </>
    ),
  },
  {
    icon: Lock,
    title: "3. Privacy & Data",
    content: (
      <>
        <p>When you use SRM Social, the following information is stored:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white font-medium">Profile data:</strong> your registered display name and institutional email address.</li>
          <li><strong className="text-white font-medium">Activity data:</strong> plans you create, join, or leave, and your XP points balance.</li>
          <li><strong className="text-white font-medium">Optional profile data:</strong> phone number, hostel/address, and UPI ID — provided voluntarily.</li>
          <li><strong className="text-white font-medium">Notifications:</strong> messages sent to other users when you interact with their plans.</li>
        </ul>
        <p>Your data is stored securely on Firebase (Firestore) and is not sold to any third party. Your UPI ID and phone number are visible to users in shared plans to facilitate coordination. Do not add sensitive payment information beyond what is needed for plan coordination.</p>
        <p>Plans are automatically deleted 3 hours after the scheduled plan time. Notification history is retained for up to 50 most recent entries.</p>
      </>
    ),
  },
  {
    icon: Users,
    title: "4. User Content & Plans",
    content: (
      <>
        <p>You are solely responsible for all content you post, including plan descriptions, locations, and chat messages. By submitting content, you grant SRM Social a non-exclusive, royalty-free licence to display that content to other platform users for the purpose of facilitating coordination.</p>
        <p>You agree that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Content must be accurate, lawful, and relevant to campus life.</li>
          <li>You will not post any offensive, defamatory, or illegal content in plan descriptions or chat.</li>
          <li>You are limited to <strong className="text-white font-medium">3 active plans</strong> at any one time to prevent abuse.</li>
          <li>Deleting a plan you created will affect participants who have already joined — notify them via chat before deleting.</li>
        </ul>
      </>
    ),
  },
  {
    icon: Scale,
    title: "5. XP Points System",
    content: (
      <>
        <p>The XP (experience points) system is a gamification feature designed to encourage participation. Points are awarded and deducted as follows:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white font-medium">+50 XP</strong> when you successfully join a plan.</li>
          <li><strong className="text-white font-medium">+50 XP</strong> to the creator when someone joins their plan.</li>
          <li><strong className="text-white font-medium">−50 XP</strong> to both parties when a participant leaves.</li>
        </ul>
        <p>XP points have no monetary value and cannot be exchanged for any tangible goods or services. The leaderboard is public to all SRM Social users. We reserve the right to adjust, reset, or remove XP at our discretion to maintain fair play.</p>
      </>
    ),
  },
  {
    icon: AlertTriangle,
    title: "6. Disclaimer of Liability",
    content: (
      <>
        <p>SRM Social facilitates <strong className="text-white font-medium">peer-to-peer coordination only</strong>. We are not responsible for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Any physical harm, loss, or injury arising from real-world meetups coordinated through the platform.</li>
          <li>Failure of a user to honour a plan they created or joined.</li>
          <li>Financial disputes arising from UPI payments made outside the platform.</li>
          <li>Loss of data arising from Firebase outages or other service interruptions.</li>
          <li>Consequences arising from sharing personal contact details (phone, UPI ID) voluntarily on the platform.</li>
        </ul>
        <p>SRM Social is provided <strong className="text-white font-medium">"as is"</strong> without warranty of any kind. Use the platform at your own discretion and risk. Always exercise common sense when meeting people you have not previously met in person.</p>
      </>
    ),
  },
  {
    icon: RefreshCw,
    title: "7. Changes to These Terms",
    content: (
      <>
        <p>We may update these Terms of Service at any time. Continued use of SRM Social after changes are published constitutes your acceptance of the revised terms. We will attempt to notify users of significant changes via an in-app notice.</p>
        <p>It is your responsibility to check these terms periodically. The <strong className="text-white font-medium">Last Updated</strong> date at the top of this page indicates when the most recent revision was made.</p>
      </>
    ),
  },
  {
    icon: Trash2,
    title: "8. Account Termination",
    content: (
      <>
        <p>We reserve the right to suspend or terminate your access to SRM Social at any time, with or without notice, for any violation of these terms or for behaviour deemed harmful to the community.</p>
        <p>You may request deletion of your account and associated data by emailing us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-neutral-300 hover:text-white underline">{CONTACT_EMAIL}</a>. We will process deletion requests within 7 business days. Note that your joining/leaving actions may have already created notifications in other users' feeds — these cannot be retroactively deleted.</p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800">
      
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-black to-black" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Platform
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Zap className="text-black fill-black" size={16} />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-neutral-500 text-lg leading-relaxed font-light">
            Please read these terms carefully before using SRM Social. By signing in, you agree to be bound by the terms below.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5">
            <RefreshCw size={12} />
            Last updated: {LAST_UPDATED}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, content }) => (
            <section
              key={title}
              className="bg-neutral-950 border border-neutral-900 rounded-2xl p-8 hover:border-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Icon size={14} className="text-neutral-400" />
                </div>
                <h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
              </div>
              <div className="text-neutral-400 text-sm leading-relaxed space-y-3 font-light">
                {content}
              </div>
            </section>
          ))}
        </div>

        {/* Contact footer */}
        <div className="mt-12 p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
          <Mail size={24} className="text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white tracking-tight mb-2">Questions about these terms?</h3>
          <p className="text-neutral-500 text-sm mb-6 font-light">
            If you have any questions or concerns about these Terms of Service, reach out to us directly.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-colors"
          >
            <Mail size={16} />
            Email Us
          </a>
        </div>

        {/* Bottom */}
        <div className="mt-16 text-center text-xs text-neutral-600">
          © 2026 SRM Social. All rights reserved.
        </div>
      </div>
    </div>
  );
}
