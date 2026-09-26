// ─── Canonical talent field-key lists ──────────────────────────────────────
// Single source for the jsonb keys inside talent_profiles.social_links that
// completion scoring, the public-profile content rules, and the
// PATCH /api/profile/complete allowlist all need to agree on. Previously each
// of those three files hand-copied the same array; a key added to one and
// not the others silently desynced "is this section done" from "is this
// section visible" from "can this key actually be saved".

export const TALENT_PHYSICAL_KEYS = [
  "height", "weight", "hair_color", "shoe_size", "age", "languages", "dialect", "eye_color",
  "chest", "waist", "hip",
] as const;

// The My Profile guided flow's Model-only physical step shows exactly these —
// the rest of TALENT_PHYSICAL_KEYS stay readable/writable (nothing deleted),
// just not part of the approved Model minimum surfaced by the wizard.
export const MODEL_PHYSICAL_FIELDS = [
  "height", "weight", "shoe_size", "hair_color", "eye_color", "chest", "waist", "hip",
] as const;

// Physical-step fields for every non-Model talent (UGC and legacy categories).
export const GENERAL_PHYSICAL_FIELDS = ["age", "languages", "dialect"] as const;

export const TALENT_SOCIAL_KEYS = [
  "instagram", "tiktok", "facebook", "youtube", "linkedin", "telegram", "website", "other",
] as const;

// talent_profiles.social_links.gender — what the Explore Male/Female filter
// reads. Deliberately NOT in TALENT_PHYSICAL_KEYS: that list drives the
// "physical" completion section, and a gender alone must not mark it done.
export const TALENT_GENDERS = ["male", "female"] as const;
export type TalentGender = (typeof TALENT_GENDERS)[number];

/** Normalises whatever was stored (any case, Arabic words) to male/female/null. */
export function normalizeGender(v: unknown): TalentGender | null {
  const x = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (["male", "m", "man", "ذكر", "رجل"].includes(x)) return "male";
  if (["female", "f", "woman", "أنثى", "انثى", "ست"].includes(x)) return "female";
  return null;
}
