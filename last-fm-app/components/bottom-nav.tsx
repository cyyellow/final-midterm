"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  UsersRound,
  MessageSquare,
  Music,
  Music2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Society",
    href: "/society",
    icon: UsersRound,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Playlists",
    href: "/playlists",
    icon: Music,
  },
];

interface BottomNavProps {
  onMusicClick: () => void;
}

export function BottomNav({ onMusicClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border bg-sidebar lg:hidden safe-area-inset-bottom">
      <div className="relative flex items-center justify-around px-1 sm:px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}

        {/* Floating music button */}
        <button
          onClick={onMusicClick}
          className="absolute -top-5 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background z-10"
          aria-label="Open music panel"
        >
          <Music2 className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}
