"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Edit2, Trash2, MoreVertical, Loader2, Music } from "lucide-react";
import type { Post } from "@/types/post";
import { TrackLink } from "@/components/track-link";
import { EditPostDialog } from "./edit-post-dialog";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = session?.user?.id === post?.userId;

  // Update currentPost when post prop changes
  useEffect(() => {
    if (post) {
      setCurrentPost(post);
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

  const handlePostUpdated = (updatedPost: Post) => {
    setCurrentPost(updatedPost);
    toast({ title: "Post updated" });
  };

  return (
    <>
      <Dialog open={open && !!post} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          {post && currentPost && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
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
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
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
              </DialogHeader>

              <div className="space-y-4">
                {/* Track Info */}
                {currentPost.track && (
              <div className="flex gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md shadow-md bg-muted">
                  {currentPost.track.image ? (
                    <Image
                      src={currentPost.track.image}
                      alt={currentPost.track.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <TrackLink
                    track={{
                      name: currentPost.track.name,
                      artist: currentPost.track.artist,
                      // @ts-expect-error Some track types may not have url but it's optional
                      url: currentPost.track.url,
                    }}
                    className="group"
                  >
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {currentPost.track.name}
                    </h3>
                    <p className="text-lg text-muted-foreground">{currentPost.track.artist}</p>
                    {currentPost.track.album && (
                      <p className="mt-1 text-sm text-muted-foreground">{currentPost.track.album}</p>
                    )}
                    <p className="mt-2 text-sm text-primary hover:underline">
                      Listen on YouTube →
                    </p>
                  </TrackLink>
                </div>
              </div>
            )}

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

                {/* Thoughts */}
                {currentPost.thoughts && (
                  <div className="rounded-lg bg-muted/20 p-4">
                    <p className="whitespace-pre-wrap leading-relaxed">{currentPost.thoughts}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {currentPost && (
        <EditPostDialog
          post={currentPost}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </>
  );
}



