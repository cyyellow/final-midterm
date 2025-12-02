import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { getTopArtists } from "@/lib/lastfm";
import { importExternalEventsForUser } from "@/lib/external-events";

const importSchema = z.object({
  artists: z.array(z.string().min(1)).optional(),
  useTopArtists: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.lastfmUsername) {
      return NextResponse.json(
        { error: "Last.fm username is required" },
        { status: 400 },
      );
    }

    const json = await request.json();
    const { artists, useTopArtists } = importSchema.parse(json);

    let artistList: string[] = [];

    if (useTopArtists) {
      // Get top artists from Last.fm
      const topArtists = await getTopArtists(session.user.lastfmUsername, 10, "7day");
      artistList = topArtists.map((artist) => artist.name);
    } else if (artists && artists.length > 0) {
      artistList = artists;
    } else {
      return NextResponse.json(
        { error: "Either artists array or useTopArtists must be provided" },
        { status: 400 },
      );
    }

    if (artistList.length === 0) {
      return NextResponse.json(
        { error: "No artists found" },
        { status: 400 },
      );
    }

    const { imported } = await importExternalEventsForUser({
      userId: session.user.id,
      username: session.user.username || "Anonymous",
      userImage: session.user.image,
      artists: artistList,
    });

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    console.error("Failed to import external events:", error);
    return NextResponse.json(
      { error: "Failed to import external events" },
      { status: 500 },
    );
  }
}


