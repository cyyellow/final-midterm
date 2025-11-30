"use client";

import { useState } from "react";
import { Loader2, Plus, X, Music, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppUser, FavoriteTrack } from "@/lib/users";
import type { LastfmTrack } from "@/lib/lastfm";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

type EditProfileDialogProps = {
  user: AppUser;
  currentUserLastfmUsername: string;
};

export function EditProfileDialog({ user, currentUserLastfmUsername }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [favoriteTracks, setFavoriteTracks] = useState<FavoriteTrack[]>(user.favoriteTracks || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          favoriteTracks,
        }),
      });

      if (res.ok) {
        toast({ title: "Profile updated" });
        setOpen(false);
        router.refresh();
      } else {
        toast({ title: "Failed to update profile", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeTrack = (index: number) => {
    setFavoriteTracks(prev => prev.filter((_, i) => i !== index));
  };

  const addTrack = (track: LastfmTrack) => {
    if (favoriteTracks.length >= 5) {
      toast({ title: "Maximum 5 favorite tracks", variant: "destructive" });
      return;
    }
    
    const newTrack: FavoriteTrack = {
      name: track.name,
      artist: track.artist["#text"],
      image: track.image?.find(i => i.size === "medium")?.["#text"],
      url: track.url,
    };

    setFavoriteTracks(prev => [...prev, newTrack]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              maxLength={160}
              placeholder="Tell us about yourself..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Favorite Tracks ({favoriteTracks.length}/5)</Label>
              <AddFavoriteTrackDialog 
                username={currentUserLastfmUsername} 
                onAdd={addTrack}
                disabled={favoriteTracks.length >= 5} 
              />
            </div>
            
            {favoriteTracks.length > 0 ? (
              <div className="space-y-2">
                {favoriteTracks.map((track, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                    <Avatar className="h-10 w-10 rounded-md">
                      <AvatarImage src={track.image} />
                      <AvatarFallback><Music className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeTrack(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Add your anthem or favorite tracks to show on your profile.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddFavoriteTrackDialog({ 
  username, 
  onAdd, 
  disabled 
}: { 
  username: string; 
  onAdd: (track: LastfmTrack) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<LastfmTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentTracks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lastfm/recent-tracks?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!disabled) {
        setOpen(val);
        if (val) loadRecentTracks();
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1" disabled={disabled}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select from Recent Tracks</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {tracks.map((track, i) => (
                  <div key={`${track.url}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-10 w-10 rounded-md">
                      <AvatarImage src={track.image?.find(img => img.size === "medium")?.["#text"]} />
                      <AvatarFallback><Music className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {track.artist["#text"]}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        onAdd(track);
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

