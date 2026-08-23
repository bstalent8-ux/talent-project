"use client";

// Standard Meta base-pixel snippet, gated behind NEXT_PUBLIC_META_PIXEL_ID.
// No ID set → this renders nothing: no script, no fbq, no Facebook network
// request. Mounted once in the root layout (app/layout.tsx), not
// (main)/layout.tsx, so it also covers (auth) and (admin) route groups.
//
// This component ONLY loads fbq and calls fbq('init', ...) — it must NEVER
// call fbq('track', 'PageView') itself. PageViewTracker is the single owner
// of every PageView event (initial mount + each SPA route change); if this
// snippet also fired one, the first page view of every session would be
// double-counted in Meta. See buildMetaPixelSnippet's own comment.

import Script from "next/script";
import { buildMetaPixelSnippet } from "@/lib/analytics/meta-pixel";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {buildMetaPixelSnippet(PIXEL_ID)}
      </Script>
      <noscript>
        {/* Meta's standard no-JS fallback beacon — mutually exclusive with
            the fbq path above (fires only when JS/fbq never ran), so this
            is not a second source of the same PageView. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
