import { describe, it, expect } from "vitest";
import { TALENT_PHYSICAL_KEYS, normalizeGender } from "./profile-fields";

describe("normalizeGender", () => {
  it("maps English and Arabic spellings to male/female", () => {
    for (const v of ["male", "Male", " M ", "man", "ذكر", "رجل"]) expect(normalizeGender(v)).toBe("male");
    for (const v of ["female", "FEMALE", "f", "woman", "أنثى", "انثى"]) expect(normalizeGender(v)).toBe("female");
  });

  it("returns null for anything else", () => {
    for (const v of ["", "other", "x", null, undefined, 1, {}]) expect(normalizeGender(v)).toBeNull();
  });

  it("gender is not a physical key (it must not complete that section on its own)", () => {
    expect((TALENT_PHYSICAL_KEYS as readonly string[]).includes("gender")).toBe(false);
  });
});
