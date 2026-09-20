// ─── Meta Pixel wrapper (client-only) ────────────────────────────────────────
// No-ops entirely when NEXT_PUBLIC_META_PIXEL_ID is unset (default today —
// no Pixel ID exists yet) or the base snippet (components/analytics/
// MetaPixel.tsx) hasn't loaded fbq yet. Call sites never need to check
// either condition themselves.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ENABLED = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);

export function trackMetaEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params);
}

/**
 * The base-pixel init snippet, as a pure string builder so it's unit
 * testable without a DOM. Loads fbq and calls `fbq('init', ...)` ONLY —
 * it must never also call `fbq('track', 'PageView')` here. PageViewTracker
 * (components/analytics/PageViewTracker.tsx / lib/analytics/page-view.ts)
 * is the single, sole source of PageView events: exactly one on initial
 * mount, exactly one per SPA route change after that. If this snippet also
 * fired PageView, every session would double-count its first page view.
 */
export function buildMetaPixelSnippet(pixelId: string): string {
  // The fbq queue stub is created immediately (so PageViewTracker's events are queued,
  // not lost), but the ~190 KB fbevents.js download is deferred until the page has
  // finished loading and the browser is idle — it used to compete with the hero image
  // and the app bundles for bandwidth. Queued events are flushed when it arrives.
  return `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    var load=function(){if(load.d)return;load.d=1;t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)};
    var idle=function(){f.requestIdleCallback?f.requestIdleCallback(load,{timeout:3000}):setTimeout(load,200)};
    b.readyState==='complete'?idle():f.addEventListener('load',idle)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
  `;
}
