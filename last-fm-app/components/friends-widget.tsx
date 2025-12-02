"use client";

import { UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AddFriendDialog } from "./add-friend-dialog";
import { useState } from "react";
import type { FriendStatus } from "./right-status";

type FriendsWidgetProps = {
  friendStatuses: FriendStatus[];
};

export function FriendsWidget({ friendStatuses }: FriendsWidgetProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Show only first 5 friends with status (like Discord)
  const displayFriends = friendStatuses.slice(0, 5);

  return (
    <>
      <AddFriendDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
      <Card className="flex flex-col border-t-0 rounded-none rounded-b-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Friends</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1"
            onClick={() => setShowAddDialog(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <ScrollArea className="h-[200px] px-2">
            {displayFriends.length > 0 ? (
              <div className="space-y-1">
                {displayFriends.map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/profile/${friend.id}`}
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={friend.avatarUrl || undefined} />
                        <AvatarFallback>
                          {(friend.displayName || friend.username || "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {friend.isListening && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-medium leading-none">
                          {friend.displayName || friend.username}
                        </p>
                        {friend.isListening && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            🎵
                          </Badge>
                        )}
                      </div>
                      {friend.isListening && friend.trackName && (
                        <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                          {friend.trackName}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
                {friendStatuses.length > 5 && (
                  <Link
                    href="/friends"
                    className="flex items-center justify-center rounded-md p-2 hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                  >
                    View all {friendStatuses.length} friends →
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No friends yet.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7"
                  onClick={() => setShowAddDialog(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Add Friend
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

