import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LastfmArtist } from "@/lib/lastfm";
import { Trophy } from "lucide-react";

export function TopArtistsCard({ artists }: { artists: LastfmArtist[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <CardTitle className="text-base">Top Artists (Last 7 Days)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {artists.slice(0, 5).map((artist, index) => (
            <div key={artist.name} className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={artist.image?.find(i => i.size === "medium")?.["#text"]} />
                <AvatarFallback>{artist.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{artist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {parseInt(artist.playcount).toLocaleString()} plays
                </p>
              </div>
            </div>
          ))}
          {artists.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No listening data yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

