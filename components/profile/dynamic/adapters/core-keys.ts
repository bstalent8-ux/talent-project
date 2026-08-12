// ─── Canonical core section keys ──────────────────────────────────────────────
// Pure data. No React, no imports — safe for unit tests.
//
// Core sections split into two groups, and the distinction matters:
//
//   RENDERABLE — a standalone component exists, so an adapter must claim the key.
//   INLINE     — the data is rendered INSIDE another component (mostly
//                ProfileHero) or has no UI at all. No standalone component
//                exists, so no adapter claims it and it resolves to the
//                placeholder. Claiming it would mean inventing new UI, which
//                the adapter layer explicitly must not do.
//
// The test suite asserts both halves: every renderable key has an adapter
// entry, and every inline key fails safe.

/**
 * Talent core sections with a standalone component today.
 *
 * `social` (Professional Presence) and `physical` (Measurements, Model only —
 * see section-content.ts's category gate) used to be inline placeholders with
 * no component; the public UGC/Model profile work gave them one each
 * (ProfessionalPresenceSection, MeasurementsSection).
 */
export const TALENT_RENDERABLE_CORE_KEYS = [
  "hero",
  "avatar",        // seeded completion key — part of the hero block
  "personal",      // seeded completion key — part of the hero block
  "social",
  "physical",
  "portfolio",
  "packages",
  "usage_addons",
  "reviews",
  "experience",
  "brands",
  "performance",
  "trust",
] as const;

/**
 * Talent core sections with no standalone component.
 * `bio` and `categories` render inside ProfileHero; `availability` renders
 * there too (see the public ProfileHero's identity line); `payment` is the
 * weight-0 "coming soon" section from lib/profile-completion.ts.
 */
export const TALENT_INLINE_CORE_KEYS = [
  "bio",
  "categories",
  "availability",
  "payment",
] as const;

/** Brand core sections with a standalone component in components/profile/brand/. */
export const BRAND_RENDERABLE_CORE_KEYS = [
  "bio",
  "company_info",
  "industry",
  "social",
  "verification",
] as const;

/**
 * `logo` renders inside BrandHero, which the brand page draws as chrome above
 * the layout slots — exactly as `avatar` does for talent.
 */
export const BRAND_INLINE_CORE_KEYS = [
  "logo",
] as const;

export const RENDERABLE_CORE_KEYS_BY_TYPE: Record<string, readonly string[]> = {
  talent: TALENT_RENDERABLE_CORE_KEYS,
  brand:  BRAND_RENDERABLE_CORE_KEYS,
};

export const INLINE_CORE_KEYS_BY_TYPE: Record<string, readonly string[]> = {
  talent: TALENT_INLINE_CORE_KEYS,
  brand:  BRAND_INLINE_CORE_KEYS,
};

/**
 * True when a core section is INTENTIONALLY inline — its data is rendered
 * inside another component, or it exists only for completion scoring.
 *
 * The renderer skips these entirely rather than showing a placeholder: a
 * placeholder would tell an admin something is broken when nothing is.
 * They remain in profile_sections, so completion weighting and the admin
 * config screens are unaffected.
 */
export function isInlineCoreKey(typeSlug: string, sectionKey: string): boolean {
  return (INLINE_CORE_KEYS_BY_TYPE[typeSlug] ?? []).includes(sectionKey);
}

/** True when a core section has a standalone component reachable via an adapter. */
export function isRenderableCoreKey(typeSlug: string, sectionKey: string): boolean {
  return (RENDERABLE_CORE_KEYS_BY_TYPE[typeSlug] ?? []).includes(sectionKey);
}
