"use client";

import { useState } from "react";
import type React from "react";
import { getMusicLink } from "@/lib/music-links";

interface BasicTrack {
  name: string;
  artist: string;
  url?: string | null;
}

interface TrackLinkProps {
  track: BasicTrack;
  children: React.ReactNode;
  className?: string;
}

export function TrackLink({ track, children, className }: TrackLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If the track already has a direct streaming link, just open it
    if (track.url) {
      const lower = track.url.toLowerCase();
      if (
        lower.includes("youtube.com") ||
        lower.includes("youtu.be") ||
        lower.includes("spotify.com") ||
        lower.includes("music.apple.com") ||
        lower.includes("apple.com/music")
      ) {
        window.open(track.url, "_blank", "noopener,noreferrer");
        return;
      }
    }

    setIsLoading(true);

    try {
      const query = `${track.name} ${track.artist}`;
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}`,
      );

      if (res.ok) {
        const data = (await res.json()) as { videoUrl?: string };
        if (data.videoUrl) {
          window.open(data.videoUrl, "_blank", "noopener,noreferrer");
          return;
        }
      }

      // Fallback: open regular YouTube search link
      window.open(getMusicLink(track), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to resolve YouTube link", error);
      window.open(getMusicLink(track), "_blank", "noopener,noreferrer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={className}
      title="Play on YouTube"
      style={isLoading ? { cursor: "wait", opacity: 0.8 } : undefined}
    >
      {children}
    </a>
  );
}


