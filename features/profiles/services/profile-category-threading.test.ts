import { describe, it, expect, vi } from "vitest";
import { createProfileService, type ProfileServiceDeps } from "./profile.service";
import type { IdentityRow } from "../repositories/profile.repository";
import type { RawProfileType, RawSharedProfile } from "../types/raw";

// ─── Sprint 1 (profile-category-foundation) regression ────────────────────────
// Proves profile.service.ts threads the resolved talent category into
// dynamic.getSectionsForProfile()/getLayout() — the "central resolution,
// never scattered `if category === 'ugc'` in components" rule from the
// audit's §6 — WITHOUT touching any live database row. Every dependency is
// injected, same pattern as generic-provider.test.ts.

const TALENT_TYPE: RawProfileType = {
  id: "type-talent", slug: "talent", name: "Talent", description: null,
  name_ar: "موهبة", name_en: "Talent", core_table: "talent_profiles",
  provider_key: "talent", is_bookable: true, route_prefix: "talent",
  is_active: true, sort_order: 10,
};

const BRAND_TYPE: RawProfileType = {
  id: "type-brand", slug: "brand", name: "Brand", description: null,
  name_ar: "علامة تجارية", name_en: "Brand", core_table: "brand_profiles",
  provider_key: "brand", is_bookable: false, route_prefix: "brand",
  is_active: true, sort_order: 20,
};

function makeIdentity(type: RawProfileType, role: string): IdentityRow {
  const profile: RawSharedProfile = {
    id: "user-1", role, full_name: "Test User",
    handle: "test-profile", avatar_url: null, city: null, bio: null,
    phone_number: null, is_verified: false, account_status: "active",
    brand_status: null, created_at: new Date().toISOString(),
    profile_type_id: type.id,
  };
  return { profile, type };
}

function makeTalentProvider(category: string | null) {
  const core = { kind: "talent" as const, category };
  return {
    meta: { typeSlug: "talent", coreTable: "talent_profiles", bookable: true, routePrefix: "talent", label: { ar: "", en: "" }, writableCoreFields: [] },
    loadCore: vi.fn().mockResolvedValue(core),
    getPublicProfile: vi.fn().mockResolvedValue(core),
    getPrivateProfile: vi.fn().mockResolvedValue({ core, moderation: { status: "approved", rejectionReason: null, approvedAt: null } }),
    updateProfile: vi.fn(),
    getSections: vi.fn().mockResolvedValue([]),
    hasContent: vi.fn().mockReturnValue(true),
    getCompletion: vi.fn().mockResolvedValue({}),
    getCoreCompletionSections: vi.fn().mockResolvedValue([]),
    getCompletionGates: vi.fn().mockResolvedValue([]),
    validateDynamicFields: vi.fn(),
  };
}

function makeBrandProvider() {
  const core = { kind: "brand" as const }; // deliberately no `category` field
  return {
    meta: { typeSlug: "brand", coreTable: "brand_profiles", bookable: false, routePrefix: "brand", label: { ar: "", en: "" }, writableCoreFields: [] },
    loadCore: vi.fn().mockResolvedValue(core),
    getPublicProfile: vi.fn().mockResolvedValue(core),
    getPrivateProfile: vi.fn().mockResolvedValue({ core, moderation: { status: "approved", rejectionReason: null, approvedAt: null } }),
    updateProfile: vi.fn(),
    getSections: vi.fn().mockResolvedValue([]),
    hasContent: vi.fn().mockReturnValue(true),
    getCompletion: vi.fn().mockResolvedValue({}),
    getCoreCompletionSections: vi.fn().mockResolvedValue([]),
    getCompletionGates: vi.fn().mockResolvedValue([]),
    validateDynamicFields: vi.fn(),
  };
}

function buildService(identity: IdentityRow, provider: ReturnType<typeof makeTalentProvider> | ReturnType<typeof makeBrandProvider>) {
  const dynamic = {
    getSchemaBySlug:       vi.fn(),
    invalidateSchema:      vi.fn(),
    getSectionDefinitions: vi.fn().mockResolvedValue([]),
    getSectionsForProfile: vi.fn().mockResolvedValue([]),
    getLayout:             vi.fn().mockResolvedValue({ main: [], sidebar: [] }),
    validate:              vi.fn(),
    saveValues:            vi.fn(),
  };

  const service = createProfileService({
    profiles: {
      findIdentityByHandle: vi.fn().mockResolvedValue(identity),
      findIdentityById:     vi.fn().mockResolvedValue(identity),
      findIdentityByUserId: vi.fn().mockResolvedValue(identity),
      updateShared:         vi.fn(),
      findDisplayNames:     vi.fn().mockResolvedValue({}),
      findTypeBySlug:       vi.fn().mockResolvedValue(identity.type),
    } as unknown as ProfileServiceDeps["profiles"],
    dynamic: dynamic as unknown as ProfileServiceDeps["dynamic"],
    registry: {
      hasProvider: (slug: string) => slug === identity.type?.slug,
      resolve:     () => provider,
      resolveBookable: () => { throw new Error("not exercised"); },
      listProviders: () => [provider],
    } as unknown as ProfileServiceDeps["registry"],
  });

  return { service, dynamic };
}

describe("profile.service.ts category threading (Sprint 1)", () => {
  it("buildPublic passes the talent's resolved category to getSectionsForProfile and getLayout", async () => {
    const identity = makeIdentity(TALENT_TYPE, "talent");
    const provider = makeTalentProvider("model");
    const { service, dynamic } = buildService(identity, provider);

    await service.getPublicProfileByHandle("test-profile");

    expect(dynamic.getSectionsForProfile).toHaveBeenCalledWith("user-1", "talent", "public", "model");
    expect(dynamic.getLayout).toHaveBeenCalledWith("talent", "model");
  });

  it("buildPublic passes null category for a talent with no category set", async () => {
    const identity = makeIdentity(TALENT_TYPE, "talent");
    const provider = makeTalentProvider(null);
    const { service, dynamic } = buildService(identity, provider);

    await service.getPublicProfileByHandle("test-profile");

    expect(dynamic.getSectionsForProfile).toHaveBeenCalledWith("user-1", "talent", "public", null);
    expect(dynamic.getLayout).toHaveBeenCalledWith("talent", null);
  });

  it("buildPublic passes null category for a brand (core has no category field) — brand regression", async () => {
    const identity = makeIdentity(BRAND_TYPE, "brand");
    const provider = makeBrandProvider();
    const { service, dynamic } = buildService(identity, provider);

    await service.getPublicProfileByHandle("test-profile");

    expect(dynamic.getSectionsForProfile).toHaveBeenCalledWith("user-1", "brand", "public", null);
    expect(dynamic.getLayout).toHaveBeenCalledWith("brand", null);
  });

  it("getOwnProfile passes the owner's resolved category to getSectionsForProfile", async () => {
    const identity = makeIdentity(TALENT_TYPE, "talent");
    const provider = makeTalentProvider("ugc");
    const { service, dynamic } = buildService(identity, provider);

    await service.getOwnProfile("user-1");

    expect(dynamic.getSectionsForProfile).toHaveBeenCalledWith("user-1", "talent", "owner", "ugc");
  });

  it("still resolves a full public DTO end-to-end for an unscoped (pre-Sprint-1-shaped) talent — no regression", async () => {
    const identity = makeIdentity(TALENT_TYPE, "talent");
    const provider = makeTalentProvider("fashion");
    const { service } = buildService(identity, provider);

    const dto = await service.getPublicProfileByHandle("test-profile");

    expect(dto.meta.typeSlug).toBe("talent");
    expect(dto.core).toMatchObject({ kind: "talent", category: "fashion" });
    expect(dto.sections).toEqual([]);
  });
});
