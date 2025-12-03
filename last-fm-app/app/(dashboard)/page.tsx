import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getTopArtists } from "@/lib/lastfm";
import { getHomepagePlaylist } from "@/lib/playlist";
import { TopArtistsCard } from "@/components/top-artists-card";
import { MyPlaylistCard } from "@/components/my-playlist-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  // Fetch data in parallel, with error handling for Last.fm API
  const [topArtistsResult, homepagePlaylist] = await Promise.allSettled([
    getTopArtists(session.user.lastfmUsername).catch(() => []),
    getHomepagePlaylist(session.user.id),
  ]);

  const topArtists = topArtistsResult.status === "fulfilled" ? topArtistsResult.value : [];
  const playlistData = homepagePlaylist.status === "fulfilled" ? homepagePlaylist.value : null;

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="mx-auto w-full max-w-4xl p-6 space-y-8">
        
        {/* Top Section: Artists & Playlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TopArtistsCard artists={topArtists} />
          <MyPlaylistCard 
            initialPlaylist={playlistData} 
            username={session.user.lastfmUsername} 
          />
        </div>
      </div>
    </div>
  );
}
