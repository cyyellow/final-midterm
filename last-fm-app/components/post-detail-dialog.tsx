"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Post } from "@/types/post";
import { getMusicLink } from "@/lib/music-links";

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({ post, open, onOpenChange }: PostDetailDialogProps) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.userImage} />
              <AvatarFallback>{post.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.username}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Track Info */}
          <div className="flex gap-4 rounded-lg border bg-muted/30 p-4">
            {post.track.image && (
              <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md shadow-md">
                <Image
                  src={post.track.image}
                  alt={post.track.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <a
                href={getMusicLink(post.track)}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{post.track.name}</h3>
                <p className="text-lg text-muted-foreground">{post.track.artist}</p>
                {post.track.album && (
                  <p className="mt-1 text-sm text-muted-foreground">{post.track.album}</p>
                )}
                <p className="mt-2 text-sm text-primary hover:underline">
                  Listen on YouTube →
                </p>
              </a>
            </div>
          </div>

          {/* Thoughts */}
          {post.thoughts && (
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="whitespace-pre-wrap leading-relaxed">{post.thoughts}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



