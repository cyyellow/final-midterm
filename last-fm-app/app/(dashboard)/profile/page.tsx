import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getUserPosts } from "@/lib/posts";
import { TrackGrid } from "@/components/track-grid";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  const user = await getUserById(session.user.id);
  const posts = await getUserPosts(session.user.id);

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
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.image || session.user.image || undefined} />
              <AvatarFallback className="text-2xl">
                {(user?.username || session.user.username || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">
                {user?.username ?? session.user.username ?? "Anonymous"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                @{user?.lastfmUsername ?? session.user.lastfmUsername}
              </p>
              <p className="mt-2 text-sm">
                {user?.bio ?? "Music is life 🎵"}
              </p>
            </div>
          </div>
        </CardHeader>
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


