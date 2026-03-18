"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const ALLOWED_DOMAIN = "@srmist.edu.in";

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Redirect if already logged in with correct domain
  useEffect(() => {
    if (user && user.email?.endsWith(ALLOWED_DOMAIN)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z]{2}[0-9]{4}@srmist\.edu\.in$/;
    return emailRegex.test(email);
  };

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try logging in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/user-not-found":
        return "No account found with this email. Please sign up first.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  // Handle Email/Password Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateEmail(email)) {
      setError(`Only emails in the format ab1234@srmist.edu.in are allowed.`);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name
      await updateProfile(result.user, { displayName: displayName.trim() });

      // Send verification email
      await sendEmailVerification(result.user);

      setSuccess(
        "Account created! A verification email has been sent to your SRM email. Please verify before logging in."
      );

      // Sign out until they verify
      await signOut(auth);

      // Switch to login mode after a delay
      setTimeout(() => {
        setMode("login");
        setSuccess("Account created! Please check your SRM email for verification, then log in.");
      }, 3000);

    } catch (error: any) {
      const message = getFirebaseErrorMessage(error?.code);
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateEmail(email)) {
      setError(`Only emails in the format ab1234@srmist.edu.in are allowed.`);
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(auth);
        setError(
          "Please verify your email first. A new verification link has been sent."
        );
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      const message = getFirebaseErrorMessage(error?.code);
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };



  // Derive live email validation state
  const emailDomainValid = email.length === 0 || validateEmail(email);
  const emailHasInput = email.length > 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-[50%] left-[60%] w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* --- BACK TO HOME --- */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 group transition-colors"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Home
        </motion.button>

        {/* --- AUTH CARD --- */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e293b]/70 backdrop-blur-2xl shadow-2xl shadow-indigo-900/20"
        >
          {/* Decorative top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          <div className="p-8 md:p-10">
            {/* --- LOGO & HEADER --- */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2.5 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Zap className="text-white fill-white" size={20} />
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  SRM<span className="text-indigo-400">Social</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-slate-400">
                {mode === "login"
                  ? "Sign in to your campus network"
                  : "Join the exclusive SRM community"}
              </p>
            </div>

            {/* --- DOMAIN BADGE --- */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-6">
              <ShieldCheck size={14} className="text-indigo-400" />
              Only @srmist.edu.in emails allowed
            </div>

            {/* --- MODE TABS --- */}
            <div className="flex gap-1 p-1 bg-black/20 rounded-2xl border border-white/5 mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  mode === "login"
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  mode === "signup"
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* --- ERROR BANNER --- */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5"
                >
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/25">
                    <AlertTriangle
                      size={16}
                      className="text-red-400 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-red-300 font-medium leading-relaxed">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- SUCCESS BANNER --- */}
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5"
                >
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle
                      size={16}
                      className="text-emerald-400 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-emerald-300 font-medium leading-relaxed">
                      {success}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- AUTH FORM --- */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={mode === "login" ? handleLogin : handleSignUp}
                className="space-y-4"
              >
                
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="relative"
                  >
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-600 transition-all"
                    />
                  </motion.div>
                )}

                
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    placeholder="yourname@srmist.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full bg-black/20 border rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm font-medium focus:outline-none focus:ring-2 placeholder:text-slate-600 transition-all ${
                      emailHasInput && !emailDomainValid
                        ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10"
                        : emailHasInput && emailDomainValid
                        ? "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/10"
                        : "border-white/10 focus:border-indigo-500/60 focus:ring-indigo-500/10"
                    }`}
                  />
                  
                  {emailHasInput && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {emailDomainValid ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {emailHasInput && !emailDomainValid && (
                  <p className="text-xs text-red-400/80 ml-2 -mt-1.5">
                    Email must be in format ab1234@srmist.edu.in
                  </p>
                )}
 
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-11 pr-12 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Confirm Password (Sign Up only) */}
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="relative"
                  >
                    <Lock
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-11 pr-12 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </motion.div>
                )}

                
                <button
                  type="submit"
                  disabled={loading || (emailHasInput && !emailDomainValid)}
                  className="group relative w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === "login"
                          ? "Signing in..."
                          : "Creating account..."}
                      </>
                    ) : (
                      <>
                        {mode === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight
                          size={16}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </>
                    )}
                  </span>
                </button>
              </motion.form>
            </AnimatePresence>



            
            <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Sparkles size={12} className="text-indigo-500/50" />
              <span>
                Secured with Firebase Auth • Only SRM students
              </span>
            </div>
          </div>
        </motion.div>

        {/* --- FOOTER --- */}
        <p className="text-center text-xs text-slate-600 mt-6">
          By continuing, you agree to SRMSocial&apos;s{" "}
          <a href="/tos" className="text-indigo-400/60 hover:text-indigo-400 transition-colors">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
