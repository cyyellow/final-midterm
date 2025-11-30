# 實時聊天實現說明

## 當前實現方式

目前聊天室使用**優化輪詢（Optimized Polling）**機制：

- **參與者**：每 1.5 秒輪詢一次（較快的響應）
- **非參與者**：每 5 秒輪詢一次（節省資源）
- **發送消息後**：立即刷新消息列表

### 優點
- ✅ 無需額外服務或配置
- ✅ 簡單可靠，適合小規模使用
- ✅ 在 Vercel 等 Serverless 環境中工作良好

### 缺點
- ⚠️ 不是真正的實時（最多 1.5 秒延遲）
- ⚠️ 會產生較多的 HTTP 請求
- ⚠️ 不適合高並發場景

## 改進選項

### 選項 1: 使用 Pusher（推薦用於生產環境）

Pusher 提供真正的 WebSocket 實時通信，適合生產環境。

#### 安裝
```bash
npm install pusher pusher-js
```

#### 設置環境變數
```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

#### 實現示例

**服務端** (`lib/pusher.ts`):
```typescript
import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

**API 路由** (`app/api/events/[id]/chat/route.ts`):
```typescript
// 發送消息時觸發 Pusher 事件
await pusherServer.trigger(`event-${eventId}`, "new-message", chatMessage);
```

**客戶端** (`components/event-detail-dialog.tsx`):
```typescript
import Pusher from "pusher-js";

useEffect(() => {
  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  const channel = pusher.subscribe(`event-${event._id}`);
  channel.bind("new-message", (data: ChatMessage) => {
    setMessages((prev) => [...prev, data]);
  });

  return () => {
    channel.unbind_all();
    channel.unsubscribe();
    pusher.disconnect();
  };
}, [event._id]);
```

### 選項 2: 使用 Server-Sent Events (SSE)

SSE 是單向的實時通信，適合消息推送場景。

**注意**：Vercel Serverless Functions 對 SSE 支持有限，可能需要額外配置。

### 選項 3: 使用 Ably

Ably 是另一個實時通信服務，提供類似 Pusher 的功能。

## 建議

- **開發/測試環境**：使用當前的優化輪詢即可
- **生產環境（小規模）**：優化輪詢仍然可用
- **生產環境（大規模/高並發）**：建議使用 Pusher 或 Ably

## 當前實現的性能

- 每個活躍聊天室每 1.5 秒產生 1 個請求
- 10 個活躍聊天室 = 約 400 請求/分鐘
- 對於大多數應用來說這是可接受的

如果需要升級到真正的實時通信，可以參考上面的 Pusher 示例。

