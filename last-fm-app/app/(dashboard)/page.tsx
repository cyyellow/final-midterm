import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { getTopArtists } from "@/lib/lastfm";
import { getUserPlaylist } from "@/lib/playlist";
import { TopArtistsCard } from "@/components/top-artists-card";
import { MyPlaylistCard } from "@/components/my-playlist-card";
import { FeedPost } from "@/components/feed-post";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  // Fetch data in parallel
  const [posts, topArtists, playlist] = await Promise.all([
    getPosts(100, session.user.id),
    getTopArtists(session.user.lastfmUsername),
    getUserPlaylist(session.user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="mx-auto w-full max-w-4xl p-6 space-y-8">
        
        {/* Top Section: Artists & Playlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TopArtistsCard artists={topArtists} />
          <MyPlaylistCard 
            initialPlaylist={playlist} 
            username={session.user.lastfmUsername} 
          />
        </div>

        {/* Bottom Section: Feed */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Music Feed</h2>
          
          {posts.length > 0 ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              {posts.map((post) => (
                <FeedPost key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                No posts yet. Start sharing your music moments!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
