 "use client";

import { useEffect } from "react";

/**
 * Defensive fix for cases where the <body> element ends up with
 * `pointer-events: none` and blocks all interactions, without any
 * visible dialog or overlay being open.
 *
 * This should be a no-op in normal cases, but will clear the style
 * if it looks like the UI is incorrectly frozen.
 */
export function BodyPointerEventsFix() {
  useEffect(() => {
    const fixPointerEvents = () => {
      if (typeof document === "undefined") return;

      const body = document.body;
      if (!body) return;

      // Only intervene if body is explicitly blocking pointer events
      if (body.style.pointerEvents === "none") {
        // Heuristic: if there is any open dialog / sheet / radix overlay,
        // we assume it is intentionally blocking interactions.
        const hasOpenDialog =
          !!document.querySelector(
            '[data-state="open"][role="dialog"], [data-state="open"][data-radix-dialog-content]'
          ) ||
          !!document.querySelector(
            '[data-state="open"][data-radix-toast], [data-nextjs-error-overlay="true"]'
          );

        if (!hasOpenDialog) {
          body.style.pointerEvents = "";
        }
      }
    };

    // Run once on mount
    fixPointerEvents();

    // Also run periodically in case something sets it later
    const intervalId = window.setInterval(fixPointerEvents, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}


