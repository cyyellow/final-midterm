"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, TrendingUp, Disc, Users } from "lucide-react";
import type { LastfmTrack } from "@/lib/lastfm";

type RecapStatsCardProps = {
  listeningStats: {
    tracks: LastfmTrack[];
    totalScrobbles: number;
    totalPages: number;
  };
  year: number;
};

export function RecapStatsCard({ listeningStats, year }: RecapStatsCardProps) {
  const totalTracks = listeningStats.totalScrobbles || listeningStats.tracks.length;
  
  // Calculate unique counts from listening stats
  const uniqueArtists = new Set<string>();
  const uniqueSongs = new Set<string>();
  const uniqueAlbums = new Set<string>();
  
  listeningStats.tracks.forEach((track) => {
    if (track.artist?.["#text"]) {
      uniqueArtists.add(track.artist["#text"]);
    }
    if (track.name) {
      uniqueSongs.add(`${track.name} - ${track.artist?.["#text"] || "Unknown"}`);
    }
    if (track.album?.["#text"]) {
      uniqueAlbums.add(`${track.album["#text"]} - ${track.artist?.["#text"] || "Unknown"}`);
    }
  });
  
  const uniqueArtistsCount = uniqueArtists.size;
  const uniqueSongsCount = uniqueSongs.size;
  const uniqueAlbumsCount = uniqueAlbums.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {year} Listening Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Music className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Total Scrobbles</p>
            </div>
            <p className="text-2xl font-bold">{totalTracks.toLocaleString()}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Unique Artists</p>
            </div>
            <p className="text-2xl font-bold">{uniqueArtistsCount.toLocaleString()}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Unique Songs</p>
            </div>
            <p className="text-2xl font-bold">{uniqueSongsCount.toLocaleString()}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Disc className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Unique Albums</p>
            </div>
            <p className="text-2xl font-bold">{uniqueAlbumsCount.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

