"use client";

import { useState } from "react";
import { Music, MoreVertical, Trash2, Pin, PinOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import type { Playlist } from "@/lib/playlist";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function PlaylistsWidget({ playlists }: { playlists: Playlist[] }) {
  const { toast } = useToast();
  const router = useRouter();

  const handlePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });

      if (res.ok) {
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
        toast({ title: "Playlist deleted" });
        router.refresh();
      }
    } catch (error) {
      toast({ title: "Failed to delete playlist", variant: "destructive" });
    }
  };

  return (
    <Card className="flex flex-col border-t-0 rounded-none rounded-b-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium">My Playlists</CardTitle>
        <CreatePlaylistDialog />
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <ScrollArea className="h-[150px] px-2">
          {playlists.length > 0 ? (
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      <Music className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-none">
                        {playlist.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground mt-1">
                        {playlist.tracks.length} tracks
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {playlist.isPinned && (
                      <Pin className="h-3 w-3 text-primary mr-1 rotate-45" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePin(playlist._id, !!playlist.isPinned)}>
                          {playlist.isPinned ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" /> Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" /> Pin to Home
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(playlist._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No playlists yet. Create one!
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}




