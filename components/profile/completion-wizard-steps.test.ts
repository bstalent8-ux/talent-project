import { describe, it, expect } from "vitest";
import { getWizardSteps } from "./completion-wizard-steps";

describe("getWizardSteps", () => {
  it("inserts a physical step for category=model, right after basic", () => {
    const steps = getWizardSteps("model");
    expect(steps).toEqual(["basic", "physical", "professional", "portfolio", "presence", "availability", "review"]);
  });

  it("has no physical step for category=ugc", () => {
    const steps = getWizardSteps("ugc");
    expect(steps).toEqual(["basic", "professional", "portfolio", "presence", "availability", "review"]);
    expect(steps).not.toContain("physical");
  });

  it("has no physical step for a legacy category (e.g. fashion) — no bespoke flow invented", () => {
    const steps = getWizardSteps("fashion");
    expect(steps).not.toContain("physical");
  });

  it("has no physical step when category is null/undefined", () => {
    expect(getWizardSteps(null)).not.toContain("physical");
    expect(getWizardSteps(undefined)).not.toContain("physical");
  });

  it("review is always the last step", () => {
    expect(getWizardSteps("model").at(-1)).toBe("review");
    expect(getWizardSteps("ugc").at(-1)).toBe("review");
  });

  it("basic is always the first step", () => {
    expect(getWizardSteps("model")[0]).toBe("basic");
    expect(getWizardSteps("ugc")[0]).toBe("basic");
  });
});
