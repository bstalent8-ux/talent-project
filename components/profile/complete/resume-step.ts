// ─── Full-page wizard resume logic ─────────────────────────────────────────
// Pure, no JSX — importable from a vitest test without pulling in React.
// Determines which step /profile/me/complete should open on when the
// talent arrives with no explicit ?step= — i.e. via the "Complete My
// Profile" CTA. The rule is "first step with unfinished required sections",
// derived from the same CompletionDTO the sidebar % bar reads, not from
// whatever step the URL happened to hold last time.

import type { WizardStepKey } from "@/components/profile/completion-wizard-steps";

/**
 * Which CompletionDTO section keys must be `done` for a wizard step to count
 * as finished. "review" has none — it is only ever reached once every other
 * step is (or the talent jumps to it manually).
 */
export const STEP_COMPLETION_KEYS: Record<WizardStepKey, string[]> = {
  basic: ["avatar", "personal", "bio"],
  physical: ["physical"],
  professional: ["categories", "packages", "usage_addons"],
  portfolio: ["portfolio"],
  presence: ["social"],
  availability: ["availability"],
  review: [],
};

export interface CompletionSectionLike {
  key: string;
  done: boolean;
}

export function resumeStepIndex(steps: WizardStepKey[], sections: CompletionSectionLike[] | undefined | null): number {
  if (!sections?.length) return 0;
  const doneByKey = Object.fromEntries(sections.map((s) => [s.key, s.done]));
  for (let i = 0; i < steps.length; i++) {
    const key = steps[i];
    if (key === "review") continue;
    const required = STEP_COMPLETION_KEYS[key];
    const allDone = required.every((k) => doneByKey[k]);
    if (!allDone) return i;
  }
  return steps.length - 1; // everything done — land on Review
}

export function stepDone(key: WizardStepKey, sections: CompletionSectionLike[] | undefined | null): boolean {
  const doneByKey = Object.fromEntries((sections ?? []).map((s) => [s.key, s.done]));
  const required = STEP_COMPLETION_KEYS[key];
  return required.length > 0 && required.every((k) => doneByKey[k]);
}
