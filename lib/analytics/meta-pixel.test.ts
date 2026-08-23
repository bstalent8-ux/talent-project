import { describe, it, expect, vi, afterEach } from "vitest";

describe("META_PIXEL_ENABLED — reflects NEXT_PUBLIC_META_PIXEL_ID", () => {
  const originalEnv = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = originalEnv;
    vi.resetModules();
  });

  it("is false when the env var is unset", async () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    vi.resetModules();
    const { META_PIXEL_ENABLED } = await import("./meta-pixel");
    expect(META_PIXEL_ENABLED).toBe(false);
  });

  it("is true when the env var is set", async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456";
    vi.resetModules();
    const { META_PIXEL_ENABLED } = await import("./meta-pixel");
    expect(META_PIXEL_ENABLED).toBe(true);
  });
});

describe("trackMetaEvent — no-op without a loaded Pixel", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it("does nothing when window is undefined (SSR)", async () => {
    delete (globalThis as any).window;
    const { trackMetaEvent } = await import("./meta-pixel");
    expect(() => trackMetaEvent("PageView")).not.toThrow();
  });

  it("does nothing when window.fbq was never loaded (NEXT_PUBLIC_META_PIXEL_ID unset → MetaPixel renders nothing → fbq never defined)", async () => {
    (globalThis as any).window = {};
    const { trackMetaEvent } = await import("./meta-pixel");
    expect(() => trackMetaEvent("PageView")).not.toThrow();
    expect((globalThis.window as any).fbq).toBeUndefined();
  });

  it("calls window.fbq('track', ...) once fbq exists", async () => {
    const fbq = vi.fn();
    (globalThis as any).window = { fbq };
    const { trackMetaEvent } = await import("./meta-pixel");
    trackMetaEvent("ViewContent", { content_type: "talent_profile" });
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", { content_type: "talent_profile" });
  });
});

describe("buildMetaPixelSnippet — the loader initializes fbq only, never PageView", () => {
  it("calls fbq('init', <id>)", async () => {
    const { buildMetaPixelSnippet } = await import("./meta-pixel");
    const snippet = buildMetaPixelSnippet("123456");
    expect(snippet).toContain("fbq('init', '123456')");
  });

  it("never calls fbq('track', 'PageView') itself — PageViewTracker owns every PageView", async () => {
    const { buildMetaPixelSnippet } = await import("./meta-pixel");
    const snippet = buildMetaPixelSnippet("123456");
    expect(snippet).not.toContain("PageView");
    expect(snippet).not.toMatch(/fbq\(\s*['"]track['"]/);
  });
});
