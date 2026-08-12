import { describe, it, expect } from "vitest";
import { TALENT_TYPES } from "./talent-types";

describe("registration TALENT_TYPES — MVP scope (UGC + Model only)", () => {
  const values = TALENT_TYPES.map((t) => t.value);

  it("exposes exactly ugc and model, in that order", () => {
    expect(values).toEqual(["ugc", "model"]);
  });

  it.each([
    "media_buyers",
    "influencer",
    "food_reviewer",
    "tech_reviewer",
    "unboxing",
    "host",
    "fashion",
    "makeup",
    "kids",
    "commercial",
    "parts",
  ])("does not expose %s as a new-registration option", (unsupported) => {
    expect(values).not.toContain(unsupported);
  });
});
