"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Music, Plus, Loader2, Pin, Trash2, MoreVertical, Share2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { SharePlaylistDialog } from "@/components/share-playlist-dialog";
import type { Playlist } from "@/lib/playlist";

export function PlaylistsPageClient({ initialPlaylists }: { initialPlaylists: Playlist[] }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [copyingPlaylistId, setCopyingPlaylistId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Sync with initialPlaylists when they change (e.g., after router.refresh())
  useEffect(() => {
    setPlaylists(initialPlaylists);
  }, [initialPlaylists]);

  const handleCreate = async (e: React.FormEvent) => {
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
        // Reset form first
        setName("");
        setDescription("");
        setShowCreateForm(false);
        
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
        const errorData = await res.json().catch(() => ({}));
        toast({ 
          title: "Failed to create playlist", 
          description: errorData.error || "Something went wrong",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Failed to create playlist", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });

      if (res.ok) {
        setPlaylists(playlists.map(p => 
          p._id === id 
            ? { ...p, isPinned: !currentPinned }
            : { ...p, isPinned: false }
        ));
        toast({ title: currentPinned ? "Playlist unpinned" : "Playlist pinned to home" });
        router.refresh();
      }
    } catch (error) {
      toast({ title: "Failed to update playlist", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPlaylists(playlists.filter(p => p._id !== id));
        toast({ title: "Playlist deleted" });
        router.refresh();
      }
    } catch (error) {
      toast({ title: "Failed to delete playlist", variant: "destructive" });
    }
  };

  const handleCopy = async (id: string) => {
    if (copyingPlaylistId) return;
    
    setCopyingPlaylistId(id);
    try {
      const res = await fetch(`/api/playlists/${id}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Playlist copied successfully!" });
        router.push(`/playlists/${data.playlist._id}`);
      } else {
        const error = await res.json();
        toast({
          title: "Failed to copy playlist",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to copy playlist",
        variant: "destructive",
      });
    } finally {
      setCopyingPlaylistId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Playlists</h1>
        <Button 
          onClick={async () => {
            // Immediately create a new playlist and navigate to edit page
            setLoading(true);
            try {
              const res = await fetch("/api/playlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}), // Empty name will trigger auto-generation
              });

              if (res.ok) {
                const data = await res.json();
                if (data.playlist && data.playlist._id) {
                  // Navigate to edit page with new=true flag
                  router.push(`/playlists/${data.playlist._id}?new=true`);
                } else {
                  toast({ title: "Failed to create playlist", variant: "destructive" });
                }
              } else {
                toast({ title: "Failed to create playlist", variant: "destructive" });
              }
            } catch (error) {
              toast({ title: "Failed to create playlist", variant: "destructive" });
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </>
          )}
        </Button>
      </div>

      {/* Create Form - Inline (kept for backward compatibility, but can be removed) */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Playlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave empty for auto-generated name (playlist1, playlist2, ...)"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
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
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Edit
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setName("");
                  setDescription("");
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Playlists List */}
      {playlists.length > 0 ? (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <Card
              key={playlist._id}
              className="hover:bg-muted/60 transition-colors border border-border/60"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {(() => {
                    // Use playlist.image if available, otherwise find first track with non-placeholder image
                    const playlistImage = playlist.image || 
                      playlist.tracks.find(track => track.image && track.image.trim() !== "")?.image;
                    
                    return playlistImage ? (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={playlistImage}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    );
                  })()}
                  <CardTitle className="text-lg truncate">
                    <Link 
                      href={`/playlists/${playlist._id}`}
                      className="hover:underline"
                    >
                      {playlist.name}
                    </Link>
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPlaylist(playlist);
                        setShareDialogOpen(true);
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleCopy(playlist._id)}
                      disabled={copyingPlaylistId === playlist._id}
                    >
                      {copyingPlaylistId === playlist._id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Copying...
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </>
                      )}
                    </DropdownMenuItem>
                    {!playlist.isPinned && (
                      <DropdownMenuItem onClick={() => handlePin(playlist._id, false)}>
                        <Pin className="mr-2 h-4 w-4" /> Pin to Home
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(playlist._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {playlist.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{playlist.tracks.length} tracks</span>
                  {playlist.isPinned && (
                    <span className="flex items-center gap-1 text-primary">
                      <Pin className="h-3 w-3 rotate-45" />
                      Pinned
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No playlists yet. Create one to get started!</p>
          </CardContent>
        </Card>
      )}
      
      {selectedPlaylist && (
        <SharePlaylistDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          playlist={selectedPlaylist}
        />
      )}
    </div>
  );
}

