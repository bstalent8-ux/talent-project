import { describe, it, expect } from "vitest";
import { planBrandSync } from "./talent-brands-sync";

describe("planBrandSync", () => {
  it("inserts all names when there are no existing rows", () => {
    const plan = planBrandSync([], ["Nike", "Adidas"]);
    expect(plan.toInsert).toEqual([
      { brand_name: "Nike", sort_order: 0 },
      { brand_name: "Adidas", sort_order: 1 },
    ]);
    expect(plan.toDeleteIds).toEqual([]);
    expect(plan.toReorder).toEqual([]);
  });

  it("deletes unverified rows dropped from the list", () => {
    const plan = planBrandSync(
      [{ id: "1", brand_name: "Nike", verified: false }],
      ["Adidas"]
    );
    expect(plan.toDeleteIds).toEqual(["1"]);
    expect(plan.toInsert).toEqual([{ brand_name: "Adidas", sort_order: 0 }]);
  });

  it("never deletes a verified row even when dropped from the list", () => {
    const plan = planBrandSync(
      [{ id: "1", brand_name: "Nike", verified: true }],
      ["Adidas"]
    );
    expect(plan.toDeleteIds).toEqual([]);
    expect(plan.toInsert).toEqual([{ brand_name: "Adidas", sort_order: 0 }]);
  });

  it("reorders a kept row instead of deleting+reinserting it", () => {
    const plan = planBrandSync(
      [
        { id: "1", brand_name: "Nike", verified: false },
        { id: "2", brand_name: "Adidas", verified: false },
      ],
      ["Adidas", "Nike"]
    );
    expect(plan.toDeleteIds).toEqual([]);
    expect(plan.toInsert).toEqual([]);
    expect(plan.toReorder).toEqual([
      { id: "2", brand_name: "Adidas", sort_order: 0 },
      { id: "1", brand_name: "Nike", sort_order: 1 },
    ]);
  });

  it("dedupes, trims, and drops empty/oversized names", () => {
    const plan = planBrandSync([], [" Nike ", "Nike", "", "  ", "x".repeat(61)]);
    expect(plan.toInsert).toEqual([{ brand_name: "Nike", sort_order: 0 }]);
  });

  it("caps the list at 20 brands", () => {
    const names = Array.from({ length: 25 }, (_, i) => `Brand ${i}`);
    const plan = planBrandSync([], names);
    expect(plan.toInsert).toHaveLength(20);
  });

  it("treats a non-array input as an empty desired list", () => {
    const plan = planBrandSync([{ id: "1", brand_name: "Nike", verified: false }], undefined);
    expect(plan.toDeleteIds).toEqual(["1"]);
    expect(plan.toInsert).toEqual([]);
  });
});
