import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// The route only needs: an authenticated user, a `profiles` row readable via
// adminClient, permission granted, and the provider's loadCoreRow/
// updateCoreForUser. Everything else (cache invalidation, ProfileError
// formatting) is mocked to a no-op so the test stays about the allowlist.

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
  }),
}));

const profilesBuilder = {
  select: () => profilesBuilder,
  eq: () => profilesBuilder,
  single: async () => ({
    data: { id: "user-1", role: "talent", handle: "ahmed", account_status: "active", is_suspended: false },
    error: null,
  }),
};

vi.mock("@/lib/supabase/admin", () => ({
  adminClient: { from: () => profilesBuilder },
}));

vi.mock("@/lib/permissions", () => ({
  canPerformAction: () => ({ allowed: true }),
}));

vi.mock("@/lib/cache", () => ({
  invalidateTalent: () => {},
  privateNoStoreHeaders: () => ({}),
}));

const updateCoreForUser = vi.fn(async () => {});

vi.mock("@/features/profiles", () => ({
  profileService: {
    loadCoreRow: async () => ({ typeSlug: "talent", core: { social_links: { instagram: "@existing" } } }),
    updateCoreForUser,
  },
  ProfileError: {
    from: (e: unknown) => ({
      code: "internal", internal: e, publicMessage: "failed", status: 500,
      toBody: () => ({ error: "failed" }),
    }),
  },
}));

// Imported AFTER the mocks so the route picks them up.
const { PATCH } = await import("./route");

function patchRequest(body: unknown) {
  return {
    json: async () => body,
  } as any;
}

beforeEach(() => {
  updateCoreForUser.mockClear();
});

describe("PATCH /api/profile/complete — physical section allowlist", () => {
  it("accepts eye_color (Model minimum field) and writes it into social_links", async () => {
    const res = await PATCH(patchRequest({ section: "physical", data: { eye_color: "بني" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@existing", eye_color: "بني" },
    });
  });

  it("rejects an unknown key silently (dropped, not written)", async () => {
    const res = await PATCH(patchRequest({ section: "physical", data: { not_a_real_field: "x", height: "180" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@existing", height: "180" },
    });
  });

  it("still accepts the pre-existing physical keys (no regression)", async () => {
    const res = await PATCH(patchRequest({ section: "physical", data: { hair_color: "black", shoe_size: "42" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@existing", hair_color: "black", shoe_size: "42" },
    });
  });
});

describe("PATCH /api/profile/complete — social section: allowlist + unsafe-scheme rejection", () => {
  it("accepts a platform key from TALENT_SOCIAL_KEYS (telegram)", async () => {
    const res = await PATCH(patchRequest({ section: "social", data: { telegram: "https://t.me/example" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@existing", telegram: "https://t.me/example" },
    });
  });

  it("accepts a bare handle — MVP is links-only, no scheme required", async () => {
    const res = await PATCH(patchRequest({ section: "social", data: { instagram: "@newname" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@newname" },
    });
  });

  it("drops a key outside TALENT_SOCIAL_KEYS instead of writing it", async () => {
    const res = await PATCH(patchRequest({ section: "social", data: { instagram: "@ok", not_a_platform: "x" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@ok" },
    });
  });

  it("drops a value with a dangerous scheme (javascript:) instead of writing it", async () => {
    const res = await PATCH(patchRequest({ section: "social", data: { website: "javascript:alert(1)", instagram: "@ok" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@ok" },
    });
  });
});
