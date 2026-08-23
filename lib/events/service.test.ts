import { describe, it, expect, vi, beforeEach } from "vitest";

// What's testable here at the TS-orchestration layer: which adminClient
// calls fire, in what shape, and the boolean success contract. The actual
// 30-minute profile-view dedupe window and the 5-minute last_active_at
// throttle are atomic guards inside Postgres functions (see
// supabase/migrations/20260823_user_events.sql's track_talent_profile_view
// and touch_last_active) — real window-boundary behavior needs a live DB
// integration test, which this repo has no harness for (vitest runs with no
// DB). This file proves the app calls those functions correctly and reacts
// correctly to their result; it does not re-prove the SQL's own atomicity.

const insert = vi.fn(async () => ({ error: null }));
const rpc = vi.fn(async () => ({ error: null }));

vi.mock("@/lib/supabase/admin", () => ({
  adminClient: {
    from: (_table: string) => ({ insert }),
    rpc,
  },
}));

const { logEvent, logTalentProfileView } = await import("./service");

beforeEach(() => {
  insert.mockClear();
  rpc.mockClear();
});

describe("logEvent — last_active_at throttle delegation", () => {
  it("calls touch_last_active when a userId is present", async () => {
    const ok = await logEvent({ eventName: "page_view", userId: "user-1", sessionId: "s-1" });
    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("touch_last_active", { p_user_id: "user-1" });
  });

  it("does NOT call touch_last_active for a guest event (no userId)", async () => {
    const ok = await logEvent({ eventName: "page_view", userId: null, sessionId: "s-1" });
    expect(ok).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns false, and does not touch last_active, when the insert fails", async () => {
    insert.mockResolvedValueOnce({ error: { message: "boom" } });
    const ok = await logEvent({ eventName: "page_view", userId: "user-1", sessionId: "s-1" });
    expect(ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("logTalentProfileView — dedupe RPC call shape", () => {
  it("calls track_talent_profile_view with session, viewer, talent and metadata", async () => {
    const ok = await logTalentProfileView({
      sessionId: "s-1", userId: "viewer-1", talentUserId: "talent-1", metadata: { path: "/talent/x" },
    });
    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("track_talent_profile_view", {
      p_session_id: "s-1",
      p_viewer_user_id: "viewer-1",
      p_talent_user_id: "talent-1",
      p_metadata: { path: "/talent/x" },
    });
  });

  it("passes p_viewer_user_id: null for a guest viewer", async () => {
    await logTalentProfileView({ sessionId: "s-1", userId: null, talentUserId: "talent-1" });
    expect(rpc).toHaveBeenCalledWith("track_talent_profile_view", expect.objectContaining({ p_viewer_user_id: null }));
  });

  it("also touches last_active for a signed-in viewer, independent of whether the view counted", async () => {
    await logTalentProfileView({ sessionId: "s-1", userId: "viewer-1", talentUserId: "talent-1" });
    expect(rpc).toHaveBeenCalledWith("touch_last_active", { p_user_id: "viewer-1" });
  });

  it("returns false when the RPC errors (e.g. dedupe/increment failed)", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "boom" } });
    const ok = await logTalentProfileView({ sessionId: "s-1", userId: null, talentUserId: "talent-1" });
    expect(ok).toBe(false);
  });
});
