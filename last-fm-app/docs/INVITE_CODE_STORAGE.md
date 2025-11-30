# 邀請碼存儲位置說明

## 存儲位置

### 數據庫層級
- **數據庫名稱**: 由環境變數 `MONGODB_DB` 控制
- **默認值**: `nextfm`（如果未設置）
- **Collection**: `users`
- **字段**: `inviteCode`

### 完整路徑
```
MongoDB Connection (MONGODB_URI)
  └── Database (MONGODB_DB)
      └── Collection: users
          └── Field: inviteCode
```

## 關鍵點

### 1. 所有用戶必須在同一個數據庫中
- ✅ 用戶 A 和用戶 B 必須連接到**同一個 MongoDB 數據庫**
- ✅ 數據庫名稱必須相同（通過 `MONGODB_DB` 環境變數設置）

### 2. 邀請碼存儲在 `users` collection
```javascript
{
  _id: ObjectId("..."),
  inviteCode: "ABCD1234",  // ← 邀請碼存儲在這裡
  username: "...",
  lastfmUsername: "...",
  ...
}
```

### 3. 查找邏輯
```typescript
// lib/users.ts
export async function getUserByInviteCode(inviteCode: string) {
  const collection = await getUsersCollection();
  // 查詢同一個數據庫中的 users collection
  return collection.findOne({ inviteCode: inviteCode.toUpperCase() });
}
```

## 可能導致找不到邀請碼的原因

### 原因 1: 數據庫不一致 ❌
**問題**: 兩個用戶連接到不同的數據庫

**檢查方法**:
1. 確認兩個用戶的 `.env` 文件中 `MONGODB_DB` 值相同
2. 確認 `MONGODB_URI` 指向同一個 MongoDB 實例

**解決方法**:
- 統一數據庫名稱
- 確認使用相同的 MongoDB 連接字符串

### 原因 2: 用戶還沒有邀請碼 ❌
**問題**: 舊用戶可能還沒有邀請碼

**檢查方法**:
```javascript
// 在 MongoDB shell 中執行
db.users.findOne(
  { lastfmUsername: "目標用戶名" }, 
  { inviteCode: 1, username: 1 }
)
```

**解決方法**:
- 訪問個人資料頁面會自動生成
- 或者運行生成腳本

### 原因 3: 邀請碼未正確保存 ❌
**問題**: 邀請碼生成後沒有正確寫入數據庫

**檢查方法**:
```javascript
// 查看所有用戶的邀請碼
db.users.find({}, { inviteCode: 1, username: 1, lastfmUsername: 1 })
```

## 檢查步驟

### 步驟 1: 確認數據庫連接
檢查 `.env` 文件：
```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=nextfm  # 確保兩個用戶使用相同的數據庫名稱
```

### 步驟 2: 在 MongoDB 中檢查
```javascript
// 連接到 MongoDB
use nextfm  // 或你的數據庫名稱

// 查看所有用戶的邀請碼
db.users.find({}, { inviteCode: 1, username: 1, lastfmUsername: 1 })

// 查找特定用戶的邀請碼
db.users.findOne({ lastfmUsername: "用戶名" }, { inviteCode: 1 })

// 查找沒有邀請碼的用戶
db.users.find({ inviteCode: { $exists: false } })
```

### 步驟 3: 測試邀請碼查找
```javascript
// 測試通過邀請碼查找用戶
db.users.findOne({ inviteCode: "ABCD1234" })
```

## 解決方案

### 方案 1: 確保使用相同數據庫
- 確認兩個用戶都使用相同的 `MONGODB_DB` 環境變數
- 確認連接到同一個 MongoDB 實例

### 方案 2: 為所有用戶生成邀請碼
運行腳本為所有用戶生成邀請碼（如果需要，我可以創建這個腳本）

### 方案 3: 檢查數據庫連接
確認環境變數設置正確，並且能正常連接到數據庫

