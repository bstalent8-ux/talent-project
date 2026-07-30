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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:${__impeccableLiveDev}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob: https:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co${__impeccableLiveDev}`,
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      ...[
        "/api/admin/:path*",
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

