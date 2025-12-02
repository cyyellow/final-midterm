"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackSelectorDialog } from "./track-selector-dialog";

export function CreatePostButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full gap-2 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Send className="h-5 w-5" />
        Record a Moment
      </Button>
      <TrackSelectorDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

