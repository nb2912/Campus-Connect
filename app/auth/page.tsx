"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
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
} from "lucide-react";
import Footer from "../components/Footer";

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

  useEffect(() => {
    if (user && user.email?.endsWith(ALLOWED_DOMAIN)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[\w\.-]+@srmist\.edu\.in$/;
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
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase. Please enable it in the Firebase Console.";
      case "auth/popup-closed-by-user":
        return "";
      default:
        console.error("Unhandled Firebase auth error code:", code);
        return "Something went wrong. Please try again.";
    }
  };

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
      await updateProfile(result.user, { displayName: displayName.trim() });
      await sendEmailVerification(result.user);

      setSuccess(
        "Account created! A verification email has been sent to your SRM email. (Check your Spam folder if it's missing). Please verify before logging in."
      );
      await signOut(auth);

      setTimeout(() => {
        setMode("login");
        setSuccess("Account created! Please check your SRM email (and Spam folder) for verification, then log in.");
      }, 3000);

    } catch (error: any) {
      const message = getFirebaseErrorMessage(error?.code);
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

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
  
  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your SRM email first.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid SRM email (ab1234@srmist.edu.in).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent! Please check your SRM email. If you don't see it, check your Spam/Junk folder and mark it as 'Not Spam'.");
    } catch (error: any) {
      const message = getFirebaseErrorMessage(error?.code);
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const emailDomainValid = email.length === 0 || validateEmail(email);
  const emailHasInput = email.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 flex flex-col items-center justify-center relative overflow-hidden px-4">
      
      {/* Minimal Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-50" />

      <div className="relative z-10 w-full max-w-[420px]">
        
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-bold mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-[24px] border border-slate-200 bg-white p-8 md:p-10 shadow-2xl shadow-slate-200/50"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Zap className="text-indigo-600 fill-indigo-600" size={20} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {mode === "login" ? "Enter your details to sign in" : "Join the SRM network"}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200 mb-8">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                mode === "login" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                mode === "signup" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600 leading-relaxed font-semibold">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-700 leading-relaxed font-semibold">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence>
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 10 : -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={mode === "login" ? handleLogin : handleSignUp}
              className="space-y-4"
            >
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wider">SRM Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="ab1234@srmist.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    required
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-slate-900 text-sm focus:outline-none transition-colors placeholder:text-slate-400 font-semibold ${
                      emailHasInput && !emailDomainValid
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-200 focus:border-indigo-500"
                    }`}
                  />
                  {emailHasInput && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {emailDomainValid ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {emailHasInput && !emailDomainValid && (
                  <p className="text-xs text-red-500 pl-1 font-semibold">Must be @srmist.edu.in format</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1 pr-1">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                   {mode === "login" && (
                     <button
                       type="button"
                       onClick={handleResetPassword}
                       className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                     >
                       Forgot?
                     </button>
                   )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || (emailHasInput && !emailDomainValid)}
                  className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    mode === "login" ? "Sign In" : "Create Account"
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-xs font-bold text-slate-400 mt-8">
          By continuing, you agree to SRMSocial's{" "}
          <Link href="/tos" className="text-indigo-600 hover:text-indigo-700 transition-colors underline underline-offset-2">
            Terms of Service
          </Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
