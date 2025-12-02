"use client";

import { useState } from "react";
import { Music } from "lucide-react";

interface TrackImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function TrackImage({ src, alt, className }: TrackImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Music className="h-5 w-5 text-primary/60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className || "h-full w-full object-cover"}
      onError={() => setHasError(true)}
    />
  );
}

