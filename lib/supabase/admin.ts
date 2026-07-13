import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only client (bypasses RLS) — lazy-initialized so build doesn't fail
// when env vars aren't present at compile time (e.g. Cloudflare Pages build).
let _admin: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  _admin = createClient(url, key, {
    global: {
      fetch: (u, opts = {}) => fetch(u, { ...opts, cache: "no-store" }),
    },
  });

  return _admin;
}

export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getAdminClient()[prop as keyof SupabaseClient];
  },
});
