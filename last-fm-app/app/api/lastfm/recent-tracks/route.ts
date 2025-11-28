import { NextResponse } from "next/server";
import { getRecentTracks } from "@/lib/lastfm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    const tracks = await getRecentTracks(username, 50);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Failed to fetch recent tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent tracks" },
      { status: 500 }
    );
  }
}



