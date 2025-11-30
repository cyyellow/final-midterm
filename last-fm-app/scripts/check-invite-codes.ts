import { MongoClient } from "mongodb";

// 檢查邀請碼的腳本
const MONGODB_URI = process.env.MONGODB_URI || process.argv[2];
const MONGODB_DB = process.env.MONGODB_DB || process.argv[3] || "nextfm";

async function checkInviteCodes() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined");
    console.log("Usage: tsx scripts/check-invite-codes.ts <MONGODB_URI> [MONGODB_DB]");
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log(`📊 Using database: ${MONGODB_DB}\n`);

    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection("users");

    // 檢查數據庫中的用戶總數
    const totalUsers = await usersCollection.countDocuments();
    console.log(`👥 Total users: ${totalUsers}\n`);

    // 檢查有邀請碼的用戶
    const usersWithInviteCode = await usersCollection.countDocuments({
      inviteCode: { $exists: true, $ne: null },
    });
    console.log(`✅ Users with invite code: ${usersWithInviteCode}`);

    // 檢查沒有邀請碼的用戶
    const usersWithoutInviteCode = await usersCollection.countDocuments({
      $or: [
        { inviteCode: { $exists: false } },
        { inviteCode: null },
      ],
    });
    console.log(`❌ Users without invite code: ${usersWithoutInviteCode}\n`);

    // 顯示所有用戶的邀請碼
    if (totalUsers > 0) {
      console.log("📋 All users and their invite codes:");
      console.log("─".repeat(80));
      
      const users = await usersCollection
        .find({})
        .project({
          inviteCode: 1,
          username: 1,
          lastfmUsername: 1,
          displayName: 1,
        })
        .toArray();

      users.forEach((user: any) => {
        const username = user.username || user.lastfmUsername || "Unknown";
        const inviteCode = user.inviteCode || "❌ NO INVITE CODE";
        console.log(`${username.padEnd(30)} | ${inviteCode}`);
      });
      
      console.log("─".repeat(80));
    }

    // 測試查找邀請碼
    if (usersWithInviteCode > 0) {
      const sampleUser = await usersCollection.findOne({
        inviteCode: { $exists: true, $ne: null },
      });

      if (sampleUser?.inviteCode) {
        console.log(`\n🔍 Testing invite code lookup: ${sampleUser.inviteCode}`);
        const foundUser = await usersCollection.findOne({
          inviteCode: sampleUser.inviteCode,
        });
        
        if (foundUser) {
          console.log(`✅ Successfully found user: ${foundUser.username || foundUser.lastfmUsername}`);
        } else {
          console.log(`❌ Failed to find user by invite code`);
        }
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n👋 Connection closed");
  }
}

checkInviteCodes();

