"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Music2, Disc } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LastfmTrack } from "@/lib/lastfm";
import { InlinePostForm } from "./inline-post-form";
import { CreatePostDialog } from "./create-post-dialog";

interface RightSidebarContentProps {
  nowPlaying: LastfmTrack | null;
  recentTracks: LastfmTrack[];
  friendStatuses: Array<{
    id: string;
    username: string;
    image?: string;
    nowPlaying?: {
      track: string;
      artist: string;
    };
  }>;
}

function getRelativeTime(uts?: string) {
  if (!uts) return "Just now";
  const playedAt = Number(uts) * 1000;
  const diff = Date.now() - playedAt;
  if (diff < 60_000) return "Just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function RightSidebarContent({
  nowPlaying,
  recentTracks,
  friendStatuses,
}: RightSidebarContentProps) {
  return (
    <div className="flex h-screen flex-col">
      <h2 className="mb-4 text-lg font-semibold">Your Music</h2>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-3">
          {/* Now Playing */}
          {nowPlaying && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-center gap-2">
                  <Music2 className="h-3.5 w-3.5 animate-pulse text-primary" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Now Playing
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="flex gap-2">
                  {nowPlaying.image && nowPlaying.image.length > 0 && (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md shadow-md">
                      <Image
                        src={
                          nowPlaying.image.find((img) => img.size === "large")?.["#text"] ||
                          nowPlaying.image[0]["#text"]
                        }
                        alt={nowPlaying.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-xs font-semibold leading-tight">{nowPlaying.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{nowPlaying.artist["#text"]}</p>
                    {nowPlaying.album?.["#text"] && (
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                        {nowPlaying.album["#text"]}
                      </p>
                    )}
                  </div>
                </div>

                <InlinePostForm track={nowPlaying} />
              </CardContent>
            </Card>
          )}

          {/* Listening History */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide">Listening History</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <div className="max-h-[500px] space-y-0.5 overflow-y-auto px-2">
                <HistoryTracksList tracks={recentTracks.slice(0, 20)} />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Friend Activity */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Friend Activity</h3>
            {friendStatuses.length > 0 ? (
              <div className="space-y-3">
                {friendStatuses.map((friend) => (
                  <div key={friend.id} className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.image} alt={friend.username} />
                      <AvatarFallback>{friend.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{friend.username}</p>
                      {friend.nowPlaying ? (
                        <div className="mt-0.5">
                          <Badge variant="secondary" className="text-xs">
                            Listening
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {friend.nowPlaying.track} • {friend.nowPlaying.artist}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Offline</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No friends online</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function HistoryTracksList({ tracks }: { tracks: LastfmTrack[] }) {
  const [selectedTrack, setSelectedTrack] = useState<LastfmTrack | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleRecordClick = (track: LastfmTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setShowCreatePost(true);
  };

  return (
    <>
      {tracks.map((track, index) => {
        const isNowPlaying = track["@attr"]?.nowplaying === "true";
        return (
          <div
            key={`${track.name}-${index}`}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
          >
            <button
              onClick={(e) => handleRecordClick(track, e)}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
              title="Record a moment"
            >
              <Disc className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <Link
                href={track.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-xs font-medium text-foreground hover:underline"
              >
                {track.name}
              </Link>
              <div className="flex items-center gap-2">
                <p className="flex-1 truncate text-[11px] text-muted-foreground">
                  {track.artist?.["#text"] ?? "Unknown Artist"}
                </p>
                <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                  {isNowPlaying ? "Now" : getRelativeTime(track.date?.uts)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        track={selectedTrack}
      />
    </>
  );
}

