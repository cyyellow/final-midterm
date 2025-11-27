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
  };

  const result = await db.collection("posts").insertOne(post);

  return {
    ...post,
    _id: result.insertedId.toString(),
  };
}

export async function getPosts(limit = 50): Promise<Post[]> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const posts = await db
    .collection("posts")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return posts.map((post) => ({
    ...post,
    _id: post._id.toString(),
  })) as Post[];
}

export async function getUserPosts(userId: string, limit = 50): Promise<Post[]> {
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

