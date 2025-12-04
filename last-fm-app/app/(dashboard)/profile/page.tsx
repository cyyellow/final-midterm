import { redirect } from "next/navigation";
import { Disc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getUserPosts } from "@/lib/posts";
import { TrackGrid } from "@/components/track-grid";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { TrackImage } from "@/components/track-image";
import { TrackLink } from "@/components/track-link";
import { Play } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  const user = await getUserById(session.user.id);
  const posts = await getUserPosts(session.user.id, 100, session.user.id);

  // Group posts by week (Monday to Sunday)
  const postsByWeek = posts.reduce((acc, post) => {
    const date = new Date(post.createdAt);
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay();
    // Calculate days to subtract to get to Monday (1)
    // If Sunday (0), go back 6 days. Otherwise, go back (dayOfWeek - 1) days
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - daysToSubtract);
    // Set to start of day to avoid timezone issues
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split("T")[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  // Filter out empty weeks and sort
  const weeks = Object.entries(postsByWeek)
    .filter(([_, weekPosts]) => weekPosts.length > 0)
    .sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-4 sm:p-6 lg:px-10 min-h-0 overflow-y-auto">
      {/* Profile Header */}
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={user?.image || session.user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {(user?.displayName || user?.username || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {user?.displayName || user?.username || "Anonymous"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  @{user?.username || "user"}
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
            
            {user && (
              <EditProfileDialog 
                user={user} 
                currentUserLastfmUsername={session.user.lastfmUsername!} 
              />
            )}
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
                  <TrackLink
                    key={i}
                    track={{
                      name: track.name,
                      artist: track.artist,
                      url: track.url,
                    }}
                    className="group flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors border border-transparent hover:border-border"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="absolute inset-0">
                        <TrackImage src={track.image} alt={track.name} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                  </TrackLink>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Posts by Week */}
      <div className="space-y-8">
        <h2 className="text-xl font-semibold">Your Music Moments</h2>
        
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
                No posts yet. Start sharing your music moments!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


