import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getPlaylistByIdPublic, copyPlaylist } from "@/lib/playlist";
import { z } from "zod";

const copyPlaylistSchema = z.object({
  name: z.string().min(1).max(150).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sourcePlaylist = await getPlaylistByIdPublic(id);
    if (!sourcePlaylist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const json = await request.json();
    const { name } = copyPlaylistSchema.parse(json);

    const newPlaylist = await copyPlaylist(session.user.id, sourcePlaylist, name);

    return NextResponse.json({ playlist: newPlaylist }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to copy playlist:", error);
    return NextResponse.json(
      { error: "Failed to copy playlist" },
      { status: 500 }
    );
  }
}


