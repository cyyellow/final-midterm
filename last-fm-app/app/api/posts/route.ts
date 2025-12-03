import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { createPost } from "@/lib/posts";
import { updatePlaylist } from "@/lib/playlist";
import { z } from "zod";

const createPostSchema = z.object({
  track: z.object({
    name: z.string(),
    artist: z.string(),
    album: z.string().optional(),
    image: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
  playlistId: z.string().optional(),
  playlistName: z.string().optional(),
  playlistImage: z.string().optional(),
  playlistTrackCount: z.number().optional(),
  thoughts: z.string().min(1).max(200),
  isPublic: z.boolean().optional(),
}).refine((data) => data.track || data.playlistId, {
  message: "Either track or playlistId must be provided",
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = createPostSchema.parse(json);
    const { track, playlistId, playlistName, playlistImage, playlistTrackCount, thoughts, isPublic } = parsed;

    // If a playlist is being shared, mark it as public so others can view it
    if (playlistId) {
      try {
        await updatePlaylist(session.user.id, playlistId, { isPublic: true });
      } catch (error) {
        // If update fails (e.g., playlist doesn't exist or user doesn't own it), continue anyway
        console.error("Failed to mark playlist as public:", error);
      }
    }

    const post = await createPost(
      session.user.id,
      session.user.username || "Anonymous",
      session.user.image,
      { track, playlistId, playlistName, playlistImage, playlistTrackCount, thoughts, isPublic }
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



