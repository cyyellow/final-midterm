"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { MobileMusicSheet } from "@/components/mobile-music-sheet";
import type { LastfmTrack } from "@/lib/lastfm";

interface ResponsiveLayoutWrapperProps {
  children: React.ReactNode;
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
  username: string;
}

export function ResponsiveLayoutWrapper({
  children,
  nowPlaying,
  recentTracks,
  friendStatuses,
  username,
}: ResponsiveLayoutWrapperProps) {
  const [isMusicSheetOpen, setIsMusicSheetOpen] = useState(false);

  return (
    <>
      {children}
      <BottomNav onMusicClick={() => setIsMusicSheetOpen(true)} />
      <MobileMusicSheet
        open={isMusicSheetOpen}
        onOpenChange={setIsMusicSheetOpen}
        nowPlaying={nowPlaying}
        recentTracks={recentTracks}
        friendStatuses={friendStatuses}
        username={username}
      />
    </>
  );
}

