// ─── Registration submit outcome ──────────────────────────────────────────────
// The bug this replaces: handleSubmit in page.tsx used to discard the
// `POST /api/profile` response entirely and unconditionally navigate to
// /profile/me. When the request failed (e.g. an invalid category), the user
// landed on /profile/me signed-in with no `profiles` row, whose own
// `GET /api/me` self-heal then created a BARE profiles row (no category, no
// talent_profiles) — a partially-created account, silently, with no error
// shown. This function is the single decision point page.tsx now defers to:
// navigate only on success, otherwise stop and surface an error.
export interface SubmitOutcome {
  navigate: boolean;
  showError: boolean;
}

export function resolveProfileSubmitOutcome(res: { ok: boolean }): SubmitOutcome {
  return res.ok
    ? { navigate: true, showError: false }
    : { navigate: false, showError: true };
}
