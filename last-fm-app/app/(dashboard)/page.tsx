import { redirect } from "next/navigation";

import { ListeningHistoryList } from "@/components/history-list";
import { NowPlayingCard } from "@/components/now-playing-card";
import { WeeklyTopArtists } from "@/components/top-artists";
import { getAuthSession } from "@/lib/auth";
import {
  getNowPlaying,
  getRecentTracks,
  getWeeklyTopArtists,
} from "@/lib/lastfm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  const username = session.user.lastfmUsername;

  const [nowPlaying, recentTracks, weeklyArtists] = await Promise.all([
    getNowPlaying(username),
    getRecentTracks(username, 25),
    getWeeklyTopArtists(username),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <NowPlayingCard track={nowPlaying} />
          <ListeningHistoryList tracks={recentTracks} />
        </div>
        <WeeklyTopArtists artists={weeklyArtists.slice(0, 10)} />
      </section>
    </div>
  );
}


