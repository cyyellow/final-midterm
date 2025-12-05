import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getHomepagePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from "@/lib/playlist";
import { z } from "zod";

const addTrackSchema = z.object({
  name: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  playlistId: z.string().optional(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlist = await getHomepagePlaylist(session.user.id);
    return NextResponse.json({ playlist });
  } catch {
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = addTrackSchema.parse(json);
    
    if (!data.playlistId) {
      return NextResponse.json({ error: "playlistId is required" }, { status: 400 });
    }

    const result = await addTrackToPlaylist(session.user.id, data.playlistId, {
      name: data.name,
      artist: data.artist,
      album: data.album,
      image: data.image,
      url: data.url,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.reason || "Failed to add track" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to add track" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const playlistId = searchParams.get("playlistId");

    if (!url || !playlistId) {
      return NextResponse.json({ error: "URL and playlistId are required" }, { status: 400 });
    }

    await removeTrackFromPlaylist(session.user.id, playlistId, url);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove track" }, { status: 500 });
  }
}

