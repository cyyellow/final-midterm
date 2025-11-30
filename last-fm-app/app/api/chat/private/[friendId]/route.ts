import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getPrivateMessages, sendPrivateMessage, getChatMessagesCollection } from "@/lib/chat";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

const sendMessageSchema = z.object({
  message: z.string().min(1).max(500),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const { friendId } = await params;
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await getPrivateMessages(session.user.id, friendId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to get private messages:", error);
    return NextResponse.json(
      { error: "Failed to get private messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const { friendId } = await params;
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { message } = sendMessageSchema.parse(json);

    const chatMessage = await sendPrivateMessage(
      session.user.id,
      session.user.username || "Anonymous",
      session.user.image,
      friendId,
      message
    );

    // Trigger Pusher event
    if (pusherServer) {
      const chatId = chatMessage.eventId; // This is the private chat ID
      try {
        await pusherServer.trigger(`chat-${chatId}`, "new-message", chatMessage);
      } catch (error) {
        console.error("Failed to trigger Pusher event:", error);
      }
    }

    return NextResponse.json(chatMessage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Failed to send private message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

