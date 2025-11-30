import { NextResponse } from "next/server";
import { getEventById, updateEventStatuses } from "@/lib/events";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await updateEventStatuses();
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Failed to get event:", error);
    return NextResponse.json(
      { error: "Failed to get event" },
      { status: 500 }
    );
  }
}

