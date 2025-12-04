import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getTopArtists, getUserListeningStats } from "@/lib/lastfm";
import { getHomepagePlaylist, getUserPlaylists } from "@/lib/playlist";
import { TopArtistsCard } from "@/components/top-artists-card";
import { MyPlaylistCard } from "@/components/my-playlist-card";
import { RecapStatsCard } from "@/components/recap-stats-card";

// Use revalidate instead of force-dynamic to allow caching
export const revalidate = 300; // Revalidate every 5 minutes

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  // Get stats for the current year
  const currentYear = new Date().getFullYear();
  const yearStart = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);
  const yearEnd = Math.floor(new Date(currentYear, 11, 31, 23, 59, 59).getTime() / 1000);

  // Fetch data in parallel, with error handling for Last.fm API
  // Using allSettled to ensure we get results even if some fail
  const [topArtistsResult, homepagePlaylist, listeningStatsResult, allPlaylistsResult] = await Promise.allSettled([
    getTopArtists(session.user.lastfmUsername).catch((error) => {
      console.error("Failed to fetch top artists:", error);
      return [];
    }),
    getHomepagePlaylist(session.user.id),
    getUserListeningStats(session.user.lastfmUsername, yearStart, yearEnd).catch((error) => {
      console.error("Failed to fetch listening stats:", error);
      return {
        tracks: [],
        totalScrobbles: 0,
        totalPages: 0,
      };
    }),
    getUserPlaylists(session.user.id),
  ]);

  // Extract results with fallbacks - this ensures data persists even if API calls fail
  const topArtists = topArtistsResult.status === "fulfilled" ? topArtistsResult.value : [];
  const playlistData = homepagePlaylist.status === "fulfilled" ? homepagePlaylist.value : null;
  const listeningStats = listeningStatsResult.status === "fulfilled" 
    ? listeningStatsResult.value 
    : {
        tracks: [],
        totalScrobbles: 0,
        totalPages: 0,
      };
  const allPlaylists = allPlaylistsResult.status === "fulfilled" ? allPlaylistsResult.value : [];

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10 min-h-0 overflow-hidden">
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto">
        
        {/* Top Section: Artists & Playlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TopArtistsCard artists={topArtists} />
          <MyPlaylistCard 
            initialPlaylist={playlistData} 
            allPlaylists={allPlaylists}
            username={session.user.lastfmUsername} 
          />
        </div>

        {/* Recap Stats Section */}
        {listeningStats.totalScrobbles > 0 && (
          <RecapStatsCard listeningStats={listeningStats} year={currentYear} />
          )}
      </div>
    </div>
  );
}
