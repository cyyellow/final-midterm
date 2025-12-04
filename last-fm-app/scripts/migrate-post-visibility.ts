import { MongoClient } from "mongodb";

// Get MongoDB URI from command line arguments or environment
const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI!;
const MONGODB_DB = process.argv[3] || process.env.MONGODB_DB || "lastfm-app";

async function migratePostVisibility() {
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

    const totalPosts = await postsCollection.countDocuments();
    console.log(`\nTotal posts in collection: ${totalPosts}`);

    // Find posts that need migration (have isPublic but no visibility, or have neither)
    const postsToMigrate = await postsCollection
      .find({
        $or: [
          { isPublic: { $exists: true }, visibility: { $exists: false } },
          { isPublic: { $exists: false }, visibility: { $exists: false } }
        ]
      })
      .toArray();

    console.log(`\nFound ${postsToMigrate.length} posts that need migration`);

    if (postsToMigrate.length === 0) {
      console.log("✅ No posts need migration. All posts already have visibility field.");
      return;
    }

    // Show sample of posts to be updated
    console.log("\nSample of posts to be migrated:");
    postsToMigrate.slice(0, 5).forEach((post, i) => {
      console.log(`  ${i + 1}. Post ID: ${post._id}`);
      console.log(`     - isPublic: ${post.isPublic ?? "undefined"}`);
      console.log(`     - visibility: ${post.visibility ?? "undefined"}`);
      console.log(`     - Track: ${post.track?.name ?? "N/A"}`);
    });
    if (postsToMigrate.length > 5) {
      console.log(`     ... and ${postsToMigrate.length - 5} more`);
    }

    let publicCount = 0;
    let friendsCount = 0;
    let defaultCount = 0;

    // Migrate posts with isPublic field
    const postsWithIsPublic = postsToMigrate.filter(p => p.isPublic !== undefined);
    if (postsWithIsPublic.length > 0) {
      // Convert isPublic: true → visibility: "public"
      const publicResult = await postsCollection.updateMany(
        { isPublic: true, visibility: { $exists: false } },
        {
          $set: { visibility: "public" },
          $unset: { isPublic: "" }
        }
      );
      publicCount = publicResult.modifiedCount;
      console.log(`\n✅ Converted ${publicCount} posts from isPublic: true → visibility: "public"`);

      // Convert isPublic: false → visibility: "friends"
      const friendsResult = await postsCollection.updateMany(
        { isPublic: false, visibility: { $exists: false } },
        {
          $set: { visibility: "friends" },
          $unset: { isPublic: "" }
        }
      );
      friendsCount = friendsResult.modifiedCount;
      console.log(`✅ Converted ${friendsCount} posts from isPublic: false → visibility: "friends"`);
    }

    // Migrate posts without either field (default to "friends")
    const postsWithoutFields = postsToMigrate.filter(
      p => p.isPublic === undefined && p.visibility === undefined
    );
    if (postsWithoutFields.length > 0) {
      const defaultResult = await postsCollection.updateMany(
        { isPublic: { $exists: false }, visibility: { $exists: false } },
        {
          $set: { visibility: "friends" }
        }
      );
      defaultCount = defaultResult.modifiedCount;
      console.log(`✅ Set ${defaultCount} posts without visibility field → visibility: "friends" (default)`);
    }

    const totalMigrated = publicCount + friendsCount + defaultCount;
    console.log(`\n🎵 Migration completed successfully!`);
    console.log(`   Total posts migrated: ${totalMigrated}`);
    console.log(`   - Public: ${publicCount}`);
    console.log(`   - Friends: ${friendsCount + defaultCount}`);
    console.log(`   - Removed isPublic field from ${publicCount + friendsCount} posts`);

    // Verify migration
    const remaining = await postsCollection.countDocuments({
      $or: [
        { isPublic: { $exists: true }, visibility: { $exists: false } },
        { isPublic: { $exists: false }, visibility: { $exists: false } }
      ]
    });
    if (remaining > 0) {
      console.log(`\n⚠️  Warning: ${remaining} posts still need migration`);
    } else {
      console.log(`\n✅ All posts have been migrated successfully!`);
    }
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the migration
console.log("Starting post visibility migration...");
console.log("MongoDB URI:", MONGODB_URI ? "✓ Set" : "✗ Not set");
console.log("MongoDB DB:", MONGODB_DB);
console.log("");

migratePostVisibility()
  .then(() => {
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });

