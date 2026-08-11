import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawProfileField, RawProfileLayout, RawProfileSection, RawProfileType } from "../types/raw";

// ─── Sprint 1 (profile-category-foundation) regression ────────────────────────
// Proves the category-scope filtering rules in dynamic-profile.service.ts
// WITHOUT touching any live database row — the repository module is mocked,
// same principle as generic-provider.test.ts's dependency injection, applied
// here via vi.mock() because dynamic-profile.service.ts imports its
// repository directly rather than taking it as a constructor argument.
//
// Three things must all hold, matching the audit's approved architecture
// (§0.1/§15.5, Option A):
//   1. A section with category_scope NULL/empty is visible to every category
//      (this is every section that existed before this sprint — zero drift).
//   2. A section scoped to ["ugc"] is visible to a ugc profile, hidden from
//      a model profile.
//   3. A section scoped to ["model"] is visible to a model profile, hidden
//      from a ugc profile.
// Plus: a category-specific layout override wins over the shared layout when
// one exists, and the shared layout is used when it doesn't (the fallback).

vi.mock("../repositories/dynamic-profile.repository", () => ({
  dynamicProfileRepository: {
    findSectionsByType:  vi.fn(),
    findFieldsBySections: vi.fn(),
    findValuesByProfile: vi.fn(),
    findLayout:          vi.fn(),
    findLayoutOverride:  vi.fn(),
  },
}));

vi.mock("../repositories/profile.repository", () => ({
  profileRepository: {
    findTypeBySlug: vi.fn(),
  },
}));

const TALENT_TYPE: RawProfileType = {
  id: "type-talent", slug: "talent", name: "Talent", description: null,
  name_ar: "موهبة", name_en: "Talent", core_table: "talent_profiles",
  provider_key: "talent", is_bookable: true, route_prefix: "talent",
  is_active: true, sort_order: 10,
};

function makeSection(overrides: Partial<RawProfileSection>): RawProfileSection {
  return {
    id: overrides.key ?? "section-1", profile_type_id: TALENT_TYPE.id,
    key: "shared_section", title: "Shared", description: null,
    title_ar: null, title_en: null, description_ar: null, description_en: null,
    display_order: 10, is_enabled: true, kind: "dynamic", weight: 0,
    visibility: "public", render_component: null, icon: null,
    category_scope: null,
    ...overrides,
  };
}

describe("dynamic profile category-scope filtering (Sprint 1)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { profileRepository } = await import("../repositories/profile.repository");
    (profileRepository.findTypeBySlug as any).mockResolvedValue(TALENT_TYPE);
  });

  async function loadService() {
    // Fresh module instance per test so the internal schema/layout caches
    // never leak state between tests (vi.resetModules() forces a re-import).
    vi.resetModules();
    const svc = await import("./dynamic-profile.service");
    const repo = await import("../repositories/dynamic-profile.repository");
    return { dynamicProfileService: svc.dynamicProfileService, repo: repo.dynamicProfileRepository };
  }

  it("a shared section (category_scope NULL) is visible to every category — zero drift for pre-Sprint-1 sections", async () => {
    const { dynamicProfileService, repo } = await loadService();
    const shared = makeSection({ id: "s1", key: "bio", category_scope: null });

    (repo.findSectionsByType as any).mockResolvedValue([shared]);
    (repo.findFieldsBySections as any).mockResolvedValue([]);
    (repo.findValuesByProfile as any).mockResolvedValue([]);

    const forUgc   = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "ugc");
    const forModel = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "model");
    const forNull  = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", null);

    expect(forUgc.map((s) => s.key)).toEqual(["bio"]);
    expect(forModel.map((s) => s.key)).toEqual(["bio"]);
    expect(forNull.map((s) => s.key)).toEqual(["bio"]);
  });

  it("a UGC-only section is visible to ugc and hidden from model", async () => {
    const { dynamicProfileService, repo } = await loadService();
    const ugcOnly = makeSection({ id: "s2", key: "content_styles", category_scope: ["ugc"] });

    (repo.findSectionsByType as any).mockResolvedValue([ugcOnly]);
    (repo.findFieldsBySections as any).mockResolvedValue([]);
    (repo.findValuesByProfile as any).mockResolvedValue([]);

    const forUgc   = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "ugc");
    const forModel = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "model");
    const forNull  = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", null);

    expect(forUgc.map((s) => s.key)).toEqual(["content_styles"]);
    expect(forModel).toEqual([]);
    expect(forNull).toEqual([]);
  });

  it("a Model-only section is visible to model and hidden from ugc", async () => {
    const { dynamicProfileService, repo } = await loadService();
    const modelOnly = makeSection({ id: "s3", key: "physical_details", category_scope: ["model"] });

    (repo.findSectionsByType as any).mockResolvedValue([modelOnly]);
    (repo.findFieldsBySections as any).mockResolvedValue([]);
    (repo.findValuesByProfile as any).mockResolvedValue([]);

    const forModel = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "model");
    const forUgc   = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "ugc");

    expect(forModel.map((s) => s.key)).toEqual(["physical_details"]);
    expect(forUgc).toEqual([]);
  });

  it("a mixed set resolves independently per category — shared + ugc-only + model-only together", async () => {
    const { dynamicProfileService, repo } = await loadService();
    const sections = [
      makeSection({ id: "s1", key: "bio", display_order: 10, category_scope: null }),
      makeSection({ id: "s2", key: "content_styles", display_order: 20, category_scope: ["ugc"] }),
      makeSection({ id: "s3", key: "physical_details", display_order: 30, category_scope: ["model"] }),
    ];

    (repo.findSectionsByType as any).mockResolvedValue(sections);
    (repo.findFieldsBySections as any).mockResolvedValue([]);
    (repo.findValuesByProfile as any).mockResolvedValue([]);

    const forUgc   = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "ugc");
    const forModel = await dynamicProfileService.getSectionsForProfile("profile-1", "talent", "public", "model");

    expect(forUgc.map((s) => s.key)).toEqual(["bio", "content_styles"]);
    expect(forModel.map((s) => s.key)).toEqual(["bio", "physical_details"]);
  });

  it("layout: a category override wins over the shared layout when one exists", async () => {
    const { dynamicProfileService, repo } = await loadService();
    const sharedLayout: RawProfileLayout = {
      id: "l1", profile_type_id: TALENT_TYPE.id, variant: "public",
      layout: { main: ["portfolio"], sidebar: [] }, is_active: true, category_scope: null,
    };
    const modelOverride: RawProfileLayout = {
      id: "l2", profile_type_id: TALENT_TYPE.id, variant: "public",
      layout: { main: ["physical_details", "portfolio"], sidebar: [] }, is_active: true, category_scope: "model",
    };

    (repo.findSectionsByType as any).mockResolvedValue([]);
    (repo.findFieldsBySections as any).mockResolvedValue([]);
    (repo.findLayout as any).mockResolvedValue(sharedLayout);
    (repo.findLayoutOverride as any).mockImplementation(
      async (_typeId: string, _variant: string, category: string) =>
        category === "model" ? modelOverride : null,
    );

    const modelLayout = await dynamicProfileService.getLayout("talent", "model");
    const ugcLayout   = await dynamicProfileService.getLayout("talent", "ugc");
    const sharedOnly  = await dynamicProfileService.getLayout("talent", null);

    expect(modelLayout.main.map((e) => e.key)).toEqual(["physical_details", "portfolio"]);
    // ugc has no override row → falls back to the shared layout, unchanged.
    expect(ugcLayout.main.map((e) => e.key)).toEqual(["portfolio"]);
    expect(sharedOnly.main.map((e) => e.key)).toEqual(["portfolio"]);
  });

  it("legacy plain-string layout entries and existing {key,width} entries still normalize correctly (backward compatibility)", async () => {
    const { dynamicProfileService, repo } = await loadService();
    const layout: RawProfileLayout = {
      id: "l1", profile_type_id: TALENT_TYPE.id, variant: "public",
      layout: { main: ["portfolio", { key: "packages", width: "half" }], sidebar: [] },
      is_active: true, category_scope: null,
    };

    (repo.findSectionsByType as any).mockResolvedValue([]);
    (repo.findFieldsBySections as any).mockResolvedValue([]);
    (repo.findLayout as any).mockResolvedValue(layout);

    const result = await dynamicProfileService.getLayout("talent", null);

    expect(result.main).toEqual([
      { key: "portfolio", width: "full" },
      { key: "packages", width: "half" },
    ]);
  });
});
