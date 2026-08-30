// ─── First-touch/last-tagged UTM attribution ─────────────────────────────────
// Meta Pixel's own click attribution only recognizes a paid ad click
// (fbclid) — an organic Facebook group post has no fbclid, so the Pixel
// alone can never tell "came from the ad" apart from "came from a group
// post." This module fills that gap in-house: every distribution link
// (ad vs. group post) carries its own utm_source, we remember the most
// recently seen tagged visit in localStorage, and the signup event later
// reads it back — same localStorage-session-id pattern as lib/analytics/
// track.ts's getSessionId().

const ATTRIBUTION_KEY = "talents_attribution";
const MAX_VALUE_LEN = 100;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
type UtmKey = typeof UTM_KEYS[number];

export type Attribution = Partial<Record<UtmKey, string>>;

/**
 * Reads utm_* from the current page's query params and, only when at least
 * one is present, overwrites the stored attribution — last TAGGED visit
 * wins. A plain reload or an untagged internal navigation has no utm
 * params and leaves whatever was stored earlier untouched, so a visitor
 * who arrives from the ad and later just re-opens the site keeps the ad
 * as their attributed source.
 */
export function captureAttribution(searchParams: URLSearchParams): void {
  if (typeof window === "undefined") return;

  const found: Attribution = {};
  let any = false;
  for (const key of UTM_KEYS) {
    const v = searchParams.get(key);
    if (v && v.length <= MAX_VALUE_LEN) {
      found[key] = v;
      any = true;
    }
  }
  if (!any) return;

  try {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(found));
  } catch {
    // Private-browsing / storage-disabled — attribution is best-effort only,
    // never worth breaking navigation over.
  }
}

/** Reads back whatever captureAttribution last stored, if anything. */
export function getAttribution(): Attribution | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return undefined;
    return parsed as Attribution;
  } catch {
    return undefined;
  }
}
