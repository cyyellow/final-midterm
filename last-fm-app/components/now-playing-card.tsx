import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LastfmTrack } from "@/lib/lastfm";

type NowPlayingCardProps = {
  track: LastfmTrack | null;
};

export function NowPlayingCard({ track }: NowPlayingCardProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4">
        {track?.image?.length ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-lg">
            <Image
              src={track.image.at(-1)?.["#text"] || track.image[0]["#text"]}
              alt={track.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            ♫
          </div>
        )}
        <div>
          <CardTitle className="text-base">Now playing</CardTitle>
          {track ? (
            <CardDescription>
              <span className="block text-lg font-semibold text-foreground">
                {track.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {track.artist?.["#text"] ?? "Unknown Artist"}
              </span>
            </CardDescription>
          ) : (
            <CardDescription>No track currently playing.</CardDescription>
          )}
        </div>
      </CardHeader>
      {track ? (
        <CardContent className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <span>
            Album:{" "}
            <strong className="font-medium text-foreground">
              {track.album?.["#text"] ?? "—"}
            </strong>
          </span>
          <a
            href={track.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            View on Last.fm
          </a>
        </CardContent>
      ) : null}
    </Card>
  );
}


