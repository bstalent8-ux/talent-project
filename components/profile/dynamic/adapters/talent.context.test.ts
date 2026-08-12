import { describe, it, expect } from "vitest";
import { toMeasurements, toPresenceLinks, toTalentData } from "./talent.context";
import type { PublicProfileDTO, TalentPublicCore } from "@/features/profiles/types/dto";

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

describe("toPresenceLinks", () => {
  it("returns only the filled platforms, trimmed", () => {
    const profile = profileWith({ socialLinks: { instagram: "  @sara  ", tiktok: "", website: "example.com" } });
    expect(toPresenceLinks(profile)).toEqual({ instagram: "@sara", website: "example.com" });
  });

  it("ignores unknown keys and short handles (<=2 chars)", () => {
    const profile = profileWith({ socialLinks: { instagram: "@x", not_a_platform: "https://y.com" } });
    expect(toPresenceLinks(profile)).toEqual({});
  });

  it("returns an empty object, never null, when nothing is filled", () => {
    expect(toPresenceLinks(profileWith({ socialLinks: {} }))).toEqual({});
  });
});

describe("toMeasurements", () => {
  it("null for a non-model category even with fields filled", () => {
    const profile = profileWith({ category: "ugc", socialLinks: { height: "170" } });
    expect(toMeasurements(profile)).toBeNull();
  });

  it("null for a model with nothing filled", () => {
    const profile = profileWith({ category: "model", socialLinks: {} });
    expect(toMeasurements(profile)).toBeNull();
  });

  it("returns only the 5 approved fields for a model — no age/languages/dialect", () => {
    const profile = profileWith({
      category: "model",
      socialLinks: { height: "170", eye_color: "بني", age: "24", languages: "AR/EN", dialect: "Cairene" },
    });
    expect(toMeasurements(profile)).toEqual({ height: "170", eye_color: "بني" });
  });
});

describe("toTalentData — availability/languages chrome fields", () => {
  it("carries availability and languages through for the hero", () => {
    const profile = profileWith({ availability: "available", socialLinks: { languages: "Arabic, English" } });
    const talent = toTalentData(profile);
    expect(talent.availability).toBe("available");
    expect(talent.languages).toBe("Arabic, English");
  });

  it("both are null when unset — hero hides the line", () => {
    const profile = profileWith({ availability: null, socialLinks: {} });
    const talent = toTalentData(profile);
    expect(talent.availability).toBeNull();
    expect(talent.languages).toBeNull();
  });
});
