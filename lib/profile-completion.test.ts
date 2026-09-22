import { describe, it, expect } from "vitest";
import { calculateCompletion, calculateSectionProgress } from "./profile-completion";

const baseProfile = { avatar_url: "x", full_name: "Ahmed", city: "Cairo", bio: "hi" };
const basePortfolio = [{ id: "1" }];

describe("calculateCompletion — physical section picks up eye_color", () => {
  it("counts physical as done when only eye_color is filled", () => {
    const talentProfile = { category: "model", social_links: { eye_color: "بني" } };
    const { sections } = calculateCompletion(baseProfile, talentProfile, basePortfolio);
    const physical = sections.find((s) => s.key === "physical");
    expect(physical?.done).toBe(true);
  });

  it("still counts physical as done via the pre-existing keys (no regression)", () => {
    const talentProfile = { category: "ugc", social_links: { height: "170" } };
    const { sections } = calculateCompletion(baseProfile, talentProfile, basePortfolio);
    const physical = sections.find((s) => s.key === "physical");
    expect(physical?.done).toBe(true);
  });

  it("counts physical as not done when social_links is empty", () => {
    const talentProfile = { category: "ugc", social_links: {} };
    const { sections } = calculateCompletion(baseProfile, talentProfile, basePortfolio);
    const physical = sections.find((s) => s.key === "physical");
    expect(physical?.done).toBe(false);
  });
});

describe("calculateCompletion — social section picks up the new Professional Presence platforms", () => {
  it("counts social as done when only a new platform (telegram) is filled", () => {
    const talentProfile = { category: "ugc", social_links: { telegram: "https://t.me/example" } };
    const { sections } = calculateCompletion(baseProfile, talentProfile, basePortfolio);
    const social = sections.find((s) => s.key === "social");
    expect(social?.done).toBe(true);
  });

  it("still counts social as done via the pre-existing keys (no regression)", () => {
    const talentProfile = { category: "ugc", social_links: { instagram: "@ahmed" } };
    const { sections } = calculateCompletion(baseProfile, talentProfile, basePortfolio);
    const social = sections.find((s) => s.key === "social");
    expect(social?.done).toBe(true);
  });
});

describe("calculateCompletion — experience (Previous Projects) section", () => {
  it("counts experience as done once at least one entry exists", () => {
    const talentProfile = { social_links: { experience: [{ id: "p1", name: "Campaign X", verified: false }] } };
    const { sections } = calculateCompletion(baseProfile, talentProfile, basePortfolio);
    const experience = sections.find((s) => s.key === "experience");
    expect(experience?.done).toBe(true);
    expect(experience?.weight).toBe(10);
  });

  it("counts experience as not done when the list is empty or absent", () => {
    const { sections } = calculateCompletion(baseProfile, { social_links: { experience: [] } }, basePortfolio);
    expect(sections.find((s) => s.key === "experience")?.done).toBe(false);
    const { sections: sections2 } = calculateCompletion(baseProfile, {}, basePortfolio);
    expect(sections2.find((s) => s.key === "experience")?.done).toBe(false);
  });

  it("every section's weight still sums to 100, so 100% stays reachable", () => {
    const { sections } = calculateCompletion(baseProfile, {}, basePortfolio);
    const total = sections.reduce((sum, s) => sum + s.weight, 0);
    expect(total).toBe(100);
  });
});

describe("calculateSectionProgress — ratios grow over the wider key lists", () => {
  it("physical progress reflects 1 of 11 keys (height/weight/hair_color/shoe_size/age/languages/dialect/eye_color/chest/waist/hip)", () => {
    const talentProfile = { social_links: { eye_color: "بني" } };
    const progress = calculateSectionProgress(baseProfile, talentProfile, basePortfolio);
    expect(progress.physical).toBeCloseTo(1 / 11);
  });

  it("social progress reflects 1 of 8 platforms, not 1 of 4", () => {
    const talentProfile = { social_links: { website: "https://example.com" } };
    const progress = calculateSectionProgress(baseProfile, talentProfile, basePortfolio);
    expect(progress.social).toBeCloseTo(1 / 8);
  });
});
