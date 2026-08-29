import { describe, it, expect } from "vitest";
import { applySchema } from "./schema";

// Mirrors the real body ApplyModal.tsx sends (see app/(main)/jobs/_components/ApplyModal.tsx).
const validBody = {
  message: "I'd love to work on this campaign.",
  proposed_price: 5000,
  delivery_days: 7,
  portfolio_links: ["https://instagram.com/p/abc123"],
};

describe("applySchema", () => {
  it("accepts the real client payload shape", () => {
    expect(applySchema.parse(validBody)).toEqual(validBody);
  });

  it("accepts null delivery_days/portfolio_links (client sends null, not omitted)", () => {
    const body = { ...validBody, delivery_days: null, portfolio_links: null };
    expect(applySchema.parse(body)).toEqual(body);
  });

  it("rejects an empty message", () => {
    expect(() => applySchema.parse({ ...validBody, message: "" })).toThrow();
  });

  it("rejects a message over 2000 chars", () => {
    expect(() => applySchema.parse({ ...validBody, message: "a".repeat(2001) })).toThrow();
  });

  it("rejects a non-positive proposed_price", () => {
    expect(() => applySchema.parse({ ...validBody, proposed_price: 0 })).toThrow();
    expect(() => applySchema.parse({ ...validBody, proposed_price: -50 })).toThrow();
  });

  it("rejects a proposed_price above the ceiling", () => {
    expect(() => applySchema.parse({ ...validBody, proposed_price: 10_000_001 })).toThrow();
  });

  it("rejects a non-numeric proposed_price (the old Number('garbage')->NaN hole)", () => {
    expect(() => applySchema.parse({ ...validBody, proposed_price: "garbage" })).toThrow();
  });

  it("rejects a non-integer delivery_days", () => {
    expect(() => applySchema.parse({ ...validBody, delivery_days: 2.5 })).toThrow();
  });

  it("rejects delivery_days over the 365-day ceiling", () => {
    expect(() => applySchema.parse({ ...validBody, delivery_days: 400 })).toThrow();
  });

  it("rejects a non-URL portfolio link", () => {
    expect(() => applySchema.parse({ ...validBody, portfolio_links: ["not a url"] })).toThrow();
  });

  it("rejects more than 10 portfolio links", () => {
    const links = Array.from({ length: 11 }, (_, i) => `https://example.com/${i}`);
    expect(() => applySchema.parse({ ...validBody, portfolio_links: links })).toThrow();
  });

  it("rejects a missing message entirely (server used to allow this silently)", () => {
    const { message, ...rest } = validBody;
    expect(() => applySchema.parse(rest)).toThrow();
  });
});
