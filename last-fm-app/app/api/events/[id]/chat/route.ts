import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { sendChatMessage, getChatMessages } from "@/lib/events";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

const sendMessageSchema = z.object({
  message: z.string().min(1).max(500),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await getChatMessages(id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to get chat messages:", error);
    return NextResponse.json(
      { error: "Failed to get chat messages" },
      { status: 500 }
    );
  }
}

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

    const json = await request.json();
    const { message } = sendMessageSchema.parse(json);

    const chatMessage = await sendChatMessage(
      id,
      session.user.id,
      session.user.username || "Anonymous",
      session.user.image,
      message
    );

    // Trigger Pusher event to notify all clients (if configured)
    if (pusherServer) {
      try {
        await pusherServer.trigger(`event-${id}`, "new-message", chatMessage);
      } catch (error) {
        console.error("Failed to trigger Pusher event:", error);
        // Don't fail the request if Pusher fails
      }
    }

    return NextResponse.json(chatMessage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Failed to send chat message:", error);
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

