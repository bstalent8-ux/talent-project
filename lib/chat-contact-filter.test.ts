import { describe, expect, it } from "vitest";
import { findContactInfo, containsContactInfo } from "./chat-contact-filter";

describe("findContactInfo — phone", () => {
  it("flags a plain phone number", () => {
    const result = findContactInfo("كلمني على 01012345678");
    expect(result).toEqual([{ type: "phone", raw: "01012345678" }]);
  });

  it("ignores a year or a price", () => {
    expect(findContactInfo("خبرة من 2019 وسعري 500 جنيه")).toEqual([]);
  });
});

describe("findContactInfo — email", () => {
  it("flags an email address", () => {
    const result = findContactInfo("راسلني على test.contact@example.com لو حابب");
    expect(result).toEqual([{ type: "email", raw: "test.contact@example.com" }]);
  });

  it("ignores plain text with an @ that isn't an email", () => {
    expect(findContactInfo("تابعوني @myhandle على انستجرام")).toEqual([]);
  });
});

describe("findContactInfo — off-platform links", () => {
  it("flags a wa.me link (the embedded number also matches as a phone — both are real signals)", () => {
    const result = findContactInfo("كلمني على https://wa.me/201001234567");
    expect(result.map((m) => m.type).sort()).toEqual(["off_platform_link", "phone"]);
  });

  it("flags a t.me link", () => {
    expect(findContactInfo("t.me/myusername").length).toBe(1);
  });

  it("does NOT flag an ordinary Instagram/portfolio link", () => {
    expect(findContactInfo("شوف شغلي على instagram.com/mycreator")).toEqual([]);
  });
});

describe("findContactInfo — ordinary chat", () => {
  it("finds nothing in normal negotiation text", () => {
    expect(findContactInfo("تمام، السعر 3000 جنيه ومدة التسليم أسبوع")).toEqual([]);
  });

  it("returns [] for null/undefined/empty", () => {
    expect(findContactInfo(null)).toEqual([]);
    expect(findContactInfo(undefined)).toEqual([]);
    expect(findContactInfo("")).toEqual([]);
  });
});

describe("findContactInfo — combined", () => {
  it("flags both a phone and an email in the same message", () => {
    const result = findContactInfo("رقمي 01012345678 وايميلي test@example.com");
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.type).sort()).toEqual(["email", "phone"]);
  });
});

describe("containsContactInfo", () => {
  it("is true when contact info is present", () => {
    expect(containsContactInfo("01012345678")).toBe(true);
  });
  it("is false for ordinary chat text", () => {
    expect(containsContactInfo("تمام هابدأ الشغل بكرة")).toBe(false);
  });
});
