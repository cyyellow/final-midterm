import { clientPromise } from "./mongodb";
import { ObjectId } from "mongodb";
import type { Post, CreatePostInput } from "@/types/post";

export async function createPost(
  userId: string,
  username: string,
  userImage: string | null,
  input: CreatePostInput
): Promise<Post> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const post = {
    userId,
    username,
    userImage: userImage || undefined,
    track: input.track,
    thoughts: input.thoughts,
    createdAt: new Date(),
    likes: 0,
    isPublic: input.isPublic ?? false,
  };

  const result = await db.collection("posts").insertOne(post);

  return {
    ...post,
    _id: result.insertedId.toString(),
  };
}

export async function getPosts(limit = 100, currentUserId?: string): Promise<Post[]> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // If no user ID is provided, return only public posts (if we had a public flag) or empty/limited list
  // For now, we'll assume posts are friends-only by default, so without a user ID we might return nothing
  // or return all posts if we want a public feed behavior (which seems to be current behavior).
  // But the user requested permission control.
  
  if (!currentUserId) {
    // If we want to enforce "friends only" and no user is logged in, return empty.
    // However, `getPosts` might be used in contexts where we want all posts (e.g. admin).
    // Let's keep the original behavior if no ID is passed, but typically we should pass ID.
    return [];
  }

  // Get list of friends
  const { getFriends } = await import("./friends");
  const friends = await getFriends(currentUserId);
  const friendIds = friends.map(f => f.id);

  // Include self
  const allowedUserIds = [...friendIds, currentUserId];

  const posts = await db
    .collection("posts")
    .find({
      $or: [
        { userId: { $in: allowedUserIds } },
        { isPublic: true }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return posts.map((post) => ({
    ...post,
    _id: post._id.toString(),
    createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
  })) as Post[];
}

export async function getUserPosts(userId: string, limit = 100): Promise<Post[]> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const posts = await db
    .collection("posts")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return posts.map((post) => ({
    ...post,
    _id: post._id.toString(),
    createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
  })) as Post[];
}

export async function getPostById(postId: string): Promise<Post | null> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(postId)) {
    return null;
  }

  const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });

  if (!post) {
    return null;
  }

  return {
    ...post,
    _id: post._id.toString(),
  } as Post;
}



