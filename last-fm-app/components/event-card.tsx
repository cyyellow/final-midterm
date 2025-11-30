"use client";

import { useState } from "react";
import { Calendar, MapPin, Users, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Event } from "@/types/event";
import { EventDetailDialog } from "./event-detail-dialog";

type EventCardProps = {
  event: Event;
  currentUserId?: string;
};

export function EventCard({ event, currentUserId }: EventCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const now = new Date();
  const eventDate = new Date(event.eventDate);
  const endDate = new Date(event.endDate);
  const isUpcoming = eventDate > now;
  const isActive = eventDate <= now && endDate > now;
  const isEnded = endDate <= now;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const isParticipant = currentUserId
    ? event.participants.some((p) => p.userId === currentUserId) || event.creatorId === currentUserId
    : false;

  const participantCount = event.participants.length;
  const maxParticipants = event.maxParticipants;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetail(true)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={event.creatorImage} />
                  <AvatarFallback className="text-xs">
                    {event.creatorUsername[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{event.creatorUsername}</span>
              </div>
            </div>
            <Badge
              variant={
                isEnded
                  ? "secondary"
                  : isActive
                  ? "default"
                  : "outline"
              }
            >
              {isEnded ? "Ended" : isActive ? "Active" : "Upcoming"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(eventDate)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {participantCount} {maxParticipants ? `/ ${maxParticipants}` : ""} participants
              </span>
            </div>

            {event.requiresChat && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Chat room available</span>
              </div>
            )}
          </div>

          {isParticipant && (
            <div className="mt-4 pt-4 border-t">
              <Badge variant="secondary" className="text-xs">
                You're participating
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <EventDetailDialog
        event={event}
        open={showDetail}
        onOpenChange={setShowDetail}
        currentUserId={currentUserId}
      />
    </>
  );
}

