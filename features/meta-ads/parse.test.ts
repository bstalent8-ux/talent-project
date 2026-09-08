import { describe, expect, it } from "vitest";
import { extractConversationsStarted, pickPrimaryResult, costPerResult } from "./parse";

describe("extractConversationsStarted", () => {
  it("sums the messaging_conversation_started_7d action", () => {
    const actions = [
      { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "12" },
      { action_type: "link_click", value: "50" },
    ];
    expect(extractConversationsStarted(actions)).toBe(12);
  });

  it("returns 0 for a campaign with no messaging actions (not an error)", () => {
    const actions = [{ action_type: "link_click", value: "50" }];
    expect(extractConversationsStarted(actions)).toBe(0);
  });

  it("returns 0 for an undefined actions array", () => {
    expect(extractConversationsStarted(undefined)).toBe(0);
  });
});

describe("pickPrimaryResult", () => {
  it("prefers a lead action over a link click", () => {
    const actions = [
      { action_type: "link_click", value: "80" },
      { action_type: "lead", value: "5" },
    ];
    expect(pickPrimaryResult(actions)).toEqual({ count: 5, type: "lead" });
  });

  it("falls back to link_click when nothing higher-priority exists", () => {
    const actions = [{ action_type: "link_click", value: "80" }];
    expect(pickPrimaryResult(actions)).toEqual({ count: 80, type: "link_click" });
  });

  it("returns null when actions carry no known type", () => {
    const actions = [{ action_type: "post_engagement", value: "3" }];
    expect(pickPrimaryResult(actions)).toBeNull();
  });

  it("returns null for an undefined actions array", () => {
    expect(pickPrimaryResult(undefined)).toBeNull();
  });
});

describe("costPerResult", () => {
  it("divides spend by result count", () => {
    expect(costPerResult(100, 4)).toBe(25);
  });

  it("returns null when there were zero results", () => {
    expect(costPerResult(100, 0)).toBeNull();
  });
});
