import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getPostById, updateComment, deleteComment } from "@/lib/posts";
import { z } from "zod";

const updateCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await getPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = updateCommentSchema.parse(json);

    const comment = await updateComment(commentId, session.user.id, parsed.content);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to update comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await deleteComment(commentId, session.user.id);

    if (!success) {
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

