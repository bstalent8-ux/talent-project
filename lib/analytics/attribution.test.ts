import { describe, it, expect, afterEach } from "vitest";

// No jsdom in this repo (see vitest.config.ts) — stub window AND localStorage
// as plain globals, same pattern as meta-pixel.test.ts's window stub.

function makeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
}

describe("attribution — captureAttribution / getAttribution", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = (globalThis as any).localStorage;

  function stubBrowser() {
    const ls = makeLocalStorage();
    (globalThis as any).window = {};
    (globalThis as any).localStorage = ls;
    return ls;
  }

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it("does nothing when window is undefined (SSR)", async () => {
    delete (globalThis as any).window;
    const { captureAttribution, getAttribution } = await import("./attribution");
    expect(() => captureAttribution(new URLSearchParams("utm_source=fb_ad"))).not.toThrow();
    expect(getAttribution()).toBeUndefined();
  });

  it("stores utm_* params present in the URL", async () => {
    stubBrowser();
    const { captureAttribution, getAttribution } = await import("./attribution");
    captureAttribution(new URLSearchParams("utm_source=fb_ad&utm_campaign=model_ugc_aug26&other=ignored"));
    expect(getAttribution()).toEqual({ utm_source: "fb_ad", utm_campaign: "model_ugc_aug26" });
  });

  it("leaves stored attribution untouched when the URL has no utm params", async () => {
    stubBrowser();
    const { captureAttribution, getAttribution } = await import("./attribution");
    captureAttribution(new URLSearchParams("utm_source=fb_group"));
    captureAttribution(new URLSearchParams()); // plain internal navigation, no tags
    expect(getAttribution()).toEqual({ utm_source: "fb_group" });
  });

  it("last tagged visit overwrites an earlier one", async () => {
    stubBrowser();
    const { captureAttribution, getAttribution } = await import("./attribution");
    captureAttribution(new URLSearchParams("utm_source=fb_group"));
    captureAttribution(new URLSearchParams("utm_source=fb_ad"));
    expect(getAttribution()).toEqual({ utm_source: "fb_ad" });
  });

  it("returns undefined when nothing was ever captured", async () => {
    stubBrowser();
    const { getAttribution } = await import("./attribution");
    expect(getAttribution()).toBeUndefined();
  });
});
