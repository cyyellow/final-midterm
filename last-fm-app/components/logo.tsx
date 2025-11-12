"use client";

import Link from "next/link";
import { Music4 } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-lg font-semibold tracking-tight text-primary hover:bg-primary/10",
        className,
      )}
      aria-label="next.fm home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Music4 className="h-5 w-5" />
      </span>
      <span className="text-xl">next.fm</span>
    </Link>
  );
}


