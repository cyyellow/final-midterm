"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Plus, Trash2, Music, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTracksSection } from "@/components/add-tracks-section";
import type { Playlist, PlaylistTrack } from "@/lib/playlist";
import type { LastfmTrack } from "@/lib/lastfm";
import { useToast } from "@/components/ui/use-toast";

// Dynamically import Select to avoid SSR issues
const Select = dynamic(
  () => import("@/components/ui/select").then((mod) => mod.Select),
  { ssr: false }
);
const SelectContent = dynamic(
  () => import("@/components/ui/select").then((mod) => mod.SelectContent),
  { ssr: false }
);
const SelectItem = dynamic(
  () => import("@/components/ui/select").then((mod) => mod.SelectItem),
  { ssr: false }
);
const SelectTrigger = dynamic(
  () => import("@/components/ui/select").then((mod) => mod.SelectTrigger),
  { ssr: false }
);
const SelectValue = dynamic(
  () => import("@/components/ui/select").then((mod) => mod.SelectValue),
  { ssr: false }
);

type MyPlaylistCardProps = {
  initialPlaylist: Playlist | null;
  allPlaylists?: Playlist[];
  username: string; // Last.fm username for fetching recent tracks
};

export function MyPlaylistCard({ initialPlaylist, allPlaylists = [], username }: MyPlaylistCardProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(initialPlaylist);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure there is a playlist to add tracks into.
  // If user has no playlist yet, we create a default one on the fly.
  const ensurePlaylist = async (): Promise<Playlist | null> => {
    if (playlist) return playlist;

    try {
      setLoading(true);
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Favorites",
          description: "Songs you’ve added from Your Music.",
        }),
      });

      if (!res.ok) {
        toast({ title: "Failed to create playlist", variant: "destructive" });
        return null;
      }

      const data = await res.json();
      setPlaylist(data.playlist);
      return data.playlist as Playlist;
    } catch (error) {
      toast({ title: "Failed to create playlist", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrack = async (url: string) => {
    if (!playlist) return;

    try {
      const res = await fetch(`/api/playlists/${playlist._id}/tracks?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPlaylist((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tracks: prev.tracks.filter((t) => t.url !== url),
          };
        });
        toast({ title: "Removed from playlist" });
      }
    } catch (error) {
      toast({ title: "Failed to remove track", variant: "destructive" });
    }
  };

  const handleAddTrack = async (track: LastfmTrack) => {
    try {
      const targetPlaylist = await ensurePlaylist();
      if (!targetPlaylist) return;

      // Get the best available image (prefer large/extralarge, fallback to medium/small)
      const getBestImage = (images?: Array<{ size: string; "#text": string }>) => {
        if (!images || images.length === 0) return undefined;
        const img = images.find((i) => i.size === "extralarge")?.["#text"] ||
                   images.find((i) => i.size === "large")?.["#text"] ||
                   images.find((i) => i.size === "medium")?.["#text"] ||
                   images.find((i) => i.size === "small")?.["#text"] ||
                   images[0]?.["#text"];
        // Filter out empty strings
        return img && img.trim() !== "" ? img : undefined;
      };

      const newTrack = {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album?.["#text"],
        image: getBestImage(track.image),
        url: track.url || "#",
      };

      const res = await fetch(`/api/playlists/${targetPlaylist._id}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrack),
      });

      if (res.ok) {
        const addedTrack: PlaylistTrack = {
          ...newTrack,
          addedAt: new Date(),
        };

        setPlaylist((prev) => {
          const base = prev ?? targetPlaylist;
          // Avoid duplicates
          if (base.tracks.some((t) => t.url === newTrack.url)) return base;
          return {
            ...base,
            tracks: [addedTrack, ...base.tracks],
          };
        });
        
        toast({ title: "Added to playlist" });
      } else {
        toast({ title: "Failed to add track", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to add track", variant: "destructive" });
    }
  };

  const handleSwitchPlaylist = async (playlistId: string) => {
    if (isSwitching || playlistId === playlist?._id) return;
    
    setIsSwitching(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data.playlist);
        toast({ title: `Switched to "${data.playlist.name}"` });
      } else {
        toast({ title: "Failed to load playlist", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to load playlist", variant: "destructive" });
    } finally {
      setIsSwitching(false);
    }
  };

  // Get playlist cover image (use first track's image or a gradient)
  const playlistCover = playlist?.tracks?.[0]?.image;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader 
        className="pb-3 flex-shrink-0"
      >
        <div className="flex items-center justify-between gap-2">
          <div 
            className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-muted/50 transition-colors rounded px-2 py-1 -mx-2 -my-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Music className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">
              {playlist?.name || "My Playlist"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isMounted && allPlaylists && allPlaylists.length > 1 && (
              <Select
                value={playlist?._id || ""}
                onValueChange={handleSwitchPlaylist}
                disabled={isSwitching}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Switch playlist" />
                </SelectTrigger>
                <SelectContent>
                  {allPlaylists.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{p.name}</span>
                        {p.isPinned && (
                          <span className="text-primary text-[10px]">📌</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isExpanded && playlist && playlist.tracks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
              </span>
            )}
            <div 
              className="cursor-pointer hover:bg-muted/50 transition-colors rounded p-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <>
      {/* Spotify-style header with large cover */}
      {playlist && playlist.tracks.length > 0 && (
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
          <div className="absolute inset-0 flex items-center gap-4 p-4">
            <div className="relative h-24 w-24 flex-shrink-0 rounded-md shadow-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              {playlistCover ? (
                <Image
                  src={playlistCover}
                  alt={playlist.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                  onError={() => {}}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-10 w-10 text-primary/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold truncate">{playlist.name}</h3>
              <p className="text-sm text-muted-foreground">
                {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>
        </div>
      )}
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
        <ScrollArea className="h-[300px] px-4">
          {playlist && playlist.tracks.length > 0 ? (
            <div className="space-y-1">
              {playlist.tracks.map((track, i) => (
                <div 
                  key={`${track.url}-${i}`} 
                  className="flex items-center gap-3 p-2 rounded-md group hover:bg-muted/50 transition-colors"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
                    {track.image && track.image.trim() !== "" ? (
                      <Image
                        src={track.image}
                        alt={track.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                        onError={() => {}}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music className="h-6 w-6 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a 
                      href={track.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium hover:text-primary transition-colors block"
                    >
                      {track.name}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artist}
                    </p>
                    {track.album && (
                      <p className="truncate text-xs text-muted-foreground/70">
                        {track.album}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => track.url && handleRemoveTrack(track.url)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No songs in your playlist yet.</p>
              <p className="text-xs mt-1">Click "Add" to get started</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
        </>
      )}
    </Card>
  );
}

function AddTrackDialog({ username, onAdd }: { username: string; onAdd: (track: LastfmTrack) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Track</DialogTitle>
        </DialogHeader>
        <AddTracksSection 
          username={username} 
          onAdd={(track) => {
            onAdd(track);
            setOpen(false);
          }}
          autoLoadRecent={false}
        />
      </DialogContent>
    </Dialog>
  );
}

