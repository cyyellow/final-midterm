"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Music, Globe, Lock, ListMusic, Edit2, Trash2, MessageSquare, Send, Loader2, MoreVertical } from "lucide-react";
import { getMusicLink } from "@/lib/music-links";
import { EditPostDialog } from "./edit-post-dialog";

interface FeedPostProps {
  post: Post;
}

export function FeedPost({ post }: FeedPostProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [commentsLoaded, setCommentsLoaded] = useState(!!post.comments);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);

  const isOwner = session?.user?.id === post.userId;

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
        toast({ title: "Comment added" });
      } else {
        toast({
          title: "Failed to add comment",
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
        window.location.reload();
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

  return (
    <>
      <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
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
                  {new Date(currentPost.createdAt).toLocaleDateString()}
                </span>
                {currentPost.isPublic ? (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
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
          <a
            href={getMusicLink(currentPost.track)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity"
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
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{currentPost.track.name}</p>
              <p className="text-sm text-muted-foreground">{currentPost.track.artist}</p>
              {currentPost.track.album && (
                <p className="text-xs text-muted-foreground">{currentPost.track.album}</p>
              )}
            </div>
          </a>
        ) : null}

        {currentPost.thoughts && (
          <p className="mt-3 text-sm leading-relaxed">{currentPost.thoughts}</p>
        )}

        {/* Comments Section */}
        <div className="mt-4 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">
              {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? "s" : ""}` : "Comment"}
            </span>
          </Button>

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
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] text-sm resize-none"
                    maxLength={500}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!commentInput.trim() || isSubmittingComment}
                    className="h-[60px] w-[60px] shrink-0"
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

      <EditPostDialog
        post={currentPost}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onPostUpdated={handlePostUpdated}
      />
    </>
  );
}
