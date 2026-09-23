import { describe, it, expect, vi, beforeEach } from "vitest";

// Proves the RPC call shape and the fallback-to-null contract on a missing
// migration (Postgres error 42883 = function does not exist — see
// supabase/migrations/20260922_fuzzy_search.sql, not auto-applied per
// CLAUDE.md §6). Does not re-prove the SQL's own ranking/similarity logic —
// this repo has no live-DB test harness (vitest runs with no Postgres).

const adminRpc = vi.fn(async () => ({ data: [], error: null }));

vi.mock("@/lib/supabase/admin", () => ({
  adminClient: { rpc: adminRpc },
}));

const { fuzzyProfileIds, fuzzyCommunityQuestionIds } = await import("./fuzzy-search-db");

beforeEach(() => {
  adminRpc.mockClear();
});

describe("fuzzyProfileIds", () => {
  it("returns null for an empty/whitespace term without calling the RPC", async () => {
    expect(await fuzzyProfileIds("   ")).toBeNull();
    expect(adminRpc).not.toHaveBeenCalled();
  });

  it("calls search_profiles_fuzzy with the trimmed term and role filter", async () => {
    adminRpc.mockResolvedValueOnce({ data: [{ id: "a" }, { id: "b" }], error: null });
    const ids = await fuzzyProfileIds("  mohamed  ", "talent");
    expect(adminRpc).toHaveBeenCalledWith("search_profiles_fuzzy", {
      search_term: "mohamed",
      role_filter: "talent",
      match_limit: 200,
    });
    expect(ids).toEqual(["a", "b"]);
  });

  it("passes role_filter: null when no role is given", async () => {
    await fuzzyProfileIds("ahmed");
    expect(adminRpc).toHaveBeenCalledWith("search_profiles_fuzzy", expect.objectContaining({ role_filter: null }));
  });

  it("returns null (migration not applied) on a function-does-not-exist error", async () => {
    adminRpc.mockResolvedValueOnce({ data: null, error: { code: "42883", message: "function does not exist" } });
    expect(await fuzzyProfileIds("mohamed", "talent")).toBeNull();
  });

  it("returns null on any other RPC error too, without throwing", async () => {
    adminRpc.mockResolvedValueOnce({ data: null, error: { code: "XX000", message: "boom" } });
    await expect(fuzzyProfileIds("mohamed")).resolves.toBeNull();
  });

  it("returns an empty array (not null) when the RPC succeeds with no matches", async () => {
    adminRpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await fuzzyProfileIds("zzz999")).toEqual([]);
  });
});

describe("fuzzyCommunityQuestionIds", () => {
  it("uses the caller-supplied client, not adminClient", async () => {
    const callerRpc = vi.fn(async () => ({ data: [{ id: "q1" }], error: null }));
    const callerClient = { rpc: callerRpc } as unknown as Parameters<typeof fuzzyCommunityQuestionIds>[0];
    const ids = await fuzzyCommunityQuestionIds(callerClient, "booking question");
    expect(callerRpc).toHaveBeenCalledWith("search_community_questions_fuzzy", {
      search_term: "booking question",
      match_limit: 200,
    });
    expect(adminRpc).not.toHaveBeenCalled();
    expect(ids).toEqual(["q1"]);
  });

  it("returns null for an empty term without calling the RPC", async () => {
    const callerRpc = vi.fn();
    const callerClient = { rpc: callerRpc } as unknown as Parameters<typeof fuzzyCommunityQuestionIds>[0];
    expect(await fuzzyCommunityQuestionIds(callerClient, "")).toBeNull();
    expect(callerRpc).not.toHaveBeenCalled();
  });

  it("returns null on a function-does-not-exist error", async () => {
    const callerRpc = vi.fn(async () => ({ data: null, error: { code: "42883", message: "nope" } }));
    const callerClient = { rpc: callerRpc } as unknown as Parameters<typeof fuzzyCommunityQuestionIds>[0];
    expect(await fuzzyCommunityQuestionIds(callerClient, "term")).toBeNull();
  });
});
