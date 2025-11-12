import { ObjectId, type WithId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";

export type AppUser = {
  _id: ObjectId;
  username?: string | null;
  usernameLower?: string | null;
  lastfmUsername?: string | null;
  image?: string | null;
  displayName?: string | null;
  bio?: string | null;
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

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        username: trimmed,
        usernameLower,
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


