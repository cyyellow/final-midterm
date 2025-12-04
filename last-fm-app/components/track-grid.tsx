"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostDetailDialog } from "./post-detail-dialog";
import type { Post } from "@/types/post";

interface TrackGridProps {
  posts: Post[];
}

const ITEMS_PER_PAGE = 6;

export function TrackGrid({ posts }: TrackGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visiblePosts = posts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {visiblePosts
            .filter((post) => post.track) // Only show posts with tracks
            .map((post) => (
              <button
                key={post._id}
                type="button"
                onClick={() => setSelectedPost(post)}
                className="group flex flex-col gap-2 text-left transition-all hover:scale-105"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  {post.track?.image ? (
                    <Image
                      src={post.track.image}
                      alt={post.track.name}
                      fill
                      className="object-cover transition-opacity group-hover:opacity-80"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Music2 className="h-8 w-8 text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="px-1 text-left">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {post.track?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {post.track?.artist}
                  </p>
                </div>
              </button>
            ))}
        </div>

        {/* Navigation */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      />
    </>
  );
}



