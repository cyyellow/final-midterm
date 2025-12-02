import { redirect } from "next/navigation";
import { Disc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getUserPosts } from "@/lib/posts";
import { TrackGrid } from "@/components/track-grid";
import { Music } from "lucide-react";
import { TrackImage } from "@/components/track-image";
import { getMusicLink } from "@/lib/music-links";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuthSession();
  const { id } = await params;

  if (!session?.user) {
    redirect("/signin");
  }

  // If viewing own profile, redirect to /profile
  if (id === session.user.id) {
    redirect("/profile");
  }

  const user = await getUserById(id);
  
  if (!user) {
    redirect("/");
  }

  const posts = await getUserPosts(id);

  // Group posts by week
  const postsByWeek = posts.reduce((acc, post) => {
    const date = new Date(post.createdAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  const weeks = Object.entries(postsByWeek).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
      {/* Profile Header */}
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {(user?.displayName || user?.username || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {user?.displayName || user?.username || "Anonymous"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  @{user?.lastfmUsername || user?.username}
                </p>
                {user?.bio && (
                  <p className="mt-2 text-sm max-w-md">
                    {user.bio}
                  </p>
                )}
                {!user?.bio && (
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    Music is life 🎵
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {user?.favoriteTracks && user.favoriteTracks.length > 0 && (
          <CardContent className="pt-0 pb-6">
            <div className="mt-4">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Disc className="h-4 w-4" />
                Favorite Tracks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {user.favoriteTracks.map((track, i) => (
                  <a
                    key={i}
                    href={getMusicLink(track)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors border border-transparent hover:border-border"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5">
                      <TrackImage src={track.image} alt={track.name} fill sizes="40px" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Posts by Week */}
      <div className="space-y-8">
        <h2 className="text-xl font-semibold">Music Moments</h2>
        
        {weeks.length > 0 ? (
          weeks.map(([weekKey, weekPosts]) => {
            const weekDate = new Date(weekKey);
            const weekLabel = `Week of ${weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
            
            return (
              <div key={weekKey} className="space-y-3">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {weekLabel}
                </h3>
                <TrackGrid posts={weekPosts} />
              </div>
            );
          })
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">
                No posts yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

