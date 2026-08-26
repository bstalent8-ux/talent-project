// ─── Per-page engagement tracking ──────────────────────────────────────────
// Fires a "page_engagement" event carrying how long the visitor has stayed
// on the page so far, a render-time estimate, and whether they scrolled.
// Extracted out of PageViewTracker.tsx for the same reason firePageView()
// was: testable without a DOM/React renderer (see vitest.config.ts — this
// repo deliberately has no jsdom/RTL).
//
// Two delivery paths, because either one alone misses real cases:
//   - A heartbeat every HEARTBEAT_MS while the page stays mounted — the only
//     way data shows up for a visitor who never triggers a clean "hidden"
//     signal at all (two windows open side by side, page + admin panel,
//     never actually occludes either one — Page Visibility API's `hidden`
//     means "not visible on ANY screen", not "not focused").
//   - A final send on visibilitychange/pagehide/route-change-away, so a
//     normal single-window visit still gets an accurate last number instead
//     of stopping at the last heartbeat.
// Both write additional rows for one page view by design — user_events is
// an append-only log elsewhere in this codebase too (see CLAUDE.md), and a
// trickle of updates is the whole point: the admin can watch a number climb
// instead of only learning it after the visitor has already left.

import { trackEvent } from "./track";

const SCROLL_THRESHOLD_PX = 40;
const HEARTBEAT_MS = 20_000;
// If the browser hasn't painted a frame within this long (backgrounded /
// throttled tab — requestAnimationFrame pauses or slows drastically when a
// tab isn't the foreground one), stop waiting rather than report a
// multi-second "render time" that's really just tab-throttling noise.
const RENDER_MEASURE_TIMEOUT_MS = 2_000;

export function startEngagementTracking(path: string): () => void {
  if (typeof window === "undefined") return () => {};

  const mountedAt = performance.now();
  let scrolled = false;
  let renderMs: number | null = null;
  let stopped = false;

  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  const settleRender = (value: number) => {
    if (renderMs !== null) return; // first settler wins — rAF or the timeout
    renderMs = value;
    clearTimeout(renderTimer);
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      settleRender(Math.round(performance.now() - mountedAt));
    });
  });
  renderTimer = setTimeout(() => settleRender(RENDER_MEASURE_TIMEOUT_MS), RENDER_MEASURE_TIMEOUT_MS);

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD_PX) {
      scrolled = true;
      window.removeEventListener("scroll", onScroll);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  function fire() {
    trackEvent("page_engagement", {
      metadata: {
        path,
        duration_ms: Math.round(performance.now() - mountedAt),
        render_ms:   renderMs,
        scrolled,
      },
      keepalive: true,
    });
  }

  const heartbeat = setInterval(fire, HEARTBEAT_MS);

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") stop();
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(heartbeat);
    clearTimeout(renderTimer);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", stop);
    fire();
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", stop);

  return stop;
}
