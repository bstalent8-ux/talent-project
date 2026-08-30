import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// vi.hoisted so the mutable "current user" is settable per-test but still
// visible inside the hoisted vi.mock factory below.
const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}));

const logEvent = vi.fn(async () => true);
const logTalentProfileView = vi.fn(async () => true);

vi.mock("@/lib/events/service", () => ({
  logEvent,
  logTalentProfileView,
}));

vi.mock("@/lib/cache", () => ({
  privateNoStoreHeaders: () => ({}),
}));

// Imported AFTER the mocks so the route picks them up.
const { POST } = await import("./route");

function req(body: unknown) {
  return { json: async () => body } as any;
}

const VALID_SESSION = "11111111-1111-4111-8111-111111111111";
const VALID_TARGET = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  state.user = null;
  logEvent.mockClear();
  logTalentProfileView.mockClear();
});

describe("POST /api/events — event_name allowlist", () => {
  it("accepts a valid client event (page_view)", async () => {
    const res = await POST(req({ event_name: "page_view", session_id: VALID_SESSION, metadata: { path: "/explore" } }));
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "page_view", sessionId: VALID_SESSION }));
  });

  it("rejects an unknown event_name", async () => {
    const res = await POST(req({ event_name: "delete_account", session_id: VALID_SESSION }));
    expect(res.status).toBe(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("rejects server-only events sent from the client (booking_brief_sent)", async () => {
    const res = await POST(req({ event_name: "booking_brief_sent", session_id: VALID_SESSION }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/events — session_id must be a UUID", () => {
  it("rejects a non-UUID session_id", async () => {
    const res = await POST(req({ event_name: "page_view", session_id: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("rejects a missing session_id", async () => {
    const res = await POST(req({ event_name: "page_view" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/events — target validation", () => {
  it("rejects a non-UUID target_id on talent_profile_view", async () => {
    const res = await POST(req({
      event_name: "talent_profile_view", session_id: VALID_SESSION,
      target_type: "talent_profile", target_id: "not-a-uuid",
    }));
    expect(res.status).toBe(400);
    expect(logTalentProfileView).not.toHaveBeenCalled();
  });

  it("rejects an invalid target_type", async () => {
    const res = await POST(req({
      event_name: "talent_profile_view", session_id: VALID_SESSION,
      target_type: "not_a_real_type", target_id: VALID_TARGET,
    }));
    expect(res.status).toBe(400);
    expect(logTalentProfileView).not.toHaveBeenCalled();
  });

  it("rejects a target_type that doesn't match the event's fixed type", async () => {
    const res = await POST(req({
      event_name: "talent_profile_view", session_id: VALID_SESSION,
      target_type: "job", target_id: VALID_TARGET,
    }));
    expect(res.status).toBe(400);
  });

  it("rejects a target on an event that doesn't accept one (page_view)", async () => {
    const res = await POST(req({
      event_name: "page_view", session_id: VALID_SESSION,
      target_type: "talent_profile", target_id: VALID_TARGET,
    }));
    expect(res.status).toBe(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("accepts a valid talent_profile_view target and routes to logTalentProfileView", async () => {
    const res = await POST(req({
      event_name: "talent_profile_view", session_id: VALID_SESSION,
      target_type: "talent_profile", target_id: VALID_TARGET,
    }));
    expect(res.status).toBe(200);
    expect(logTalentProfileView).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: VALID_SESSION, talentUserId: VALID_TARGET,
    }));
    expect(logEvent).not.toHaveBeenCalled();
  });
});

describe("POST /api/events — metadata schema", () => {
  it("rejects an unknown metadata key", async () => {
    const res = await POST(req({
      event_name: "page_view", session_id: VALID_SESSION,
      metadata: { path: "/explore", evil_key: "x" },
    }));
    expect(res.status).toBe(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("rejects metadata with the wrong type for a known key", async () => {
    const res = await POST(req({
      event_name: "search", session_id: VALID_SESSION,
      metadata: { query: "x", result_count: "not-a-number" },
    }));
    expect(res.status).toBe(400);
  });

  it("rejects an oversized metadata value", async () => {
    const res = await POST(req({
      event_name: "page_view", session_id: VALID_SESSION,
      metadata: { path: "a".repeat(1000) },
    }));
    expect(res.status).toBe(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("rejects an enum field outside its allowlist (signup role)", async () => {
    const res = await POST(req({
      event_name: "signup", session_id: VALID_SESSION,
      metadata: { role: "admin" }, // admin cannot self-register — only login accepts it
    }));
    expect(res.status).toBe(400);
  });

  it("accepts signup with utm attribution fields", async () => {
    const res = await POST(req({
      event_name: "signup", session_id: VALID_SESSION,
      metadata: { role: "talent", utm_source: "fb_ad", utm_campaign: "model_ugc_aug26" },
    }));
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { role: "talent", utm_source: "fb_ad", utm_campaign: "model_ugc_aug26" },
    }));
  });

  it("rejects an unknown key on signup metadata", async () => {
    const res = await POST(req({
      event_name: "signup", session_id: VALID_SESSION,
      metadata: { role: "talent", utm_content: "not-allowed" },
    }));
    expect(res.status).toBe(400);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("accepts missing metadata entirely", async () => {
    const res = await POST(req({ event_name: "login", session_id: VALID_SESSION }));
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ metadata: {} }));
  });
});

describe("POST /api/events — page_engagement metadata", () => {
  it("accepts a full valid payload", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      metadata: { path: "/explore", duration_ms: 12_345, render_ms: 48, scrolled: true },
    }));
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: "page_engagement",
      metadata: { path: "/explore", duration_ms: 12_345, render_ms: 48, scrolled: true },
    }));
  });

  it("accepts a null render_ms (page hidden before paint measured)", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      metadata: { duration_ms: 500, render_ms: null, scrolled: false },
    }));
    expect(res.status).toBe(200);
  });

  it("rejects a negative duration_ms", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      metadata: { duration_ms: -1 },
    }));
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range duration_ms", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      metadata: { duration_ms: 999_999_999 },
    }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-boolean scrolled", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      metadata: { scrolled: "yes" },
    }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown metadata key", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      metadata: { duration_ms: 100, extra: "nope" },
    }));
    expect(res.status).toBe(400);
  });

  it("rejects a target on page_engagement (does not accept one)", async () => {
    const res = await POST(req({
      event_name: "page_engagement", session_id: VALID_SESSION,
      target_type: "job", target_id: VALID_TARGET,
    }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/events — click metadata", () => {
  it("accepts a full valid payload", async () => {
    const res = await POST(req({
      event_name: "click", session_id: VALID_SESSION,
      metadata: { path: "/explore", label: "Book Now", href: "/talent/sara" },
    }));
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: "click",
      metadata: { path: "/explore", label: "Book Now", href: "/talent/sara" },
    }));
  });

  it("accepts a click with no href (a button, not a link)", async () => {
    const res = await POST(req({
      event_name: "click", session_id: VALID_SESSION,
      metadata: { path: "/explore", label: "Send Brief" },
    }));
    expect(res.status).toBe(200);
  });

  it("rejects an unknown metadata key", async () => {
    const res = await POST(req({
      event_name: "click", session_id: VALID_SESSION,
      metadata: { label: "x", selector: "#foo" },
    }));
    expect(res.status).toBe(400);
  });

  it("rejects an oversized label", async () => {
    const res = await POST(req({
      event_name: "click", session_id: VALID_SESSION,
      metadata: { label: "a".repeat(200) },
    }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/events — identity", () => {
  it("ignores a client-supplied user_id entirely (never trusted)", async () => {
    state.user = null;
    const res = await POST(req({
      event_name: "page_view", session_id: VALID_SESSION,
      user_id: "attacker-controlled-id",
    }));
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
  });

  it("resolves userId: null for an unauthenticated caller", async () => {
    state.user = null;
    await POST(req({ event_name: "page_view", session_id: VALID_SESSION }));
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
  });

  it("resolves userId from the revalidated session for an authenticated caller", async () => {
    state.user = { id: "real-user-1" };
    await POST(req({ event_name: "page_view", session_id: VALID_SESSION }));
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: "real-user-1" }));
  });
});

describe("POST /api/events — DB failure is not reported as success", () => {
  it("returns 500 (not 200) when logEvent fails", async () => {
    logEvent.mockResolvedValueOnce(false);
    const res = await POST(req({ event_name: "page_view", session_id: VALID_SESSION }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBeUndefined();
  });
});
