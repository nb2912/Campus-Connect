export interface RideRequest {
  id: string;
  // Added "CUSTOM" to the end of the list
  type: "CAB" | "GYM" | "TRAIN" | "FOOD" | "STUDY" | "MOVIE" | "CUSTOM"; 
  
  description: string;
  time: string;
  createdAt: any;
  status: "OPEN" | "ACCEPTED" | "CLOSED";
  
  // Group & User Details
  capacity?: number;
  participants?: string[];
  
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhoto?: string;
  
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedByEmail?: string;

  // Optional: Add this if you want to store the specific title of a custom plan
  // e.g. If type is "CUSTOM", customTitle could be "Basketball"
  customTitle?: string; 
}