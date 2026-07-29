// ─── Category matching (pure — no DB, safe to import from client components) ──
// `category.service.ts` imports `adminClient`, so anything a "use client" file
// needs must live here instead.

export function normalizeCategoryId(value: string | null | undefined): string {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "brand_fashion" || raw === "brand-fashion") return "brand_fashion";
  if (raw === "brand_food" || raw === "brand-food") return "brand_food";
  if (raw === "technology") return "technology";
  if (raw.includes("ugc") || raw.includes("content")) return "ugc";
  if (raw.includes("influencer")) return "influencer";
  if (raw.includes("fashion") || raw.includes("style")) return "fashion";
  if (raw.includes("food reviewer") || raw.includes("food-reviewer") || raw.includes("food_reviewer") || (raw.includes("food") && raw.includes("review"))) return "food_reviewer";
  if (raw.includes("tech reviewer") || raw.includes("tech-reviewer") || raw.includes("tech_reviewer")) return "tech_reviewer";
  if (raw.includes("unbox")) return "unboxing";
  if (raw.includes("host") || raw.includes("presenter")) return "host";
  if (raw.includes("restaurant")) return "restaurant";
  if (raw.includes("cafe")) return "cafe";
  if (raw.includes("event")) return "events";
  if (raw.includes("technology") || raw === "tech") return "technology";
  if (raw.includes("real estate") || raw.includes("real-estate") || raw.includes("real_estate")) return "real_estate";
  if (raw === "food") return "brand_food";
  return raw.replace(/[^a-z0-9؀-ۿ]+/g, "_").replace(/^_+|_+$/g, "");
}

// Brand category ids and talent category ids live in two different namespaces
// (`categories.role_type`), so an exact string match almost never fires. This
// map says which talent categories a brand category is looking for.
export const BRAND_TO_TALENT_AFFINITY: Record<string, string[]> = {
  restaurant:    ["food_reviewer", "ugc"],
  cafe:          ["food_reviewer", "ugc"],
  brand_food:    ["food_reviewer", "ugc"],
  technology:    ["tech_reviewer", "unboxing"],
  brand_fashion: ["fashion", "influencer"],
  events:        ["host", "influencer"],
  real_estate:   ["host", "ugc"],
};

export const MATCH_RANK_EXACT    = 0;
export const MATCH_RANK_AFFINITY = 1;
export const MATCH_RANK_NONE     = 2;

/**
 * Ranking bucket for a talent against the viewing brand's category.
 * Lower sorts first. Never excludes anyone — worst case is MATCH_RANK_NONE.
 */
export function categoryMatchRank(
  brandCategory: string | null | undefined,
  talentCategory: string | null | undefined,
): number {
  const brand = normalizeCategoryId(brandCategory);
  const talent = normalizeCategoryId(talentCategory);
  if (!brand || !talent) return MATCH_RANK_NONE;

  if (brand === talent) return MATCH_RANK_EXACT;
  if ((BRAND_TO_TALENT_AFFINITY[brand] ?? []).includes(talent)) return MATCH_RANK_AFFINITY;
  return MATCH_RANK_NONE;
}
