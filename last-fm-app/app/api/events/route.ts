import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { createEvent, getEvents, updateEventStatuses } from "@/lib/events";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be at most 500 characters"),
  location: z.string().max(200).optional(),
  eventDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxParticipants: z.number().int().positive().optional(),
  requiresChat: z.boolean(),
});

export async function GET() {
  try {
    // Update event statuses before fetching
    await updateEventStatuses();
    
    const events = await getEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to get events:", error);
    return NextResponse.json(
      { error: "Failed to get events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const data = createEventSchema.parse(json);

    const event = await createEvent(
      session.user.id,
      session.user.username || "Anonymous",
      session.user.image,
      data
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Failed to create event:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

