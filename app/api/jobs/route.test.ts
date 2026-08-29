import { describe, it, expect } from "vitest";
import { createJobSchema } from "./schema";

// Mirrors the real body app/(main)/jobs/create/page.tsx sends.
const validBody = {
  title: "UGC video for skincare launch",
  description: "3 short-form videos, product-in-hand style.",
  category: "beauty",
  budget_min: 2000,
  budget_max: 5000,
  currency: "EGP",
  start_date: "2026-09-01",
  end_date: "2026-09-15",
  slots: 2,
};

describe("createJobSchema", () => {
  it("accepts the real client payload shape", () => {
    expect(createJobSchema.parse(validBody)).toEqual(validBody);
  });

  it("defaults currency to EGP and slots to 1 when omitted", () => {
    const { currency, slots, ...rest } = validBody;
    expect(createJobSchema.parse(rest)).toMatchObject({ currency: "EGP", slots: 1 });
  });

  it("accepts null budgets/dates (client sends null when the field is blank)", () => {
    const body = { ...validBody, budget_min: null, budget_max: null, start_date: null, end_date: null };
    expect(createJobSchema.parse(body)).toEqual(body);
  });

  it("rejects a title under 3 chars", () => {
    expect(() => createJobSchema.parse({ ...validBody, title: "ab" })).toThrow();
  });

  it("rejects a missing title", () => {
    const { title, ...rest } = validBody;
    expect(() => createJobSchema.parse(rest)).toThrow();
  });

  it("rejects a negative budget", () => {
    expect(() => createJobSchema.parse({ ...validBody, budget_min: -100 })).toThrow();
  });

  it("rejects budget_min greater than budget_max", () => {
    expect(() => createJobSchema.parse({ ...validBody, budget_min: 9000, budget_max: 1000 })).toThrow();
  });

  it("rejects a malformed date", () => {
    expect(() => createJobSchema.parse({ ...validBody, start_date: "09/01/2026" })).toThrow();
  });

  it("rejects zero or negative slots", () => {
    expect(() => createJobSchema.parse({ ...validBody, slots: 0 })).toThrow();
    expect(() => createJobSchema.parse({ ...validBody, slots: -3 })).toThrow();
  });

  it("rejects an absurd slots count", () => {
    expect(() => createJobSchema.parse({ ...validBody, slots: 5000 })).toThrow();
  });

  it("rejects a non-integer slots value", () => {
    expect(() => createJobSchema.parse({ ...validBody, slots: 2.5 })).toThrow();
  });

  it("rejects a description over the 5000-char cap", () => {
    expect(() => createJobSchema.parse({ ...validBody, description: "a".repeat(5001) })).toThrow();
  });
});
