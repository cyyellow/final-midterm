import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { updatePlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from "@/lib/playlist";
import { z } from "zod";

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
    // Allow updating name, description, isPinned
    await updatePlaylist(session.user.id, id, json);
    return NextResponse.json({ success: true });
  } catch (error) {
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

