import { getEventsCollection } from "./events";
import type { Event } from "@/types/event";

type BandsintownEvent = {
  id: string;
  url: string;
  venue: {
    name: string;
    city: string;
    country: string;
  };
  lineup: string[];
  datetime: string; // ISO
};

/**
 * Fetch upcoming concerts for a single artist from Bandsintown.
 * Docs: https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0 (API may require registration)
 */
async function fetchBandsintownEvents(artist: string): Promise<BandsintownEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID;
  if (!appId) {
    console.warn("BANDSINTOWN_APP_ID is not set. Skipping external events import.");
    return [];
  }

  const encodedArtist = encodeURIComponent(artist);
  const url = `https://rest.bandsintown.com/artists/${encodedArtist}/events?app_id=${appId}&date=upcoming`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch Bandsintown events:", res.status, res.statusText);
    return [];
  }

  const data = (await res.json()) as any;
  if (!Array.isArray(data)) return [];
  return data as BandsintownEvent[];
}

/**
 * Import upcoming concerts for a list of artists as events in our DB.
 * Each external event is created once (dedup by source + sourceId).
 */
export async function importExternalEventsForUser(opts: {
  userId: string;
  username: string;
  userImage: string | null;
  artists: string[];
}): Promise<{ imported: number }> {
  const { userId, username, userImage, artists } = opts;
  const eventsCollection = await getEventsCollection();

  let imported = 0;

  for (const artist of artists) {
    const externalEvents = await fetchBandsintownEvents(artist);

    for (const ext of externalEvents) {
      const start = new Date(ext.datetime);
      if (Number.isNaN(start.getTime())) continue;

      // Simple 2-hour window for end time
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const location = [ext.venue.name, ext.venue.city, ext.venue.country]
        .filter(Boolean)
        .join(" · ");

      // Avoid duplicates for the same external event
      const existing = await eventsCollection.findOne({
        source: "bandsintown",
        sourceId: ext.id,
      });
      if (existing) continue;

      const now = new Date();

      const doc: Omit<Event, "_id"> = {
        creatorId: userId,
        creatorUsername: username,
        creatorImage: userImage || undefined,
        source: "bandsintown",
        sourceId: ext.id,
        externalUrl: ext.url,
        title: `${artist} @ ${ext.venue.name}`,
        description: `Imported from Bandsintown. Lineup: ${ext.lineup.join(", ")}`,
        location,
        eventDate: start,
        endDate: end,
        maxParticipants: undefined,
        requiresChat: false,
        chatRoomId: undefined,
        participants: [],
        status: start > now ? "upcoming" : end > now ? "active" : "ended",
        createdAt: now,
        updatedAt: now,
      };

      await eventsCollection.insertOne(doc as any);
      imported += 1;
    }
  }

  return { imported };
}


