import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { FeedPost } from "@/components/feed-post";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SocietyPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  // Fetch posts
  const posts = await getPosts(100, session.user.id);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10 min-h-0 overflow-hidden">
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto">
        {posts.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            {posts.map((post) => (
              <FeedPost key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center bg-card/50">
            <div className="flex justify-center mb-4">
              <Users className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No posts yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Connect with friends or share your own music moments to see them here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
