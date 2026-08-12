// ─── Guided completion wizard step sequence ────────────────────────────────
// Pure, no JSX — importable from a vitest test without pulling in React.
// The only category-aware branch is "physical": it exists solely for `model`
// (the approved-minimum height/weight/shoe_size/hair_color/eye_color fields).
// Every other talent category (ugc, and any legacy value such as fashion)
// gets the same generic sequence — no bespoke flow invented for them.

export type WizardStepKey =
  | "basic"
  | "physical"
  | "professional"
  | "portfolio"
  | "presence"
  | "availability"
  | "review";

export function getWizardSteps(category?: string | null): WizardStepKey[] {
  const steps: WizardStepKey[] = ["basic"];
  if (category === "model") steps.push("physical");
  steps.push("professional", "portfolio", "presence", "availability", "review");
  return steps;
}
