# 邀請碼實現說明與調試

## 邀請碼實現原理

### 1. 邀請碼生成
- 每個用戶自動生成唯一的 8 位邀請碼（大寫字母和數字）
- 邀請碼在以下情況生成：
  - 用戶註冊時（`createUser` 事件）
  - 設置用戶名時（`setUsernameForUser` 或 `setUsernameAndDisplayName`）

### 2. 邀請碼存儲
- 存儲在 `users` collection 的 `inviteCode` 字段
- 格式：8 位大寫字母和數字（例如：`ABCD1234`）

### 3. 添加好友流程
1. 用戶輸入邀請碼
2. 系統通過邀請碼查找目標用戶
3. 檢查是否是自己
4. 檢查是否已經是好友
5. 創建雙向好友關係（在 `follows` collection 中創建兩條記錄）

## 常見問題

### 問題 1: "Invalid invite code"
**原因**：
- 邀請碼輸入錯誤
- 目標用戶還沒有邀請碼（舊用戶）

**解決方法**：
- 確認邀請碼正確（區分大小寫，但系統會自動轉為大寫）
- 如果目標用戶沒有邀請碼，需要讓他們重新設置用戶名或訪問個人資料

### 問題 2: "You are already friends"
**原因**：已經添加過這個好友

### 問題 3: 用戶 ID 格式不匹配
**原因**：NextAuth 的用戶 ID 可能是 ObjectId 字符串或普通字符串，需要統一處理

## 調試方法

### 檢查用戶是否有邀請碼
```javascript
// 在 MongoDB 中檢查
db.users.findOne({ lastfmUsername: "username" }, { inviteCode: 1 })
```

### 檢查好友關係
```javascript
// 查看所有好友關係
db.follows.find({ followerId: "your-user-id" })
```

### 生成邀請碼給舊用戶
如果舊用戶沒有邀請碼，可以通過以下方式生成：
1. 重新訪問個人資料頁面
2. 系統會自動調用 `getOrCreateInviteCode` 生成

