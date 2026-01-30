// app/page.tsx
"use client";
import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
// Note: "./firebase" assumes firebase.ts is in the app folder
import { auth, googleProvider } from "./firebase"; 
import { useRouter } from "next/navigation";
import type { RideRequest } from "@/types"; 
// OR if that fails, try:
// import type { RideRequest } from "../../types";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 1. Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If they are already logged in, send them to dashboard immediately
      if (currentUser && currentUser.email?.endsWith("@srmist.edu.in")) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Handle Login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      // SAFETY CHECK: Is it an SRM email?
      if (email && email.endsWith("@srmist.edu.in")) {
        router.push("/dashboard"); 
      } else {
        // If not SRM, kick them out immediately
        await signOut(auth);
        alert("Access Denied: You must use your @srmist.edu.in email.");
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-blue-900">SRM Companion</h1>
        <p className="text-gray-600">Find partners for Cabs, Gym, or Trains.</p>
        
        {user ? (
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 w-full"
          >
            Go to Dashboard
          </button>
        ) : (
          <button 
            onClick={handleLogin}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full font-semibold"
          >
            Sign in with SRM Email
          </button>
        )}
      </div>
    </div>
  );
}