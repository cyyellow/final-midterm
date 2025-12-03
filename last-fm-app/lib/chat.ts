import { clientPromise } from "./mongodb";
import { ObjectId } from "mongodb";

export type ChatMessage = {
  _id: string;
  eventId: string; // Reused for chat ID in private chats
  userId: string;
  username: string;
  userImage?: string | null;
  message: string;
  createdAt: Date | string;
  playlistPreview?: {
    playlistId: string;
    playlistName: string;
    playlistImage?: string;
    trackCount: number;
  };
};

export async function getChatMessagesCollection() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection<ChatMessage>("chatMessages");
}

function getPrivateChatId(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();
  return `private-${sortedIds[0]}-${sortedIds[1]}`;
}

export async function sendPrivateMessage(
  senderId: string,
  senderUsername: string,
  senderImage: string | null,
  recipientId: string,
  message: string,
  playlistPreview?: {
    playlistId: string;
    playlistName: string;
    playlistImage?: string;
    trackCount: number;
  }
): Promise<ChatMessage> {
  const messagesCollection = await getChatMessagesCollection();
  const chatId = getPrivateChatId(senderId, recipientId);
  const now = new Date();

  const chatMessage: Omit<ChatMessage, "_id"> = {
    eventId: chatId, // Reuse eventId field for chat ID
    userId: senderId,
    username: senderUsername,
    userImage: senderImage || undefined,
    message: message.trim(),
    createdAt: now,
    playlistPreview,
  };

  const result = await messagesCollection.insertOne(chatMessage as any);

  return {
    ...chatMessage,
    _id: result.insertedId.toString(),
  };
}

export async function getPrivateMessages(
  userId1: string,
  userId2: string,
  limit = 100
): Promise<ChatMessage[]> {
  const messagesCollection = await getChatMessagesCollection();
  const chatId = getPrivateChatId(userId1, userId2);

  const messages = await messagesCollection
    .find({ eventId: chatId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  return messages.map((msg) => ({
    ...msg,
    _id: msg._id.toString(),
    createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
  })) as ChatMessage[];
}

