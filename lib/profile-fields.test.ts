import { describe, it, expect } from "vitest";
import { MODEL_PHYSICAL_FIELDS, TALENT_PHYSICAL_KEYS, TALENT_SOCIAL_KEYS } from "./profile-fields";

describe("profile-fields canonical key lists", () => {
  it("TALENT_PHYSICAL_KEYS includes eye_color alongside the pre-existing keys", () => {
    expect(TALENT_PHYSICAL_KEYS).toEqual([
      "height", "weight", "hair_color", "shoe_size", "age", "languages", "dialect", "eye_color",
    ]);
  });

  it("MODEL_PHYSICAL_FIELDS is exactly the approved Model minimum — no invented fields", () => {
    expect(MODEL_PHYSICAL_FIELDS).toEqual(["height", "weight", "shoe_size", "hair_color", "eye_color"]);
  });

  it("every MODEL_PHYSICAL_FIELDS entry is a subset of TALENT_PHYSICAL_KEYS", () => {
    for (const key of MODEL_PHYSICAL_FIELDS) {
      expect(TALENT_PHYSICAL_KEYS).toContain(key);
    }
  });

  it("TALENT_SOCIAL_KEYS covers all 8 Professional Presence platforms", () => {
    expect(TALENT_SOCIAL_KEYS).toEqual([
      "instagram", "tiktok", "facebook", "youtube", "linkedin", "telegram", "website", "other",
    ]);
  });
});
