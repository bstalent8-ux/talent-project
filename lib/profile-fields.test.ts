import { describe, it, expect } from "vitest";
import { MODEL_PHYSICAL_FIELDS, TALENT_PHYSICAL_KEYS, TALENT_SOCIAL_KEYS, isSafePresenceValue } from "./profile-fields";

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

describe("isSafePresenceValue", () => {
  it("accepts a bare handle/username — no scheme to abuse", () => {
    expect(isSafePresenceValue("@myname")).toBe(true);
    expect(isSafePresenceValue("myname")).toBe(true);
  });

  it("accepts http and https URLs", () => {
    expect(isSafePresenceValue("https://instagram.com/myname")).toBe(true);
    expect(isSafePresenceValue("http://example.com")).toBe(true);
  });

  it("rejects dangerous schemes", () => {
    expect(isSafePresenceValue("javascript:alert(1)")).toBe(false);
    expect(isSafePresenceValue("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafePresenceValue("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects any other non-http(s) scheme, not just the well-known dangerous ones", () => {
    expect(isSafePresenceValue("ftp://example.com")).toBe(false);
    expect(isSafePresenceValue("mailto:me@example.com")).toBe(false);
  });

  it("rejects empty/whitespace-only values", () => {
    expect(isSafePresenceValue("")).toBe(false);
    expect(isSafePresenceValue("   ")).toBe(false);
  });
});
