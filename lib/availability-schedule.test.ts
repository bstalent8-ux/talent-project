import { describe, it, expect } from "vitest";
import {
  emptyAvailabilitySchedule,
  formatAvailabilitySummary,
  parseAvailabilitySchedule,
  type AvailabilitySchedule,
} from "./availability-schedule";

describe("parseAvailabilitySchedule", () => {
  it("returns an empty schedule for null/undefined/non-object input", () => {
    expect(parseAvailabilitySchedule(null)).toEqual(emptyAvailabilitySchedule());
    expect(parseAvailabilitySchedule(undefined)).toEqual(emptyAvailabilitySchedule());
    expect(parseAvailabilitySchedule("nonsense")).toEqual(emptyAvailabilitySchedule());
  });

  it("parses a valid weekly day and drops invalid slots", () => {
    const parsed = parseAvailabilitySchedule({
      timezone: "Africa/Cairo",
      weekly: {
        sunday: { enabled: true, slots: [{ start: "10:00", end: "18:00" }, { start: "bad", end: "18:00" }] },
      },
    });
    expect(parsed.timezone).toBe("Africa/Cairo");
    expect(parsed.weekly.sunday).toEqual({ enabled: true, slots: [{ start: "10:00", end: "18:00" }] });
    expect(parsed.weekly.monday).toEqual({ enabled: false, slots: [] });
  });

  it("disables a day whose slots all fail validation, even if enabled:true was stored", () => {
    const parsed = parseAvailabilitySchedule({
      weekly: { monday: { enabled: true, slots: [{ start: "18:00", end: "10:00" }] } },
    });
    expect(parsed.weekly.monday.enabled).toBe(false);
  });

  it("caps a day at 2 slots", () => {
    const parsed = parseAvailabilitySchedule({
      weekly: {
        friday: {
          enabled: true,
          slots: [
            { start: "09:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
            { start: "19:00", end: "21:00" },
          ],
        },
      },
    });
    expect(parsed.weekly.friday.slots).toHaveLength(2);
  });

  it("keeps a valid 'unavailable' exception and drops a malformed one", () => {
    const parsed = parseAvailabilitySchedule({
      exceptions: [
        { date: "2026-09-01", type: "unavailable" },
        { date: "not-a-date", type: "unavailable" },
        { date: "2026-09-05", type: "custom", slots: [{ start: "12:00", end: "15:00" }] },
        { date: "2026-09-06", type: "custom", slots: [] },
      ],
    });
    expect(parsed.exceptions).toEqual([
      { date: "2026-09-01", type: "unavailable" },
      { date: "2026-09-05", type: "custom", slots: [{ start: "12:00", end: "15:00" }] },
    ]);
  });
});

describe("formatAvailabilitySummary", () => {
  it("returns null when availability is unset", () => {
    expect(formatAvailabilitySummary(null, null, "en")).toBeNull();
    expect(formatAvailabilitySummary(undefined, null, "en")).toBeNull();
  });

  it("unavailable overrides any schedule detail", () => {
    expect(formatAvailabilitySummary("unavailable", null, "en")).toBe("Currently unavailable");
    expect(formatAvailabilitySummary("unavailable", null, "ar")).toBe("غير متاح حالياً");
  });

  it("falls back to plain 'Available now' with no weekly detail", () => {
    expect(formatAvailabilitySummary("available", null, "en")).toBe("Available now");
    expect(formatAvailabilitySummary("available", emptyAvailabilitySchedule(), "en")).toBe("Available now");
  });

  it("renders a compact contiguous uniform range", () => {
    const schedule: AvailabilitySchedule = emptyAvailabilitySchedule("Africa/Cairo");
    for (const day of ["sunday", "monday", "tuesday", "wednesday", "thursday"] as const) {
      schedule.weekly[day] = { enabled: true, slots: [{ start: "10:00", end: "18:00" }] };
    }
    expect(formatAvailabilitySummary("available", schedule, "en")).toBe("Sun–Thu · 10 AM – 6 PM");
    expect(formatAvailabilitySummary("available", schedule, "ar")).toBe("أحد–خميس · 10:00 – 18:00");
  });

  it("renders a single enabled day without a range dash", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.weekly.friday = { enabled: true, slots: [{ start: "09:00", end: "12:30" }] };
    expect(formatAvailabilitySummary("available", schedule, "en")).toBe("Fri · 9 AM – 12:30 PM");
  });

  it("falls back to generic 'this week' when days are non-contiguous", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.weekly.sunday = { enabled: true, slots: [{ start: "10:00", end: "18:00" }] };
    schedule.weekly.friday = { enabled: true, slots: [{ start: "10:00", end: "18:00" }] };
    expect(formatAvailabilitySummary("available", schedule, "en")).toBe("Available this week");
  });

  it("falls back to generic 'this week' when hours differ across enabled days", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.weekly.sunday = { enabled: true, slots: [{ start: "10:00", end: "18:00" }] };
    schedule.weekly.monday = { enabled: true, slots: [{ start: "09:00", end: "17:00" }] };
    expect(formatAvailabilitySummary("available", schedule, "en")).toBe("Available this week");
  });

  it("never leaks date exceptions into the public summary", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.weekly.sunday = { enabled: true, slots: [{ start: "10:00", end: "18:00" }] };
    schedule.exceptions = [{ date: "2026-09-01", type: "unavailable" }];
    const summary = formatAvailabilitySummary("available", schedule, "en")!;
    expect(summary).not.toMatch(/2026|09-01/);
  });
});
