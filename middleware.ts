import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Paths that are always accessible regardless of account status
const ALWAYS_ALLOWED = ["/blocked", "/login", "/register", "/forgot-password"];

// Prefixes to skip entirely (static assets, Next internals)
const SKIP_PREFIXES = ["/_next", "/favicon", "/assets", "/api/auth"];

const BLOCKED_STATUSES = ["blocked", "suspended", "rejected"];

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

  // No session → let the page/layout handle auth redirects
  if (!user) return response;

  // Check account_status using service role to bypass RLS
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: "no-store" }) } }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("account_status, block_reason")
    .eq("id", user.id)
    .single();

  if (profile && BLOCKED_STATUSES.includes(profile.account_status ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/blocked";
    url.searchParams.set("reason", profile.block_reason ?? "");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
