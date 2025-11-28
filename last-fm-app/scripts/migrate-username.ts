import { MongoClient } from "mongodb";

// Get MongoDB URI and target userId from command line arguments
const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI!;
const TARGET_USER_ID = process.argv[3]; // Optional: specific userId to migrate to
const TARGET_USERNAME = process.argv[4] || "lacertilia"; // Optional: target username
const MONGODB_DB = process.argv[5] || process.env.MONGODB_DB || "lastfm-app";

async function migrateUsername() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    console.log("Using database:", MONGODB_DB);

    const db = client.db(MONGODB_DB);
    const postsCollection = db.collection("posts");
    const usersCollection = db.collection("users");

    const postCount = await postsCollection.countDocuments();
    console.log(`Total posts in collection: ${postCount}`);

    let targetUserId: string;
    let targetUsername: string;

    if (TARGET_USER_ID) {
      // Use the provided userId
      targetUserId = TARGET_USER_ID;
      targetUsername = TARGET_USERNAME;
      console.log(`Using provided target user: ${targetUsername} (ID: ${targetUserId})`);
    } else {
      // Find the most recent non-anonymous post to get the target userId
      const recentPost = await postsCollection.findOne(
        { username: { $not: { $regex: "^anonymous$", $options: "i" } } },
        { sort: { createdAt: -1 } }
      );

      if (!recentPost) {
        console.error("❌ Could not find any non-anonymous posts to determine target user");
        console.error("   Please provide a target userId as the 3rd argument");
        return;
      }

      targetUserId = recentPost.userId;
      targetUsername = recentPost.username;
      console.log(`Found target user: ${targetUsername} (ID: ${targetUserId})`);
    }

    // First, let's see what usernames exist
    const allPosts = await postsCollection.find({}).limit(10).toArray();
    console.log("\nAll posts in database:");
    allPosts.forEach((post, i) => {
      console.log(`  ${i + 1}. username: "${post.username}", userId: ${post.userId}, track: ${post.track?.name}`);
    });

    // Find all posts with username "anonymous" (case-insensitive)
    // MongoDB regex needs to be a string when using $regex
    const anonymousPosts = await postsCollection
      .find({ username: { $regex: "^anonymous$", $options: "i" } })
      .toArray();

    console.log(`\nFound ${anonymousPosts.length} posts with username matching /^anonymous$/i`);

    if (anonymousPosts.length === 0) {
      console.log("No posts to migrate");
      return;
    }

    // Show sample of posts to be updated
    console.log("\nPosts to be updated:");
    anonymousPosts.forEach((post, i) => {
      console.log(`  ${i + 1}. Track: ${post.track?.name}, Created: ${post.createdAt}, Current userId: ${post.userId}`);
    });

    // Update all anonymous posts to the target user (both username and userId)
    const result = await postsCollection.updateMany(
      { username: { $regex: "^anonymous$", $options: "i" } },
      { 
        $set: { 
          username: targetUsername,
          userId: targetUserId
        } 
      }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} posts`);
    console.log(`   - Username changed from "anonymous" to "${targetUsername}"`);
    console.log(`   - UserId changed to: ${targetUserId}`);
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the migration
console.log("Starting migration...");
console.log("MongoDB URI:", MONGODB_URI ? "✓ Set" : "✗ Not set");
console.log("Target User ID:", TARGET_USER_ID || "Not provided");
console.log("Target Username:", TARGET_USERNAME);
console.log("");

migrateUsername()
  .then(() => {
    console.log("\n🎵 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });

