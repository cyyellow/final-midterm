# Recap 功能實現說明

## 數據來源
Recap 功能使用 **Last.fm API** 的 `user.getRecentTracks` 方法來獲取用戶的聆聽歷史。

## 實現流程

### 1. 時間範圍設定
```typescript
// 計算當年的開始和結束時間（Unix timestamp）
const currentYear = new Date().getFullYear();
const yearStart = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);
const yearEnd = Math.floor(new Date(currentYear, 11, 31, 23, 59, 59).getTime() / 1000);
```

### 2. API 請求
```typescript
getUserListeningStats(username, yearStart, yearEnd)
```
- 方法：`user.getRecentTracks`
- 參數：
  - `user`: Last.fm 用戶名
  - `limit`: 1000（Last.fm API 單次請求的最大限制）
  - `from`: 年份開始時間戳
  - `to`: 年份結束時間戳

### 3. 返回數據結構
```typescript
{
  tracks: LastfmTrack[],        // 實際返回的歌曲列表（最多 1000 首）
  totalScrobbles: number,       // 總播放次數（來自 API 的 @attr.total）
  totalPages: number            // 總頁數
}
```

### 4. 統計計算
在 `RecapStatsCard` 組件中：
- **Total Scrobbles**: 使用 `totalScrobbles`（來自 API，準確）
- **Unique Artists/Songs/Albums**: 從 `tracks` 數組中計算唯一值

## 數據準確性分析

### ✅ 準確的數據
1. **Total Scrobbles（總播放次數）**
   - 來源：Last.fm API 的 `@attr.total` 屬性
   - 準確性：**100% 準確**
   - 這是 Last.fm 服務器計算的總數，不受分頁限制

### ⚠️ 可能不準確的數據
2. **Unique Artists（不同藝術家數量）**
3. **Unique Songs（不同歌曲數量）**
4. **Unique Albums（不同專輯數量）**

**問題原因：**
- Last.fm API 每次請求最多返回 1000 條記錄
- 目前實現只獲取第一頁數據（`tracks` 數組）
- 唯一值統計只基於這 1000 條記錄計算
- 如果用戶一年內播放超過 1000 首不同的歌曲，統計會不完整

**示例：**
- 如果用戶今年播放了 5000 次，但只有 800 首不同的歌曲
- `totalScrobbles` 會顯示 5000（準確）
- `uniqueSongs` 可能只顯示 800（如果這 800 首都在前 1000 條記錄中）
- 但如果用戶播放了 2000 首不同的歌曲，而前 1000 條記錄只包含 600 首，則 `uniqueSongs` 會顯示 600（不準確）

## 改進方案

### 方案 1：分頁獲取所有數據（推薦但耗時）
```typescript
// 需要循環獲取所有頁面
for (let page = 1; page <= totalPages; page++) {
  const pageData = await getUserListeningStats(username, yearStart, yearEnd, page);
  allTracks.push(...pageData.tracks);
}
// 然後從所有 tracks 計算唯一值
```
**優點：** 數據完全準確  
**缺點：** 
- 如果用戶有大量播放記錄，可能需要數十次 API 請求
- 載入時間會很長（可能 10-30 秒）
- Last.fm API 有速率限制

### 方案 2：使用 Last.fm 的其他 API（如果可用）
- 檢查是否有專門的統計 API
- 某些統計可能已經由 Last.fm 計算好

### 方案 3：顯示數據來源說明
- 在 UI 上標註「基於前 1000 條記錄」
- 讓用戶知道這是估算值

## 當前實現的限制

1. **只獲取第一頁數據**（最多 1000 條記錄）
2. **唯一值統計可能不完整**（如果用戶播放記錄很多）
3. **總播放次數是準確的**（來自 Last.fm 服務器）

## 建議

對於大多數用戶：
- 如果一年內播放次數 < 1000，數據是準確的
- 如果播放次數 > 1000，唯一值統計可能不完整，但總播放次數仍然準確

如果要提高準確性，可以實現分頁獲取，但需要權衡載入時間和用戶體驗。


