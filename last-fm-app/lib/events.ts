import { ObjectId } from "mongodb";
import { clientPromise } from "./mongodb";
import type { Event, EventParticipant, ChatMessage, CreateEventInput } from "@/types/event";

export async function getEventsCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection<Event>("events");
}

export async function getChatMessagesCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection<ChatMessage>("chatMessages");
}

/**
 * Create a new event
 */
export async function createEvent(
  userId: string,
  username: string,
  userImage: string | null,
  input: CreateEventInput
): Promise<Event> {
  const collection = await getEventsCollection();
  const now = new Date();
  const eventDate = new Date(input.eventDate);
  const endDate = new Date(input.endDate);

  // Validate dates
  if (eventDate < now) {
    throw new Error("Event date cannot be in the past");
  }
  if (endDate <= eventDate) {
    throw new Error("End date must be after event date");
  }

  const event: Omit<Event, "_id"> = {
    creatorId: userId,
    creatorUsername: username,
    creatorImage: userImage || undefined,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location?.trim(),
    eventDate,
    endDate,
    maxParticipants: input.maxParticipants && input.maxParticipants > 0 ? input.maxParticipants : undefined,
    requiresChat: input.requiresChat,
    chatRoomId: input.requiresChat ? new ObjectId().toString() : undefined,
    participants: [],
    status: "upcoming",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(event as any);
  
  return {
    ...event,
    _id: result.insertedId.toString(),
  };
}

/**
 * Get all active/upcoming events
 */
export async function getEvents(limit = 50): Promise<Event[]> {
  const collection = await getEventsCollection();
  const now = new Date();

  const events = await collection
    .find({
      status: { $in: ["upcoming", "active"] },
      endDate: { $gt: now },
    })
    .sort({ eventDate: 1 })
    .limit(limit)
    .toArray();

  return events.map((event) => ({
    ...event,
    _id: event._id.toString(),
    eventDate: event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate),
    endDate: event.endDate instanceof Date ? event.endDate : new Date(event.endDate),
    createdAt: event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt),
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt : new Date(event.updatedAt),
  })) as Event[];
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const collection = await getEventsCollection();
  
  if (!ObjectId.isValid(eventId)) {
    return null;
  }

  const event = await collection.findOne({ _id: new ObjectId(eventId) });
  
  if (!event) {
    return null;
  }

  return {
    ...event,
    _id: event._id.toString(),
    eventDate: event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate),
    endDate: event.endDate instanceof Date ? event.endDate : new Date(event.endDate),
    createdAt: event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt),
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt : new Date(event.updatedAt),
  } as Event;
}

/**
 * Join an event
 */
export async function joinEvent(
  eventId: string,
  userId: string,
  username: string,
  userImage: string | null
): Promise<{ success: boolean; message: string }> {
  const collection = await getEventsCollection();
  
  if (!ObjectId.isValid(eventId)) {
    return { success: false, message: "Invalid event ID" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, message: "Event not found" };
  }

  // Check if event is still active
  const now = new Date();
  if (event.endDate < now || event.status === "ended" || event.status === "cancelled") {
    return { success: false, message: "This event has ended or been cancelled" };
  }

  // Check if already joined
  const alreadyJoined = event.participants.some((p) => p.userId === userId);
  if (alreadyJoined) {
    return { success: false, message: "You have already joined this event" };
  }

  // Check if creator
  if (event.creatorId === userId) {
    return { success: false, message: "You are the creator of this event" };
  }

  // Check max participants
  if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
    return { success: false, message: "This event is full" };
  }

  const participant: EventParticipant = {
    userId,
    username,
    userImage: userImage || undefined,
    joinedAt: new Date(),
  };

  await collection.updateOne(
    { _id: new ObjectId(eventId) },
    {
      $push: { participants: participant },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true, message: "Successfully joined the event!" };
}

/**
 * Leave an event
 */
export async function leaveEvent(eventId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const collection = await getEventsCollection();
  
  if (!ObjectId.isValid(eventId)) {
    return { success: false, message: "Invalid event ID" };
  }

  await collection.updateOne(
    { _id: new ObjectId(eventId) },
    {
      $pull: { participants: { userId } },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true, message: "Left the event" };
}

/**
 * Update event status based on dates (called periodically)
 */
export async function updateEventStatuses(): Promise<void> {
  const collection = await getEventsCollection();
  const now = new Date();

  // Mark events as active if event date has passed but not ended
  await collection.updateMany(
    {
      status: "upcoming",
      eventDate: { $lte: now },
      endDate: { $gt: now },
    },
    {
      $set: { status: "active", updatedAt: now },
    }
  );

  // Mark events as ended if end date has passed
  await collection.updateMany(
    {
      status: { $in: ["upcoming", "active"] },
      endDate: { $lte: now },
    },
    {
      $set: { status: "ended", updatedAt: now },
    }
  );
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  eventId: string,
  userId: string,
  username: string,
  userImage: string | null,
  message: string
): Promise<ChatMessage> {
  const messagesCollection = await getChatMessagesCollection();
  
  // Verify event exists and user is a participant
  const event = await getEventById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  if (!event.requiresChat || !event.chatRoomId) {
    throw new Error("This event does not have a chat room");
  }

  const now = new Date();
  if (event.endDate < now || event.status === "ended") {
    throw new Error("This event has ended");
  }

  // Check if user is creator or participant
  const isCreator = event.creatorId === userId;
  const isParticipant = event.participants.some((p) => p.userId === userId);
  
  if (!isCreator && !isParticipant) {
    throw new Error("You must join the event to send messages");
  }

  const chatMessage: Omit<ChatMessage, "_id"> = {
    eventId,
    userId,
    username,
    userImage: userImage || undefined,
    message: message.trim(),
    createdAt: now,
  };

  const result = await messagesCollection.insertOne(chatMessage as any);

  return {
    ...chatMessage,
    _id: result.insertedId.toString(),
  };
}

/**
 * Get chat messages for an event
 */
export async function getChatMessages(eventId: string, limit = 100): Promise<ChatMessage[]> {
  const messagesCollection = await getChatMessagesCollection();

  const messages = await messagesCollection
    .find({ eventId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  return messages.map((msg) => ({
    ...msg,
    _id: msg._id.toString(),
    createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
  })) as ChatMessage[];
}

/**
 * Delete expired chat messages (cleanup)
 */
export async function cleanupExpiredChats(): Promise<void> {
  const eventsCollection = await getEventsCollection();
  const messagesCollection = await getChatMessagesCollection();

  // Find ended events
  const endedEvents = await eventsCollection
    .find({ status: "ended" })
    .project({ _id: 1 })
    .toArray();

  const endedEventIds = endedEvents.map((e) => e._id.toString());

  if (endedEventIds.length > 0) {
    // Delete chat messages for ended events
    await messagesCollection.deleteMany({
      eventId: { $in: endedEventIds },
    });
  }
}

