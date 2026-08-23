// ─── Client-side event tracker ───────────────────────────────────────────────
// Browser-only (localStorage, fetch) — only ever import this from a
// "use client" file. Posts to /api/events, which is the only thing allowed
// to write to user_events (see lib/events/service.ts).

const SESSION_KEY = "talents_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private-browsing / storage-disabled: a per-call random id still lets
    // the event through, it just won't correlate across page loads.
    return crypto.randomUUID();
  }
}

export type ClientEventName = "page_view" | "talent_profile_view" | "search" | "signup" | "login";

export interface TrackEventOptions {
  targetType?: string;
  targetId?:   string;
  metadata?:   Record<string, unknown>;
}

/** Fire-and-forget — a dropped analytics call must never surface to the user. */
export function trackEvent(eventName: ClientEventName, options: TrackEventOptions = {}): void {
  if (typeof window === "undefined") return;

  void fetch("/api/events", {
    method:      "POST",
    headers:     { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      event_name:  eventName,
      session_id:  getSessionId(),
      target_type: options.targetType,
      target_id:   options.targetId,
      metadata:    options.metadata,
    }),
  }).catch(() => {});
}
