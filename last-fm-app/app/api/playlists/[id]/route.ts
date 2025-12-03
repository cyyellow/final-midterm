import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { updatePlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from "@/lib/playlist";
import { z } from "zod";

const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(5000).optional().nullable(),
  isPinned: z.boolean().optional(),
});

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
  } catch (error) {
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

