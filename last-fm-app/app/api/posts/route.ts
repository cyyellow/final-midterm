import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { createPost } from "@/lib/posts";
import { z } from "zod";

const createPostSchema = z.object({
  track: z.object({
    name: z.string(),
    artist: z.string(),
    album: z.string().optional(),
    image: z.string().optional(),
    url: z.string().optional(),
  }),
  thoughts: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { track, thoughts } = createPostSchema.parse(json);

    const post = await createPost(
      session.user.id,
      session.user.username || "Anonymous",
      session.user.image,
      { track, thoughts }
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}



