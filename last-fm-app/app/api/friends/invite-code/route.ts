import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getOrCreateInviteCode } from "@/lib/users";

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inviteCode = await getOrCreateInviteCode(session.user.id);
    return NextResponse.json({ inviteCode });
  } catch (error) {
    console.error("Failed to get invite code:", error);
    return NextResponse.json(
      { error: "Failed to get invite code" },
      { status: 500 }
    );
  }
}

