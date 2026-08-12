import { describe, it, expect } from "vitest";
import { hasSectionContent } from "./section-content";
import type { ProfileSectionDTO, PublicProfileDTO, TalentPublicCore } from "../types/dto";

function coreSection(key: string): ProfileSectionDTO {
  return {
    key,
    title: { ar: key, en: key },
    description: null,
    kind: "core",
    renderComponent: null,
    icon: null,
    displayOrder: 0,
    fields: [],
  };
}

function profileWith(core: Partial<TalentPublicCore>): PublicProfileDTO {
  return {
    identity: {
      id: "u1", handle: "sara", fullName: "Sara", avatarUrl: null, city: "Cairo",
      bio: "hi", isVerified: false, createdAt: "2026-01-01", typeSlug: "talent",
    },
    meta: { typeSlug: "talent", label: { ar: "موهبة", en: "Talent" }, routePrefix: "talent", bookable: true },
    core: {
      kind: "talent",
      category: null,
      specialties: [],
      availability: null,
      packages: [],
      socialLinks: {},
      rating: 0,
      reviewCount: 0,
      totalBookings: 0,
      views: "0",
      isFeatured: false,
      portfolio: [],
      reviews: [],
      brands: [],
      ...core,
    } as TalentPublicCore,
    sections: [],
    layout: { main: [], sidebar: [] },
    isBookable: true,
  };
}

describe("talent `physical` section — public Measurements, Model only", () => {
  it("hidden for a model with no measurement fields filled", () => {
    const profile = profileWith({ category: "model", socialLinks: {} });
    expect(hasSectionContent("talent", coreSection("physical"), profile)).toBe(false);
  });

  it("visible for a model with at least one approved field filled", () => {
    const profile = profileWith({ category: "model", socialLinks: { eye_color: "بني" } });
    expect(hasSectionContent("talent", coreSection("physical"), profile)).toBe(true);
  });

  it("hidden for ugc even when physical fields happen to be set (legacy data)", () => {
    const profile = profileWith({ category: "ugc", socialLinks: { height: "170", weight: "60" } });
    expect(hasSectionContent("talent", coreSection("physical"), profile)).toBe(false);
  });

  it("hidden for a legacy category (fashion) with physical data — no regression, no new exposure", () => {
    const profile = profileWith({ category: "fashion", socialLinks: { hair_color: "black" } });
    expect(hasSectionContent("talent", coreSection("physical"), profile)).toBe(false);
  });

  it("only the 5 approved fields count — age/languages/dialect do not make it visible for a model", () => {
    const profile = profileWith({ category: "model", socialLinks: { age: "24", languages: "AR/EN", dialect: "Cairene" } });
    expect(hasSectionContent("talent", coreSection("physical"), profile)).toBe(false);
  });
});

describe("talent `social` section — Professional Presence, all categories", () => {
  it("visible for ugc with a new platform (telegram) filled", () => {
    const profile = profileWith({ category: "ugc", socialLinks: { telegram: "https://t.me/x" } });
    expect(hasSectionContent("talent", coreSection("social"), profile)).toBe(true);
  });

  it("visible for a legacy category (fashion) too — Presence is not category-gated", () => {
    const profile = profileWith({ category: "fashion", socialLinks: { website: "https://example.com" } });
    expect(hasSectionContent("talent", coreSection("social"), profile)).toBe(true);
  });

  it("hidden when no platform is filled", () => {
    const profile = profileWith({ category: "ugc", socialLinks: {} });
    expect(hasSectionContent("talent", coreSection("social"), profile)).toBe(false);
  });
});
