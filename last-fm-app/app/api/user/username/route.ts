import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getAuthSession } from "@/lib/auth";
import { setUsernameForUser } from "@/lib/users";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long.")
    .max(24, "Username must be at most 24 characters long.")
    .regex(/^[a-zA-Z0-9_]+$/, "Usernames can only include letters, numbers, and underscores."),
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const { username } = schema.parse(json);

  try {
    await setUsernameForUser(session.user.id, username);
    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/profile", "page");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update username.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


