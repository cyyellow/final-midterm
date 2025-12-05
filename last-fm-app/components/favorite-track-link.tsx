"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { TrackImage } from "@/components/track-image";

type FavoriteTrack = {
  name: string;
  artist: string;
  image?: string | null;
  url?: string | null;
};

interface FavoriteTrackLinkProps {
  track: FavoriteTrack;
}

export function FavoriteTrackLink({ track }: FavoriteTrackLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If track already has a URL (YouTube/Spotify), use it directly
    if (track.url) {
      const url = track.url.toLowerCase();
      if (
        url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("spotify.com") ||
        url.includes("apple.com/music") ||
        url.includes("music.apple.com")
      ) {
        window.open(track.url, "_blank", "noopener,noreferrer");
        return;
      }
    }

    // Otherwise, fetch the first YouTube result
    setIsLoading(true);

    try {
      const query = `${track.name} ${track.artist}`;
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.videoUrl) {
          window.open(data.videoUrl, "_blank", "noreferrer");
        } else {
          // Fallback to YouTube search if no video found
          const searchQuery = encodeURIComponent(query);
          window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, "_blank", "noreferrer");
        }
      } else {
        // Fallback to YouTube search on error
        const searchQuery = encodeURIComponent(query);
        window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, "_blank", "noreferrer");
      }
    } catch (error) {
      // Fallback to YouTube search on error
      const query = encodeURIComponent(`${track.name} ${track.artist}`);
      window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank", "noreferrer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      title="Play on YouTube"
      className={`group flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors border border-transparent hover:border-border ${
        isLoading ? "opacity-50 cursor-wait" : ""
      }`}
      style={isLoading ? { cursor: "wait", opacity: 0.8 } : undefined}
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="absolute inset-0">
          <TrackImage src={track.image} alt={track.name} fill sizes="40px" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-sm font-medium">{track.name}</p>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>
    </a>
  );
}

