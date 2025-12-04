"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LastfmTrack } from "@/lib/lastfm";

type ListeningHistoryListProps = {
  tracks: LastfmTrack[];
};

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

export function ListeningHistoryList({ tracks }: ListeningHistoryListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-5">
        <CardTitle className="text-base font-semibold">
          Listening history
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[420px]">
          <ul className="space-y-4 px-6">
            {tracks.map((track, index) => {
              const isNowPlaying = track["@attr"]?.nowplaying === "true";
              return (
                <li key={`${track.name}-${index}`} className="flex gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {track.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {track.artist?.["#text"] ?? "Unknown Artist"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isNowPlaying ? "Now" : mounted ? getRelativeTime(track.date?.uts) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


