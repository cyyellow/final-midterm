import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Post } from "@/types/post";
import { Music, Globe, Lock, ListMusic } from "lucide-react";

interface FeedPostProps {
  post: Post;
}

export function FeedPost({ post }: FeedPostProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.userImage} />
          <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{post.username}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            {post.isPublic ? (
              <Globe className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {post.playlistId ? (
        <Link href={`/playlists/${post.playlistId}`}>
          <div className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
              {post.playlistImage ? (
                <img
                  src={post.playlistImage}
                  alt={post.playlistName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ListMusic className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Playlist: {post.playlistName}</p>
              <p className="text-sm text-muted-foreground">
                {post.playlistTrackCount || 0} tracks
              </p>
            </div>
          </div>
        </Link>
      ) : post.track ? (
        <div className="flex gap-3">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
            {post.track.image ? (
              <img
                src={post.track.image}
                alt={post.track.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{post.track.name}</p>
            <p className="text-sm text-muted-foreground">{post.track.artist}</p>
            {post.track.album && (
              <p className="text-xs text-muted-foreground">{post.track.album}</p>
            )}
          </div>
        </div>
      ) : null}

      {post.thoughts && (
        <p className="mt-3 text-sm leading-relaxed">{post.thoughts}</p>
      )}
    </div>
  );
}

