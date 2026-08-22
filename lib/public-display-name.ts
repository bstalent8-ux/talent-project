// ─── Safe public display name ──────────────────────────────────────────────
// P0 fix: a real user's email address was appearing as a Talent's public
// display name. Root cause is a DATA bug — profiles.full_name can literally
// hold an email string (registerValidation.ts only checks for emptiness,
// never rejects email-shaped input) — not a code path that reads
// profiles.email (no public query selects that column; see audit). This
// helper is the single point every public name computation must go through
// so no DB row, however dirty, can ever surface an email publicly.
const EMAIL_SHAPE = /\S+@\S+\.\S+/;
const EMAIL_SHAPE_GLOBAL = /\S+@\S+\.\S+/g;

export function isEmailShaped(value: string): boolean {
  return EMAIL_SHAPE.test(value);
}

/** Strips any email-shaped substring out of free text (e.g. a bio a talent
 * wrote themselves, which can contain one alongside other real content —
 * unlike a name field, there's no single "whole value" to fall back from).
 * Returns null if that leaves nothing worth keeping. */
export function redactEmails(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text.replace(EMAIL_SHAPE_GLOBAL, "").replace(/\s{2,}/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** `social_links` is a free-form jsonb catch-all (platform handles, title,
 * campaign stats, physical measurements, ...) shipped wholesale into every
 * public profile DTO — not just through the few keys a display component
 * happens to read. No legitimate value in it is ever a bare email, so drop
 * any string VALUE that is one, whatever the key. Non-string values
 * (numbers, arrays, nested objects) pass through untouched. */
export function sanitizeSocialLinksForPublic(
  links: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!links || typeof links !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(links)) {
    if (typeof value === "string" && isEmailShaped(value)) continue;
    out[key] = value;
  }
  return out;
}

/** Real name if it looks like one, else the handle, else a neutral fallback.
 * Never returns an email-shaped string. */
export function safePublicDisplayName(
  fullName: string | null | undefined,
  handle: string | null | undefined,
  fallback: string = "Talent",
): string {
  const name = fullName?.trim();
  if (name && !isEmailShaped(name)) return name;

  const h = handle?.trim();
  if (h && !isEmailShaped(h)) return h;

  return fallback;
}
