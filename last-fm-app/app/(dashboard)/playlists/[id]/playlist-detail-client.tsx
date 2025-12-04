"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Trash2, Music, Edit2, Save, X, Upload, Users, Lock, Unlock, Share2, Copy, Globe, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { SharePlaylistDialog } from "@/components/share-playlist-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrackLink } from "@/components/track-link";
import type { Playlist, PlaylistTrack, PlaylistPermission } from "@/lib/playlist";
import type { LastfmTrack } from "@/lib/lastfm";

type PlaylistDetailClientProps = {
  initialPlaylist: Playlist;
  username: string;
  canEdit: boolean;
  isOwner: boolean;
};

export function PlaylistDetailClient({ initialPlaylist, username, canEdit, isOwner }: PlaylistDetailClientProps) {
  const [playlist, setPlaylist] = useState<Playlist>(initialPlaylist);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(playlist.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isPublic, setIsPublic] = useState(playlist.isPublic ?? false);
  const [allowPublicEdit, setAllowPublicEdit] = useState(playlist.allowPublicEdit ?? false);
  const [selectedTrackUrls, setSelectedTrackUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNewPlaylist = searchParams.get("new") === "true";

  const handleRemoveTrack = async (url: string) => {
    if (!canEdit) return;

    try {
      const res = await fetch(`/api/playlists/${playlist._id}/tracks?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPlaylist({
          ...playlist,
          tracks: playlist.tracks.filter((t) => t.url !== url),
        });
        toast({ title: "Removed from playlist" });
        router.refresh();
      }
    } catch (error) {
      toast({ title: "Failed to remove track", variant: "destructive" });
    }
  };

  // Get the best available image (consistent with AddTracksSection)
  const getBestImage = (images?: Array<{ size: string; "#text": string }>) => {
    if (!images || images.length === 0) return undefined;
    const img = images.find((i) => i.size === "extralarge")?.["#text"] ||
               images.find((i) => i.size === "large")?.["#text"] ||
               images.find((i) => i.size === "medium")?.["#text"] ||
               images.find((i) => i.size === "small")?.["#text"] ||
               images[0]?.["#text"];
    return img && img.trim() !== "" ? img : undefined;
  };

  const handleAddTrack = async (track: LastfmTrack) => {
    if (!canEdit) return;

    try {
      const newTrack = {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album?.["#text"],
        image: getBestImage(track.image),
        url: track.url || "#",
      };

      const res = await fetch(`/api/playlists/${playlist._id}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrack),
      });

      if (res.ok) {
        const addedTrack: PlaylistTrack = {
          ...newTrack,
          addedAt: new Date(),
        };
        
        // Avoid duplicates
        if (!playlist.tracks.some(t => t.url === newTrack.url)) {
          setPlaylist({
            ...playlist,
            tracks: [addedTrack, ...playlist.tracks],
          });
        }
        
        toast({ title: "Added to playlist" });
        router.refresh();
      } else {
        toast({ title: "Failed to add track", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to add track", variant: "destructive" });
    }
  };

  const handleToggleTrackSelected = (url?: string) => {
    if (!url) return;
    setSelectedTrackUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleBulkRemoveTracks = async () => {
    if (!canEdit || selectedTrackUrls.length === 0) return;

    try {
      await Promise.all(
        selectedTrackUrls.map((url) =>
          fetch(`/api/playlists/${playlist._id}/tracks?url=${encodeURIComponent(url)}`, {
            method: "DELETE",
          })
        )
      );

      setPlaylist((prev) => ({
        ...prev,
        tracks: prev.tracks.filter((t) => !selectedTrackUrls.includes(t.url || "")),
      }));
      setSelectedTrackUrls([]);
      toast({ title: "Removed selected tracks" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to remove tracks", variant: "destructive" });
    }
  };



  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/playlists">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Playlists
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing && canEdit ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-name">Playlist Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {editName.length}/150
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1 resize-none"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {editDescription.length}/5000
                  </p>
                </div>
                {isOwner && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isPublic" className="text-sm cursor-pointer flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Make playlist public
                      </Label>
                    </div>
                    {isPublic && (
                      <div className="flex items-center gap-2 ml-6">
                        <input
                          type="checkbox"
                          id="allowPublicEdit"
                          checked={allowPublicEdit}
                          onChange={(e) => setAllowPublicEdit(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="allowPublicEdit" className="text-sm cursor-pointer flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Allow anyone to edit
                        </Label>
                      </div>
                    )}
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        setIsSaving(true);
                        try {
                          const res = await fetch(`/api/playlists/${playlist._id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: editName.trim(),
                              description: editDescription.trim() || undefined,
                              ...(isOwner && {
                                isPublic,
                                allowPublicEdit: isPublic ? allowPublicEdit : false,
                              }),
                            }),
                          });

                          if (res.ok) {
                            setPlaylist({
                              ...playlist,
                              name: editName.trim(),
                              description: editDescription.trim() || undefined,
                              ...(isOwner && {
                                isPublic,
                                allowPublicEdit: isPublic ? allowPublicEdit : false,
                              }),
                            });
                            setIsEditing(false);
                            toast({ title: "Playlist updated" });
                            router.refresh();
                          } else {
                            toast({ title: "Failed to update playlist", variant: "destructive" });
                          }
                        } catch (error) {
                          toast({ title: "Failed to update playlist", variant: "destructive" });
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving || !editName.trim()}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(playlist.name);
                        setEditDescription(playlist.description || "");
                      }}
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{playlist.name}</h1>
                  {canEdit ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (isCopying) return;
                          setIsCopying(true);
                          try {
                            const res = await fetch(`/api/playlists/${playlist._id}/copy`, {
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
                            setIsCopying(false);
                          }
                        }}
                        disabled={isCopying}
                        className="h-8 w-8"
                        title="Copy playlist"
                      >
                        {isCopying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShareDialogOpen(true)}
                        className="h-8 w-8"
                        title="Share playlist"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (isCopying) return;
                          setIsCopying(true);
                          try {
                            const res = await fetch(`/api/playlists/${playlist._id}/copy`, {
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
                            setIsCopying(false);
                          }
                        }}
                        disabled={isCopying}
                        className="h-8 w-8"
                        title="Copy playlist"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShareDialogOpen(true)}
                        className="h-8 w-8"
                        title="Share playlist"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {playlist.description && (
                  <p className="text-muted-foreground">{playlist.description}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Playlist Tracks */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{playlist.tracks.length} Tracks</CardTitle>
              {canEdit && selectedTrackUrls.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkRemoveTracks}
                  className="h-8"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete selected ({selectedTrackUrls.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {playlist.tracks.length > 0 ? (
                  <div className="space-y-3">
                    {playlist.tracks.map((track, i) => (
                      <div key={`${track.url}-${i}`} className="flex items-center gap-3 group">
                        <TrackLink
                          track={{
                            name: track.name,
                            artist: track.artist,
                            url: track.url,
                          }}
                          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm cursor-pointer"
                        >
                          {track.image && track.image.trim() !== "" ? (
                            <Image
                              src={track.image}
                              alt={track.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              onError={() => {}}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Music className="h-6 w-6 text-primary/60" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-5 w-5 text-white fill-white" />
                          </div>
                        </TrackLink>
                        <div className="min-w-0 flex-1">
                          <TrackLink
                            track={{
                              name: track.name,
                              artist: track.artist,
                              url: track.url,
                            }}
                            className="truncate text-sm font-medium hover:underline block"
                          >
                            {track.name}
                          </TrackLink>
                          <p className="truncate text-xs text-muted-foreground">
                            {track.artist}
                          </p>
                          {track.album && (
                            <p className="truncate text-xs text-muted-foreground/70">
                              {track.album}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <Checkbox
                            checked={track.url ? selectedTrackUrls.includes(track.url) : false}
                            onCheckedChange={() => handleToggleTrackSelected(track.url)}
                            className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground">
                    <Music className="h-12 w-12 mb-4" />
                    <p className="text-sm">No songs in this playlist yet.</p>
                    <p className="text-xs mt-1">Add tracks using the panel on the right.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <SharePlaylistDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        playlist={playlist}
      />
    </div>
  );
}


