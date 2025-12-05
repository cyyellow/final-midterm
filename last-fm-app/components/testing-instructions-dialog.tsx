"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function TestingInstructionsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-muted-foreground hover:text-foreground">
          測試說明
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            測試說明
          </DialogTitle>
          <DialogDescription>
            以下是測試帳號使用說明與功能測試指南
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">網站簡介</h3>
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <p className="text-sm text-foreground leading-relaxed">
                這是一個讓您記錄對所聽音樂的想法，並查看朋友正在聽什麼的社交音樂平台。您可以分享正在聆聽的音樂，點擊網站上的曲目並直接在 YouTube 上播放，或是將曲目記錄到播放清單中與朋友分享！
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">1. 登入測試帳號</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              請使用以下測試帳號登入 Last.fm，然後使用 Last.fm 帳號登入我們的服務：
            </p>
            <div className="bg-muted/50 rounded-md p-4 space-y-1">
              <p className="text-sm">
                <span className="font-medium">使用者名稱：</span>nextfm-user
              </p>
              <p className="text-sm">
                <span className="font-medium">密碼：</span>nextFM1141!
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">限制</h3>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                此測試帳號已包含一些我們預先處理的歌曲資料。若您想測試實際的聆聽記錄/scrobble 功能，請參考下方的指南設定 scrobble。
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">2. Scrobble 功能測試指南</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              如果您想測試 scrobble 功能，可以參考以下方式連接不同平台：
            </p>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-md p-4">
                <h4 className="font-medium text-sm mb-2">Spotify</h4>
                <p className="text-xs text-muted-foreground">
                  在 Last.fm 設定中連接 Spotify 帳號，即可自動記錄 Spotify 播放的音樂。
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-4">
                <h4 className="font-medium text-sm mb-2">YouTube (網頁版)</h4>
                <p className="text-xs text-muted-foreground">
                  使用瀏覽器擴充功能（如 Web Scrobbler）連接 YouTube 與 Last.fm 帳號。
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-4">
                <h4 className="font-medium text-sm mb-2">Android</h4>
                <p className="text-xs text-muted-foreground">
                  在 Android 裝置上安裝 Last.fm 官方應用程式，並登入測試帳號以記錄播放記錄。
                </p>
              </div>
              <div className="bg-muted/50 rounded-md p-4">
                <h4 className="font-medium text-sm mb-2">Apple (iOS)</h4>
                <p className="text-xs text-muted-foreground">
                  在 iOS 裝置上安裝 Last.fm 官方應用程式，或使用支援 Last.fm 的音樂播放器應用程式。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">3. 注意事項</h3>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                請注意：部分功能尚未完成，且手機和 Spotify 的 scrobble 記錄功能目前仍不穩定，可能會出現記錄延遲或遺漏的情況。
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

