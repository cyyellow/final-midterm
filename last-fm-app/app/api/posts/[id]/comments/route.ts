import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getPostById, addComment, getComments } from "@/lib/posts";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await getComments(id);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Failed to get comments:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}

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

    const post = await getPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = createCommentSchema.parse(json);

    const comment = await addComment(
      id,
      session.user.id,
      session.user.username || "Anonymous",
      session.user.image,
      parsed.content
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to add comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

