// ─── Canonical talent field-key lists ──────────────────────────────────────
// Single source for the jsonb keys inside talent_profiles.social_links that
// completion scoring, the public-profile content rules, and the
// PATCH /api/profile/complete allowlist all need to agree on. Previously each
// of those three files hand-copied the same array; a key added to one and
// not the others silently desynced "is this section done" from "is this
// section visible" from "can this key actually be saved".

export const TALENT_PHYSICAL_KEYS = [
  "height", "weight", "hair_color", "shoe_size", "age", "languages", "dialect", "eye_color",
] as const;

// The My Profile guided flow's Model-only physical step shows exactly these —
// the rest of TALENT_PHYSICAL_KEYS stay readable/writable (nothing deleted),
// just not part of the approved Model minimum surfaced by the wizard.
export const MODEL_PHYSICAL_FIELDS = [
  "height", "weight", "shoe_size", "hair_color", "eye_color",
] as const;

export const TALENT_SOCIAL_KEYS = [
  "instagram", "tiktok", "facebook", "youtube", "linkedin", "telegram", "website", "other",
] as const;

/**
 * Server-side guard for a Professional Presence value. MVP is links-only, no
 * OAuth, so this does not require a full URL — the UI accepts a bare handle
 * ("@name") and expands it to a real profile URL only at display time (see
 * ProfessionalPresenceSection.tsx's toHref()). Rejecting anything WITHOUT a
 * scheme would break that. What must never reach storage is a dangerous
 * scheme (`javascript:`, `data:`, `vbscript:`, ...) — the only case handled
 * here is "the value declares an explicit scheme and it isn't http(s)".
 */
export function isSafePresenceValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed);
  if (!schemeMatch) return true; // bare handle/username — no scheme to abuse
  return /^https?$/i.test(schemeMatch[1]);
}
