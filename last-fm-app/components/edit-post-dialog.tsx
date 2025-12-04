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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Globe, Lock, Users } from "lucide-react";
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
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">(post.visibility ?? "friends");
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
          visibility,
        }),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        onPostUpdated(updatedPost);
        // Close dialog first - this is critical
        onOpenChange(false);
        // Don't refresh immediately - let the dialog fully close first
        // The post is already updated via onPostUpdated callback
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


