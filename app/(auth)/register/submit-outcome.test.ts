import { describe, it, expect } from "vitest";
import { resolveProfileSubmitOutcome } from "./submit-outcome";

describe("resolveProfileSubmitOutcome", () => {
  it("navigates and shows no error when /api/profile succeeds", () => {
    expect(resolveProfileSubmitOutcome({ ok: true })).toEqual({ navigate: true, showError: false });
  });

  it("does not navigate and shows an error when /api/profile fails", () => {
    expect(resolveProfileSubmitOutcome({ ok: false })).toEqual({ navigate: false, showError: true });
  });
});
