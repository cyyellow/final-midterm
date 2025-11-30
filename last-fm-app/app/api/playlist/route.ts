import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getUserPlaylist, addToPlaylist, removeFromPlaylist } from "@/lib/playlist";
import { z } from "zod";

const addTrackSchema = z.object({
  name: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlist = await getUserPlaylist(session.user.id);
    return NextResponse.json({ playlist });
  } catch (error) {
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
    const track = addTrackSchema.parse(json);
    
    await addToPlaylist(session.user.id, track);
    return NextResponse.json({ success: true });
  } catch (error) {
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

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await removeFromPlaylist(session.user.id, url);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove track" }, { status: 500 });
  }
}

