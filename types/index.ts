// types/index.ts
export interface RideRequest {
  id: string;
  type: "CAB" | "GYM" | "TRAIN";
  description: string;
  time: string;
  createdAt: any; // We use 'any' to handle Firestore timestamps easily
  status: "OPEN" | "ACCEPTED" | "CLOSED";
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  
  // Optional fields (add '?' so TypeScript doesn't complain if they are missing)
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedByEmail?: string;
}