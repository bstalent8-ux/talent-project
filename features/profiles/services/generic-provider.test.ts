import { describe, it, expect, vi } from "vitest";
import { createProfileService, type ProfileServiceDeps } from "./profile.service";
import type { IdentityRow } from "../repositories/profile.repository";
import type { RawProfileType, RawSharedProfile } from "../types/raw";
import { ProfileError } from "../errors/profile-error";

// ─── Stage 0 regression test ──────────────────────────────────────────────────
// Proves resolveContext()'s generic-provider fallback (profile.service.ts)
// WITHOUT touching any live database row or any real user's profile_type_id.
// Every dependency is injected — see createProfileService(overrides), designed
// exactly for this.
//
// Two things must both hold:
//   1. A type with core_table === null resolves through createGenericProvider(),
//      never throws INVALID_PROFILE_TYPE, and produces a valid public DTO with
//      zero hardcoded provider/adapter code touched.
//   2. A type with a non-null core_table and no registered provider is a real
//      misconfiguration and MUST still throw — the fallback must not paper
//      over that case.

function makeType(overrides: Partial<RawProfileType>): RawProfileType {
  return {
    id: "type-1", slug: "food_reviewer", name: "Food Reviewer",
    description: null, name_ar: "مراجع طعام", name_en: "Food Reviewer",
    core_table: null, provider_key: null, is_bookable: false,
    route_prefix: "food-reviewer", is_active: true, sort_order: 100,
    ...overrides,
  };
}

function makeIdentity(type: RawProfileType | null): IdentityRow {
  const profile: RawSharedProfile = {
    id: "user-1", role: "talent", full_name: "Test User",
    handle: "test-generic-profile", avatar_url: null, city: null, bio: null,
    phone_number: null, is_verified: false, account_status: "active",
    brand_status: null, created_at: new Date().toISOString(),
    profile_type_id: type?.id ?? null,
  };
  return { profile, type };
}

function buildService(identity: IdentityRow): ReturnType<typeof createProfileService> {
  const deps: Partial<ProfileServiceDeps> = {
    profiles: {
      findIdentityByHandle:  vi.fn().mockResolvedValue(identity),
      findIdentityById:      vi.fn().mockResolvedValue(identity),
      findIdentityByUserId:  vi.fn().mockResolvedValue(identity),
      updateShared:          vi.fn(),
      findDisplayNames:      vi.fn().mockResolvedValue({}),
      findTypeBySlug:        vi.fn().mockResolvedValue(identity.type),
    } as unknown as ProfileServiceDeps["profiles"],
    dynamic: {
      getSchemaBySlug:        vi.fn(),
      invalidateSchema:       vi.fn(),
      getSectionDefinitions:  vi.fn().mockResolvedValue([]),
      getSectionsForProfile:  vi.fn().mockResolvedValue([]),
      getLayout:              vi.fn().mockResolvedValue({ main: [], sidebar: [] }),
      validate:                vi.fn(),
      saveValues:              vi.fn(),
    } as unknown as ProfileServiceDeps["dynamic"],
  };
  return createProfileService(deps);
}

describe("generic provider fallback (Stage 0)", () => {
  it("resolves a public profile for a generic-eligible type with zero hardcoded provider/adapter", async () => {
    const type = makeType({ slug: "food_reviewer", core_table: null });
    const service = buildService(makeIdentity(type));

    const dto = await service.getPublicProfileByHandle("test-generic-profile");

    expect(dto.meta.typeSlug).toBe("food_reviewer");
    expect(dto.core).toEqual({ kind: "generic" });
    expect(dto.isBookable).toBe(false);
    expect(dto.sections).toEqual([]);
  });

  it("never throws INVALID_PROFILE_TYPE for a generic-eligible type", async () => {
    const type = makeType({ slug: "another_generic_type", core_table: null });
    const service = buildService(makeIdentity(type));

    await expect(service.getPublicProfileByHandle("test-generic-profile")).resolves.toBeDefined();
  });

  it("still throws INVALID_PROFILE_TYPE for a genuinely misconfigured type (core_table set, no provider)", async () => {
    const type = makeType({ slug: "broken_type", core_table: "some_orphaned_table" });
    const service = buildService(makeIdentity(type));

    await expect(service.getPublicProfileByHandle("test-generic-profile")).rejects.toMatchObject({
      code: "INVALID_PROFILE_TYPE",
    } satisfies Partial<ProfileError>);
  });

  it("a REGISTERED type wins through the registry and never reaches the generic fallback", async () => {
    // A stub provider stands in for talentProvider — the point is to prove
    // resolveContext() takes the `hasProvider === true` branch and never
    // consults identity.type.core_table at all, without this test touching
    // any live network/DB call (this suite stays pure, per vitest.config.ts).
    const stubCore = { kind: "talent" } as const;
    const stubProvider = {
      meta: { typeSlug: "talent", coreTable: "talent_profiles", bookable: true, routePrefix: "talent", label: { ar: "", en: "" }, writableCoreFields: [] },
      loadCore: vi.fn().mockResolvedValue({}),
      getPublicProfile: vi.fn().mockResolvedValue(stubCore),
      getPrivateProfile: vi.fn(),
      updateProfile: vi.fn(),
      getSections: vi.fn().mockResolvedValue([]),
      hasContent: vi.fn().mockReturnValue(true),
      getCompletion: vi.fn().mockResolvedValue({}),
      getCoreCompletionSections: vi.fn().mockResolvedValue([]),
      getCompletionGates: vi.fn().mockResolvedValue([]),
      validateDynamicFields: vi.fn(),
    };

    // core_table is deliberately WRONG here ("nonsense") — if the fallback
    // ever fired for a registered type, it would build a generic provider
    // instead of using stubProvider, and dto.core would be {kind:"generic"}
    // rather than stubCore. It must not.
    const talentType = makeType({ id: "type-talent", slug: "talent", core_table: "nonsense" });
    const identity = makeIdentity(talentType);

    const service = createProfileService({
      profiles: {
        findIdentityByHandle: vi.fn().mockResolvedValue(identity),
        findIdentityById:     vi.fn().mockResolvedValue(identity),
        findIdentityByUserId: vi.fn().mockResolvedValue(identity),
        updateShared:         vi.fn(),
        findDisplayNames:     vi.fn().mockResolvedValue({}),
        findTypeBySlug:       vi.fn().mockResolvedValue(identity.type),
      } as unknown as ProfileServiceDeps["profiles"],
      dynamic: {
        getSchemaBySlug:       vi.fn(),
        invalidateSchema:      vi.fn(),
        getSectionDefinitions: vi.fn().mockResolvedValue([]),
        getSectionsForProfile: vi.fn().mockResolvedValue([]),
        getLayout:             vi.fn().mockResolvedValue({ main: [], sidebar: [] }),
        validate:              vi.fn(),
        saveValues:            vi.fn(),
      } as unknown as ProfileServiceDeps["dynamic"],
      registry: {
        hasProvider: (slug: string) => slug === "talent",
        resolve:     () => stubProvider,
        resolveBookable: () => { throw new Error("not exercised"); },
        listProviders: () => [stubProvider],
      } as unknown as ProfileServiceDeps["registry"],
    });

    const dto = await service.getPublicProfileByHandle("test-generic-profile");
    expect(dto.core).toEqual(stubCore);
    expect(stubProvider.getPublicProfile).toHaveBeenCalled();
  });
});
