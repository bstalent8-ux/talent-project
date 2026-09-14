import { describe, it, expect } from "vitest";
import { bookingSchema } from "./schema";

// Mirrors the real body components/DirectBriefModal.tsx sends — a budget
// RANGE (Flow 2: custom brief, price negotiated after sending), not a fixed
// amount. See app/api/bookings/package/route.ts for Flow 1 (fixed package
// price, separate endpoint/schema).
const validBody = {
  talent_user_id: "11111111-1111-4111-8111-111111111111",
  service_type: "hourly",
  start_date: "2026-09-01",
  duration: 3,
  deadline: null,
  budget_min: 1000,
  budget_max: 1500,
  brief: "Need a 30-second product demo.",
};

describe("bookingSchema", () => {
  it("accepts the real client payload shape (hourly)", () => {
    expect(bookingSchema.parse(validBody)).toEqual(validBody);
  });

  it("accepts a fixed_project payload (duration null, deadline set)", () => {
    const body = { ...validBody, service_type: "fixed_project", duration: null, deadline: "2026-09-20" };
    expect(bookingSchema.parse(body)).toEqual(body);
  });

  it("accepts an equal budget_min and budget_max (a fixed number expressed as a range)", () => {
    const body = { ...validBody, budget_min: 1200, budget_max: 1200 };
    expect(bookingSchema.parse(body)).toEqual(body);
  });

  it("rejects an invalid service_type", () => {
    expect(() => bookingSchema.parse({ ...validBody, service_type: "monthly" })).toThrow();
  });

  it("rejects a non-UUID talent_user_id", () => {
    expect(() => bookingSchema.parse({ ...validBody, talent_user_id: "not-a-uuid" })).toThrow();
  });

  it("rejects a malformed start_date", () => {
    expect(() => bookingSchema.parse({ ...validBody, start_date: "Sep 1 2026" })).toThrow();
  });

  it("rejects an empty brief", () => {
    expect(() => bookingSchema.parse({ ...validBody, brief: "" })).toThrow();
  });

  it("rejects a brief over the 5000-char cap (no cap existed before)", () => {
    expect(() => bookingSchema.parse({ ...validBody, brief: "a".repeat(5001) })).toThrow();
  });

  it("rejects a budget_min below the 500 EGP floor", () => {
    expect(() => bookingSchema.parse({ ...validBody, budget_min: 499 })).toThrow();
  });

  it("rejects a budget_max below the 500 EGP floor", () => {
    expect(() => bookingSchema.parse({ ...validBody, budget_max: 100 })).toThrow();
  });

  it("rejects a budget_max above the ceiling", () => {
    expect(() => bookingSchema.parse({ ...validBody, budget_max: 50_000_000 })).toThrow();
  });

  it("rejects budget_max below budget_min", () => {
    expect(() => bookingSchema.parse({ ...validBody, budget_min: 2000, budget_max: 1000 })).toThrow();
  });

  it("rejects more than 10 attachments", () => {
    const attachments = Array.from({ length: 11 }, (_, i) => `https://example.com/${i}.pdf`);
    expect(() => bookingSchema.parse({ ...validBody, attachments })).toThrow();
  });

  it("rejects a non-URL attachment", () => {
    expect(() => bookingSchema.parse({ ...validBody, attachments: ["not-a-url"] })).toThrow();
  });
});
