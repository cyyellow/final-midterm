import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getFriends } from "@/lib/friends";
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

  // Get friends
  const friends = await getFriends(session.user.id);

  return (
    <ChatPageClient 
      events={[]} 
      friends={friends} 
      currentUserId={session.user.id} 
    />
  );
}

