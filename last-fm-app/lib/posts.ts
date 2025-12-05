import { clientPromise } from "./mongodb";
import { ObjectId } from "mongodb";
import type { Post, CreatePostInput, Comment } from "@/types/post";
import { getPlaylistByIdPublic } from "./playlist";

export async function createPost(
  userId: string,
  username: string,
  displayName: string | null,
  userImage: string | null,
  input: CreatePostInput
): Promise<Post> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const post = {
    userId,
    username,
    displayName: displayName || undefined,
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

export async function getPosts(limit = 100, currentUserId?: string, filter?: "friends" | "everyone"): Promise<Post[]> {
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

  // Build query based on filter
  let query: any;
  
  if (filter === "everyone") {
    // Everyone view: Show all public posts from anyone
    query = {
      $or: [
        // Public posts from anyone (new format with visibility field)
        { visibility: "public" },
        // Legacy public posts (old format with isPublic field)
        { isPublic: true }
      ]
    };
  } else {
    // Friends view (default): Show only posts from friends and self (public or friends-only), plus own private posts
    query = {
      $or: [
        // Public posts from friends or self (new format)
        {
          userId: { $in: allowedUserIds },
          visibility: "public"
        },
        // Legacy public posts from friends or self
        {
          userId: { $in: allowedUserIds },
          isPublic: true
        },
        // Friends-only posts from friends or self (new format)
        {
          userId: { $in: allowedUserIds },
          visibility: "friends"
        },
        // Legacy friends-only posts (old format - isPublic is false or missing, and user is friend/self)
        {
          userId: { $in: allowedUserIds },
          $and: [
            { $or: [{ isPublic: false }, { isPublic: { $exists: false } }] },
            { visibility: { $exists: false } }
          ]
        },
        // Private posts only from self
        {
          userId: currentUserId,
          visibility: "private"
        }
      ]
    };
  }

  const posts = await db
    .collection("posts")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  // Get unique user IDs to fetch display names
  const userIds = [...new Set(posts.map(p => p.userId).filter(Boolean))];
  const usersCollection = db.collection("users");
  const userObjectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  
  const users = await usersCollection
    .find({
      $or: [
        { _id: { $in: userObjectIds } },
        { id: { $in: userIds } },
      ],
    })
    .project({
      _id: 1,
      id: 1,
      displayName: 1,
    })
    .toArray();

  // Create a map of userId to displayName
  const userDisplayNameMap = new Map<string, string | null>();
  users.forEach((user) => {
    const userId = user._id?.toString() ?? (user as any).id;
    if (userId) {
      userDisplayNameMap.set(userId, user.displayName || null);
    }
  });

  // Get comment counts for all posts
  const postIds = posts.map((p) => p._id.toString());
  const commentCounts = await db
    .collection("comments")
    .aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ])
    .toArray();
  
  const commentCountMap = new Map<string, number>();
  commentCounts.forEach((item) => {
    commentCountMap.set(item._id, item.count);
  });

  // Process posts to update playlist data (image and track count)
  const processedPosts = await Promise.all(
    posts.map(async (post) => {
      let updatedPost = { ...post };
      
      // If post has playlistId, fetch current playlist data
      if (post.playlistId) {
        try {
          const playlist = await getPlaylistByIdPublic(post.playlistId);
          if (playlist) {
            // Update track count from current playlist
            updatedPost.playlistTrackCount = playlist.tracks?.length || 0;
            
            // Update image if missing or empty
            if (!post.playlistImage && playlist.tracks && playlist.tracks.length > 0) {
              const trackWithImage = playlist.tracks.find(track => track.image && track.image.trim() !== "");
              if (trackWithImage?.image) {
                updatedPost.playlistImage = trackWithImage.image;
              }
            }
          }
        } catch (error) {
          console.error("Error fetching playlist for post:", error);
        }
      }
      
      // If post doesn't have displayName, try to get it from the users map
      const displayName = updatedPost.displayName || userDisplayNameMap.get(updatedPost.userId) || undefined;
      const commentCount = commentCountMap.get(updatedPost._id.toString()) || 0;
      
      return {
        ...updatedPost,
        displayName,
        commentCount,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt instanceof Date ? updatedPost.createdAt : new Date(updatedPost.createdAt),
      };
    })
  );

  return processedPosts as Post[];
}

export async function getUserPosts(userId: string, limit = 100, currentUserId?: string): Promise<Post[]> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // Get displayName from users collection if not in post
  const usersCollection = db.collection("users");
  let userDisplayName: string | null = null;
  if (ObjectId.isValid(userId)) {
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { displayName: 1 } }
    );
    userDisplayName = user?.displayName || null;
  } else {
    const user = await usersCollection.findOne(
      { id: userId },
      { projection: { displayName: 1 } }
    );
    userDisplayName = user?.displayName || null;
  }

  // If viewing own profile, show all posts including private ones
  if (currentUserId === userId) {
    const query: any = { userId };
    const posts = await db
      .collection("posts")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get comment counts for all posts
    const postIds = posts.map((p) => p._id.toString());
    const commentCounts = await db
      .collection("comments")
      .aggregate([
        { $match: { postId: { $in: postIds } } },
        { $group: { _id: "$postId", count: { $sum: 1 } } },
      ])
      .toArray();
    
    const commentCountMap = new Map<string, number>();
    commentCounts.forEach((item) => {
      commentCountMap.set(item._id, item.count);
    });

    // Process posts and update playlist data (image and track count)
    const processedPosts = await Promise.all(
      posts.map(async (post) => {
        let updatedPost = { ...post };
        
        // If post has playlistId, fetch current playlist data
        if (post.playlistId) {
          try {
            const playlist = await getPlaylistByIdPublic(post.playlistId);
            if (playlist) {
              // Update track count from current playlist
              updatedPost.playlistTrackCount = playlist.tracks?.length || 0;
              
              // Update image if missing or empty
              if (!post.playlistImage && playlist.tracks && playlist.tracks.length > 0) {
                const trackWithImage = playlist.tracks.find(track => track.image && track.image.trim() !== "");
                if (trackWithImage?.image) {
                  updatedPost.playlistImage = trackWithImage.image;
                }
              }
            }
          } catch (error) {
            console.error("Error fetching playlist for post:", error);
          }
        }
        
        const commentCount = commentCountMap.get(updatedPost._id.toString()) || 0;
        
        return {
          ...updatedPost,
          displayName: updatedPost.displayName || userDisplayName || undefined,
          commentCount,
          _id: updatedPost._id.toString(),
          createdAt: updatedPost.createdAt instanceof Date ? updatedPost.createdAt : new Date(updatedPost.createdAt),
        } as Post;
      })
    );

    return processedPosts;
  }

  // If viewing someone else's profile, check if they are friends
  let isFriend = false;
  if (currentUserId) {
    const { getFriends } = await import("./friends");
    const friends = await getFriends(currentUserId);
    isFriend = friends.some(f => f.id === userId);
  }

  // Build query based on friendship
  let query: any;
  
  if (isFriend) {
    // Friends can see public and friends-only posts, but not private
    query = {
      userId,
      $or: [
        { visibility: "public" },
        { visibility: "friends" },
        // Legacy posts (isPublic: true or false/missing)
        { isPublic: true },
        { $and: [{ $or: [{ isPublic: false }, { isPublic: { $exists: false } }] }, { visibility: { $exists: false } }] }
      ]
    };
  } else {
    // Non-friends can only see public posts
    query = {
      userId,
      $or: [
        { visibility: "public" },
        // Legacy public posts
        { isPublic: true }
      ]
    };
  }

  const posts = await db
    .collection("posts")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  // Get comment counts for all posts
  const postIds = posts.map((p) => p._id.toString());
  const commentCounts = await db
    .collection("comments")
    .aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ])
    .toArray();
  
  const commentCountMap = new Map<string, number>();
  commentCounts.forEach((item) => {
    commentCountMap.set(item._id, item.count);
  });

  // Process posts and update playlist data (image and track count)
  const processedPosts = await Promise.all(
    posts.map(async (post) => {
      let updatedPost = { ...post };
      
      // If post has playlistId, fetch current playlist data
      if (post.playlistId) {
        try {
          const playlist = await getPlaylistByIdPublic(post.playlistId);
          if (playlist) {
            // Update track count from current playlist
            updatedPost.playlistTrackCount = playlist.tracks?.length || 0;
            
            // Update image if missing or empty
            if (!post.playlistImage && playlist.tracks && playlist.tracks.length > 0) {
              // Find first track with a non-empty image
              const trackWithImage = playlist.tracks.find(track => track.image && track.image.trim() !== "");
              if (trackWithImage?.image) {
                updatedPost.playlistImage = trackWithImage.image;
              }
            }
          }
        } catch (error) {
          // If playlist fetch fails, just continue without updating
          console.error("Error fetching playlist for post:", error);
        }
      }
      
      const commentCount = commentCountMap.get(updatedPost._id.toString()) || 0;
      
      return {
        ...updatedPost,
        displayName: updatedPost.displayName || userDisplayName || undefined,
        commentCount,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt instanceof Date ? updatedPost.createdAt : new Date(updatedPost.createdAt),
      } as Post;
    })
  );

  return processedPosts;
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

export async function togglePostLike(postId: string, userId: string): Promise<{ likes: number; isLiked: boolean }> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!ObjectId.isValid(postId)) {
    throw new Error("Invalid post ID");
  }

  const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });

  if (!post) {
    throw new Error("Post not found");
  }

  // Initialize likedBy array if it doesn't exist
  const likedBy = post.likedBy || [];
  const isLiked = likedBy.includes(userId);

  let newLikes: number;
  let newLikedBy: string[];

  if (isLiked) {
    // Unlike: remove user from likedBy array
    newLikedBy = likedBy.filter((id: string) => id !== userId);
    newLikes = Math.max(0, (post.likes || 0) - 1);
  } else {
    // Like: add user to likedBy array
    newLikedBy = [...likedBy, userId];
    newLikes = (post.likes || 0) + 1;
  }

  await db.collection("posts").updateOne(
    { _id: new ObjectId(postId) },
    {
      $set: {
        likes: newLikes,
        likedBy: newLikedBy,
      },
    }
  );

  return {
    likes: newLikes,
    isLiked: !isLiked,
  };
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



