"use client";

import { useState } from "react";
import { Plus, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { ImportExternalEventsDialog } from "@/components/import-external-events-dialog";
import { useToast } from "@/components/ui/use-toast";
import type { Event } from "@/types/event";

type EventsPageClientProps = {
  events: Event[];
  currentUserId: string;
};

export function EventsPageClient({ events, currentUserId }: EventsPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImportFromTopArtists = async () => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/events/import-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useTopArtists: true }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: "Success!", 
          description: `Imported ${data.imported || 0} events from your top artists` 
        });
        window.location.reload();
      } else {
        const error = await res.json();
        toast({ 
          title: "Import failed", 
          description: error.error || "Failed to import events",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Import failed", 
        description: "Failed to import events",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover and join music events, or create your own
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleImportFromTopArtists}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Import from Top Artists
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Import Events
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-dashed border-primary/30 p-10 text-center max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-2">No events yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to create an event and invite friends to join!
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event._id} event={event} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          window.location.reload();
        }}
      />
      <ImportExternalEventsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

