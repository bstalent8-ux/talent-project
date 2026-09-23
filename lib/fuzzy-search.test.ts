import { describe, it, expect } from "vitest";
import { fuzzyMatch, matchScore, normalizeText } from "./fuzzy-search";

describe("normalizeText", () => {
  it("unifies alef/ة/ى forms and strips diacritics", () => {
    expect(normalizeText("أَحْمَد")).toBe("احمد");
    expect(normalizeText("إسلام")).toBe("اسلام");
    expect(normalizeText("فاطمة")).toBe("فاطمه");
    expect(normalizeText("ليلى")).toBe("ليلي");
  });

  it("lowercases and collapses whitespace", () => {
    expect(normalizeText("  Mohamed   Saeed  ")).toBe("mohamed saeed");
  });
});

describe("matchScore", () => {
  it("scores an exact substring highest", () => {
    expect(matchScore("moha", "Mohamed Saeed")).toBe(100);
  });

  it("tolerates a single wrong letter in a longer word", () => {
    expect(matchScore("mohaned", "Mohamed Saeed")).toBeGreaterThan(0);
  });

  it("tolerates a missing letter", () => {
    expect(matchScore("filopater", "Filopateer Atef")).toBeGreaterThan(0);
  });

  it("tolerates Arabic typos after normalization", () => {
    expect(matchScore("احمد", "أحمد")).toBe(100);
    expect(matchScore("احمود", "احمد")).toBeGreaterThan(0);
  });

  it("returns 0 for unrelated text", () => {
    expect(matchScore("photographer", "Mohamed Saeed")).toBe(0);
  });

  it("returns 0 for an empty query", () => {
    expect(matchScore("", "Mohamed Saeed")).toBe(0);
  });

  it("requires every query word to match (AND semantics)", () => {
    expect(matchScore("mohamed xyz123", "Mohamed Saeed")).toBe(0);
  });

  it("rejects a short word typo outside its budget", () => {
    // 3-letter words need an exact/prefix match — no typo budget.
    expect(matchScore("xyz", "abc")).toBe(0);
  });
});

describe("fuzzyMatch", () => {
  it("matches across multiple joined fields", () => {
    expect(fuzzyMatch("ugc mohamed", "Mohamed Saeed", "ugc")).toBe(true);
  });

  it("treats an empty query as matching everything", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });

  it("ignores null/undefined fields", () => {
    expect(fuzzyMatch("mohamed", "Mohamed Saeed", null, undefined)).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(fuzzyMatch("zzz999", "Mohamed Saeed", "ugc")).toBe(false);
  });
});
