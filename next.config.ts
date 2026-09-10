import type { NextConfig } from "next";

// Dev-only allowance so impeccable live mode can load.
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Trims per-route bundles for libraries imported all over the app (nearly
  // every component pulls a `lucide-react` icon or two) — each of the 149
  // edge functions next-on-pages generates otherwise carries more of these
  // packages' internals than it actually uses. Pure build-time transform, no
  // behavior change. Added while the compiled Worker was tripping Cloudflare's
  // free-plan 3 MiB size limit (see the 2026-08-31 deploy incident).
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Folded these out of standalone page.tsx routes (each was 6-7 lines of
  // nothing but a redirect(), or a byte-identical duplicate render of
  // another page) so they stop counting as separate entries in Cloudflare
  // Pages' _routes.json — that file caps at 100 rules, and this project's
  // 147 combined page/API routes was exceeding it, silently 404ing whichever
  // routes didn't make the cut (confirmed live: /api/events,
  // /api/talent-type-requests, /api/auth/otp/send). next-on-pages compiles
  // these into Cloudflare's native _redirects mechanism instead, which is
  // edge-level and doesn't share that budget.
  async redirects() {
    return [
      { source: "/talents", destination: "/explore", permanent: true },
      { source: "/pricing", destination: "/packages", permanent: true },
      { source: "/campaigns", destination: "/jobs", permanent: true },
      { source: "/profile", destination: "/profile/me", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/cookies", destination: "/legal/cookies", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://connect.facebook.net${__impeccableLiveDev}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob: https:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.facebook.com https://graph.facebook.com${__impeccableLiveDev}`,
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      ...[
        "/api/admin/:path*",
        "/api/auth/:path*",
        "/api/me",
        "/api/me/:path*",
        "/api/bookings",
        "/api/bookings/:path*",
        "/api/chat",
        "/api/chat/:path*",
        "/api/notifications",
        "/api/notifications/:path*",
        "/api/portfolio",
        "/api/profile",
        "/api/profile/:path*",
        "/api/subscriptions",
        "/api/sync-profile",
        "/api/reviews",
        "/api/reviews/:path*",
        "/admin",
        "/admin/:path*",
        "/dashboard",
        "/dashboard/:path*",
        "/profile",
        "/profile/:path*",
        "/messages",
        "/messages/:path*",
        "/chat",
        "/chat/:path*",
        "/bookings",
        "/bookings/:path*",
        "/notifications",
        "/notifications/:path*",
        "/settings",
        "/settings/:path*",
        "/payments",
        "/payments/:path*",
      ].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
        ],
      })),
    ];
  },
};

export default nextConfig;

