import { describe, it, expect, vi, beforeEach } from "vitest";

// firePageView() is what PageViewTracker's useEffect calls on every
// (pathname, searchParams) change — extracted out so this is testable
// without rendering the component (no jsdom/RTL in this repo, see
// vitest.config.ts). The component itself is a one-line wrapper: its
// effect fires once on initial mount and once per dependency change
// (React's normal effect semantics), i.e. once per route.

const trackEvent = vi.fn();
const trackMetaEvent = vi.fn();

vi.mock("./track", () => ({ trackEvent: (...args: unknown[]) => trackEvent(...args) }));
vi.mock("./meta-pixel", () => ({ trackMetaEvent: (...args: unknown[]) => trackMetaEvent(...args) }));

const { firePageView } = await import("./page-view");

beforeEach(() => {
  trackEvent.mockClear();
  trackMetaEvent.mockClear();
});

describe("firePageView", () => {
  it("logs exactly one internal page_view and one Meta PageView for the initial route", () => {
    firePageView("/explore");
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("page_view", { metadata: { path: "/explore" } });
    expect(trackMetaEvent).toHaveBeenCalledTimes(1);
    expect(trackMetaEvent).toHaveBeenCalledWith("PageView");
  });

  it("fires exactly one additional pair per subsequent route change", () => {
    firePageView("/explore");
    firePageView("/talent/some-handle");
    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackMetaEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenLastCalledWith("page_view", { metadata: { path: "/talent/some-handle" } });
  });
});
