"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Edit2, Trash2, MoreVertical, Loader2, Music, Play, Globe, Lock, Users } from "lucide-react";
import type { Post } from "@/types/post";
import { TrackLink } from "@/components/track-link";

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({ post, open, onOpenChange }: PostDetailDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [currentPost, setCurrentPost] = useState<Post | null>(post);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thoughts, setThoughts] = useState(post?.thoughts || "");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">(post?.visibility ?? "friends");

  const isOwner = session?.user?.id === post?.userId;
  const MAX_CHARACTERS = 200;
  const remainingChars = MAX_CHARACTERS - thoughts.length;
  const isOverLimit = remainingChars < 0;

  // Update currentPost when post prop changes
  useEffect(() => {
    if (post) {
      setCurrentPost(post);
      setThoughts(post.thoughts || "");
      setVisibility(post.visibility ?? "friends");
      setIsEditing(false);
    }
  }, [post]);

  const handleDelete = async () => {
    if (!post || !confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Post deleted" });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: "Failed to delete post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentPost || !thoughts.trim() || isSubmitting || isOverLimit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${currentPost._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thoughts: thoughts.trim(),
          visibility,
        }),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setCurrentPost(updatedPost);
        setIsEditing(false);
        toast({ title: "Post updated" });
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

  const handleCancelEdit = () => {
    if (currentPost) {
      setThoughts(currentPost.thoughts || "");
      setVisibility(currentPost.visibility ?? "friends");
      setIsEditing(false);
    }
  };

  return (
    <>
      <Dialog open={open && !!post} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
          {post && currentPost && (
            <>
              <DialogHeader>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={currentPost.userImage} />
                      <AvatarFallback>{currentPost.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{currentPost.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(currentPost.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {/* Track Info */}
                  {currentPost.track && (
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <TrackLink
                          track={{
                            name: currentPost.track.name,
                            artist: currentPost.track.artist,
                            // @ts-expect-error Some track types may not have url but it's optional
                            url: currentPost.track.url,
                          }}
                          className="group flex gap-3 cursor-pointer hover:opacity-80 transition-opacity items-start"
                        >
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                            {currentPost.track.image ? (
                              <img
                                src={currentPost.track.image}
                                alt={currentPost.track.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Music className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-6 w-6 text-white fill-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="font-medium">{currentPost.track.name}</p>
                            <p className="text-sm text-muted-foreground">{currentPost.track.artist}</p>
                            {currentPost.track.album && (
                              <p className="text-xs text-muted-foreground">{currentPost.track.album}</p>
                            )}
                          </div>
                        </TrackLink>
                      </div>
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={handleDelete}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                  {/* Thoughts */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
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
                      <Select value={visibility} onValueChange={(value: "public" | "friends" | "private") => setVisibility(value)}>
                        <SelectTrigger className="w-full">
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
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdate}
                          disabled={isSubmitting || !thoughts.trim() || isOverLimit}
                        >
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
                    </div>
                  ) : (
                    currentPost.thoughts && (
                      <div className="rounded-lg bg-muted/20 p-4">
                        <p className="whitespace-pre-wrap leading-relaxed">{currentPost.thoughts}</p>
                      </div>
                    )
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-2 mt-2">
            {/* Playlist Info */}
            {currentPost.playlistId && (
              <div className="flex gap-4 rounded-lg border bg-muted/30 p-4">
                {currentPost.playlistImage && (
                  <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md shadow-md">
                    <Image
                      src={currentPost.playlistImage}
                      alt={currentPost.playlistName || "Playlist"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold">Playlist: {currentPost.playlistName}</h3>
                  <p className="text-lg text-muted-foreground">
                    {currentPost.playlistTrackCount || 0} tracks
                  </p>
                </div>
              </div>
            )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}



