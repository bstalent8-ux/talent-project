"use client";

// Mounted once in app/(main)/layout.tsx, outside any per-route effect — one
// document-level listener for the whole session, not re-attached on every
// navigation. Reads window.location.pathname at click time instead of a
// captured path, so it's always current regardless of when it was mounted.

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { buildClickLabel, isClickableElement } from "@/lib/analytics/click-tracking";

const MAX_WALK_DEPTH = 6;

export default function ClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      let el = e.target as HTMLElement | null;
      let depth = 0;

      while (el && depth < MAX_WALK_DEPTH) {
        const role = el.getAttribute("role");
        if (isClickableElement(el.tagName, role)) {
          const label = buildClickLabel({
            tag:       el.tagName,
            ariaLabel: el.getAttribute("aria-label"),
            title:     el.getAttribute("title"),
            text:      el.textContent,
            href:      null,
          });
          const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;

          trackEvent("click", {
            metadata: {
              path: window.location.pathname,
              label,
              ...(href ? { href } : {}),
            },
            // A click very often triggers navigation right after — same
            // reasoning as page_engagement's exit event.
            keepalive: true,
          });
          return;
        }
        el = el.parentElement;
        depth += 1;
      }
      // No clickable ancestor within MAX_WALK_DEPTH — a click on plain
      // content, not an affordance. Not tracked; that's the point of
      // isClickableElement, not a gap.
    }

    // Capture phase: still records a click whose bubbling gets stopped
    // partway up by some other handler (several admin tables do exactly
    // that — see TalentsTable.tsx).
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
