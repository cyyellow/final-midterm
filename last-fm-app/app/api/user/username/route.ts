import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getAuthSession } from "@/lib/auth";
import { setUsernameAndDisplayName } from "@/lib/users";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long.")
    .max(24, "Username must be at most 24 characters long.")
    .regex(/^[a-zA-Z0-9_]+$/, "Usernames can only include letters, numbers, and underscores."),
  displayName: z
    .string()
    .min(1, "Nickname is required.")
    .max(50, "Nickname must be at most 50 characters long.")
    .trim(),
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { username, displayName } = schema.parse(json);

    await setUsernameAndDisplayName(session.user.id, username, displayName);
    
    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/profile", "page");
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


