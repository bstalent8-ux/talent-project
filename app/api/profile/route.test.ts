import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Sprint 1 (profile-category-foundation) regression ────────────────────────
// Proves the partial-account-creation fix in app/api/profile/route.ts:
// an invalid category must be rejected with a clean 400 BEFORE any write to
// `profiles` or `talent_profiles` — not after, which is the exact bug the
// audit found (§5, §12): the old code validated categories AFTER both
// upserts had already run, so a bad category (e.g. the registration form's
// old "media_buyers") left a half-created Talent-role `profiles` row with
// no working `talent_profiles` row.
//
// Every Supabase/service dependency is mocked — no live database row is
// touched by this test.

// A tiny fluent query-builder stub: every chain method returns `this`, and
// the object is directly awaitable (thenable) resolving to whatever result
// was configured — enough to cover the two shapes this route actually uses:
// `.select().eq().maybeSingle()` and a bare `.upsert()`.
function makeQueryBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: any = {
    select:      vi.fn(() => builder),
    eq:          vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    upsert:      vi.fn(() => Promise.resolve(result)),
    then:        (resolve: (v: unknown) => void) => resolve(result),
  };
  return builder;
}

let existingProfileResult: { data: unknown };
let upsertResult: { error: unknown };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  adminClient: {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        // First call in the route is the `existing` read (select+maybeSingle);
        // the second is the upsert. The builder returned needs to answer
        // whichever method the route calls on it.
        const builder = makeQueryBuilder(existingProfileResult);
        builder.upsert = vi.fn(() => Promise.resolve(upsertResult));
        return builder;
      }
      return makeQueryBuilder({ data: null, error: null });
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

describe("POST /api/profile — partial-account-creation fix (Sprint 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    existingProfileResult = { data: null }; // brand-new signup, no existing row
    upsertResult = { error: null };
    fetchCategoriesMock.mockResolvedValue([
      { id: "ugc", role_type: "talent", label_ar: "UGC", label_en: "UGC", description: null, is_active: true, sort_order: 10 },
      { id: "model", role_type: "talent", label_ar: "موديل", label_en: "Model", description: null, is_active: true, sort_order: 75 },
    ]);
  });

  it("rejects an invalid category with 400 and writes NOTHING to profiles or talent_profiles", async () => {
    const { POST } = await import("./route");
    const { adminClient } = await import("@/lib/supabase/admin");

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

    // The profiles upsert must never have been called — this is the actual
    // fix: validation now runs before any write, not the old order.
    const profilesFromCall = (adminClient.from as any).mock.calls.find((c: unknown[]) => c[0] === "profiles");
    expect(profilesFromCall).toBeTruthy();
    const profilesBuilder = (adminClient.from as any).mock.results.find(
      (r: any, i: number) => (adminClient.from as any).mock.calls[i][0] === "profiles",
    )?.value;
    expect(profilesBuilder.upsert).not.toHaveBeenCalled();
    expect(updateCoreForUserMock).not.toHaveBeenCalled();
    expect(setProfileCategoriesMock).not.toHaveBeenCalled();
  });

  it("accepts a valid category (model, now that it exists) and proceeds to write", async () => {
    const { POST } = await import("./route");

    const req = makeRequest({
      userId: "user-1",
      role: "talent",
      profileData: { handle: "test-user", full_name: "Test User" },
      categoryIds: ["model"],
      talentProfileData: { category: "model" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(setProfileCategoriesMock).toHaveBeenCalledWith("user-1", ["model"]);
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
});
