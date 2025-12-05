import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getFriendStatuses } from "@/lib/friends";

// Mark this route as dynamic since it uses authentication (headers)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const statuses = await getFriendStatuses(session.user.id);

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Error fetching friend statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend statuses" },
      { status: 500 }
    );
  }
}

