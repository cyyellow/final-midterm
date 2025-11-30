"use client";

import Pusher from "pusher-js";

// Client-side Pusher instance
export function getPusherClient() {
  if (typeof window === "undefined") {
    return null;
  }

  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap3";

  if (!pusherKey) {
    console.warn("Pusher key not configured. Real-time chat will use polling fallback.");
    return null;
  }

  return new Pusher(pusherKey, {
    cluster: pusherCluster,
    forceTLS: true,
  });
}

