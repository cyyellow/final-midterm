import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { checkPlaylistEditPermission } from "@/lib/playlist";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { canEdit, isOwner } = await checkPlaylistEditPermission(
      session.user.id,
      id
    );

    return NextResponse.json({ canEdit, isOwner });
  } catch (error) {
    console.error("Failed to check playlist permissions:", error);
    return NextResponse.json(
      { error: "Failed to check playlist permissions" },
      { status: 500 }
    );
  }
}


