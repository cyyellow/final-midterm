import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { SocietyClient } from "./society-client";

export const dynamic = "force-dynamic";

export default async function SocietyPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  // Fetch initial posts (friends view by default)
  const initialPosts = await getPosts(100, session.user.id, "friends");

  return <SocietyClient initialPosts={initialPosts} userId={session.user.id} />;
}
