"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LastfmTrack } from "@/lib/lastfm";

interface InlinePostFormProps {
  track: LastfmTrack;
}

const MAX_CHARACTERS = 200;

export function InlinePostForm({ track }: InlinePostFormProps) {
  const [thoughts, setThoughts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!thoughts.trim()) return;

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
        }),
      });

      if (response.ok) {
        setThoughts("");
        router.refresh();
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
    <div className="space-y-2">
      <Textarea
        placeholder="Share your thoughts on what you're listening to..."
        value={thoughts}
        onChange={(e) => setThoughts(e.target.value)}
        className="min-h-[60px] resize-none text-xs"
        maxLength={MAX_CHARACTERS + 50}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
          {remainingChars} left
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!thoughts.trim() || isOverLimit || isSubmitting}
          className="h-7 gap-1.5 text-xs"
        >
          {isSubmitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Post
        </Button>
      </div>
    </div>
  );
}

