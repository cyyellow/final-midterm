import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { leaveEvent } from "@/lib/events";
import { revalidatePath } from "next/cache";

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

    const result = await leaveEvent(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    revalidatePath("/events");
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Failed to leave event:", error);
    const message = error instanceof Error ? error.message : "Failed to leave event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

