import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { getFriends } from "@/lib/friends";
import { getNowPlaying } from "@/lib/lastfm";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lastfmUsername } = session.user;
    if (!lastfmUsername) {
      return NextResponse.json({ error: "Last.fm username not found" }, { status: 400 });
    }

    // Get current listening status
    let nowPlaying = null;
    try {
      nowPlaying = await getNowPlaying(lastfmUsername);
    } catch (error) {
      console.error("Failed to get now playing:", error);
    }

    // Get all friends
    const friends = await getFriends(session.user.id);

    // Broadcast status update to all friends
    if (pusherServer && friends.length > 0) {
      const statusUpdate = {
        userId: session.user.id,
        username: session.user.username || lastfmUsername,
        displayName: session.user.displayName || null,
        avatarUrl: session.user.image || null,
        trackName: nowPlaying?.name || null,
        artistName: nowPlaying?.artist?.["#text"] || null,
        isListening: Boolean(nowPlaying),
      };

      // Trigger event on each friend's personal channel
      await Promise.all(
        friends.map(async (friend) => {
          try {
            await pusherServer.trigger(
              `user-${friend.id}`,
              "friend-status-update",
              statusUpdate
            );
          } catch (error) {
            console.error(`Failed to broadcast to friend ${friend.id}:`, error);
          }
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error broadcasting friend status:", error);
    return NextResponse.json(
      { error: "Failed to broadcast status" },
      { status: 500 }
    );
  }
}

