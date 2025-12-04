"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Globe, Lock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { LastfmTrack } from "@/lib/lastfm";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: LastfmTrack | null;
}

const MAX_CHARACTERS = 200;

export function CreatePostDialog({ open, onOpenChange, track }: CreatePostDialogProps) {
  const [thoughts, setThoughts] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("friends");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset all state when dialog closes
      // Use a small delay to ensure dialog animation completes
      const timer = setTimeout(() => {
        setThoughts("");
        setVisibility("friends");
        setIsSubmitting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!track || !thoughts.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track: {
            name: track.name,
            artist: track.artist["#text"],
            album: track.album?.["#text"],
            image: track.image?.find((img) => img.size === "extralarge")?.["#text"],
            url: track.url,
          },
          thoughts: thoughts.trim(),
          visibility,
        }),
      });

      if (response.ok) {
        toast({ title: "Post created successfully!" });
        // Close dialog first - this is critical
        onOpenChange(false);
        // Don't refresh immediately - let the dialog fully close first
        // The user can manually refresh or navigate to see the new post
        // This prevents the overlay from blocking interactions
      } else {
        const error = await response.json();
        toast({
          title: "Failed to create post",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_CHARACTERS - thoughts.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Record a Moment</DialogTitle>
        </DialogHeader>

        {track ? (
          <div className="space-y-4">
            {/* Track Display */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              {track.image && track.image.length > 0 && (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
                  <Image
                    src={track.image.find((img) => img.size === "large")?.["#text"] || track.image[0]["#text"]}
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
            </div>

            {/* Thoughts Input */}
            <div className="space-y-2">
              <Textarea
                placeholder="Share your thoughts about this track..."
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={MAX_CHARACTERS + 50}
              />
              <div className="flex items-center justify-between text-sm">
                <span className={isOverLimit ? "text-destructive" : "text-muted-foreground"}>
                  {remainingChars} characters remaining
                </span>
              </div>
            </div>

            {/* Visibility Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="visibility">Post Visibility</Label>
              <Select value={visibility} onValueChange={(value: "public" | "friends" | "private") => setVisibility(value)}>
                <SelectTrigger id="visibility" className="w-full">
                  <div className="flex items-center gap-2">
                    {visibility === "public" && <Globe className="h-4 w-4" />}
                    {visibility === "friends" && <Users className="h-4 w-4" />}
                    {visibility === "private" && <Lock className="h-4 w-4" />}
                    <SelectValue>
                      {visibility === "public" && "Public"}
                      {visibility === "friends" && "Friends Only"}
                      {visibility === "private" && "Private"}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Public - Anyone can see this post</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Friends Only - Only your friends can see this post</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Private - Only you can see this post</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!thoughts.trim() || isOverLimit || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>Select a track from your listening history to create a post.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



