import { describe, it, expect } from "vitest";
import { getWizardSteps } from "./completion-wizard-steps";

const FULL = ["basic", "physical", "professional", "portfolio", "presence", "availability", "review"];

describe("getWizardSteps", () => {
  it("gives a model the full sequence with physical right after basic", () => {
    expect(getWizardSteps("model")).toEqual(FULL);
  });

  it("gives ugc the same sequence — the completion score counts physical for every talent", () => {
    expect(getWizardSteps("ugc")).toEqual(FULL);
  });

  it("gives a legacy category (e.g. fashion) and null/undefined the same sequence", () => {
    expect(getWizardSteps("fashion")).toEqual(FULL);
    expect(getWizardSteps(null)).toEqual(FULL);
    expect(getWizardSteps(undefined)).toEqual(FULL);
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
