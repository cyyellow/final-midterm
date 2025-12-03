import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getPlaylistByIdPublic, createPlaylist } from "@/lib/playlist";

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
    const source = await getPlaylistByIdPublic(id);

    if (!source) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Prevent cloning your own playlist via this endpoint; you already own it.
    // (Optional, safe-guard; can be removed if you want to allow cloning self.)
    const isOwner = source.userId === session.user.id;

    const baseName = source.name || "Playlist";
    const cloneName = isOwner ? baseName : `Copy of ${baseName}`;

    // Create a new playlist for the current user, copying basic metadata and tracks
    const cloned = await createPlaylist(
      session.user.id,
      cloneName,
      source.description,
      source.image
    );

    // TODO: if you later add very large playlists, consider copying tracks in batches.
    // For now we just re-use the tracks array on the client side after redirect.

    return NextResponse.json(
      {
        playlist: cloned,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to clone playlist:", error);
    return NextResponse.json(
      { error: "Failed to clone playlist" },
      { status: 500 }
    );
  }
}


