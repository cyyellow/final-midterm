import { Logo } from "@/components/logo";
import { LeftNav } from "@/components/left-nav";
import { RightSidebarContent } from "@/components/right-sidebar-content";
import { getFriendStatuses } from "@/lib/friends";
import { getAuthSession } from "@/lib/auth";
import { getNowPlaying, getRecentTracks } from "@/lib/lastfm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const statuses = session?.user?.id
    ? await getFriendStatuses(session.user.id)
    : [];

  const username = session?.user?.lastfmUsername;
  const [nowPlaying, recentTracks] = username
    ? await Promise.all([
        getNowPlaying(username),
        getRecentTracks(username, 15),
      ])
    : [null, []];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Logo className="-ml-2 mb-6" />
        <LeftNav />
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">{children}</main>
      <aside className="hidden w-80 border-l border-sidebar-border bg-sidebar/60 p-4 xl:block">
        <RightSidebarContent
          nowPlaying={nowPlaying}
          recentTracks={recentTracks}
          friendStatuses={statuses}
        />
      </aside>
    </div>
  );
}


