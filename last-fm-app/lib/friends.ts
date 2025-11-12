import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import { getNowPlaying } from "@/lib/lastfm";
import type { FriendStatus } from "@/components/right-status";

type FollowDoc = {
  _id: ObjectId;
  followerId: string;
  followeeId: string;
  createdAt: Date;
};

export async function getFriendStatuses(userId: string): Promise<FriendStatus[]> {
  if (!userId) return [];

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const follows = await db
    .collection<FollowDoc>("follows")
    .find({ followerId: userId })
    .limit(12)
    .toArray();

  if (!follows.length) {
    return [];
  }

  const userIds = follows
    .map((follow) => follow.followeeId)
    .filter(Boolean)
    .slice(0, 8);

  const usersCollection = db.collection("users");
  const followeeObjectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const users = await usersCollection
    .find({
      $or: [
        { _id: { $in: followeeObjectIds } },
        { id: { $in: userIds } },
      ],
    })
    .project({
      username: 1,
      lastfmUsername: 1,
      image: 1,
      displayName: 1,
    })
    .limit(12)
    .toArray();

  const statuses = await Promise.all(
    users.slice(0, 8).map(async (userDoc) => {
      const lastfmUsername =
        userDoc.lastfmUsername ??
        (typeof userDoc.username === "string" ? userDoc.username : undefined);

      let nowPlaying = null;
      if (lastfmUsername) {
        try {
          nowPlaying = await getNowPlaying(lastfmUsername);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `Failed to load now playing for ${lastfmUsername}:`,
              error,
            );
          }
        }
      }

      return {
        id: userDoc._id?.toString() ?? (userDoc as any).id ?? lastfmUsername ?? "",
        username: userDoc.username ?? lastfmUsername ?? "listener",
        displayName: userDoc.displayName ?? null,
        avatarUrl: userDoc.image ?? null,
        trackName: nowPlaying?.name ?? null,
        artistName: nowPlaying?.artist?.["#text"] ?? null,
        isListening: Boolean(nowPlaying),
      };
    }),
  );

  return statuses;
}

