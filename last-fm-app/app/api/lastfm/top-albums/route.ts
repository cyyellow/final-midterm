import { NextResponse } from "next/server";
import { getTopAlbums } from "@/lib/lastfm";

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
    return NextResponse.json({ albums });
  } catch (error) {
    console.error("Failed to fetch top albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch top albums" },
      { status: 500 }
    );
  }
}

