// ─── Registration talent-type options ─────────────────────────────────────────
// MVP scope decision (pre-Founding-Creators-launch): NEW talent registration
// exposes only UGC Creator and Model. This is a registration-surface
// decision, not a taxonomy change — the `categories` table still lists
// influencer/food_reviewer/tech_reviewer/unboxing/host as active talent
// categories (existing profiles using them keep rendering normally), and
// `talent_profiles.category` is still the Postgres enum `talent_category`,
// which only recognises fashion/makeup/ugc/kids/commercial/parts today plus
// `model` once supabase/migrations/20260812_01b_talent_category_enum_model.sql
// has been applied. Widening either one to the other five categories before
// launch is a separate, undecided product call — not made here.
//
// `media_buyers` never had a categories/enum row on either side (see the
// audit) and is removed, not narrowed to a smaller MVP set.
export const TALENT_TYPES = [
  { value: "ugc", ar: "UGC Creator", en: "UGC Creator" },
  { value: "model", ar: "موديل", en: "Model" },
] as const;
