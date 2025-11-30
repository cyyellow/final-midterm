import { ObjectId, type WithId } from "mongodb";
import crypto from "crypto";

import { clientPromise } from "@/lib/mongodb";

export type AppUser = {
  _id: ObjectId;
  username?: string | null;
  usernameLower?: string | null;
  lastfmUsername?: string | null;
  image?: string | null;
  displayName?: string | null;
  bio?: string | null;
  inviteCode?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function getUsersCollection() {
  const client = await clientPromise;
  return client
    .db(process.env.MONGODB_DB)
    .collection<AppUser>("users");
}

export async function getUserById(userId: string) {
  const collection = await getUsersCollection();
  const filters = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };
  return collection.findOne(filters);
}

export async function isUsernameAvailable(username: string) {
  const collection = await getUsersCollection();
  const usernameLower = normalizeUsername(username);
  const existing = await collection.findOne({
    usernameLower,
  });
  return !existing;
}

export async function setUsernameForUser(userId: string, username: string) {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    throw new Error("Username must be at least 3 characters long.");
  }

  const usernameLower = normalizeUsername(trimmed);
  const collection = await getUsersCollection();

  const existing = await collection.findOne({
    usernameLower,
    ...(ObjectId.isValid(userId)
      ? { _id: { $ne: new ObjectId(userId) } }
      : {
          id: { $ne: userId },
        }),
  });

  if (existing) {
    throw new Error("This username is already taken.");
  }

  const filter = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };

  // Generate invite code if it doesn't exist
  const user = await collection.findOne(filter);
  let inviteCode = user?.inviteCode;
  if (!inviteCode) {
    inviteCode = await getOrCreateInviteCode(userId);
  }

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        username: trimmed,
        usernameLower,
        inviteCode,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return result.value as WithId<AppUser> | null;
}

export async function setUsernameAndDisplayName(
  userId: string,
  username: string,
  displayName: string
) {
  const trimmedUsername = username.trim();
  const trimmedDisplayName = displayName.trim();
  
  if (trimmedUsername.length < 3) {
    throw new Error("Username must be at least 3 characters long.");
  }

  if (trimmedDisplayName.length < 1) {
    throw new Error("Nickname is required.");
  }

  const usernameLower = normalizeUsername(trimmedUsername);
  const collection = await getUsersCollection();

  // Check if username is already taken by another user
  const existing = await collection.findOne({
    usernameLower,
    ...(ObjectId.isValid(userId)
      ? { _id: { $ne: new ObjectId(userId) } }
      : {
          id: { $ne: userId },
        }),
  });

  if (existing) {
    throw new Error("This username is already taken.");
  }

  const filter = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };

  // Generate invite code if it doesn't exist
  const user = await collection.findOne(filter);
  let inviteCode = user?.inviteCode;
  if (!inviteCode) {
    inviteCode = await getOrCreateInviteCode(userId);
  }

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        username: trimmedUsername,
        usernameLower,
        displayName: trimmedDisplayName,
        inviteCode,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return result.value as WithId<AppUser> | null;
}

/**
 * Generate a unique invite code (8 characters, alphanumeric)
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars like 0, O, I, 1
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get or create an invite code for a user
 */
export async function getOrCreateInviteCode(userId: string): Promise<string> {
  const collection = await getUsersCollection();
  const filter = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };

  const user = await collection.findOne(filter);
  
  if (user?.inviteCode) {
    return user.inviteCode;
  }

  // Generate a unique invite code
  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = await collection.findOne({ inviteCode });
    if (!existing) break;
    attempts++;
    if (attempts > 10) {
      // Fallback to a more unique code
      inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      break;
    }
  } while (true);

  await collection.updateOne(
    filter,
    {
      $set: {
        inviteCode,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return inviteCode;
}

/**
 * Find user by invite code
 */
export async function getUserByInviteCode(inviteCode: string): Promise<WithId<AppUser> | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ inviteCode: inviteCode.toUpperCase() });
}


