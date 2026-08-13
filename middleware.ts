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
];

const PROTECTED_EXACT_PATHS = ["/jobs/create"];

function isProtectedPath(pathname: string) {
  if (PROTECTED_EXACT_PATHS.includes(pathname)) return true;
  if (/^\/jobs\/[^/]+\/applications(?:\/|$)/.test(pathname)) return true;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// ─── TEMPORARY diagnostic timing ───────────────────────────────────────────
// Isolates where the ~7s middleware delay is spent. Only attaches headers
// when the request opts in via x-diag-timing, so normal traffic is
// unaffected. No secrets/tokens are recorded, only durations + booleans.
// Delete this block once the audit is done.
function stampDiag(
  res: NextResponse,
  diag: boolean,
  marks: Record<string, number>,
  extra: Record<string, string> = {},
) {
  if (!diag) return res;
  for (const [k, v] of Object.entries(marks)) res.headers.set(`x-diag-${k}`, String(v));
  for (const [k, v] of Object.entries(extra)) res.headers.set(`x-diag-${k}`, v);
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const diag = request.headers.get("x-diag-timing") === "1";
  const tMwStart = Date.now();

  // Skip static/internal paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Always allow these pages
  if (ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return stampDiag(NextResponse.next(), diag, { "total-ms": Date.now() - tMwStart }, { path: "always-allowed" });
  }

  // Set up SSR Supabase client to refresh tokens and read session
  let response = NextResponse.next({ request });

  const tBeforeClientCreate = Date.now();
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
  const tAfterClientCreate = Date.now();

  // getUser() validates the JWT — more secure than getSession()
  const tBeforeGetUser = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  const tAfterGetUser = Date.now();

  const diagMarks = {
    "pre-getuser-ms": tBeforeGetUser - tMwStart,
    "client-create-ms": tAfterClientCreate - tBeforeClientCreate,
    "getuser-ms": tAfterGetUser - tBeforeGetUser,
  };

  // No session: public browsing is allowed; protected app surfaces redirect.
  if (!user) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return stampDiag(NextResponse.redirect(url), diag,
        { ...diagMarks, "total-ms": Date.now() - tMwStart }, { "user-found": "0", path: "redirect-login" });
    }
    return stampDiag(response, diag, { ...diagMarks, "total-ms": Date.now() - tMwStart }, { "user-found": "0", path: "public" });
  }

  // Check account_status using service role to bypass RLS
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: "no-store" }) } }
  );

  const tBeforeAdminQuery = Date.now();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_status, block_reason")
    .eq("id", user.id)
    .single();
  const tAfterAdminQuery = Date.now();
  (diagMarks as Record<string, number>)["admin-query-ms"] = tAfterAdminQuery - tBeforeAdminQuery;

  if (profile && BLOCKED_STATUSES.includes(profile.account_status ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/blocked";
    url.searchParams.set("reason", profile.block_reason ?? "");
    return stampDiag(NextResponse.redirect(url), diag,
      { ...diagMarks, "total-ms": Date.now() - tMwStart }, { "user-found": "1", path: "redirect-blocked" });
  }

  return stampDiag(response, diag, { ...diagMarks, "total-ms": Date.now() - tMwStart }, { "user-found": "1", path: "authenticated" });
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|map|json|txt|xml|html|mp4|webm|mov|woff|woff2)$).*)",
  ],
};
