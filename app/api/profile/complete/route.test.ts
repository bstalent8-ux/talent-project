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

const updateCoreForUser = vi.fn(async (_userId: string, _payload: Record<string, unknown>) => {});
const loadCoreRow = vi.fn(async (): Promise<{ typeSlug: string; core: { social_links: Record<string, unknown> } }> => ({
  typeSlug: "talent", core: { social_links: { instagram: "@existing" } },
}));

vi.mock("@/features/profiles", () => ({
  profileService: {
    loadCoreRow,
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
  loadCoreRow.mockClear();
  loadCoreRow.mockResolvedValue({ typeSlug: "talent", core: { social_links: { instagram: "@existing" } } });
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

describe("PATCH /api/profile/complete — availability section", () => {
  it("writes only the plain availability column when no schedule is sent", async () => {
    const res = await PATCH(patchRequest({ section: "availability", data: { availability: "available" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", { availability: "available" });
  });

  it("writes availability_schedule as its own column, not into social_links", async () => {
    const schedule = { timezone: "Africa/Cairo", dates: { "2026-08-16": [{ start: "10:00", end: "14:00" }] }, exceptions: [] };
    const res = await PATCH(patchRequest({
      section: "availability",
      data: { availability: "available", availability_schedule: schedule },
    }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      availability: "available",
      availability_schedule: schedule,
    });
  });
});

describe("PATCH /api/profile/complete — experience (Previous Projects) section", () => {
  it("strips a client-sent verified:true on a brand-new entry — the talent can never self-verify", async () => {
    const res = await PATCH(patchRequest({
      section: "experience",
      data: { experience: [{ id: "p1", name: "Campaign X", verified: true }] },
    }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: {
        instagram: "@existing",
        experience: [{ id: "p1", name: "Campaign X", year: "", description: null, duration: null, deliveredAt: null, deliverable: null, logoUrl: null, verified: false }],
      },
    });
  });

  it("preserves a previously-stored verified:true for the same id, ignoring the request's own value", async () => {
    loadCoreRow.mockResolvedValueOnce({
      typeSlug: "talent",
      core: { social_links: { instagram: "@existing", experience: [{ id: "p1", name: "old", verified: true }] } },
    });
    const res = await PATCH(patchRequest({
      section: "experience",
      data: { experience: [{ id: "p1", name: "Campaign X", verified: false }] },
    }));
    expect(res.status).toBe(200);
    const call = updateCoreForUser.mock.calls[0][1] as any;
    expect(call.social_links.experience[0].verified).toBe(true);
  });

  it("drops an entry whose name is empty after trimming", async () => {
    const res = await PATCH(patchRequest({ section: "experience", data: { experience: [{ id: "p1", name: "   " }] } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@existing", experience: [] },
    });
  });

  it("caps the list at 10 entries", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `Project ${i}` }));
    const res = await PATCH(patchRequest({ section: "experience", data: { experience: many } }));
    expect(res.status).toBe(200);
    const call = updateCoreForUser.mock.calls[0][1] as any;
    expect(call.social_links.experience).toHaveLength(10);
  });

  it("carries logoUrl through unchanged", async () => {
    const res = await PATCH(patchRequest({
      section: "experience",
      data: { experience: [{ id: "p1", name: "Campaign X", logoUrl: "https://res.cloudinary.com/x/image/upload/v1/logo.png" }] },
    }));
    expect(res.status).toBe(200);
    const call = updateCoreForUser.mock.calls[0][1] as any;
    expect(call.social_links.experience[0].logoUrl).toBe("https://res.cloudinary.com/x/image/upload/v1/logo.png");
  });

  it("generates an id when the client sends none", async () => {
    const res = await PATCH(patchRequest({ section: "experience", data: { experience: [{ name: "No id yet" }] } }));
    expect(res.status).toBe(200);
    const call = updateCoreForUser.mock.calls[0][1] as any;
    expect(call.social_links.experience).toHaveLength(1);
    expect(typeof call.social_links.experience[0].id).toBe("string");
    expect(call.social_links.experience[0].id.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/profile/complete — social section accepts new Professional Presence platforms", () => {
  it("merges a new platform key (telegram) with no server-side allowlist rejection", async () => {
    const res = await PATCH(patchRequest({ section: "social", data: { telegram: "https://t.me/example" } }));
    expect(res.status).toBe(200);
    expect(updateCoreForUser).toHaveBeenCalledWith("user-1", {
      social_links: { instagram: "@existing", telegram: "https://t.me/example" },
    });
  });
});
