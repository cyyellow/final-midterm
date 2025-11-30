import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { addFriendByInviteCode } from "@/lib/friends";
import { revalidatePath } from "next/cache";

const schema = z.object({
  inviteCode: z
    .string()
    .min(1, "Invite code is required.")
    .max(20, "Invalid invite code.")
    .trim()
    .toUpperCase(),
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { inviteCode } = schema.parse(json);

    const result = await addFriendByInviteCode(session.user.id, inviteCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Revalidate pages that show friends
    revalidatePath("/", "layout");
    revalidatePath("/", "page");

    return NextResponse.json({ 
      success: true, 
      message: result.message 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    console.error("Failed to add friend:", error);
    const message =
      error instanceof Error ? error.message : "Unable to add friend.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

