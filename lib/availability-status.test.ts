import { describe, it, expect } from "vitest";
import { toDbAvailability, fromDbAvailability } from "./availability-status";

describe("availability status mapping", () => {
  it("writes unavailable as busy and leaves available untouched", () => {
    expect(toDbAvailability("unavailable")).toBe("busy");
    expect(toDbAvailability("available")).toBe("available");
    expect(toDbAvailability(undefined)).toBeUndefined();
  });
  it("reads busy and any non-available value as unavailable", () => {
    expect(fromDbAvailability("busy")).toBe("unavailable");
    expect(fromDbAvailability("unavailable")).toBe("unavailable");
    expect(fromDbAvailability("available")).toBe("available");
    expect(fromDbAvailability(null)).toBe("available");
  });
});
