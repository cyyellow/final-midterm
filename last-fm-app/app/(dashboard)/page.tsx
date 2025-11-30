import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  const posts = await getPosts(100, session.user.id);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="mx-auto w-full max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Music Feed</h1>
        
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{post.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {post.track.image && (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={post.track.image}
                        alt={post.track.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{post.track.name}</p>
                    <p className="text-sm text-muted-foreground">{post.track.artist}</p>
                    {post.track.album && (
                      <p className="text-xs text-muted-foreground">{post.track.album}</p>
                    )}
                  </div>
                </div>

                {post.thoughts && (
                  <p className="mt-3 text-sm leading-relaxed">{post.thoughts}</p>
                )}
              </div>
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
  );
}


