// ─── Canonical talent category ids ────────────────────────────────────────────
// Sprint 1 (profile-category-foundation). Single source of truth for "which
// talent category ids exist," used by:
//   - app/(auth)/register/page.tsx        (the signup dropdown)
//   - app/api/profile/route.ts            (server-side validation, before
//                                          any write — see the partial-
//                                          account-creation fix)
//   - features/categories/canonical-ids.test.ts (regression coverage)
//
// This list must be kept byte-identical to `categories` WHERE role_type =
// 'talent' AND is_active = true, once supabase/migrations/20260812_01_
// category_taxonomy_model.sql has been applied. It intentionally has no
// import of adminClient/Supabase, so it is safe to import from a "use
// client" component (CLAUDE.md §15.3: never import lib/supabase/admin.ts
// from a client file) — this file has zero DB dependency, it is a plain
// literal list.
//
// The registration route additionally re-validates against the LIVE
// `categories` table (features/categories/services/category.service.ts) —
// this static list is for the UI and for fast, dependency-free tests, not
// the authoritative check. See app/api/profile/route.ts for the live check.

export const CANONICAL_TALENT_CATEGORY_IDS = [
  "ugc",
  "influencer",
  "fashion",
  "food_reviewer",
  "tech_reviewer",
  "unboxing",
  "host",
  "model",
] as const;

export type CanonicalTalentCategoryId = (typeof CANONICAL_TALENT_CATEGORY_IDS)[number];

export function isCanonicalTalentCategoryId(value: string): value is CanonicalTalentCategoryId {
  return (CANONICAL_TALENT_CATEGORY_IDS as readonly string[]).includes(value);
}
