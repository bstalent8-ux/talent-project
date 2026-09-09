import { describe, expect, it } from "vitest";
import { extractPhoneCandidates, bioContainsPhoneNumber } from "./bio-phone-detection";

describe("extractPhoneCandidates", () => {
  it("finds a plain Egyptian mobile number", () => {
    const result = extractPhoneCandidates("كلمني على 01012345678 لو حابب تتعامل معايا مباشرة");
    expect(result).toHaveLength(1);
    expect(result[0].digits).toBe("01012345678");
  });

  it("finds a number written with spaces or dashes", () => {
    expect(extractPhoneCandidates("رقمي 010-123-45678")).toHaveLength(1);
    expect(extractPhoneCandidates("رقمي 010 123 45678")).toHaveLength(1);
  });

  it("finds a number with a country code", () => {
    const result = extractPhoneCandidates("WhatsApp: +20 100 123 4567");
    expect(result).toHaveLength(1);
    expect(result[0].digits).toBe("201001234567");
  });

  it("ignores short digit runs like a year or a price", () => {
    expect(extractPhoneCandidates("عندي خبرة من 2019 وسعري 500 جنيه")).toHaveLength(0);
  });

  it("ignores plain prose with no digits", () => {
    expect(extractPhoneCandidates("صانع محتوى UGC متخصص في مجال التجميل")).toHaveLength(0);
  });

  it("returns [] for null/undefined/empty", () => {
    expect(extractPhoneCandidates(null)).toEqual([]);
    expect(extractPhoneCandidates(undefined)).toEqual([]);
    expect(extractPhoneCandidates("")).toEqual([]);
  });

  it("de-duplicates the same number repeated in the bio", () => {
    const result = extractPhoneCandidates("رقمي 01012345678 كرر تاني 01012345678");
    expect(result).toHaveLength(1);
  });

  it("caps at 15 digits — an overly long run isn't a phone number", () => {
    expect(extractPhoneCandidates("رقم حساب 123456789012345678")).toHaveLength(0);
  });
});

describe("bioContainsPhoneNumber", () => {
  it("is true when a number is present", () => {
    expect(bioContainsPhoneNumber("01012345678")).toBe(true);
  });
  it("is false for ordinary bio text", () => {
    expect(bioContainsPhoneNumber("موديل عندي خبرة 5 سنين")).toBe(false);
  });
});
