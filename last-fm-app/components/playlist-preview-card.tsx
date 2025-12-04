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
      <Card className="mt-2 p-2 sm:p-3 hover:bg-muted/50 transition-colors cursor-pointer border-2 max-w-full">
        <div className="flex gap-2 sm:gap-3 min-w-0">
          <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
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
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0">
              <Music className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
              <p className="font-semibold text-xs sm:text-sm truncate">{playlistName}</p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {trackCount} {trackCount === 1 ? "track" : "tracks"}
            </p>
            <p className="text-[9px] sm:text-[10px] text-primary mt-0.5 sm:mt-1 truncate">View Playlist →</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}


