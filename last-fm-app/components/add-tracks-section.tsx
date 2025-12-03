"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LastfmTrack } from "@/lib/lastfm";

// Unified TrackList component with consistent image handling
function TrackList({ tracks, onAdd }: { tracks: LastfmTrack[]; onAdd: (track: LastfmTrack) => void }) {
  // Helper to get best image - consistent across all uses
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

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No tracks found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track, i) => {
        const imageUrl = getBestImage(track.image);
        return (
          <div
            key={`${track.url || track.name}-${i}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(track);
            }}
          >
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={track.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                  onError={() => {}}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-5 w-5 text-primary/60" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-sm font-medium">{track.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {track.artist["#text"]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Unified AddTracksSection component
export function AddTracksSection({ 
  username, 
  onAdd,
  autoLoadRecent = false 
}: { 
  username: string; 
  onAdd: (track: LastfmTrack) => void;
  autoLoadRecent?: boolean;
}) {
  const [recentTracks, setRecentTracks] = useState<LastfmTrack[]>([]);
  const [searchResults, setSearchResults] = useState<LastfmTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentLoaded, setRecentLoaded] = useState(false);
  
  // Custom track state
  const [customName, setCustomName] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  // Auto-load recent tracks if enabled
  useEffect(() => {
    if (autoLoadRecent && !recentLoaded && username) {
      loadRecentTracks();
    }
  }, [autoLoadRecent, recentLoaded, username]);

  const loadRecentTracks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lastfm/recent-tracks?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setRecentTracks(data.tracks || []);
        setRecentLoaded(true);
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
    };
    
    onAdd(track);
    setCustomName("");
    setCustomArtist("");
    setCustomUrl("");
  };

  return (
    <Tabs defaultValue="recent" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="recent">Recent</TabsTrigger>
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>
      
      <TabsContent value="recent" className="mt-4">
        {!recentLoaded && (
          <Button 
            onClick={loadRecentTracks} 
            variant="outline" 
            className="w-full mb-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load Recent Tracks"
            )}
          </Button>
        )}
        <ScrollArea className="h-[400px]">
          <div className="pr-2 max-w-md mx-auto w-full">
            {loading && recentTracks.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TrackList tracks={recentTracks} onAdd={onAdd} />
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="search" className="mt-4">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input 
            placeholder="Search song or artist..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
        <ScrollArea className="h-[400px]">
          <div className="pr-2 max-w-md mx-auto w-full">
            {loading && searchResults.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <TrackList tracks={searchResults} onAdd={onAdd} />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Search for any song on Last.fm
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="custom" className="mt-4">
        <form onSubmit={handleCustomAdd} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Track Name</Label>
            <Input 
              id="name" 
              required 
              value={customName} 
              onChange={e => setCustomName(e.target.value)} 
              placeholder="e.g. Never Gonna Give You Up" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artist</Label>
            <Input 
              id="artist" 
              required 
              value={customArtist} 
              onChange={e => setCustomArtist(e.target.value)} 
              placeholder="e.g. Rick Astley" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Link (Optional)</Label>
            <Input 
              id="url" 
              type="url" 
              value={customUrl} 
              onChange={e => setCustomUrl(e.target.value)} 
              placeholder="https://youtube.com/..." 
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube, Spotify, or any other link here.
            </p>
          </div>
          <Button type="submit" className="w-full">Add to Playlist</Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}


