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

  it("parses a valid date and drops invalid slots", () => {
    const parsed = parseAvailabilitySchedule({
      timezone: "Africa/Cairo",
      dates: {
        "2026-08-16": [{ start: "10:00", end: "14:00" }, { start: "bad", end: "18:00" }],
      },
    });
    expect(parsed.timezone).toBe("Africa/Cairo");
    expect(parsed.dates).toEqual({ "2026-08-16": [{ start: "10:00", end: "14:00" }] });
  });

  it("drops a date whose key is not a valid YYYY-MM-DD string", () => {
    const parsed = parseAvailabilitySchedule({ dates: { "not-a-date": [{ start: "10:00", end: "14:00" }] } });
    expect(parsed.dates).toEqual({});
  });

  it("drops a date whose slots all fail validation", () => {
    const parsed = parseAvailabilitySchedule({ dates: { "2026-08-16": [{ start: "18:00", end: "10:00" }] } });
    expect(parsed.dates).toEqual({});
  });

  it("caps a date at 2 slots", () => {
    const parsed = parseAvailabilitySchedule({
      dates: {
        "2026-08-16": [
          { start: "09:00", end: "12:00" },
          { start: "14:00", end: "18:00" },
          { start: "19:00", end: "21:00" },
        ],
      },
    });
    expect(parsed.dates["2026-08-16"]).toHaveLength(2);
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
  const today = "2026-08-14";

  it("returns null when availability is unset", () => {
    expect(formatAvailabilitySummary(null, null, "en", today)).toBeNull();
    expect(formatAvailabilitySummary(undefined, null, "en", today)).toBeNull();
  });

  it("unavailable overrides any schedule detail", () => {
    expect(formatAvailabilitySummary("unavailable", null, "en", today)).toBe("Currently unavailable");
    expect(formatAvailabilitySummary("unavailable", null, "ar", today)).toBe("غير متاح حالياً");
  });

  it("falls back to plain 'Available now' with no dates selected", () => {
    expect(formatAvailabilitySummary("available", null, "en", today)).toBe("Available now");
    expect(formatAvailabilitySummary("available", emptyAvailabilitySchedule(), "en", today)).toBe("Available now");
  });

  it("ignores past dates when picking upcoming ones", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.dates["2026-08-10"] = [{ start: "10:00", end: "14:00" }]; // past
    expect(formatAvailabilitySummary("available", schedule, "en", today)).toBe("Available now");
  });

  it("renders up to 3 upcoming dates sharing one uniform time range", () => {
    const schedule: AvailabilitySchedule = emptyAvailabilitySchedule("Africa/Cairo");
    schedule.dates["2026-08-16"] = [{ start: "10:00", end: "14:00" }];
    schedule.dates["2026-08-18"] = [{ start: "10:00", end: "14:00" }];
    schedule.dates["2026-08-20"] = [{ start: "10:00", end: "14:00" }];
    expect(formatAvailabilitySummary("available", schedule, "en", today)).toBe("Available Aug 16, Aug 18, Aug 20 · 10 AM – 2 PM");
    expect(formatAvailabilitySummary("available", schedule, "ar", today)).toBe("متاح 16 أغسطس، 18 أغسطس، 20 أغسطس · 10:00 – 14:00");
  });

  it("caps the shown date list at 3 even with more selected", () => {
    const schedule = emptyAvailabilitySchedule();
    for (const d of ["2026-08-16", "2026-08-17", "2026-08-18", "2026-08-19"]) {
      schedule.dates[d] = [{ start: "10:00", end: "14:00" }];
    }
    const summary = formatAvailabilitySummary("available", schedule, "en", today)!;
    expect(summary).toBe("Available Aug 16, Aug 17, Aug 18 · 10 AM – 2 PM");
  });

  it("falls back to generic 'this week' when upcoming dates have different hours", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.dates["2026-08-16"] = [{ start: "10:00", end: "14:00" }];
    schedule.dates["2026-08-17"] = [{ start: "09:00", end: "17:00" }];
    expect(formatAvailabilitySummary("available", schedule, "en", today)).toBe("Available this week");
  });

  it("never leaks date exceptions into the public summary", () => {
    const schedule = emptyAvailabilitySchedule();
    schedule.dates["2026-08-16"] = [{ start: "10:00", end: "14:00" }];
    schedule.exceptions = [{ date: "2026-09-01", type: "unavailable" }];
    const summary = formatAvailabilitySummary("available", schedule, "en", today)!;
    expect(summary).not.toMatch(/2026-09/);
  });
});
