// ─── Registration talent-type options ─────────────────────────────────────────
// Extracted from page.tsx (Sprint 1, profile-category-foundation) so this pure
// data can be regression-tested without importing a "use client" component
// (CSS module import, next/navigation, next/image) into vitest's node
// environment.
//
// Values must exactly match CANONICAL_TALENT_CATEGORY_IDS
// (features/categories/canonical-ids.ts), which itself must match
// `categories` WHERE role_type='talent' once supabase/migrations/
// 20260812_01_category_taxonomy_model.sql has been applied. Regression-tested
// in talent-types.test.ts. "media_buyers" was never a valid category (it
// failed the profile_categories FK on submit — see the audit) and "model" was
// missing entirely; both fixed here.
export const TALENT_TYPES = [
  { value: "ugc", ar: "UGC Creator", en: "UGC Creator" },
  { value: "influencer", ar: "Influencer", en: "Influencer" },
  { value: "fashion", ar: "Fashion", en: "Fashion" },
  { value: "food_reviewer", ar: "Food Reviewer", en: "Food Reviewer" },
  { value: "tech_reviewer", ar: "Tech Reviewer", en: "Tech Reviewer" },
  { value: "unboxing", ar: "Unboxing", en: "Unboxing" },
  { value: "host", ar: "Host", en: "Host" },
  { value: "model", ar: "موديل", en: "Model" },
] as const;
