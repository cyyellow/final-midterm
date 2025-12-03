import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { addTrackToPlaylist, removeTrackFromPlaylist, checkPlaylistEditPermission } from "@/lib/playlist";
import { z } from "zod";

const addTrackSchema = z.object({
  name: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
});

export async function POST(
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
    const track = addTrackSchema.parse(json);

    const result = await addTrackToPlaylist(session.user.id, id, track);

    if (!result.success) {
      if (result.reason === "duplicate") {
        return NextResponse.json(
          { error: "Track already in playlist" },
          { status: 409 }
        );
      }
      if (result.reason === "no_permission") {
        return NextResponse.json(
          { error: "No permission to edit this playlist" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Failed to add track" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add track" }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await removeTrackFromPlaylist(session.user.id, id, url);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("permission")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to remove track" }, { status: 500 });
  }
}

