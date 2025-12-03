"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Post } from "@/types/post";

interface EditPostDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: (post: Post) => void;
}

const MAX_CHARACTERS = 200;

export function EditPostDialog({
  post,
  open,
  onOpenChange,
  onPostUpdated,
}: EditPostDialogProps) {
  const [thoughts, setThoughts] = useState(post.thoughts);
  const [isPublic, setIsPublic] = useState(post.isPublic ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughts.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thoughts: thoughts.trim(),
          isPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onPostUpdated(data.post);
        onOpenChange(false);
        router.refresh();
      } else {
        const error = await res.json();
        toast({
          title: "Failed to update post",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_CHARACTERS - thoughts.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content and visibility
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thoughts">Your thoughts</Label>
            <Textarea
              id="thoughts"
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="Share what you think..."
              maxLength={MAX_CHARACTERS}
              rows={4}
              className={isOverLimit ? "border-destructive" : ""}
            />
            <p className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
              {remainingChars} characters remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPublic" className="text-sm cursor-pointer">
              Make this post public
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !thoughts.trim() || isOverLimit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

