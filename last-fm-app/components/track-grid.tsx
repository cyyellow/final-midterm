"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostDetailDialog } from "./post-detail-dialog";
import type { Post } from "@/types/post";

interface TrackGridProps {
  posts: Post[];
}

const ITEMS_PER_PAGE = 5; // 1 row of 5

export function TrackGrid({ posts }: TrackGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Filter posts with tracks first
  const postsWithTracks = posts.filter((post) => post.track);
  const totalPages = Math.ceil(postsWithTracks.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visiblePosts = postsWithTracks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visiblePosts.map((post) => (
              <button
                key={post._id}
                type="button"
                onClick={() => setSelectedPost(post)}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                {post.track?.image ? (
                  <Image
                    src={post.track.image}
                    alt={post.track.name}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-80"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {/* Text overlay on bottom of track */}
                <div className="absolute bottom-0 left-0 right-0 z-20 h-2/5 pointer-events-none" style={{ transition: 'none' }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%)' }}></div>
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col p-2 pointer-events-auto overflow-hidden">
                    <p className="truncate text-sm font-semibold text-white drop-shadow-md">
                      {post.track?.name}
                    </p>
                    <p className="truncate text-xs text-white/90 drop-shadow-md">
                      {post.track?.artist}
                    </p>
                  </div>
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



