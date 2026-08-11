import { describe, it, expect } from "vitest";
import { TALENT_TYPES } from "./talent-types";
import { CANONICAL_TALENT_CATEGORY_IDS } from "@/features/categories/canonical-ids";

describe("registration talent-type dropdown (Sprint 1 regression)", () => {
  it("offers exactly the canonical talent category ids — no more, no fewer", () => {
    const formValues = TALENT_TYPES.map((t) => t.value).slice().sort();
    const canonical = [...CANONICAL_TALENT_CATEGORY_IDS].sort();
    expect(formValues).toEqual(canonical);
  });

  it("offers model", () => {
    expect(TALENT_TYPES.some((t) => t.value === "model")).toBe(true);
  });

  it("no longer offers media_buyers", () => {
    expect(TALENT_TYPES.some((t) => (t.value as string) === "media_buyers")).toBe(false);
  });

  it("every option has both ar and en labels (CLAUDE.md §15.5 bilingual rule)", () => {
    for (const t of TALENT_TYPES) {
      expect(t.ar).toBeTruthy();
      expect(t.en).toBeTruthy();
    }
  });

  it("every value is unique", () => {
    const values = TALENT_TYPES.map((t) => t.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
