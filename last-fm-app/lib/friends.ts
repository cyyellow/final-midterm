import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import { getNowPlaying } from "@/lib/lastfm";
import type { FriendStatus } from "@/components/right-status";
import { getUserByInviteCode } from "@/lib/users";

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

/**
 * Add a friend by invite code (creates bidirectional friendship)
 */
export async function addFriendByInviteCode(
  currentUserId: string,
  inviteCode: string
): Promise<{ success: boolean; message: string }> {
  if (!currentUserId || !inviteCode) {
    return { success: false, message: "Invalid user ID or invite code." };
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // Find user by invite code
  const targetUser = await getUserByInviteCode(inviteCode.toUpperCase());
  if (!targetUser) {
    return { success: false, message: "Invalid invite code." };
  }

  // Normalize user IDs to ensure consistent format (always use string representation)
  const normalizeUserId = (userId: string): string => {
    if (ObjectId.isValid(userId)) {
      return new ObjectId(userId).toString();
    }
    return userId;
  };

  const targetUserId = targetUser._id.toString();
  const normalizedCurrentUserId = normalizeUserId(currentUserId);
  const normalizedTargetUserId = normalizeUserId(targetUserId);

  // Check if trying to add self (compare normalized IDs)
  if (normalizedCurrentUserId === normalizedTargetUserId) {
    return { success: false, message: "You cannot add yourself as a friend." };
  }

  // Check if already friends (bidirectional check)
  // Check both normalized and original formats to handle edge cases
  const existingFollow1 = await db.collection("follows").findOne({
    $or: [
      { followerId: normalizedCurrentUserId, followeeId: normalizedTargetUserId },
      { followerId: currentUserId, followeeId: targetUserId },
    ],
  });

  const existingFollow2 = await db.collection("follows").findOne({
    $or: [
      { followerId: normalizedTargetUserId, followeeId: normalizedCurrentUserId },
      { followerId: targetUserId, followeeId: currentUserId },
    ],
  });

  if (existingFollow1 || existingFollow2) {
    return { success: false, message: "You are already friends with this user." };
  }

  // Create bidirectional friendship using normalized IDs
  const now = new Date();
  await db.collection("follows").insertMany([
    {
      followerId: normalizedCurrentUserId,
      followeeId: normalizedTargetUserId,
      createdAt: now,
    },
    {
      followerId: normalizedTargetUserId,
      followeeId: normalizedCurrentUserId,
      createdAt: now,
    },
  ]);

  return {
    success: true,
    message: `Successfully added ${targetUser.username || targetUser.lastfmUsername || "user"} as a friend!`,
  };
}

/**
 * Get list of friends for a user
 */
export async function getFriends(userId: string): Promise<Array<{
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}>> {
  if (!userId) return [];

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const follows = await db
    .collection<FollowDoc>("follows")
    .find({ followerId: userId })
    .toArray();

  if (!follows.length) {
    return [];
  }

  const userIds = follows.map((follow) => follow.followeeId).filter(Boolean);
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
    .toArray();

  return users.map((userDoc) => ({
    id: userDoc._id?.toString() ?? (userDoc as any).id ?? "",
    username: userDoc.username ?? userDoc.lastfmUsername ?? "listener",
    displayName: userDoc.displayName ?? null,
    avatarUrl: userDoc.image ?? null,
  }));
}

