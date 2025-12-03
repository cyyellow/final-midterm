import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { updatePlaylist, deletePlaylist, checkPlaylistEditPermission, getPlaylistByIdPublic } from "@/lib/playlist";
import { z } from "zod";

const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(5000).optional().nullable(),
  image: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowPublicEdit: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const playlist = await getPlaylistByIdPublic(id);
    
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error("Failed to fetch playlist:", error);
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const json = await request.json();
    const validated = updatePlaylistSchema.parse(json);
    await updatePlaylist(session.user.id, id, validated);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("permission")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deletePlaylist(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}

