import { describe, it, expect } from "vitest";
import { applyCategoryTalentLayout } from "./talent-layout";
import type { ProfileLayoutDTO } from "@/features/profiles/types/dto";

const baseLayout: ProfileLayoutDTO = {
  main: [
    { key: "bio", width: "full" },
    { key: "portfolio", width: "full" },
    { key: "experience", width: "full" },
    { key: "packages", width: "full" },
    { key: "usage_addons", width: "full" },
    { key: "equipment", width: "full" },
    { key: "awards", width: "full" },
  ],
  sidebar: [
    { key: "performance", width: "full" },
    { key: "reviews", width: "full" },
    { key: "brands", width: "full" },
    { key: "trust", width: "full" },
  ],
};

describe("applyCategoryTalentLayout", () => {
  it("model: social right after portfolio, brands right after experience, no physical in main", () => {
    const result = applyCategoryTalentLayout(baseLayout, "model");
    const keys = result.main.map((e) => e.key);
    expect(keys).toEqual([
      "bio", "portfolio", "social", "experience", "brands", "packages", "usage_addons", "equipment", "awards",
    ]);
    expect(keys).not.toContain("physical");
  });

  it("model: sidebar leads with the compact Measurements card, brands removed", () => {
    const result = applyCategoryTalentLayout(baseLayout, "model");
    const keys = result.sidebar.map((e) => e.key);
    expect(keys).toEqual(["physical", "performance", "reviews", "trust"]);
    expect(keys).not.toContain("brands");
  });

  it("ugc: inserts social after portfolio, no physical, brands stays in the sidebar", () => {
    const result = applyCategoryTalentLayout(baseLayout, "ugc");
    const keys = result.main.map((e) => e.key);
    expect(keys).toEqual([
      "bio", "portfolio", "social", "experience", "packages", "usage_addons", "equipment", "awards",
    ]);
    expect(keys).not.toContain("physical");
    expect(keys).not.toContain("brands");
    expect(result.sidebar).toEqual(baseLayout.sidebar);
  });

  it("legacy category (fashion): behaves exactly like ugc — no bespoke section invented", () => {
    const result = applyCategoryTalentLayout(baseLayout, "fashion");
    const keys = result.main.map((e) => e.key);
    expect(keys).not.toContain("physical");
    expect(keys).not.toContain("brands");
    expect(keys).toContain("social");
    expect(result.sidebar).toEqual(baseLayout.sidebar);
  });

  it("null/undefined category: no physical, social still inserted, sidebar unchanged", () => {
    expect(applyCategoryTalentLayout(baseLayout, null).main.map((e) => e.key)).not.toContain("physical");
    expect(applyCategoryTalentLayout(baseLayout, undefined).main.map((e) => e.key)).toContain("social");
    expect(applyCategoryTalentLayout(baseLayout, null).sidebar).toEqual(baseLayout.sidebar);
  });

  it("is idempotent — applying it twice gives the same result as once", () => {
    const once  = applyCategoryTalentLayout(baseLayout, "model");
    const twice = applyCategoryTalentLayout(once, "model");
    expect(twice.main.map((e) => e.key)).toEqual(once.main.map((e) => e.key));
    expect(twice.sidebar.map((e) => e.key)).toEqual(once.sidebar.map((e) => e.key));
  });

  it("falls back to appending at the end when portfolio/experience are absent from the layout", () => {
    const bare: ProfileLayoutDTO = {
      main: [{ key: "bio", width: "full" }],
      sidebar: [],
    };
    const result = applyCategoryTalentLayout(bare, "model");
    expect(result.main.map((e) => e.key)).toEqual(["bio", "brands", "social"]);
    expect(result.sidebar.map((e) => e.key)).toEqual(["physical"]);
  });

  it("preserves widths on entries it does not touch", () => {
    const withWidth: ProfileLayoutDTO = {
      main: [
        { key: "bio", width: "half" },
        { key: "portfolio", width: "two_thirds" },
      ],
      sidebar: [],
    };
    const result = applyCategoryTalentLayout(withWidth, "ugc");
    expect(result.main.find((e) => e.key === "bio")?.width).toBe("half");
    expect(result.main.find((e) => e.key === "portfolio")?.width).toBe("two_thirds");
  });
});
