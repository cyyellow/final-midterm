"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/bottom-nav";
import { MobileMusicSheet } from "@/components/mobile-music-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music4 } from "lucide-react";
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
  userDisplayName?: string | null;
  userImage?: string | null;
}

function getMobileTitle(pathname: string | null): string {
  if (!pathname) return "Home";

  if (pathname === "/") return "Home";
  if (pathname.startsWith("/society")) return "Society";
  if (pathname.startsWith("/chat")) return "Chat";
  if (pathname.startsWith("/playlists")) return "Playlists";
  if (pathname.startsWith("/friends")) return "Friends";
  if (pathname.startsWith("/profile")) return "Profile";

  return "next.fm";
}

export function ResponsiveLayoutWrapper({
  children,
  nowPlaying,
  recentTracks,
  friendStatuses,
  username,
  userDisplayName,
  userImage,
}: ResponsiveLayoutWrapperProps) {
  const [isMusicSheetOpen, setIsMusicSheetOpen] = useState(false);
  const pathname = usePathname();
  const title = getMobileTitle(pathname);

  const avatarFallback =
    (userDisplayName || username || "U")
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <>
      {/* Mobile top bar: current section title + logo + profile avatar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden safe-area-inset-top">
        <span className="text-sm font-semibold tracking-tight truncate min-w-0 flex-1">{title}</span>
        
        {/* Logo in the center */}
        <Link 
          href="/" 
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5"
          aria-label="next.fm home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Music4 className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold text-primary">next.fm</span>
        </Link>
        
        <Link href="/profile" className="flex items-center flex-shrink-0 ml-auto">
          <Avatar className="h-8 w-8">
            {userImage ? (
              <AvatarImage src={userImage} alt={userDisplayName || username || "Profile"} />
            ) : (
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            )}
          </Avatar>
        </Link>
      </header>

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

