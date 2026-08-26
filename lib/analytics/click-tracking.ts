// ─── Click labeling ─────────────────────────────────────────────────────────
// Pure logic split out of ClickTracker.tsx so it's unit-testable without a
// DOM/React renderer (this repo deliberately has no jsdom/RTL — see
// vitest.config.ts). The component does the DOM walking (finding the nearest
// clickable ancestor) and hands this plain data.

export interface ClickableInfo {
  tag:       string;
  ariaLabel: string | null;
  title:     string | null;
  text:      string | null;
  href:      string | null;
}

const MAX_LABEL_LEN = 100;

function truncate(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Precedence: aria-label (explicit, author-chosen) > title (also explicit)
 * > visible text (what a visitor actually read) > bare tag name (last
 * resort — still better than nothing, e.g. an icon-only button with none
 * of the above).
 */
export function buildClickLabel(info: ClickableInfo): string {
  if (info.ariaLabel && info.ariaLabel.trim()) return truncate(info.ariaLabel, MAX_LABEL_LEN);
  if (info.title && info.title.trim()) return truncate(info.title, MAX_LABEL_LEN);
  if (info.text && info.text.trim()) return truncate(info.text, MAX_LABEL_LEN);
  return info.tag.toLowerCase();
}

/** Tags/roles worth tracking a click on — everything else is noise (a div,
 * a paragraph, plain text) that isn't actually an affordance a visitor
 * chose to act on. */
const CLICKABLE_TAGS = new Set(["A", "BUTTON"]);

export function isClickableElement(tag: string, role: string | null): boolean {
  return CLICKABLE_TAGS.has(tag.toUpperCase()) || role === "button" || role === "link";
}
