"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  UserRound,
  UsersRound,
  Music2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Profile",
    href: "/profile",
    icon: UserRound,
  },
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
];

interface BottomNavProps {
  onMusicClick: () => void;
}

export function BottomNav({ onMusicClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border bg-sidebar lg:hidden">
      <div className="flex items-center justify-around">
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
        <button
          onClick={onMusicClick}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Music2 className="h-5 w-5" />
          <span>Music</span>
        </button>
      </div>
    </nav>
  );
}

