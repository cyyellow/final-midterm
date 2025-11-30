# 數據庫結構說明

## MongoDB 數據庫配置

### 數據庫名稱
- 由環境變數 `MONGODB_DB` 控制
- 默認值：`nextfm`（如果未設置）
- **重要**：所有模塊必須使用相同的數據庫名稱！

### 連接字符串
- 環境變數：`MONGODB_URI`
- 格式：`mongodb+srv://username:password@cluster.mongodb.net/`

## Collections（集合）

### 1. `users` Collection
這是**核心**集合，存儲所有用戶信息。

**文檔結構**：
```javascript
{
  _id: ObjectId("..."),           // NextAuth 生成的用戶 ID
  id: "...",                      // NextAuth 用戶 ID（字符串）
  name: "...",                    // NextAuth 用戶名
  email: null,                    // 通常為 null（Last.fm 不使用 email）
  emailVerified: null,
  image: "...",                   // 用戶頭像 URL
  accounts: [...],                // OAuth 賬戶信息
  sessions: [...],                // 會話信息（如果使用 JWT 策略）
  
  // 自定義字段
  username: "...",                // 用戶名（自定義）
  usernameLower: "...",           // 小寫用戶名（用於搜索）
  lastfmUsername: "...",          // Last.fm 用戶名
  displayName: "...",             // 顯示名稱
  bio: "...",                     // 個人簡介（可選）
  inviteCode: "ABCD1234",         // 邀請碼（8 位大寫字母數字）
  createdAt: ISODate("..."),      // 創建時間
  updatedAt: ISODate("...")       // 更新時間
}
```

**重要**：
- `users` collection 由 NextAuth 的 MongoDBAdapter 管理
- 自定義字段（如 `inviteCode`）通過 `updateOne` 添加
- 邀請碼存儲在 `inviteCode` 字段中

### 2. `follows` Collection
存儲好友關係（雙向）。

**文檔結構**：
```javascript
{
  _id: ObjectId("..."),
  followerId: "...",              // 關注者 ID（字符串）
  followeeId: "...",              // 被關注者 ID（字符串）
  createdAt: ISODate("...")       // 創建時間
}
```

**特點**：
- 每個好友關係創建兩條記錄（雙向）
- `followerId` 和 `followeeId` 都是用戶 ID 的字符串表示

### 3. `sessions` Collection
存儲 NextAuth 會話（如果使用 database 策略）。

### 4. `accounts` Collection
存儲 OAuth 賬戶鏈接。

### 5. `posts` Collection
存儲音樂分享帖子。

### 6. `events` Collection
存儲活動信息。

### 7. `chatMessages` Collection
存儲聊天消息。

## 邀請碼存儲位置

### 存儲位置
- **Collection**: `users`
- **字段**: `inviteCode`
- **格式**: 8 位大寫字母和數字（例如：`ABCD1234`）

### 查詢邀請碼
```javascript
// 通過邀請碼查找用戶
db.users.findOne({ inviteCode: "ABCD1234" })
```

### 檢查用戶是否有邀請碼
```javascript
// 查看所有用戶的邀請碼
db.users.find({}, { inviteCode: 1, username: 1, lastfmUsername: 1 })

// 查看沒有邀請碼的用戶
db.users.find({ inviteCode: { $exists: false } })

// 查看有邀請碼的用戶
db.users.find({ inviteCode: { $exists: true } })
```

## 常見問題

### 問題 1: 找不到邀請碼
**可能原因**：
1. 用戶還沒有邀請碼（舊用戶）
2. 數據庫名稱不一致（不同模塊使用了不同的數據庫）
3. 邀請碼字段名稱拼寫錯誤

**檢查方法**：
```javascript
// 1. 確認數據庫名稱
// 檢查 .env 文件中的 MONGODB_DB 變數

// 2. 在 MongoDB 中檢查
use your_database_name
db.users.findOne({ lastfmUsername: "username" }, { inviteCode: 1 })

// 3. 檢查所有用戶的邀請碼
db.users.find({}, { inviteCode: 1, username: 1 })
```

### 問題 2: 數據庫不一致
**解決方法**：
1. 確認所有環境變數 `MONGODB_DB` 都設置為相同的值
2. 確認開發環境和生產環境使用相同的數據庫名稱
3. 檢查 `.env` 文件中的配置

## 數據庫連接

所有模塊都通過 `lib/mongodb.ts` 連接：
```typescript
import { clientPromise } from "@/lib/mongodb";
const client = await clientPromise;
const db = client.db(process.env.MONGODB_DB);
```

確保：
1. ✅ 所有模塊使用相同的 `MONGODB_DB` 環境變數
2. ✅ 所有模塊使用相同的 `MONGODB_URI` 連接字符串
3. ✅ 開發和生產環境配置一致

