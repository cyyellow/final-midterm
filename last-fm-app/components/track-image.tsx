"use client";

import { useState } from "react";
import Image from "next/image";
import { Music } from "lucide-react";

interface TrackImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export function TrackImage({ src, alt, className, fill = false, sizes }: TrackImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <Music className="h-5 w-5 text-primary/60" />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className || "object-cover"}
        sizes={sizes}
        onError={() => setHasError(true)}
      />
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

