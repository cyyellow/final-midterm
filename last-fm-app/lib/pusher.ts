import Pusher from "pusher";

// Server-side Pusher instance
// Only initialize if all required env vars are present
let pusherServer: Pusher | null = null;

if (
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET
) {
  pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER || "ap3",
    useTLS: true,
  });
} else {
  console.warn(
    "Pusher environment variables not configured. Real-time chat will use polling fallback."
  );
}

export { pusherServer };

