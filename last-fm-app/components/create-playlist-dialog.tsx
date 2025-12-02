"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function CreatePlaylistDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Name is optional now, API will generate default name if empty

    setLoading(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim() || undefined, 
          description: description.trim() || undefined 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.playlist || !data.playlist._id) {
          toast({ 
            title: "Failed to create playlist", 
            description: "Invalid response from server",
            variant: "destructive" 
          });
          setLoading(false);
          return;
        }
        setOpen(false);
        setName("");
        setDescription("");
        
        // Get playlist ID
        const playlistId = data.playlist._id;
        
        // Show toast briefly, then navigate
        toast({ title: "Playlist created!" });
        
        // Use window.location.replace for immediate navigation
        // This ensures the page fully reloads with the new playlist data
        setTimeout(() => {
          window.location.replace(`/playlists/${playlistId}`);
        }, 300);
      } else {
        toast({ title: "Failed to create playlist", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to create playlist", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[637px]">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
          <DialogDescription>
            Create a new collection for your favorite tracks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave empty for auto-generated name (playlist1, playlist2, ...)"
                maxLength={50}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                maxLength={200}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}




