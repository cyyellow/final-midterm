"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  CalendarClock,
  Home,
  UserRound,
  UsersRound,
  LogOut,
  UserPlus,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FriendsDialog } from "@/components/friends-dialog";

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
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare,
  },
];

export function LeftNav() {
  const pathname = usePathname();
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);

  return (
    <>
      <nav className="flex h-full flex-col gap-4">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
          <Button
            onClick={() => setFriendsDialogOpen(true)}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <UserPlus className="h-4 w-4" />
            <span>Friends</span>
          </Button>
        </div>
        <Button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          variant="outline"
          className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          size="lg"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </nav>
      <FriendsDialog
        open={friendsDialogOpen}
        onOpenChange={setFriendsDialogOpen}
      />
    </>
  );
}


