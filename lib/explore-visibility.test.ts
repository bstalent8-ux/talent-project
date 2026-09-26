import { describe, expect, it } from "vitest";
import { exploreHiddenReason } from "./explore-visibility";

const base = { status: "approved", handle: "a", isSuspended: false, accountStatus: "active", category: "ugc" };

describe("exploreHiddenReason", () => {
  it("visible approved ugc/model talent → null", () => {
    expect(exploreHiddenReason(base)).toBeNull();
    expect(exploreHiddenReason({ ...base, category: "Model" })).toBeNull();
  });
  it("not approved → null (no Explore-specific reason)", () => {
    expect(exploreHiddenReason({ ...base, status: "pending", category: "others" })).toBeNull();
  });
  it("each Explore rule", () => {
    expect(exploreHiddenReason({ ...base, handle: null })).toBe("no_handle");
    expect(exploreHiddenReason({ ...base, isSuspended: true })).toBe("suspended");
    expect(exploreHiddenReason({ ...base, accountStatus: "blocked" })).toBe("account_blocked");
    expect(exploreHiddenReason({ ...base, category: "others" })).toBe("category");
    expect(exploreHiddenReason({ ...base, category: null })).toBe("category");
  });
});
