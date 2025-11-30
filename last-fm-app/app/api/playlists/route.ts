import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getUserPlaylists, createPlaylist } from "@/lib/playlist";
import { z } from "zod";

const createPlaylistSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await getUserPlaylists(session.user.id);
    return NextResponse.json({ playlists });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, description } = createPlaylistSchema.parse(json);
    
    const playlist = await createPlaylist(session.user.id, name, description);
    return NextResponse.json({ playlist });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}

