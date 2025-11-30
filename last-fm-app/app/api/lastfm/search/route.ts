import { NextResponse } from "next/server";
import { searchTracks } from "@/lib/lastfm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }

  try {
    const tracks = await searchTracks(query, 20);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Failed to search tracks:", error);
    return NextResponse.json(
      { error: "Failed to search tracks" },
      { status: 500 }
    );
  }
}

