import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/lastfm";

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
    const track = await getNowPlaying(username);
    return NextResponse.json({ track });
  } catch (error) {
    console.error("Failed to fetch now playing:", error);
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 500 }
    );
  }
}

