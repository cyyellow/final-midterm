import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LastfmArtist } from "@/lib/lastfm";

type WeeklyTopArtistsProps = {
  artists: LastfmArtist[];
};

export function WeeklyTopArtists({ artists }: WeeklyTopArtistsProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Weekly top artists
        </CardTitle>
      </CardHeader>
      <CardContent>
        {artists.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            We could not find any plays for this week yet. Start listening to
            see your chart here.
          </p>
        ) : (
          <ul className="space-y-4">
            {artists.map((artist, index) => (
              <li key={artist.mbid ?? `${artist.name}-${index}`}>
                <Link
                  href={artist.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-3 hover:border-primary/60 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {artist.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {artist.playcount} plays
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


