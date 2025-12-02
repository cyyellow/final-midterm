"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music2, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LastfmTrack } from "@/lib/lastfm";
import type { Playlist } from "@/lib/playlist";
import { CreatePostDialog } from "./create-post-dialog";
import { PlaylistsWidget } from "./playlists-widget";

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
  playlists: Playlist[];
  username: string;
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
  nowPlaying: initialNowPlaying,
  recentTracks: initialRecentTracks,
  friendStatuses,
  playlists,
  username,
}: RightSidebarContentProps) {
  const [selectedTrack, setSelectedTrack] = useState<LastfmTrack | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<LastfmTrack | null>(initialNowPlaying);
  const [recentTracks, setRecentTracks] = useState<LastfmTrack[]>(initialRecentTracks);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(`/api/lastfm/recent-tracks?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          const tracks = data.tracks || [];
          const currentTrack = tracks[0];
          const isNowPlaying = currentTrack?.["@attr"]?.nowplaying === "true";
          
          setNowPlaying(isNowPlaying ? currentTrack : null);
          setRecentTracks(tracks);
        }
      } catch (error) {
        console.error("Failed to fetch now playing:", error);
      }
    };

    // Initial fetch after component mounts
    fetchNowPlaying();

    // Poll for updates every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchNowPlaying();
    }, 30000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNowPlaying();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [username]);

  const handleRecordClick = (track: LastfmTrack) => {
    setSelectedTrack(track);
    setShowCreatePost(true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <h2 className="mb-4 text-lg font-semibold">Your Music</h2>

      {/* Now Playing */}
      {nowPlaying && (
        <Card className="mb-4 flex-shrink-0 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music2 className="h-3.5 w-3.5 animate-pulse text-primary" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Now Playing
                </CardTitle>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => handleRecordClick(nowPlaying)}
                title="Record a moment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex gap-2">
              <NowPlayingImage track={nowPlaying} />
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
          </CardContent>
        </Card>
      )}

      {/* Listening History - Fixed height for 5 items */}
      <Card className="mb-4 flex flex-col">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide">Listening History</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="px-2 space-y-0.5">
            <HistoryTracksList 
              tracks={recentTracks
                .filter((track) => track["@attr"]?.nowplaying !== "true")
                .slice(0, 5)} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Playlists Widget */}
      <div className="mb-4">
        <PlaylistsWidget playlists={playlists} />
      </div>

      <Separator className="mb-4" />

      {/* Friend Activity - Fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col pb-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground flex-shrink-0">Friend Activity</h3>
        <ScrollArea className="flex-1">
          {friendStatuses.length > 0 ? (
            <div className="space-y-3 pr-3">
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
        </ScrollArea>
      </div>

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        track={selectedTrack}
      />
    </div>
  );
}

function HistoryTrackImage({ track }: { track: LastfmTrack }) {
  const [hasError, setHasError] = useState(false);
  
  const trackImage = track.image?.find((img) => img.size === "small")?.["#text"] ||
                     track.image?.find((img) => img.size === "medium")?.["#text"] ||
                     track.image?.[0]?.["#text"];
  
  const showImage = trackImage && trackImage.trim() !== "" && !hasError;
  
  return (
    <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-gradient-to-br from-primary/20 to-primary/5">
      {showImage ? (
        <Image
          src={trackImage}
          alt={track.name}
          fill
          className="object-cover"
          sizes="24px"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Music2 className="h-3 w-3 text-primary/60" />
        </div>
      )}
    </div>
  );
}

function NowPlayingImage({ track }: { track: LastfmTrack }) {
  const [hasError, setHasError] = useState(false);
  
  const imageUrl = track.image?.find((img) => img.size === "large")?.["#text"] ||
                   track.image?.find((img) => img.size === "medium")?.["#text"] ||
                   track.image?.[0]?.["#text"];
  
  const showImage = imageUrl && imageUrl.trim() !== "" && !hasError;
  
  return (
    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md shadow-md bg-gradient-to-br from-primary/20 to-primary/5">
      {showImage ? (
        <Image
          src={imageUrl}
          alt={track.name}
          fill
          className="object-cover"
          sizes="56px"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Music2 className="h-6 w-6 text-primary/60" />
        </div>
      )}
    </div>
  );
}

function HistoryTracksList({ tracks }: { tracks: LastfmTrack[] }) {
  const [selectedTrack, setSelectedTrack] = useState<LastfmTrack | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handlePostClick = (track: LastfmTrack, e: React.MouseEvent) => {
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
            <HistoryTrackImage track={track} />
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
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0 opacity-0 transition-all group-hover:opacity-100"
              onClick={(e) => handlePostClick(track, e)}
              title="Post this track"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
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

