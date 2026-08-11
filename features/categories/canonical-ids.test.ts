import { describe, it, expect } from "vitest";
import { CANONICAL_TALENT_CATEGORY_IDS, isCanonicalTalentCategoryId } from "./canonical-ids";
import { fallbackCategories } from "./services/category.service";

describe("canonical talent category ids (Sprint 1 regression)", () => {
  it("includes model", () => {
    expect(CANONICAL_TALENT_CATEGORY_IDS).toContain("model");
  });

  it("does not include the old media_buyers bug", () => {
    expect(CANONICAL_TALENT_CATEGORY_IDS).not.toContain("media_buyers");
  });

  it("keeps every category that was already valid in production", () => {
    // Live baseline (docs/audits/sprint1-db-baseline-before.txt): categories
    // WHERE role_type='talent' = ugc, influencer, fashion, food_reviewer,
    // tech_reviewer, unboxing, host. None may be dropped.
    for (const id of ["ugc", "influencer", "fashion", "food_reviewer", "tech_reviewer", "unboxing", "host"]) {
      expect(CANONICAL_TALENT_CATEGORY_IDS).toContain(id);
    }
  });

  it("has no duplicates", () => {
    expect(new Set(CANONICAL_TALENT_CATEGORY_IDS).size).toBe(CANONICAL_TALENT_CATEGORY_IDS.length);
  });

  it("isCanonicalTalentCategoryId accepts every canonical id and rejects garbage", () => {
    for (const id of CANONICAL_TALENT_CATEGORY_IDS) {
      expect(isCanonicalTalentCategoryId(id)).toBe(true);
    }
    expect(isCanonicalTalentCategoryId("media_buyers")).toBe(false);
    expect(isCanonicalTalentCategoryId("not_a_real_category")).toBe(false);
  });

  it("stays a subset of category.service.ts's fallbackCategories (single source of truth guard)", () => {
    // fallbackCategories includes brand categories too, so this checks
    // containment, not equality — but every talent id here MUST have a
    // matching fallback row, or the registration form and the API's
    // fallback-on-DB-error path would disagree about what's valid.
    const fallbackTalentIds = new Set(
      fallbackCategories.filter((c) => c.role_type === "talent").map((c) => c.id),
    );
    for (const id of CANONICAL_TALENT_CATEGORY_IDS) {
      expect(fallbackTalentIds.has(id)).toBe(true);
    }
  });
});
