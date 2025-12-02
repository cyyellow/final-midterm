import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getFriends } from "@/lib/friends";
import { FriendsPageClient } from "@/components/friends-page-client";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  const friends = await getFriends(session.user.id);

  return <FriendsPageClient initialFriends={friends} />;
}

