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
