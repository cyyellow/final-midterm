"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreatePostDialog } from "./create-post-dialog";
import type { LastfmTrack } from "@/lib/lastfm";

interface TrackSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrackSelectorDialog({ open, onOpenChange }: TrackSelectorDialogProps) {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<LastfmTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<LastfmTrack | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    if (open && session?.user?.lastfmUsername) {
      fetchTracks();
    }
  }, [open, session]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTrack(null);
      setShowCreatePost(false);
    }
  }, [open]);

  const fetchTracks = async () => {
    if (!session?.user?.lastfmUsername) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/lastfm/recent-tracks?username=${session.user.lastfmUsername}`
      );
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error("Failed to fetch tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrack = (track: LastfmTrack) => {
    setSelectedTrack(track);
    // Close current dialog first, then open create post dialog
    onOpenChange(false);
    // Use setTimeout to ensure the first dialog is fully closed
    setTimeout(() => {
      setShowCreatePost(true);
    }, 150);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Select a Track
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <button
                    key={`${track.name}-${track.artist["#text"]}-${index}`}
                    onClick={() => handleSelectTrack(track)}
                    className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary hover:bg-muted"
                  >
                    {track.image && track.image.length > 0 && (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
                        <Image
                          src={
                            track.image.find((img) => img.size === "large")?.["#text"] ||
                            track.image[0]["#text"]
                          }
                          alt={track.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{track.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {track.artist["#text"]}
                      </p>
                      {track.album?.["#text"] && (
                        <p className="truncate text-xs text-muted-foreground">
                          {track.album["#text"]}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        track={selectedTrack}
      />
    </>
  );
}



