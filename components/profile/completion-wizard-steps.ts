// ─── Guided completion wizard step sequence ────────────────────────────────
// Pure, no JSX — importable from a vitest test without pulling in React.
// Every talent gets the same sequence, including "physical": the completion
// score counts that section (10 pts) for all talents, so a category without the
// step could never reach 100%. Only the FIELDS differ — Models get the approved
// measurements, everyone else gets age / languages / dialect
// (see lib/profile-fields.ts).

export type WizardStepKey =
  | "basic"
  | "physical"
  | "professional"
  | "portfolio"
  | "experience"
  | "presence"
  | "availability"
  | "review";

export function getWizardSteps(category?: string | null): WizardStepKey[] {
  void category; // sequence no longer depends on category; kept for call-site stability
  return ["basic", "physical", "professional", "portfolio", "experience", "presence", "availability", "review"];
}
