"use client";

import { useState, useTransition } from "react";
import { Calendar, MapPin, Users, MessageSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type CreateEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CreateEventDialog({ open, onOpenChange, onSuccess }: CreateEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [requiresChat, setRequiresChat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    if (!eventDate || !endDate) {
      setError("Event date and end date are required");
      return;
    }

    const eventDateObj = new Date(eventDate);
    const endDateObj = new Date(endDate);
    const now = new Date();

    if (eventDateObj < now) {
      setError("Event date cannot be in the past");
      return;
    }

    if (endDateObj <= eventDateObj) {
      setError("End date must be after event date");
      return;
    }

    const maxParticipantsNum = maxParticipants ? parseInt(maxParticipants, 10) : undefined;
    if (maxParticipantsNum !== undefined && (isNaN(maxParticipantsNum) || maxParticipantsNum < 1)) {
      setError("Max participants must be a positive number");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            location: location.trim() || undefined,
            eventDate: eventDateObj.toISOString(),
            endDate: endDateObj.toISOString(),
            maxParticipants: maxParticipantsNum,
            requiresChat,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create event");
          return;
        }

        // Reset form
        setTitle("");
        setDescription("");
        setLocation("");
        setEventDate("");
        setEndDate("");
        setMaxParticipants("");
        setRequiresChat(true);
        setError(null);

        onOpenChange(false);
        onSuccess?.();
        window.location.reload();
      } catch (err) {
        setError("Failed to create event. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
            Organize a music event and invite friends to join
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Jazz Night at Blue Note"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your event..."
              maxLength={500}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Blue Note Jazz Club, New York"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                Event Date *</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">
              <Users className="inline h-4 w-4 mr-1" />
              Max Participants (optional)
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="Leave empty for unlimited"
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              Set a limit if you need to control the number of participants
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresChat"
                  checked={requiresChat}
                  onChange={(e) => setRequiresChat(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="requiresChat" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  Enable chat room for this event
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Participants can chat and coordinate before the event. Chat will be deleted after the event ends.
              </p>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

