import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Paths that are always accessible regardless of account status
const ALWAYS_ALLOWED = ["/blocked", "/login", "/register", "/forgot-password", "/system_design.html"];

// Prefixes to skip entirely (static assets, Next internals)
const SKIP_PREFIXES = ["/_next", "/favicon", "/assets", "/api/auth"];

const BLOCKED_STATUSES = ["blocked", "suspended", "rejected"];

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/profile",
  "/messages",
  "/chat",
  "/bookings",
  "/notifications",
  "/settings",
  "/payments",
  "/favorites",
];

const PROTECTED_EXACT_PATHS = ["/jobs/create"];

// Brand-only action pages — posting a job and reviewing its applicants.
// Talents could otherwise reach these by typing the URL directly (the job
// board itself stays open to everyone; only these two actions are brand-only).
function isBrandOnlyPath(pathname: string) {
  if (pathname === "/jobs/create") return true;
  if (/^\/jobs\/[^/]+\/applications(?:\/|$)/.test(pathname)) return true;
  return false;
}

function isProtectedPath(pathname: string) {
  if (PROTECTED_EXACT_PATHS.includes(pathname)) return true;
  if (isBrandOnlyPath(pathname)) return true;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/internal paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Always allow these pages
  if (ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Set up SSR Supabase client to refresh tokens and read session
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT — more secure than getSession()
  const { data: { user } } = await supabase.auth.getUser();

  // No session: public browsing is allowed; protected app surfaces redirect.
  if (!user) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Check account_status using service role to bypass RLS
  // Note: 'cache' is not supported in Cloudflare Workers — omit it (matches lib/supabase/admin.ts)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, opts = {}) => {
          const { cache: _cache, ...rest } = opts as RequestInit;
          return fetch(url, rest);
        },
      },
    }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("role, account_status, block_reason")
    .eq("id", user.id)
    .single();

  if (profile && BLOCKED_STATUSES.includes(profile.account_status ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/blocked";
    url.searchParams.set("reason", profile.block_reason ?? "");
    return NextResponse.redirect(url);
  }

  const role = profile?.role ?? null;

  // Role-based page confinement is for PAGE navigation only. API routes
  // (including ones an admin page itself calls, like /api/admin/me or
  // /api/notifications) must never get redirected — a fetch() silently
  // follows the redirect and returns the wrong page's HTML instead of
  // JSON, which broke every admin API call the first time this shipped.
  // Every route already does its own getUser() + role check server-side.
  const isApiPath = pathname.startsWith("/api/");

  // Admin accounts are confined to the back-office — no browsing the public
  // marketplace as if they were a talent/brand. Everything outside /admin
  // (besides the universal utility pages above) bounces back to /admin.
  if (!isApiPath && role === "admin" && !pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Non-admins never reach the back-office by typing the URL — the (admin)
  // layout already checks this server-side, this is defense in depth so the
  // redirect happens before any admin page even starts rendering.
  if (!isApiPath && role !== "admin" && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Talents can browse the job board but not post jobs or review applicants
  // — those stay brand-only even if a talent types the URL directly.
  if (role !== "brand" && role !== "admin" && isBrandOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/jobs";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|map|json|txt|xml|html|mp4|webm|mov|woff|woff2)$).*)",
  ],
};
