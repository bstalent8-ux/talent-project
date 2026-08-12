import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Partial-account-creation fix (category validated before any write), ──────
// plus the MVP enum-reachability repair: a category that passes the live
// `categories` taxonomy check can still be rejected by the underlying
// talent_profiles.category enum (categories and talent_category are two
// independent taxonomies that only partially overlap today). When that
// happens, the profiles row created earlier in the SAME request for a
// brand-new signup must be cleaned up — not left standing with no
// talent_profiles row.
//
// Every Supabase/service dependency is mocked — no live database row is
// touched by this test. The "profiles" table always resolves to the SAME
// builder object across every `.from("profiles")` call in a request, so
// assertions on it (upsert called? delete called?) are meaningful instead
// of accidentally checking an unrelated builder instance.

let existingProfileResult: { data: unknown };
let upsertResult: { error: unknown };
let deleteResult: { error: unknown };
let profilesBuilder: any;

function makeGenericBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq:     vi.fn(() => builder),
    then:   (resolve: (v: unknown) => void) => resolve(result),
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  adminClient: {
    from: vi.fn((table: string) => {
      if (table === "profiles") return profilesBuilder;
      return makeGenericBuilder({ data: null, error: null });
    }),
  },
}));

const fetchCategoriesMock = vi.fn();
const setProfileCategoriesMock = vi.fn();

vi.mock("@/features/categories/services/category.service", () => ({
  fetchCategories:      fetchCategoriesMock,
  normalizeCategoryId:  (id: string) => id.trim().toLowerCase(),
  setProfileCategories: setProfileCategoriesMock,
}));

const updateCoreForUserMock = vi.fn();

vi.mock("@/features/profiles", () => ({
  profileService: { updateCoreForUser: updateCoreForUserMock },
  ProfileError: {
    from: (e: unknown) => ({
      status: 500, code: "INTERNAL", toBody: () => ({ error: "internal" }), internal: e,
    }),
  },
}));

vi.mock("@/lib/cache", () => ({
  invalidateTalent: vi.fn(),
  invalidateBrand:  vi.fn(),
  privateNoStoreHeaders: () => ({}),
}));

function makeRequest(body: unknown) {
  return { json: async () => body } as any;
}

describe("POST /api/profile — category validation + partial-account-creation fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    existingProfileResult = { data: null }; // brand-new signup, no existing row
    upsertResult = { error: null };
    deleteResult = { error: null };

    profilesBuilder = {
      select:      vi.fn(() => profilesBuilder),
      eq:          vi.fn(() => profilesBuilder),
      maybeSingle: vi.fn(() => Promise.resolve(existingProfileResult)),
      upsert:      vi.fn(() => Promise.resolve(upsertResult)),
      delete:      vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(deleteResult)) })),
    };

    fetchCategoriesMock.mockResolvedValue([
      { id: "ugc", role_type: "talent", label_ar: "UGC", label_en: "UGC", description: null, is_active: true, sort_order: 10 },
      { id: "model", role_type: "talent", label_ar: "موديل", label_en: "Model", description: null, is_active: true, sort_order: 75 },
    ]);
    updateCoreForUserMock.mockResolvedValue(undefined);
  });

  it("rejects an invalid category (media_buyers) with 400 and writes NOTHING to profiles or talent_profiles", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["media_buyers"],
      talentProfileData: { category: "media_buyers" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid category/i);
    expect(profilesBuilder.upsert).not.toHaveBeenCalled();
    expect(updateCoreForUserMock).not.toHaveBeenCalled();
    expect(setProfileCategoriesMock).not.toHaveBeenCalled();
  });

  it("accepts a valid category (ugc) and proceeds to write", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["ugc"],
      talentProfileData: { category: "ugc" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(profilesBuilder.upsert).toHaveBeenCalled();
    expect(profilesBuilder.delete).not.toHaveBeenCalled();
    expect(setProfileCategoriesMock).toHaveBeenCalledWith("user-1", ["ugc"]);
  });

  it("still rejects a forbidden cross-user write with 403, unaffected by the category-validation reorder", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "someone-else",
      role: "talent",
      profileData: {},
      categoryIds: ["ugc"],
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("cleans up the just-created profiles row when a taxonomy-valid category still fails the talent_profiles write (enum gap)", async () => {
    // 'model' passes the live `categories` check (mocked above) but the
    // underlying talent_profiles.category enum may not have 'model' yet —
    // simulate that DB-level rejection here.
    updateCoreForUserMock.mockRejectedValue(new Error('invalid input value for enum talent_category: "model"'));

    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["model"],
      talentProfileData: { category: "model" },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    // The profiles row was created (upsert ran) then removed by the cleanup path.
    expect(profilesBuilder.upsert).toHaveBeenCalled();
    expect(profilesBuilder.delete).toHaveBeenCalled();
    expect(setProfileCategoriesMock).not.toHaveBeenCalled();
  });

  it("does NOT delete the profiles row when the failing write is an edit to an existing account", async () => {
    existingProfileResult = { data: { role: "talent", handle: "existing-user" } };
    profilesBuilder.maybeSingle = vi.fn(() => Promise.resolve(existingProfileResult));
    updateCoreForUserMock.mockRejectedValue(new Error("some transient write failure"));

    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "existing-user", full_name: "Existing User" },
      categoryIds: ["ugc"],
      talentProfileData: { category: "ugc" },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(profilesBuilder.delete).not.toHaveBeenCalled();
  });
});
