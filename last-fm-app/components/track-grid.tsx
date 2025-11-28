"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visiblePosts.map((post) => (
            <button
              key={post._id}
              onClick={() => setSelectedPost(post)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-all hover:scale-105 hover:shadow-lg"
            >
              {post.track.image ? (
                <Image
                  src={post.track.image}
                  alt={post.track.name}
                  fill
                  className="object-cover transition-opacity group-hover:opacity-80"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-4xl">🎵</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-full p-2 transition-transform group-hover:translate-y-0">
                <p className="truncate text-xs font-medium text-white">
                  {post.track.name}
                </p>
                <p className="truncate text-xs text-white/80">
                  {post.track.artist}
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



