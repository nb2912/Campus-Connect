// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
// Note: "../firebase" because we are inside the 'dashboard' folder
import { db, auth } from "../firebase"; 
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { RideRequest } from "@/types"; // Make sure types/index.ts exists!

export default function Dashboard() {
  const [user, setUser] = useState<any>(null); 
  const [type, setType] = useState<"CAB" | "GYM" | "TRAIN">("CAB");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("");
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const router = useRouter();

  // 1. Check Auth & Fetch Data
  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
      }
    });

    // Real-time Database Listener
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    
    const dbUnsub = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RideRequest[];
      
      setRequests(requestsData);
    });

    return () => {
      authUnsub();
      dbUnsub();
    };
  }, [router]);

  // 2. Create Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, "requests"), {
        type,
        description: desc,
        time,
        createdAt: serverTimestamp(),
        status: "OPEN",
        creatorName: user.displayName || "Unknown Student",
        creatorEmail: user.email,
        creatorId: user.uid,
      });
      setDesc("");
      setTime("");
      alert("Request Posted!");
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  // 3. Accept Request
  const handleAcceptRequest = async (request: RideRequest) => {
    if (!user) return;
    if (request.creatorId === user.uid) {
      alert("You cannot accept your own request!");
      return;
    }

    const confirm = window.confirm(`Join ${request.creatorName} for this?`);
    if (!confirm) return;

    try {
      const requestRef = doc(db, "requests", request.id);
      await updateDoc(requestRef, {
        status: "ACCEPTED",
        acceptedBy: user.uid,
        acceptedByName: user.displayName,
        acceptedByEmail: user.email
      });
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">SRM Companion</h1>
          <button 
            onClick={() => signOut(auth)}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Sign Out
          </button>
        </header>

        {/* --- CREATE FORM --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Post a Request</h2>
          <form onSubmit={handleCreateRequest} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)}
              className="border p-2 rounded-lg bg-gray-50"
            >
              <option value="CAB">Share a Cab</option>
              <option value="GYM">Gym Partner</option>
              <option value="TRAIN">Train Buddy</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Description (e.g. Airport Drop)" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              className="border p-2 rounded-lg md:col-span-2"
              required
            />

            <input 
              type="datetime-local" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="border p-2 rounded-lg"
              required
            />

            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 md:col-span-4 font-medium">
              Post Request
            </button>
          </form>
        </div>

        {/* --- REQUESTS LIST --- */}
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className={`p-5 rounded-xl border ${req.status === 'ACCEPTED' ? 'bg-gray-100 opacity-80' : 'bg-white shadow-sm'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded text-white mb-2 ${
                    req.type === 'CAB' ? 'bg-orange-500' : 
                    req.type === 'GYM' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {req.type}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800">{req.description}</h3>
                  <p className="text-sm text-gray-600">Time: {req.time}</p>
                  <p className="text-xs text-gray-400 mt-1">Posted by: {req.creatorName}</p>
                  
                  {req.status === 'ACCEPTED' && (
                    <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                      Accepted by: <b>{req.acceptedByName}</b> <br/>
                      Contact: {req.acceptedByEmail}
                    </div>
                  )}
                </div>

                {req.status === 'OPEN' && req.creatorId !== user?.uid && (
                  <button 
                    onClick={() => handleAcceptRequest(req)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    Accept
                  </button>
                )}
                
                {req.creatorId === user?.uid && req.status === 'OPEN' && (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">Your Post</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}