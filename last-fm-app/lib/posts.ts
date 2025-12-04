import { clientPromise } from "./mongodb";
import { ObjectId } from "mongodb";
import type { Post, CreatePostInput, Comment } from "@/types/post";

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
    playlistId: input.playlistId,
    playlistName: input.playlistName,
    playlistImage: input.playlistImage,
    playlistTrackCount: input.playlistTrackCount,
    thoughts: input.thoughts,
    createdAt: new Date(),
    likes: 0,
    visibility: input.visibility ?? "friends",
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
        // Public posts from anyone
        { visibility: "public" },
        // Friends-only posts from friends or self
        {
          userId: { $in: allowedUserIds },
          visibility: "friends"
        },
        // Private posts only from self
        {
          userId: currentUserId,
          visibility: "private"
        }
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

export async function getUserPosts(userId: string, limit = 100, currentUserId?: string): Promise<Post[]> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // If viewing own profile, show all posts including private ones
  // If viewing someone else's profile, exclude private posts
  const query: any = { userId };
  if (currentUserId !== userId) {
    query.visibility = { $ne: "private" };
  }

  const posts = await db
    .collection("posts")
    .find(query)
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
    createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
  } as Post;
}

export async function updatePost(
  postId: string,
  updates: { thoughts: string; visibility?: "public" | "friends" | "private" }
): Promise<Post> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(postId)) {
    throw new Error("Invalid post ID");
  }

  const result = await db.collection("posts").findOneAndUpdate(
    { _id: new ObjectId(postId) },
    {
      $set: {
        thoughts: updates.thoughts,
        ...(updates.visibility !== undefined && { visibility: updates.visibility }),
      },
    },
    { returnDocument: "after" }
  );

  if (!result.value) {
    throw new Error("Post not found");
  }

  return {
    ...result.value,
    _id: result.value._id.toString(),
    createdAt: result.value.createdAt instanceof Date ? result.value.createdAt : new Date(result.value.createdAt),
  } as Post;
}

export async function deletePost(postId: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(postId)) {
    throw new Error("Invalid post ID");
  }

  // Delete post and all its comments
  await Promise.all([
    db.collection("posts").deleteOne({ _id: new ObjectId(postId) }),
    db.collection("comments").deleteMany({ postId }),
  ]);
}

export async function addComment(
  postId: string,
  userId: string,
  username: string,
  userImage: string | null,
  content: string
): Promise<Comment> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(postId)) {
    throw new Error("Invalid post ID");
  }

  const comment = {
    postId,
    userId,
    username,
    userImage: userImage || undefined,
    content: content.trim(),
    createdAt: new Date(),
  };

  const result = await db.collection("comments").insertOne(comment);

  return {
    ...comment,
    _id: result.insertedId.toString(),
    createdAt: comment.createdAt,
  };
}

export async function getComments(postId: string): Promise<Comment[]> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(postId)) {
    return [];
  }

  const comments = await db
    .collection("comments")
    .find({ postId })
    .sort({ createdAt: 1 })
    .toArray();

  return comments.map((comment) => ({
    ...comment,
    _id: comment._id.toString(),
    createdAt: comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt),
  })) as Comment[];
}

export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<Comment | null> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(commentId)) {
    return null;
  }

  const result = await db.collection("comments").findOneAndUpdate(
    { _id: new ObjectId(commentId), userId },
    {
      $set: {
        content: content.trim(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result.value) {
    return null;
  }

  return {
    ...result.value,
    _id: result.value._id.toString(),
    createdAt: result.value.createdAt instanceof Date ? result.value.createdAt : new Date(result.value.createdAt),
  } as Comment;
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(commentId)) {
    return false;
  }

  const result = await db.collection("comments").deleteOne({
    _id: new ObjectId(commentId),
    userId,
  });

  return result.deletedCount > 0;
}



