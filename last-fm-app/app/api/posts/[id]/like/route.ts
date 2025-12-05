import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { togglePostLike } from "@/lib/posts";
import { pusherServer } from "@/lib/pusher";

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

    const result = await togglePostLike(id, session.user.id);

    // Broadcast like update via Pusher
    if (pusherServer) {
      try {
        await pusherServer.trigger(`post-${id}`, "like-update", {
          postId: id,
          likes: result.likes,
          userId: session.user.id,
          isLiked: result.isLiked,
        });
      } catch (error) {
        console.error("Failed to broadcast like update:", error);
      }
    }

    return NextResponse.json({
      likes: result.likes,
      isLiked: result.isLiked,
    });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

