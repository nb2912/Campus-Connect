export interface RideRequest {
  id: string;
  // Update this line to include the new categories
  type: "CAB" | "GYM" | "TRAIN" | "FOOD" | "STUDY" | "MOVIE"; 
  description: string;
  time: string;
  createdAt: any;
  status: "OPEN" | "ACCEPTED" | "CLOSED";
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedByEmail?: string;
}