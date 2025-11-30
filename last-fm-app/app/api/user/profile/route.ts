import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { updateUserProfile } from "@/lib/users";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
  favoriteTracks: z.array(z.object({
    name: z.string(),
    artist: z.string(),
    image: z.string().optional(),
    url: z.string().optional(),
  })).max(5).optional(),
});

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = updateProfileSchema.parse(json);

    await updateUserProfile(session.user.id, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

