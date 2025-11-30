import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getEventsCollection, getEventById } from "@/lib/events";
import { ObjectId } from "mongodb";
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

    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the user is the creator
    if (event.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the creator can end this event" },
        { status: 403 }
      );
    }

    if (event.status === "ended" || event.status === "cancelled") {
      return NextResponse.json(
        { error: "Event is already ended or cancelled" },
        { status: 400 }
      );
    }

    const collection = await getEventsCollection();
    const now = new Date();

    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "ended",
          endDate: now, // Update end date to now
          updatedAt: now,
        },
      }
    );

    revalidatePath("/events");
    return NextResponse.json({ success: true, message: "Event ended successfully" });
  } catch (error) {
    console.error("Failed to end event:", error);
    return NextResponse.json(
      { error: "Failed to end event" },
      { status: 500 }
    );
  }
}

