"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, MessageCircle, Users, LogOut, X, UserPlus } from "lucide-react";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// --- TYPES ---
export type ToastType = "success" | "error" | "join" | "leave" | "chat";

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  senderName?: string;
  senderPhoto?: string;
  subtitle?: string;
  duration?: number; // ms
  onClick?: () => void;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
}

// --- CONTEXT ---
const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
  removeToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// --- NOTIFICATION SOUND ---
const playNotificationSound = (type: ToastType) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    if (type === "chat") {
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
      oscillator.type = "sine";
    } else if (type === "join") {
      oscillator.frequency.setValueAtTime(520, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(780, audioCtx.currentTime + 0.15);
      oscillator.type = "sine";
    } else if (type === "leave") {
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(330, audioCtx.currentTime + 0.15);
      oscillator.type = "sine";
    } else {
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
      oscillator.type = "sine";
    }

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch {
    // Audio not supported, fail silently
  }
};

// --- TOAST CONFIG ---
const TOAST_CONFIG: Record<ToastType, { icon: any; gradient: string; borderColor: string; bgColor: string; iconColor: string; iconBg: string; progressColor: string }> = {
  success: {
    icon: Check,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-[#0c1a1a]",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    progressColor: "bg-emerald-400",
  },
  error: {
    icon: AlertTriangle,
    gradient: "from-red-500/20 to-red-600/5",
    borderColor: "border-red-500/30",
    bgColor: "bg-[#1a0c0c]",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/20",
    progressColor: "bg-red-400",
  },
  join: {
    icon: UserPlus,
    gradient: "from-indigo-500/20 to-violet-600/5",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-[#0c0f1a]",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/20",
    progressColor: "bg-indigo-400",
  },
  leave: {
    icon: LogOut,
    gradient: "from-orange-500/20 to-orange-600/5",
    borderColor: "border-orange-500/30",
    bgColor: "bg-[#1a140c]",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/20",
    progressColor: "bg-orange-400",
  },
  chat: {
    icon: MessageCircle,
    gradient: "from-violet-500/20 to-purple-600/5",
    borderColor: "border-violet-500/30",
    bgColor: "bg-[#130c1a]",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
    progressColor: "bg-violet-400",
  },
};

// --- SINGLE TOAST COMPONENT  ---
function SingleToast({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;
  const duration = toast.duration || 4500;
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const pausedRef = useRef(false);
  const remainingRef = useRef(duration);

  useEffect(() => {
    let animFrame: number;

    const tick = () => {
      if (pausedRef.current) {
        animFrame = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingRef.current - elapsed;
      const pct = Math.max(0, (remaining / duration) * 100);
      setProgress(pct);

      if (pct <= 0) {
        onRemove(toast.id);
        return;
      }
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [toast.id, duration, onRemove]);

  const handleMouseEnter = () => {
    pausedRef.current = true;
  };

  const handleMouseLeave = () => {
    // Recalculate remaining time
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = remainingRef.current - elapsed;
    startTimeRef.current = Date.now();
    pausedRef.current = false;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={toast.onClick}
      className={cn(
        "relative w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden",
        "cursor-pointer group hover:scale-[1.02] transition-transform",
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-60", config.gradient)} />

      {/* Content */}
      <div className="relative z-10 flex items-start gap-3 p-4">
        {/* Avatar / Icon */}
        {toast.senderPhoto ? (
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
              <Image src={toast.senderPhoto} alt="" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div className={cn("absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border border-black", config.iconBg)}>
              <Icon size={10} className={config.iconColor} />
            </div>
          </div>
        ) : (
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg", config.iconBg)}>
            <Icon size={18} className={config.iconColor} />
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          {toast.senderName && (
            <p className="text-xs font-bold text-white truncate">{toast.senderName}</p>
          )}
          <p className={cn("text-sm leading-snug truncate", toast.senderName ? "text-slate-300" : "text-white font-medium")}>
            {toast.message}
          </p>
          {toast.subtitle && (
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{toast.subtitle}</p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-white/5 relative">
        <motion.div
          className={cn("h-full absolute left-0 top-0", config.progressColor)}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0 }}
        />
      </div>
    </motion.div>
  );
}

// --- TOAST PROVIDER ---
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => {
      // Max 4 toasts at a time
      const updated = [...prev, { ...toast, id }];
      if (updated.length > 4) {
        return updated.slice(updated.length - 4);
      }
      return updated;
    });

    // Play sound
    playNotificationSound(toast.type);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxHeight: "calc(100vh - 2rem)" }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <SingleToast toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
