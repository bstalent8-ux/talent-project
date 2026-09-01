import { describe, it, expect } from "vitest";
import { profileApprovedEmail } from "./profile-approved";
import { verificationApprovedEmail } from "./verification-approved";
import { brandApprovedEmail } from "./brand-approved";
import { completeProfileReminderEmail } from "./complete-profile-reminder";

// S-2 regression: every template interpolates a caller-supplied name into
// its HTML. None of these payloads may survive as live markup — they must
// come out as escaped, inert text, while a normal name renders untouched.
const MALICIOUS_NAMES = [
  "<img src=x onerror=alert(1)>",
  "<script>alert(1)</script>",
  '"><svg onload=alert(1)>',
];

const TEMPLATES = [
  { name: "profileApprovedEmail", fn: profileApprovedEmail },
  { name: "verificationApprovedEmail", fn: verificationApprovedEmail },
  { name: "brandApprovedEmail", fn: brandApprovedEmail },
  { name: "completeProfileReminderEmail", fn: completeProfileReminderEmail },
];

describe.each(TEMPLATES)("$name", ({ fn }) => {
  it.each(["ar", "en"] as const)("renders a normal name untouched (%s)", (lang) => {
    const { html } = fn(lang, lang === "ar" ? "مايادا الجندي" : "Kenzy Walid");
    expect(html).toContain(lang === "ar" ? "مايادا الجندي" : "Kenzy Walid");
  });

  it.each(MALICIOUS_NAMES)("neutralizes payload: %s", (payload) => {
    const { html } = fn("ar", payload);
    // The exact attack surface: no live <img>, <script>, or <svg> tag may
    // exist in the output — only their escaped, inert text form. The
    // words "onerror="/"onload=" surviving as plain text is fine and
    // expected — escaping neutralizes the tag around them, it doesn't
    // delete the payload's characters, just makes them inert.
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<svg");
    // The trusted template markup around it must survive untouched.
    expect(html).toContain("<div");
    expect(html).toContain("<h2");
  });

  it("falls back to the default greeting for an empty name, itself inert", () => {
    const { html } = fn("ar", "");
    expect(html).not.toContain("<img");
    expect(html.length).toBeGreaterThan(0);
  });
});
