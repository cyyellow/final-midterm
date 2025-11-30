import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getEvents, updateEventStatuses } from "@/lib/events";
import { EventCard } from "@/components/event-card";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EventsPageClient } from "./events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.lastfmUsername) {
    redirect("/onboarding");
  }

  // Update event statuses before fetching
  await updateEventStatuses();
  const events = await getEvents();

  return <EventsPageClient events={events} currentUserId={session.user.id} />;
}


