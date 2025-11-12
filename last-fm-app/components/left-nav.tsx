"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarClock,
  Home,
  PenSquare,
  UserRound,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    title: "My Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "My Society",
    href: "/society",
    icon: UsersRound,
  },
  {
    title: "Join Event",
    href: "/events",
    icon: CalendarClock,
  },
];

export function LeftNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="flex h-full flex-col gap-4 px-4 pb-6">
      <div className="flex-1 space-y-1">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted-foreground transition-colors hover:bg-sidebar-muted hover:text-sidebar-foreground",
                isActive && "bg-sidebar-muted text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
      <Button
        className="w-full"
        size="lg"
        variant="sidebar"
        onClick={() => router.push("/posts/create")}
      >
        <PenSquare className="mr-2 h-4 w-4" />
        Create Post
      </Button>
    </nav>
  );
}


