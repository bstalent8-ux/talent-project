import { describe, it, expect } from "vitest";
import { isRecentlyActive, ONLINE_WINDOW_MS } from "./online-status";

describe("isRecentlyActive", () => {
  const now = new Date("2026-08-29T12:00:00.000Z").getTime();

  it("null last_active_at -> never online", () => {
    expect(isRecentlyActive(null, now)).toBe(false);
  });

  it("just now -> online", () => {
    expect(isRecentlyActive(new Date(now).toISOString(), now)).toBe(true);
  });

  it("inside the window -> online", () => {
    const ts = new Date(now - ONLINE_WINDOW_MS + 1000).toISOString();
    expect(isRecentlyActive(ts, now)).toBe(true);
  });

  it("exactly at the window edge -> still online (inclusive)", () => {
    const ts = new Date(now - ONLINE_WINDOW_MS).toISOString();
    expect(isRecentlyActive(ts, now)).toBe(true);
  });

  it("just past the window -> offline", () => {
    const ts = new Date(now - ONLINE_WINDOW_MS - 1000).toISOString();
    expect(isRecentlyActive(ts, now)).toBe(false);
  });

  it("a day old -> offline", () => {
    const ts = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    expect(isRecentlyActive(ts, now)).toBe(false);
  });

  it("malformed timestamp -> offline, not a throw", () => {
    expect(isRecentlyActive("not-a-date", now)).toBe(false);
  });
});
