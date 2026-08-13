import { describe, it, expect } from "vitest";
import { resumeStepIndex, stepDone, STEP_COMPLETION_KEYS } from "./resume-step";
import { getWizardSteps } from "@/components/profile/completion-wizard-steps";
import { calculateCompletion } from "@/lib/profile-completion";

function sections(done: Record<string, boolean>) {
  return Object.entries(done).map(([key, isDone]) => ({ key, done: isDone }));
}

describe("resumeStepIndex", () => {
  it("resumes at step 0 (basic) when there is no completion data yet", () => {
    const steps = getWizardSteps("ugc");
    expect(resumeStepIndex(steps, undefined)).toBe(0);
    expect(resumeStepIndex(steps, [])).toBe(0);
  });

  it("resumes at the first step whose required sections are not all done", () => {
    const steps = getWizardSteps("ugc"); // basic, professional, portfolio, presence, availability, review
    const data = sections({
      avatar: true, personal: true, bio: true, // basic — done
      categories: false, packages: false, usage_addons: false, // professional — not done
      portfolio: false, social: false, availability: false,
    });
    expect(resumeStepIndex(steps, data)).toBe(steps.indexOf("professional"));
  });

  it("skips a fully-done step and lands on the next incomplete one", () => {
    const steps = getWizardSteps("ugc");
    const data = sections({
      avatar: true, personal: true, bio: true,
      categories: true, packages: true, usage_addons: true, // professional — done too
      portfolio: false, social: false, availability: false, // portfolio next
    });
    expect(resumeStepIndex(steps, data)).toBe(steps.indexOf("portfolio"));
  });

  it("resumes at physical for a model whose physical step is unfinished, even if basic is done", () => {
    const steps = getWizardSteps("model"); // basic, physical, professional, ...
    const data = sections({
      avatar: true, personal: true, bio: true,
      physical: false,
      categories: true, packages: true, usage_addons: true,
      portfolio: true, social: true, availability: true,
    });
    expect(resumeStepIndex(steps, data)).toBe(steps.indexOf("physical"));
  });

  it("never resumes at physical for ugc — that step does not exist in its sequence", () => {
    const steps = getWizardSteps("ugc");
    expect(steps).not.toContain("physical");
  });

  it("lands on the last step (review) once every other step's required sections are done", () => {
    const steps = getWizardSteps("model");
    const data = sections({
      avatar: true, personal: true, bio: true, physical: true,
      categories: true, packages: true, usage_addons: true,
      portfolio: true, social: true, availability: true,
    });
    expect(resumeStepIndex(steps, data)).toBe(steps.length - 1);
    expect(steps[resumeStepIndex(steps, data)]).toBe("review");
  });
});

describe("stepDone", () => {
  it("is false when no sections are provided", () => {
    expect(stepDone("portfolio", undefined)).toBe(false);
  });

  it("is true only once every required section for that step is done", () => {
    expect(stepDone("professional", sections({ categories: true, packages: false, usage_addons: true }))).toBe(false);
    expect(stepDone("professional", sections({ categories: true, packages: true, usage_addons: true }))).toBe(true);
  });

  it("review has no required sections, so it is never reported done (it's a summary step, not a completable one)", () => {
    expect(stepDone("review", sections({ avatar: true, personal: true, bio: true }))).toBe(false);
  });
});

describe("STEP_COMPLETION_KEYS stays in sync with calculateCompletion's section keys", () => {
  it("every key referenced by a wizard step exists in calculateCompletion's output", () => {
    const { sections: calcSections } = calculateCompletion({}, {}, []);
    const validKeys = new Set(calcSections.map((s) => s.key));
    for (const keys of Object.values(STEP_COMPLETION_KEYS)) {
      for (const key of keys) {
        expect(validKeys.has(key)).toBe(true);
      }
    }
  });
});
