 "use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music2, Send, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LastfmTrack } from "@/lib/lastfm";
import type { Playlist } from "@/lib/playlist";
import { AddTracksSection } from "./add-tracks-section";
import { CreatePostDialog } from "./create-post-dialog";
import { FriendsWidget } from "./friends-widget";
import type { FriendStatus } from "./right-status";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";

interface RightSidebarContentProps {
  nowPlaying: LastfmTrack | null;
  recentTracks: LastfmTrack[];
  friendStatuses: FriendStatus[];
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
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [selectedTrack, setSelectedTrack] = useState<LastfmTrack | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<LastfmTrack | null>(initialNowPlaying);
  const [recentTracks, setRecentTracks] = useState<LastfmTrack[]>(initialRecentTracks);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playlistMatch = pathname.match(/^\/playlists\/([^\/\?]+)/);
  const currentPlaylistId = playlistMatch?.[1] || null;
  const currentPlaylist = currentPlaylistId
    ? playlists.find((p) => (p as any)._id === currentPlaylistId)
    : null;
  const isPlaylistOwner = !!currentPlaylist;

  const getBestImage = (images?: Array<{ size: string; "#text": string }>) => {
    if (!images || images.length === 0) return undefined;
    const img =
      images.find((i) => i.size === "extralarge")?.["#text"] ||
      images.find((i) => i.size === "large")?.["#text"] ||
      images.find((i) => i.size === "medium")?.["#text"] ||
      images.find((i) => i.size === "small")?.["#text"] ||
      images[0]?.["#text"];
    return img && img.trim() !== "" ? img : undefined;
  };

  const handleAddTrackToSidebarPlaylist = async (track: LastfmTrack) => {
    if (!currentPlaylistId || !isPlaylistOwner) return;

    try {
      const newTrack = {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album?.["#text"],
        image: getBestImage(track.image),
        url: track.url || "#",
      };

      const res = await fetch(`/api/playlists/${currentPlaylistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrack),
      });

      if (res.ok) {
        // Notify playlist page to update immediately
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("playlist-track-added", {
              detail: {
                playlistId: currentPlaylistId,
                track: { ...newTrack, addedAt: new Date().toISOString() },
              },
            })
          );
        }

        toast({ title: "Added to playlist" });
        router.refresh();
      } else {
        toast({ title: "Failed to add track", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to add track", variant: "destructive" });
    }
  };

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
    fetchNowPlaying().then(() => {
      // Check if user is currently listening from the fetch result
      fetch(`/api/lastfm/recent-tracks?username=${encodeURIComponent(username)}`)
        .then((res) => res.json())
        .then((data) => {
          const tracks = data.tracks || [];
          const currentTrack = tracks[0];
          const isNowPlaying = currentTrack?.["@attr"]?.nowplaying === "true";
          
          // Start polling only if user is currently listening
          if (isNowPlaying) {
            pollingIntervalRef.current = setInterval(() => {
              fetchNowPlaying().then(() => {
                // After fetch, check if still listening and stop polling if not
                fetch(`/api/lastfm/recent-tracks?username=${encodeURIComponent(username)}`)
                  .then((res) => res.json())
                  .then((data) => {
                    const tracks = data.tracks || [];
                    const currentTrack = tracks[0];
                    const isNowPlaying = currentTrack?.["@attr"]?.nowplaying === "true";
                    // Stop polling if user is not listening
                    if (!isNowPlaying && pollingIntervalRef.current) {
                      clearInterval(pollingIntervalRef.current);
                      pollingIntervalRef.current = null;
                    }
                  });
              });
            }, 30000);
          }
        });
    });

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

  if (currentPlaylistId && isPlaylistOwner && username) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <h2 className="mb-4 text-lg font-semibold">Add Songs</h2>
        <Card className="flex-shrink-0">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide">
              Add Tracks to Playlist
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <AddTracksSection
              username={username}
              onAdd={handleAddTrackToSidebarPlaylist}
              autoLoadRecent={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden p-4 lg:p-0">
      <h2 className="mb-4 text-lg font-semibold hidden lg:block">Your Music</h2>

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

      {/* Listening History - Fixed height for 5 items, scrollable for more */}
      <Card className="mb-4 flex flex-col">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide">Listening History</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <ScrollArea className="h-[200px]">
            <div className="px-2 pr-1 space-y-0.5">
              <HistoryTracksList 
                tracks={recentTracks
                  .filter((track) => track["@attr"]?.nowplaying !== "true")
                  .slice(0, 50)}
                playlists={playlists}
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Friends Widget */}
      <div className="mb-4">
        <FriendsWidget friendStatuses={friendStatuses} />
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

function HistoryTracksList({ tracks, playlists }: { tracks: LastfmTrack[]; playlists: Playlist[] }) {
  const { data: session } = useSession();
  const [selectedTrack, setSelectedTrack] = useState<LastfmTrack | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePostClick = (track: LastfmTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setShowCreatePost(true);
  };

  const handleAddToPlaylist = async (track: LastfmTrack, playlistId: string) => {
    if (isAddingToPlaylist) return;
    
    setIsAddingToPlaylist(playlistId);
    try {
      const getBestImage = (images?: Array<{ size: string; "#text": string }>) => {
        if (!images || images.length === 0) return undefined;
        const img =
          images.find((i) => i.size === "extralarge")?.["#text"] ||
          images.find((i) => i.size === "large")?.["#text"] ||
          images.find((i) => i.size === "medium")?.["#text"] ||
          images.find((i) => i.size === "small")?.["#text"] ||
          images[0]?.["#text"];
        return img && img.trim() !== "" ? img : undefined;
      };

      const newTrack = {
        name: track.name,
        artist: track.artist?.["#text"] ?? "Unknown Artist",
        album: track.album?.["#text"],
        image: getBestImage(track.image),
        url: track.url || "#",
      };

      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrack),
      });

      if (res.ok) {
        toast({ title: "Added to playlist" });
      } else {
        const error = await res.json();
        if (error.error?.includes("duplicate") || error.error?.includes("already")) {
          toast({ title: "Track already in playlist", variant: "destructive" });
        } else {
          toast({ title: "Failed to add track", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Failed to add track", variant: "destructive" });
    } finally {
      setIsAddingToPlaylist(null);
    }
  };

  return (
    <>
      {tracks.map((track, index) => {
        const isNowPlaying = track["@attr"]?.nowplaying === "true";
        return (
          <div
            key={`${track.name}-${index}`}
            className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
          >
            <HistoryTrackImage track={track} />
            <div className="min-w-0 flex-1 pr-1">
              <Link
                href={track.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-xs font-medium text-foreground hover:underline"
              >
                {track.name}
              </Link>
              <div className="flex items-center gap-1.5">
                <p className="flex-1 truncate text-[11px] text-muted-foreground">
                  {track.artist?.["#text"] ?? "Unknown Artist"}
                </p>
                <span className="flex-shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                  {isNowPlaying ? "Now" : getRelativeTime(track.date?.uts)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => handlePostClick(track, e)}
                title="Post this track"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
              {playlists && playlists.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="Add to playlist"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                    {playlists.map((playlist) => (
                      <DropdownMenuItem
                        key={playlist._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(track, playlist._id);
                        }}
                        disabled={isAddingToPlaylist === playlist._id}
                      >
                        {isAddingToPlaylist === playlist._id ? (
                          <span className="text-xs">Adding...</span>
                        ) : (
                          playlist.name
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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

