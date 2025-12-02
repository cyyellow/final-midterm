"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RightSidebarContent } from "@/components/right-sidebar-content";
import type { LastfmTrack } from "@/lib/lastfm";

interface MobileMusicSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function MobileMusicSheet({
  open,
  onOpenChange,
  nowPlaying,
  recentTracks,
  friendStatuses,
  username,
}: MobileMusicSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-4">
        <SheetHeader>
          <SheetTitle>Your Music</SheetTitle>
        </SheetHeader>
        <div className="mt-4 h-[calc(100vh-8rem)] overflow-hidden">
          <RightSidebarContent
            nowPlaying={nowPlaying}
            recentTracks={recentTracks}
            friendStatuses={friendStatuses}
            username={username}
            playlists={[]}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

