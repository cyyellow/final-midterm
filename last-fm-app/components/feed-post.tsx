"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { Post, Comment } from "@/types/post";
import { Music, Globe, Lock, Users, ListMusic, Edit2, Trash2, MessageSquare, Send, Loader2, MoreVertical, Play, Heart } from "lucide-react";
import { TrackLink } from "@/components/track-link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FeedPostProps {
  post: Post;
}

export function FeedPost({ post }: FeedPostProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thoughts, setThoughts] = useState(post.thoughts || "");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">(post.visibility ?? "friends");
  const [commentsLoaded, setCommentsLoaded] = useState(!!post.comments);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(currentPost.likes || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = session?.user?.id === post.userId;
  const MAX_CHARACTERS = 200;
  const remainingChars = MAX_CHARACTERS - thoughts.length;
  const isOverLimit = remainingChars < 0;

  // Check if current user has liked this post
  useEffect(() => {
    if (session?.user?.id && currentPost.likedBy) {
      setIsLiked(currentPost.likedBy.includes(session.user.id));
    }
  }, [session?.user?.id, currentPost.likedBy]);

  useEffect(() => {
    const loadComments = async () => {
      if (commentsLoaded || !showComments) return;
      
      try {
        const res = await fetch(`/api/posts/${post._id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
          setCommentsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
      }
    };

    if (showComments && !commentsLoaded) {
      loadComments();
    }
  }, [showComments, commentsLoaded, post._id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data]);
        setCommentInput("");
        setCommentsLoaded(true); // Mark as loaded after adding comment
        toast({ title: "Comment added" });
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        toast({
          title: "Failed to add comment",
          description: errorData.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Post deleted" });
        // Only refresh the current route, not the entire page
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
    setThoughts(updatedPost.thoughts || "");
    setVisibility(updatedPost.visibility ?? "friends");
    setIsEditing(false);
    toast({ title: "Post updated" });
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
        handlePostUpdated(updatedPost);
        setEditDialogOpen(false);
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
    setThoughts(currentPost.thoughts || "");
    setVisibility(currentPost.visibility ?? "friends");
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setThoughts(currentPost.thoughts || "");
    setVisibility(currentPost.visibility ?? "friends");
    setIsEditing(true);
    setEditDialogOpen(true);
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentContent(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim() || isUpdatingComment) return;

    setIsUpdatingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingCommentContent.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => c._id === commentId ? data.comment : c));
        setEditingCommentId(null);
        setEditingCommentContent("");
        toast({ title: "Comment updated" });
      } else {
        toast({
          title: "Failed to update comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update comment",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeletingComment(commentId);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
        toast({ title: "Comment deleted" });
      } else {
        toast({
          title: "Failed to delete comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setIsDeletingComment(null);
    }
  };

  const handleLike = async () => {
    if (!session?.user?.id || isLiking) return;

    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes || 0);
        setIsLiked(data.isLiked || false);
      } else {
        toast({
          title: "Failed to like post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to like post",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <>
    <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md w-full max-w-full overflow-hidden">
      <div className="mb-3 flex items-start gap-3">
        <Avatar className="h-10 w-10">
            <AvatarImage src={currentPost.userImage} />
            <AvatarFallback>{currentPost.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
                <span className="font-semibold">{currentPost.username}</span>
            <span className="text-xs text-muted-foreground">
                  {new Date(currentPost.createdAt).toLocaleDateString()} {new Date(currentPost.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
                {(() => {
                  // Check visibility field first, then fallback to legacy isPublic
                  const visibility = currentPost.visibility;
                  const isPublic = (currentPost as any).isPublic;
                  
                  if (visibility === "public" || isPublic === true) {
                    return <Globe className="h-3 w-3 text-muted-foreground" />;
                  } else if (visibility === "friends" || (visibility === undefined && isPublic === false)) {
                    return <Users className="h-3 w-3 text-muted-foreground" />;
                  } else if (visibility === "private") {
                    return <Lock className="h-3 w-3 text-muted-foreground" />;
                  } else {
                    // Default to friends icon for legacy posts without visibility
                    return <Users className="h-3 w-3 text-muted-foreground" />;
                  }
                })()}
          </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleStartEdit}>
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
        </div>
      </div>

        {currentPost.playlistId ? (
          <Link href={`/playlists/${currentPost.playlistId}`}>
          <div className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                {currentPost.playlistImage ? (
                <img
                    src={currentPost.playlistImage}
                    alt={currentPost.playlistName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ListMusic className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-medium">Playlist: {currentPost.playlistName}</p>
              <p className="text-sm text-muted-foreground">
                  {currentPost.playlistTrackCount || 0} tracks
              </p>
            </div>
          </div>
        </Link>
        ) : currentPost.track ? (
        <TrackLink
          track={{
            name: currentPost.track.name,
            artist: currentPost.track.artist,
            url: currentPost.track.url,
          }}
          className="group flex gap-3 cursor-pointer hover:opacity-80 transition-opacity"
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
          <div className="min-w-0 flex-1">
              <p className="font-medium">{currentPost.track.name}</p>
              <p className="text-sm text-muted-foreground">{currentPost.track.artist}</p>
              {currentPost.track.album && (
                <p className="text-xs text-muted-foreground">{currentPost.track.album}</p>
            )}
          </div>
        </TrackLink>
      ) : null}

        {currentPost.thoughts && (
          <p className="mt-3 text-sm leading-relaxed">{currentPost.thoughts}</p>
        )}

        {/* Like and Comment Actions */}
        <div className="mt-4 border-t pt-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2"
            onClick={handleLike}
            disabled={!session?.user?.id || isLiking}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-xs">{likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            {comments.length > 0 && (
              <span className="text-xs">{comments.length}</span>
            )}
          </Button>
        </div>

        {/* Comments Section */}
        <div className="mt-3">
          {showComments && (
            <div className="mt-3 space-y-3">
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3 pr-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => {
                      const isCommentOwner = session?.user?.id === comment.userId;
                      const isEditing = editingCommentId === comment._id;
                      const isDeleting = isDeletingComment === comment._id;

                      return (
                        <div key={comment._id} className="flex gap-2 group">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={comment.userImage} />
                            <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{comment.username}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {isCommentOwner && editingCommentId !== comment._id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStartEditComment(comment)}>
                                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteComment(comment._id)}
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
                            {editingCommentId === comment._id ? (
                              <div className="mt-1 flex gap-2">
                                <Input
                                  value={editingCommentContent}
                                  onChange={(e) => setEditingCommentContent(e.target.value)}
                                  className="h-7 text-xs"
                                  maxLength={500}
                                  disabled={isUpdatingComment}
                                />
                                <Button
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => handleUpdateComment(comment._id)}
                                  disabled={!editingCommentContent.trim() || isUpdatingComment}
                                >
                                  {isUpdatingComment ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={handleCancelEditComment}
                                  disabled={isUpdatingComment}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-foreground mt-0.5">{comment.content}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
                  )}
                </div>
              </ScrollArea>

              {session?.user && (
                <form onSubmit={handleAddComment} className="flex gap-2 mt-3 relative z-10">
                  <Textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] text-sm resize-none flex-1 min-w-0"
                    maxLength={500}
                    onFocus={(e) => {
                      // Ensure textarea is visible on mobile
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 300);
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!commentInput.trim() || isSubmittingComment}
                    className="h-[60px] w-[60px] shrink-0 flex-shrink-0"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              )}
            </div>
      )}
    </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          handleCancelEdit();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Track/Playlist Info */}
            {currentPost.playlistId ? (
              <div className="flex gap-3">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {currentPost.playlistImage ? (
                    <img
                      src={currentPost.playlistImage}
                      alt={currentPost.playlistName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ListMusic className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Playlist: {currentPost.playlistName}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPost.playlistTrackCount || 0} tracks
                  </p>
                </div>
              </div>
            ) : currentPost.track ? (
              <div className="flex gap-3">
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
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-medium">{currentPost.track.name}</p>
                  <p className="text-sm text-muted-foreground">{currentPost.track.artist}</p>
                  {currentPost.track.album && (
                    <p className="text-xs text-muted-foreground">{currentPost.track.album}</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Thoughts */}
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

            {/* Visibility */}
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
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  handleCancelEdit();
                }}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
