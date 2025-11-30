# Pusher 設置指南

## 1. 創建 Pusher 應用

1. 訪問 [Pusher Dashboard](https://dashboard.pusher.com/)
2. 創建新應用
3. 選擇設置：
   - **Name**: `next.fm` (或你喜歡的名稱)
   - **Cluster**: 選擇離你用戶最近的區域
   - **Front end**: React
   - **Back end**: Node.js
4. 點擊 "Create app"

## 2. 獲取憑證

創建應用後，在 "Keys" 標籤頁可以看到：
- **App ID**
- **Key**
- **Secret**
- **Cluster** (例如: ap3, us2, eu)

## 3. 設置環境變數

在 `.env` 文件中添加以下變數：

```env
# Pusher 服務端配置
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=ap3

# Pusher 客戶端配置（必須以 NEXT_PUBLIC_ 開頭）
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=ap3
```

**注意**：
- `PUSHER_KEY` 和 `NEXT_PUBLIC_PUSHER_KEY` 使用相同的值
- `PUSHER_CLUSTER` 和 `NEXT_PUBLIC_PUSHER_CLUSTER` 使用相同的值
- `NEXT_PUBLIC_*` 變數會暴露給客戶端，所以只放 Key 和 Cluster，不要放 Secret

## 4. 部署到 Vercel

在 Vercel 項目設置中添加相同的環境變數：
1. 進入項目設置
2. 選擇 "Environment Variables"
3. 添加所有 Pusher 相關變數

## 5. 測試

1. 啟動開發服務器：`npm run dev`
2. 創建一個活動並啟用聊天室
3. 加入活動
4. 發送消息，應該會即時顯示在其他用戶的屏幕上

## 6. 工作原理

- **發送消息**：當用戶發送消息時，API 會將消息保存到數據庫，然後通過 Pusher 推送到所有訂閱該活動頻道的客戶端
- **接收消息**：客戶端訂閱 `event-{eventId}` 頻道，當有新消息時會自動更新 UI
- **後備方案**：如果 Pusher 未配置或失敗，系統會自動回退到輪詢機制

## 7. 免費額度

Pusher 免費計劃包括：
- 200,000 消息/天
- 100 並發連接
- 無限制頻道

對於大多數應用來說這已經足夠了。

## 故障排除

### 消息沒有實時更新

1. 檢查環境變數是否正確設置
2. 檢查瀏覽器控制台是否有錯誤
3. 確認 Pusher Dashboard 中顯示有連接
4. 檢查網絡連接是否正常

### 連接失敗

1. 確認 `NEXT_PUBLIC_PUSHER_KEY` 和 `NEXT_PUBLIC_PUSHER_CLUSTER` 已設置
2. 檢查 Cluster 是否正確（例如 ap3, us2, eu）
3. 確認沒有防火牆阻止 WebSocket 連接

