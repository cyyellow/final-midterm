export interface Event {
  _id: string;
  creatorId: string;
  creatorUsername: string;
  creatorImage?: string;
  // Optional external source info (e.g. Bandsintown)
  source?: string;
  sourceId?: string;
  externalUrl?: string;
  title: string;
  description: string;
  location?: string;
  eventDate: Date;
  endDate: Date;
  maxParticipants?: number;
  requiresChat: boolean;
  chatRoomId?: string;
  participants: EventParticipant[];
  status: "upcoming" | "active" | "ended" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface EventParticipant {
  userId: string;
  username: string;
  userImage?: string;
  joinedAt: Date;
}

export interface ChatMessage {
  _id: string;
  eventId: string;
  userId: string;
  username: string;
  userImage?: string;
  message: string;
  createdAt: Date;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location?: string;
  eventDate: string; // ISO string
  endDate: string; // ISO string
  maxParticipants?: number;
  requiresChat: boolean;
}

