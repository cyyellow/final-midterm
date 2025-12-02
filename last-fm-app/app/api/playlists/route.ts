import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getUserPlaylists, createPlaylist } from "@/lib/playlist";
import { z } from "zod";

const createPlaylistSchema = z.object({
  name: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  image: z.string().optional(),
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
    const { name, description, image } = createPlaylistSchema.parse(json);
    
    // Generate default name if not provided
    let finalName = name?.trim();
    if (!finalName) {
      const existingPlaylists = await getUserPlaylists(session.user.id);
      // Find the next available playlist number
      const playlistNumbers = existingPlaylists
        .map(p => {
          const match = p.name.match(/^playlist(\d+)$/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      
      const nextNumber = playlistNumbers.length > 0 
        ? Math.max(...playlistNumbers) + 1 
        : 1;
      finalName = `playlist${nextNumber}`;
    }
    
    const playlist = await createPlaylist(session.user.id, finalName, description, image);
    return NextResponse.json({ playlist });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}

