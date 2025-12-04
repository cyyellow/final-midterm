"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AddFriendDialog } from "./add-friend-dialog";

type Friend = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  lastfmUsername?: string | null;
};

type FriendWithStatus = Friend & {
  isListening?: boolean;
  trackName?: string | null;
  artistName?: string | null;
};

export function FriendsPageClient({ initialFriends }: { initialFriends: Friend[] }) {
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFriendsWithStatus();
  }, []);

  const loadFriendsWithStatus = async () => {
    setLoading(true);
    try {
      // Load friends list
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        const friendsList: Friend[] = data.friends || [];

        // Load status for each friend
        const friendsWithStatus = await Promise.all(
          friendsList.map(async (friend) => {
            // Use lastfmUsername if available, otherwise fallback to username
            const lastfmUsername = friend.lastfmUsername || friend.username;
            
            let nowPlaying = null;
            if (lastfmUsername) {
              try {
                const res = await fetch(`/api/lastfm/now-playing?username=${encodeURIComponent(lastfmUsername)}`);
                if (res.ok) {
                  const data = await res.json();
                  nowPlaying = data.track;
                }
              } catch (error) {
                // Silently fail if can't get status
              }
            }

            return {
              ...friend,
              isListening: Boolean(nowPlaying),
              trackName: nowPlaying?.name ?? null,
              artistName: nowPlaying?.artist?.["#text"] ?? null,
            };
          })
        );

        setFriends(friendsWithStatus);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      friend.displayName?.toLowerCase().includes(query) ||
      friend.username.toLowerCase().includes(query) ||
      friend.bio?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {friends.length} {friends.length === 1 ? "friend" : "friends"}
          </p>
        </div>
        <AddFriendDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onFriendAdded={loadFriendsWithStatus}
        />
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Friends List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredFriends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => (
            <Link
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="block"
            >
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatarUrl || undefined} />
                        <AvatarFallback>
                          {(friend.displayName || friend.username || "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {friend.isListening && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {friend.displayName || friend.username}
                        </p>
                        {friend.isListening && (
                          <Badge variant="secondary" className="text-xs">
                            Listening
                          </Badge>
                        )}
                      </div>
                      {friend.bio ? (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {friend.bio}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          @{friend.username}
                        </p>
                      )}
                      {friend.isListening && friend.trackName && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          🎵 {friend.trackName}
                          {friend.artistName && ` • ${friend.artistName}`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {searchQuery ? "No friends found" : "No friends yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Add friends to connect with them"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

