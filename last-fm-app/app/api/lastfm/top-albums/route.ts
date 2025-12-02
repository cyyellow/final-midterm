import { NextResponse } from "next/server";
import { getTopAlbums } from "@/lib/lastfm";

// Cache album images for 1 hour (3600 seconds)
// This prevents re-fetching the same artist's top album on every page visit
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");

  if (!artist) {
    return NextResponse.json(
      { error: "Artist name is required" },
      { status: 400 }
    );
  }

  try {
    const albums = await getTopAlbums(artist, 1);
    return NextResponse.json(
      { albums },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch top albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch top albums" },
      { status: 500 }
    );
  }
}

