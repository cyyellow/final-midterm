"use client";

import { useState } from "react";
import { Download, Loader2, Search } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

type ImportExternalEventsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ImportExternalEventsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportExternalEventsDialogProps) {
  const [artists, setArtists] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artists.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one artist name",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const artistList = artists
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const res = await fetch("/api/events/import-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artists: artistList }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Success!",
          description: `Imported ${data.imported || 0} events`,
        });
        setArtists("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        const error = await res.json();
        toast({
          title: "Import failed",
          description: error.error || "Failed to import events",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import events",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import External Events</DialogTitle>
          <DialogDescription>
            Import concerts and events from Bandsintown for your favorite artists
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artists">Artist Names (comma-separated)</Label>
            <Input
              id="artists"
              placeholder="e.g. Illenium, Alesso, Martin Garrix"
              value={artists}
              onChange={(e) => setArtists(e.target.value)}
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Enter artist names separated by commas. Events will be imported from Bandsintown.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isImporting || !artists.trim()}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Events
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


