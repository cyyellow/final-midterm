"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Share2, Link2, MessageCircle, Users, Loader2, Copy, Check, Globe, Lock, Edit2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Playlist } from "@/lib/playlist";

type SharePlaylistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
};

type Friend = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export function SharePlaylistDialog({ open, onOpenChange, playlist }: SharePlaylistDialogProps) {
  const { data: session } = useSession();
  const [shareMethod, setShareMethod] = useState<"link" | "chat" | "society">("link");
  const [thoughts, setThoughts] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(playlist.isPublic ?? false);
  const [allowPublicEdit, setAllowPublicEdit] = useState(playlist.allowPublicEdit ?? false);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isOwner = session?.user?.id === playlist.userId;

  // Load friends when dialog opens and chat tab is selected
  useEffect(() => {
    if (open && shareMethod === "chat" && friends.length === 0) {
      loadFriends();
    }
  }, [open, shareMethod]);

  // Initialize permissions from playlist when dialog opens
  useEffect(() => {
    if (open) {
      setIsPublic(playlist.isPublic ?? false);
      setAllowPublicEdit(playlist.allowPublicEdit ?? false);
    }
  }, [open, playlist.isPublic, playlist.allowPublicEdit]);

  const handleUpdatePermissions = async () => {
    if (!isOwner) return;

    setIsUpdatingPermissions(true);
    try {
      const res = await fetch(`/api/playlists/${playlist._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublic,
          allowPublicEdit: isPublic ? allowPublicEdit : false,
        }),
      });

      if (res.ok) {
        toast({ title: "Permissions updated" });
        router.refresh();
      } else {
        toast({ title: "Failed to update permissions", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to update permissions", variant: "destructive" });
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
      toast({
        title: "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleCopyLink = async () => {
    const playlistUrl = `${window.location.origin}/playlists/${playlist._id}`;
    try {
      await navigator.clipboard.writeText(playlistUrl);
      setLinkCopied(true);
      toast({ title: "Link copied to clipboard!" });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleShareToChat = async () => {
    if (!selectedFriendId) {
      toast({
        title: "Please select a friend",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update playlist permissions if owner
      if (isOwner) {
        await fetch(`/api/playlists/${playlist._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isPublic,
            allowPublicEdit: isPublic ? allowPublicEdit : false,
          }),
        });
      }

      const message = thoughts.trim() 
        ? thoughts.trim()
        : `Check out my playlist: ${playlist.name}`;

      const res = await fetch(`/api/chat/private/${selectedFriendId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message,
          playlistPreview: {
            playlistId: playlist._id,
            playlistName: playlist.name,
            playlistImage: playlist.tracks[0]?.image || playlist.image,
            trackCount: playlist.tracks.length,
          },
        }),
      });

      if (res.ok) {
        toast({ title: "Playlist shared in chat!" });
        const friendId = selectedFriendId; // Save before resetting
        // Close dialog first
        onOpenChange(false);
        setThoughts("");
        setSelectedFriendId("");
        // Delay navigation to ensure dialog is fully closed and overlay is removed
        setTimeout(() => {
          router.push(`/chat?friend=${friendId}`);
        }, 300);
      } else {
        const error = await res.json();
        toast({
          title: "Failed to share playlist",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to share playlist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareToSociety = async () => {
    setIsSubmitting(true);
    try {
      // Update playlist permissions if owner
      if (isOwner) {
        await fetch(`/api/playlists/${playlist._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isPublic,
            allowPublicEdit: isPublic ? allowPublicEdit : false,
          }),
        });
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: playlist._id,
          playlistName: playlist.name,
          playlistImage: playlist.tracks[0]?.image,
          playlistTrackCount: playlist.tracks.length,
          thoughts: thoughts.trim() || `Check out my playlist: ${playlist.name}`,
          isPublic,
        }),
      });

      if (res.ok) {
        toast({ title: "Playlist shared to My Society!" });
        // Close dialog first
        onOpenChange(false);
        setThoughts("");
        // Delay refresh to ensure dialog is fully closed and overlay is removed
        setTimeout(() => {
          router.refresh();
        }, 300);
      } else {
        const error = await res.json();
        toast({
          title: "Failed to share playlist",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to share playlist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Playlist</DialogTitle>
          <DialogDescription>
            Share "{playlist.name}" with your friends
          </DialogDescription>
        </DialogHeader>

        {/* Permissions Section - Moved to top */}
        {isOwner && (
          <div className="space-y-3 pb-4 border-b">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">一般存取權 (General Access)</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPublic ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                      {isPublic ? "知道連結的任何人" : "僅限擁有者"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="share-isPublic"
                      checked={isPublic}
                      onChange={(e) => {
                        setIsPublic(e.target.checked);
                        if (!e.target.checked) {
                          setAllowPublicEdit(false);
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="share-isPublic" className="text-sm cursor-pointer">
                      {isPublic ? "公開" : "私人"}
                    </Label>
                  </div>
                </div>
                {isPublic && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">編輯權限</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="share-allowPublicEdit"
                          checked={allowPublicEdit}
                          onChange={(e) => setAllowPublicEdit(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="share-allowPublicEdit" className="text-sm cursor-pointer">
                          {allowPublicEdit ? "任何人都可編輯" : "僅限擁有者"}
                        </Label>
                      </div>
                    </div>
                    {allowPublicEdit && (
                      <p className="text-xs text-muted-foreground ml-6">
                        任何知道這個連結的網際網路使用者都能編輯
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="button"
              onClick={handleUpdatePermissions}
              disabled={isUpdatingPermissions}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isUpdatingPermissions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新權限"
              )}
            </Button>
          </div>
        )}

        <Tabs value={shareMethod} onValueChange={(v) => setShareMethod(v as typeof shareMethod)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <Link2 className="mr-2 h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="society">
              <Users className="mr-2 h-4 w-4" />
              My Society
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Playlist Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 rounded-md border bg-muted text-sm truncate">
                  {typeof window !== "undefined" ? `${window.location.origin}/playlists/${playlist._id}` : ""}
                </div>
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  {linkCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="friend">Select Friend</Label>
              {loadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No friends yet. Add friends to share playlists with them!
                </div>
              ) : (
                <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a friend..." />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map((friend) => (
                      <SelectItem key={friend.id} value={friend.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={friend.avatarUrl || undefined} alt={friend.username} />
                            <AvatarFallback>
                              {(friend.displayName || friend.username)[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{friend.displayName || friend.username}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="thoughts">Message (optional)</Label>
              <Textarea
                id="thoughts"
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="Add a message..."
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {200 - thoughts.length} characters remaining
              </p>
            </div>
            <Button
              onClick={handleShareToChat}
              disabled={isSubmitting || !selectedFriendId || loadingFriends}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send to Chat
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="society" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="thoughts">Your thoughts (optional)</Label>
              <Textarea
                id="thoughts"
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="Share what you think about this playlist..."
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {200 - thoughts.length} characters remaining
              </p>
            </div>
            <Button
              onClick={handleShareToSociety}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Share to My Society
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

