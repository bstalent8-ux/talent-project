import type { NextConfig } from "next";

// Dev-only allowance so impeccable live mode can load.
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

const nextConfig: NextConfig = {
  images: {
    // Every user-supplied image is proxied through our own upload routes to
    // Cloudinary — nothing loads `next/image` straight from an arbitrary
    // host. `images.unsplash.com` is only the hardcoded hero/placeholder
    // art; `*.supabase.co` covers Supabase Storage. Was `hostname: "**"`.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
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
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://connect.facebook.net https://challenges.cloudflare.com${__impeccableLiveDev}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Cloudinary (all user media), Unsplash (hero art), Supabase
              // Storage, and the Meta Pixel's tracking beacon. Was `https:`.
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.supabase.co https://www.facebook.com",
              "media-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://www.facebook.com https://graph.facebook.com https://challenges.cloudflare.com${__impeccableLiveDev}`,
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
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

