import { describe, it, expect } from "vitest";
import { escapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("escapes the 5 HTML-significant characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  it("neutralizes an <img onerror> payload — no tag survives as markup", () => {
    const out = escapeHtml('<img src=x onerror=alert(1)>');
    expect(out).not.toContain("<img");
    expect(out).toBe("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("neutralizes a <script> payload", () => {
    const out = escapeHtml("<script>alert(1)</script>");
    expect(out).not.toMatch(/<script/i);
    expect(out).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("neutralizes an attribute-breakout SVG payload", () => {
    const out = escapeHtml('"><svg onload=alert(1)>');
    expect(out).not.toContain("<svg");
    expect(out).toBe("&quot;&gt;&lt;svg onload=alert(1)&gt;");
  });

  it("does not double-escape an already-escaped ampersand", () => {
    // & must be escaped first so "<" -> "&lt;" doesn't get re-escaped into "&amp;lt;"
    expect(escapeHtml("<")).toBe("&lt;");
  });

  it("passes Arabic text through untouched", () => {
    expect(escapeHtml("مايادا الجندي")).toBe("مايادا الجندي");
  });

  it("passes plain English names and emoji through untouched", () => {
    expect(escapeHtml("Kenzy Walid 🎉")).toBe("Kenzy Walid 🎉");
  });

  it("preserves benign markup as inert text rather than silently stripping it", () => {
    // Not executable, but not deleted either — the raw characters are visible,
    // exactly what escaping (vs. stripping) is supposed to do.
    expect(escapeHtml("<b>Test</b>")).toBe("&lt;b&gt;Test&lt;/b&gt;");
  });
});
