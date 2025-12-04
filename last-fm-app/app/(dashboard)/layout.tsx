import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { LeftNav } from "@/components/left-nav";
import { RightSidebarContent } from "@/components/right-sidebar-content";
import { ResponsiveLayoutWrapper } from "@/components/responsive-layout-wrapper";
import { getFriendStatuses } from "@/lib/friends";
import { getAuthSession } from "@/lib/auth";
import { getNowPlaying, getRecentTracks } from "@/lib/lastfm";
import { getUserPlaylists } from "@/lib/playlist";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  
  // Redirect to onboarding if user is authenticated but hasn't completed onboarding
  if (session?.user && !session.user.username) {
    redirect("/onboarding");
  }
  
  const statuses = session?.user?.id
    ? await getFriendStatuses(session.user.id)
    : [];

  const playlists = session?.user?.id
    ? await getUserPlaylists(session.user.id)
    : [];

  const username = session?.user?.lastfmUsername;
  const [nowPlaying, recentTracks] = username
    ? await Promise.all([
        getNowPlaying(username),
        getRecentTracks(username, 5),
      ])
    : [null, []];

  return (
    <ResponsiveLayoutWrapper
      nowPlaying={nowPlaying}
      recentTracks={recentTracks}
      friendStatuses={statuses}
      username={username || ""}
      userDisplayName={session?.user?.displayName || session?.user?.username || session?.user?.lastfmUsername || null}
      userImage={session?.user?.image || null}
    >
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
          <Logo className="-ml-2 mb-6" />
          <LeftNav />
        </aside>
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden pb-20 pt-14 lg:pb-0 lg:pt-0">
          <div className="min-h-full w-full max-w-full">
            {children}
          </div>
        </main>
        <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-l border-sidebar-border bg-sidebar/60 p-4 xl:block">
          <RightSidebarContent
            nowPlaying={nowPlaying}
            recentTracks={recentTracks}
            friendStatuses={statuses}
            playlists={playlists}
            username={username || ""}
          />
        </aside>
      </div>
    </ResponsiveLayoutWrapper>
  );
}


