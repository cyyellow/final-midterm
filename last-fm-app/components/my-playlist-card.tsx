"use client";

import { useState } from "react";
import { Plus, Trash2, Music, Loader2, Search, Link as LinkIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import type { Playlist, PlaylistTrack } from "@/lib/playlist";
import type { LastfmTrack } from "@/lib/lastfm";
import { useToast } from "@/components/ui/use-toast";

type MyPlaylistCardProps = {
  initialPlaylist: Playlist | null;
  username: string; // Last.fm username for fetching recent tracks
};

export function MyPlaylistCard({ initialPlaylist, username }: MyPlaylistCardProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(initialPlaylist);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRemoveTrack = async (url: string) => {
    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(url)}`, {
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
      const newTrack = {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album?.["#text"],
        image: track.image?.find((i) => i.size === "medium")?.["#text"],
        url: track.url,
      };

      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrack),
      });

      if (res.ok) {
        // Optimistically update or re-fetch
        // For simplicity, let's just add it locally
        const addedTrack: PlaylistTrack = {
          ...newTrack,
          addedAt: new Date(),
        };
        
        setPlaylist((prev) => {
          const newPlaylist = prev || { _id: "temp", userId: "", tracks: [], updatedAt: new Date() };
          // Avoid duplicates
          if (newPlaylist.tracks.some(t => t.url === newTrack.url)) return prev;
          return {
            ...newPlaylist,
            tracks: [addedTrack, ...newPlaylist.tracks],
          };
        });
        
        toast({ title: "Added to playlist" });
      }
    } catch (error) {
      toast({ title: "Failed to add track", variant: "destructive" });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">My Playlist</CardTitle>
          </div>
          <AddTrackDialog username={username} onAdd={handleAddTrack} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-[300px] pr-4">
          {playlist && playlist.tracks.length > 0 ? (
            <div className="space-y-3">
              {playlist.tracks.map((track, i) => (
                <div key={`${track.url}-${i}`} className="flex items-center gap-3 group">
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={track.image} />
                    <AvatarFallback><Music className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <a 
                      href={track.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium hover:underline block"
                    >
                      {track.name}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artist}
                    </p>
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
              <p className="text-sm">No songs in your playlist yet.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AddTrackDialog({ username, onAdd }: { username: string; onAdd: (track: LastfmTrack) => void }) {
  const [open, setOpen] = useState(false);
  const [recentTracks, setRecentTracks] = useState<LastfmTrack[]>([]);
  const [searchResults, setSearchResults] = useState<LastfmTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom track state
  const [customName, setCustomName] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const loadRecentTracks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lastfm/recent-tracks?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setRecentTracks(data.tracks || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/lastfm/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customArtist) return;

    const track: LastfmTrack = {
      name: customName,
      url: customUrl || "#",
      artist: { "#text": customArtist },
      // No image for custom tracks initially, or maybe a placeholder
    };
    
    onAdd(track);
    setOpen(false);
    setCustomName("");
    setCustomArtist("");
    setCustomUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) loadRecentTracks();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Track</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TrackList tracks={recentTracks} onAdd={(t) => { onAdd(t); setOpen(false); }} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="search" className="mt-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input 
                placeholder="Search song or artist..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
            <ScrollArea className="h-[250px] pr-4">
               {searchResults.length > 0 ? (
                 <TrackList tracks={searchResults} onAdd={(t) => { onAdd(t); setOpen(false); }} />
               ) : (
                 <div className="text-center py-8 text-muted-foreground text-sm">
                   {loading ? "Searching..." : "Search for any song on Last.fm"}
                 </div>
               )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4">
            <form onSubmit={handleCustomAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Track Name</Label>
                <Input id="name" required value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Never Gonna Give You Up" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist">Artist</Label>
                <Input id="artist" required value={customArtist} onChange={e => setCustomArtist(e.target.value)} placeholder="e.g. Rick Astley" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Link (Optional)</Label>
                <Input id="url" type="url" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://youtube.com/..." />
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube, Spotify, or any other link here.
                </p>
              </div>
              <Button type="submit" className="w-full">Add to Playlist</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TrackList({ tracks, onAdd }: { tracks: LastfmTrack[]; onAdd: (track: LastfmTrack) => void }) {
  return (
    <div className="space-y-2">
      {tracks.map((track, i) => (
        <div key={`${track.url}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={track.image?.find(img => img.size === "medium")?.["#text"]} />
            <AvatarFallback><Music className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{track.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {track.artist["#text"]}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onAdd(track)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

