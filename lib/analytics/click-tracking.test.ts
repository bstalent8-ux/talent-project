import { describe, it, expect } from "vitest";
import { buildClickLabel, isClickableElement } from "./click-tracking";

describe("buildClickLabel", () => {
  it("prefers aria-label over everything else", () => {
    const label = buildClickLabel({ tag: "BUTTON", ariaLabel: "Close menu", title: "X", text: "close", href: null });
    expect(label).toBe("Close menu");
  });

  it("falls back to title when aria-label is absent", () => {
    const label = buildClickLabel({ tag: "A", ariaLabel: null, title: "View profile", text: "click here", href: null });
    expect(label).toBe("View profile");
  });

  it("falls back to visible text when neither attribute is set", () => {
    const label = buildClickLabel({ tag: "BUTTON", ariaLabel: null, title: null, text: "  Book Now  ", href: null });
    expect(label).toBe("Book Now");
  });

  it("falls back to the bare tag name as a last resort", () => {
    const label = buildClickLabel({ tag: "BUTTON", ariaLabel: null, title: null, text: "", href: null });
    expect(label).toBe("button");
  });

  it("treats a blank aria-label as absent, not as the label", () => {
    const label = buildClickLabel({ tag: "A", ariaLabel: "   ", title: null, text: "Explore", href: null });
    expect(label).toBe("Explore");
  });

  it("collapses internal whitespace/newlines in text content", () => {
    const label = buildClickLabel({ tag: "A", ariaLabel: null, title: null, text: "Book\n   Now", href: null });
    expect(label).toBe("Book Now");
  });

  it("truncates a long label", () => {
    const label = buildClickLabel({ tag: "BUTTON", ariaLabel: null, title: null, text: "x".repeat(200), href: null });
    expect(label.length).toBe(100);
    expect(label.endsWith("…")).toBe(true);
  });
});

describe("isClickableElement", () => {
  it("accepts <a> and <button>", () => {
    expect(isClickableElement("A", null)).toBe(true);
    expect(isClickableElement("button", null)).toBe(true);
  });

  it("accepts role=button / role=link on any tag", () => {
    expect(isClickableElement("DIV", "button")).toBe(true);
    expect(isClickableElement("SPAN", "link")).toBe(true);
  });

  it("rejects plain content elements", () => {
    expect(isClickableElement("DIV", null)).toBe(false);
    expect(isClickableElement("P", null)).toBe(false);
    expect(isClickableElement("SPAN", "presentation")).toBe(false);
  });
});
