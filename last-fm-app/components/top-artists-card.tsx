"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { LastfmArtist } from "@/lib/lastfm";
import { Trophy, ChevronDown } from "lucide-react";

function ArtistAvatar({ artist, albumImage }: { artist: LastfmArtist; albumImage?: string | null }) {
  const [hasError, setHasError] = useState(false);
  
  const getImageUrl = () => {
    // Prefer album image if available
    if (albumImage && albumImage.trim() !== "") {
      return albumImage;
    }
    
    // Fallback to artist image
    if (!artist.image || artist.image.length === 0) return null;
    
    const sizeOrder = ["extralarge", "large", "medium", "small", "mega"];
    for (const size of sizeOrder) {
      const image = artist.image.find(i => 
        i.size?.toLowerCase() === size && 
        i["#text"] && 
        i["#text"].trim() !== ""
      );
      if (image && image["#text"].trim() !== "") {
        return image["#text"];
      }
    }
    
    return null;
  };
  
  const imageUrl = getImageUrl();
  const showImage = imageUrl && !hasError;
  
  if (!showImage) {
    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback>{artist.name[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
    );
  }
  
  return (
    <Avatar className="h-10 w-10">
      <AvatarImage 
        src={imageUrl} 
        alt={artist.name}
        onError={() => setHasError(true)}
        onLoad={() => {
          if (hasError) setHasError(false);
        }}
      />
      <AvatarFallback>{artist.name[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function TopArtistsCard({ artists }: { artists: LastfmArtist[] }) {
  const [albumImages, setAlbumImages] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchAlbumImages = async () => {
      const topArtists = artists.slice(0, 5);
      const imageMap: Record<string, string | null> = {};
      const artistNames = topArtists.map(a => a.name).join(",");
      const CACHE_KEY = `top_artist_albums_${artistNames}`;
      const CACHE_DURATION = 3600000; // 1 hour in milliseconds

      // Try to load from cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION) {
            // Use cached data
            setAlbumImages(data);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        // Cache read failed, continue to fetch
      }

      // Fetch album images for all artists in parallel
      await Promise.all(
        topArtists.map(async (artist) => {
          try {
            const res = await fetch(`/api/lastfm/top-albums?artist=${encodeURIComponent(artist.name)}`);
            if (res.ok) {
              const data = await res.json();
              const albums = data.albums || [];
              if (albums.length > 0) {
                const album = albums[0];
                // Get the best available image size
                const imageUrl = album.image?.find((img: { size: string }) => img.size === "large")?.["#text"] ||
                                album.image?.find((img: { size: string }) => img.size === "extralarge")?.["#text"] ||
                                album.image?.find((img: { size: string }) => img.size === "medium")?.["#text"] ||
                                album.image?.[0]?.["#text"];
                if (imageUrl && imageUrl.trim() !== "") {
                  imageMap[artist.name] = imageUrl;
                } else {
                  imageMap[artist.name] = null;
                }
              } else {
                imageMap[artist.name] = null;
              }
            } else {
              imageMap[artist.name] = null;
            }
          } catch (error) {
            console.error(`Failed to fetch album for ${artist.name}:`, error);
            imageMap[artist.name] = null;
          }
        })
      );

      // Save to cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: imageMap,
          timestamp: Date.now(),
        }));
      } catch (error) {
        // Cache write failed, ignore
      }

      setAlbumImages(imageMap);
      setLoading(false);
    };

    if (artists.length > 0) {
      fetchAlbumImages();
    } else {
      setLoading(false);
    }
  }, [artists]);

  return (
    <Card className="h-full">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-base">Top Artists (Last 7 Days)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && artists.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {artists.length} artists
              </span>
            )}
            <ChevronDown 
              className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {artists.slice(0, 5).map((artist, index) => (
              <div key={artist.name} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <ArtistAvatar 
                  artist={artist} 
                  albumImage={loading ? undefined : albumImages[artist.name]}
                />
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
      )}
    </Card>
  );
}

