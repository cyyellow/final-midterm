import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getFriends } from "@/lib/friends";

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const friends = await getFriends(session.user.id);
    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Failed to get friends:", error);
    return NextResponse.json(
      { error: "Failed to get friends" },
      { status: 500 }
    );
  }
}

