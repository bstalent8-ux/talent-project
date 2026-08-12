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
  it("model: inserts physical right before portfolio and social right after it", () => {
    const result = applyCategoryTalentLayout(baseLayout, "model");
    const keys = result.main.map((e) => e.key);
    expect(keys).toEqual([
      "bio", "physical", "portfolio", "social", "experience", "packages", "usage_addons", "equipment", "awards",
    ]);
  });

  it("ugc: inserts social after portfolio, no physical", () => {
    const result = applyCategoryTalentLayout(baseLayout, "ugc");
    const keys = result.main.map((e) => e.key);
    expect(keys).toEqual([
      "bio", "portfolio", "social", "experience", "packages", "usage_addons", "equipment", "awards",
    ]);
    expect(keys).not.toContain("physical");
  });

  it("legacy category (fashion): behaves exactly like ugc — no bespoke section invented", () => {
    const result = applyCategoryTalentLayout(baseLayout, "fashion");
    const keys = result.main.map((e) => e.key);
    expect(keys).not.toContain("physical");
    expect(keys).toContain("social");
  });

  it("null/undefined category: no physical, social still inserted", () => {
    expect(applyCategoryTalentLayout(baseLayout, null).main.map((e) => e.key)).not.toContain("physical");
    expect(applyCategoryTalentLayout(baseLayout, undefined).main.map((e) => e.key)).toContain("social");
  });

  it("never touches the sidebar", () => {
    const result = applyCategoryTalentLayout(baseLayout, "model");
    expect(result.sidebar).toEqual(baseLayout.sidebar);
  });

  it("is idempotent — applying it twice gives the same result as once", () => {
    const once  = applyCategoryTalentLayout(baseLayout, "model");
    const twice = applyCategoryTalentLayout(once, "model");
    expect(twice.main.map((e) => e.key)).toEqual(once.main.map((e) => e.key));
  });

  it("falls back to appending at the end when portfolio is absent from the layout", () => {
    const noPortfolio: ProfileLayoutDTO = {
      main: [{ key: "bio", width: "full" }],
      sidebar: [],
    };
    const result = applyCategoryTalentLayout(noPortfolio, "model");
    expect(result.main.map((e) => e.key)).toEqual(["bio", "physical", "social"]);
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
