import { describe, expect, it } from "vitest";
import { parseBlogPostInput } from "./validation";

const base = {
  title: "دليل شامل لـ UGC للبراندات",
  category: "UGC",
};

describe("parseBlogPostInput", () => {
  it("accepts a minimal valid body, deriving the slug from the title", () => {
    const result = parseBlogPostInput(base);
    expect("input" in result).toBe(true);
    if ("input" in result) {
      expect(result.input.slug.length).toBeGreaterThan(0);
      expect(result.input.status).toBe("draft");
      expect(result.input.lang).toBe("ar");
    }
  });

  it("rejects a missing title", () => {
    const result = parseBlogPostInput({ category: "UGC" });
    expect(result).toEqual({ error: "title is required" });
  });

  it("rejects a category outside the closed set", () => {
    const result = parseBlogPostInput({ title: "x", category: "Sports" });
    expect(result).toEqual({ error: "invalid category" });
  });

  it("slugifies a custom slug rather than trusting it raw", () => {
    const result = parseBlogPostInput({ ...base, slug: "Hello World!!" });
    if ("input" in result) expect(result.input.slug).toBe("hello-world");
    else throw new Error("expected input");
  });

  it("caps tags at 15 and drops blanks", () => {
    const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`).concat(["", "  "]);
    const result = parseBlogPostInput({ ...base, tags });
    if ("input" in result) expect(result.input.tags.length).toBe(15);
    else throw new Error("expected input");
  });

  it("falls back to a generated slug for a pure-Arabic title instead of rejecting it", () => {
    const result = parseBlogPostInput({ title: "دليل شامل للمواهب والبراندات", category: "Talent" });
    if ("input" in result) {
      expect(result.input.slug.length).toBeGreaterThan(0);
      expect(result.input.slug.startsWith("post-")).toBe(true);
    } else {
      throw new Error("expected input, got error: " + result.error);
    }
  });

  it("defaults status to draft and only accepts 'published' as the other value", () => {
    const published = parseBlogPostInput({ ...base, status: "published" });
    const garbage = parseBlogPostInput({ ...base, status: "live" });
    if ("input" in published) expect(published.input.status).toBe("published");
    if ("input" in garbage) expect(garbage.input.status).toBe("draft");
  });
});
