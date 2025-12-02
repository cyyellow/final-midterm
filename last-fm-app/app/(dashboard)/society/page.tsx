import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { getUserPlaylists } from "@/lib/playlist";
import { FeedPost } from "@/components/feed-post";
import { SharePlaylistButton } from "@/components/share-playlist-button";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SocietyPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  // Fetch posts and playlists
  const [posts, playlists] = await Promise.all([
    getPosts(100, session.user.id),
    getUserPlaylists(session.user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="mx-auto w-full max-w-4xl p-6 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Society</h1>
              <p className="text-muted-foreground text-sm">
                Updates from your friends and music circle
              </p>
            </div>
          </div>
          {playlists.length > 0 && (
            <SharePlaylistButton playlists={playlists} />
          )}
        </div>

        {posts.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
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
