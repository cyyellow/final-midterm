"use client";

import { useState, useEffect } from "react";
import { Copy, Check, UserPlus, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

type Friend = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type FriendsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FriendsDialog({ open, onOpenChange }: FriendsDialogProps) {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load invite code and friends when dialog opens
  useEffect(() => {
    if (open) {
      loadInviteCode();
      loadFriends();
    }
  }, [open]);

  const loadInviteCode = async () => {
    try {
      const res = await fetch("/api/friends/invite-code");
      if (res.ok) {
        const data = await res.json();
        setInviteCode(data.inviteCode);
      }
    } catch (error) {
      console.error("Failed to load invite code:", error);
    }
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAddingFriend(true);

    try {
      const res = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteInput.toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Friend added successfully!");
        setInviteInput("");
        // Reload friends list
        await loadFriends();
        // Refresh the page to update friend statuses
        window.location.reload();
      } else {
        setError(data.error || "Failed to add friend");
      }
    } catch (error) {
      setError("Failed to add friend. Please try again.");
    } finally {
      setAddingFriend(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
          <DialogDescription>
            Share your invite code or enter a friend's code to connect.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Code Section */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium mb-2 block">
                Your Invite Code
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono text-lg tracking-wider"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyInviteCode}
                  disabled={!inviteCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with friends so they can add you
              </p>
            </CardContent>
          </Card>

          {/* Add Friend Section */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAddFriend} className="space-y-4">
                <Label htmlFor="invite-code" className="text-sm font-medium">
                  Add Friend by Invite Code
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="invite-code"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    className="font-mono uppercase"
                    maxLength={20}
                    disabled={addingFriend}
                  />
                  <Button type="submit" disabled={!inviteInput || addingFriend}>
                    {addingFriend ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-green-600">{success}</p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Friends List */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" />
                <Label className="text-sm font-medium">
                  Your Friends ({friends.length})
                </Label>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatarUrl || undefined} />
                        <AvatarFallback>
                          {friend.username[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {friend.displayName || friend.username}
                        </p>
                        {friend.displayName && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No friends yet. Share your invite code to get started!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

