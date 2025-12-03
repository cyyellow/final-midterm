"use client";

import Link from "next/link";
import Image from "next/image";
import { Music, ListMusic } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PlaylistPreviewCardProps {
  playlistId: string;
  playlistName: string;
  playlistImage?: string;
  trackCount: number;
}

export function PlaylistPreviewCard({
  playlistId,
  playlistName,
  playlistImage,
  trackCount,
}: PlaylistPreviewCardProps) {
  return (
    <Link href={`/playlists/${playlistId}`}>
      <Card className="mt-2 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-2">
        <div className="flex gap-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {playlistImage ? (
              <Image
                src={playlistImage}
                alt={playlistName}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ListMusic className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Music className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <p className="font-semibold text-sm truncate">{playlistName}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {trackCount} {trackCount === 1 ? "track" : "tracks"}
            </p>
            <p className="text-[10px] text-primary mt-1">View Playlist →</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

