"use client";

import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { Playlist } from "@/lib/playlist";

type SharePlaylistButtonProps = {
  playlists: Playlist[];
};

export function SharePlaylistButton({ playlists }: SharePlaylistButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [thoughts, setThoughts] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const selectedPlaylist = playlists.find((p) => p._id === selectedPlaylistId);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylistId || !selectedPlaylist) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: selectedPlaylist._id,
          playlistName: selectedPlaylist.name,
          playlistImage: selectedPlaylist.tracks[0]?.image,
          playlistTrackCount: selectedPlaylist.tracks.length,
          thoughts: thoughts.trim() || `Check out my playlist: ${selectedPlaylist.name}`,
          isPublic,
        }),
      });

      if (res.ok) {
        toast({ title: "Playlist shared!" });
        setOpen(false);
        setSelectedPlaylistId("");
        setThoughts("");
        setIsPublic(false);
        router.refresh();
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

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Share2 className="mr-2 h-4 w-4" />
        Share Playlist
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Playlist</DialogTitle>
            <DialogDescription>
              Share one of your playlists with your friends
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist">Select Playlist</Label>
              <Select
                value={selectedPlaylistId}
                onValueChange={setSelectedPlaylistId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a playlist..." />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist._id} value={playlist._id}>
                      {playlist.name} ({playlist.tracks.length} tracks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedPlaylistId}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


