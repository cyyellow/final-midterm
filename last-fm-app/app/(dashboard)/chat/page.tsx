import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getEvents } from "@/lib/events";
import { ChatPageClient } from "./chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  // Get all events where the user is a participant or creator
  const allEvents = await getEvents();
  const userEvents = allEvents.filter(event => 
    event.creatorId === session.user.id || 
    event.participants.some(p => p.userId === session.user.id)
  );

  // Filter for events that have chat enabled
  const chatEvents = userEvents.filter(event => event.requiresChat && event.chatRoomId);

  return <ChatPageClient events={chatEvents} currentUserId={session.user.id} />;
}

