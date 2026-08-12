import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Category validation gates, in the order the route applies them ───────────
// 1. Is this a real, active row in `categories` for the role? (catches
//    media_buyers / arbitrary junk — never had a row on either side.)
// 2. Only for a BRAND-NEW Talent signup (no existing `profiles` row yet):
//    is it one of the two MVP-supported new-registration categories (ugc,
//    model)? (catches influencer/fashion/etc — real `categories` rows, but
//    not offered at registration and not yet writable to the narrower
//    talent_profiles.category enum for most of them.)
// 3. Defense-in-depth: if a category clears both gates but still fails the
//    underlying enum write (e.g. model before the enum migration lands),
//    the profiles row created earlier in THIS request is deleted — but
//    only for a brand-new signup, never for an edit to an existing account.
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

    // The broad `categories` table today has more active talent rows than
    // talent_profiles.category (the enum) can hold — influencer and fashion
    // are real, active rows (fashion is also a real legacy enum value) but
    // neither is offered at new registration. Included here so the tests
    // below can prove gate 1 (categories) and gate 2 (new-registration MVP
    // allowlist) are independent checks, not the same check twice.
    fetchCategoriesMock.mockResolvedValue([
      { id: "ugc", role_type: "talent", label_ar: "UGC", label_en: "UGC", description: null, is_active: true, sort_order: 10 },
      { id: "influencer", role_type: "talent", label_ar: "Influencer", label_en: "Influencer", description: null, is_active: true, sort_order: 20 },
      { id: "fashion", role_type: "talent", label_ar: "Fashion", label_en: "Fashion", description: null, is_active: true, sort_order: 30 },
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

  it("rejects an arbitrary invalid category string with 400 and writes nothing", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["totally-made-up-category"],
      talentProfileData: { category: "totally-made-up-category" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid category/i);
    expect(profilesBuilder.upsert).not.toHaveBeenCalled();
  });

  it("rejects influencer for a NEW Talent signup before any write, even though it is an active categories row", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["influencer"],
      talentProfileData: { category: "influencer" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/not available for new registrations/i);
    expect(profilesBuilder.upsert).not.toHaveBeenCalled();
    expect(updateCoreForUserMock).not.toHaveBeenCalled();
    expect(setProfileCategoriesMock).not.toHaveBeenCalled();
  });

  it("rejects fashion for a NEW Talent signup before any write", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["fashion"],
      talentProfileData: { category: "fashion" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/not available for new registrations/i);
    expect(profilesBuilder.upsert).not.toHaveBeenCalled();
  });

  it("allows editing an EXISTING Talent profile whose category is the legacy fashion value", async () => {
    existingProfileResult = { data: { role: "talent", handle: "existing-fashion-user" } };
    profilesBuilder.maybeSingle = vi.fn(() => Promise.resolve(existingProfileResult));

    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "existing-fashion-user", full_name: "Existing Fashion User", bio: "updated bio" },
      categoryIds: ["fashion"],
      talentProfileData: { category: "fashion" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(profilesBuilder.upsert).toHaveBeenCalled();
    expect(setProfileCategoriesMock).toHaveBeenCalledWith("user-1", ["fashion"]);
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
