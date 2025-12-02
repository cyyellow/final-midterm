"use client";

import { useState, useEffect } from "react";
import { Copy, Check, UserPlus, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type AddFriendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFriendAdded?: () => void;
};

export function AddFriendDialog({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  // Load invite code when dialog opens
  useEffect(() => {
    if (open) {
      loadInviteCode();
      setError(null);
      setSuccess(null);
      setInviteInput("");
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
        toast({ title: "Friend added successfully!" });
        onFriendAdded?.();
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        setError(data.error || "Failed to add friend");
        toast({ title: data.error || "Failed to add friend", variant: "destructive" });
      }
    } catch (error) {
      setError("Failed to add friend. Please try again.");
      toast({ title: "Failed to add friend. Please try again.", variant: "destructive" });
    } finally {
      setAddingFriend(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

