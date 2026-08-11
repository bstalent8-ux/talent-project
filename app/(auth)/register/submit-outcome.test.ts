import { describe, it, expect } from "vitest";
import { resolveProfileSubmitOutcome } from "./submit-outcome";

// ─── Sprint 1 (profile-category-foundation) — partial-account fix ────────────
// Proves the exact failure path the user's follow-up flagged: a failed
// POST /api/profile must not navigate to /profile/me, because that
// navigation is what triggers GET /api/me's self-heal, which would create a
// bare `profiles` row (no category, no talent_profiles) — a partially-
// created account. This function is the single decision point page.tsx's
// handleSubmit now defers to; page.tsx wires it directly (see page.tsx's
// import), so this test proves the real code path, not a parallel one.

describe("registration submit outcome (Sprint 1 partial-account fix)", () => {
  it("a successful (ok) response navigates and shows no error", () => {
    const outcome = resolveProfileSubmitOutcome({ ok: true });
    expect(outcome).toEqual({ navigate: true, showError: false });
  });

  it("a 400 (invalid category) response does NOT navigate — stops self-heal from ever triggering", () => {
    const outcome = resolveProfileSubmitOutcome({ ok: false });
    expect(outcome.navigate).toBe(false);
  });

  it("a 400 (invalid category) response surfaces an error to the user", () => {
    const outcome = resolveProfileSubmitOutcome({ ok: false });
    expect(outcome.showError).toBe(true);
  });

  it("a 500 (unexpected server failure) response also does not navigate", () => {
    // ok:false covers every non-2xx status uniformly — the fix does not
    // special-case 400 vs 500, both must stop the same way.
    const outcome = resolveProfileSubmitOutcome({ ok: false });
    expect(outcome).toEqual({ navigate: false, showError: true });
  });
});
