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
      fetch: (u, opts = {}) => {
        const headers = new Headers((opts as RequestInit).headers);
        headers.set("User-Agent", "supabase-js/2 (Node.js server)");
        return fetch(u, { ...opts, cache: "no-store", headers });
      },
    },
  });

  return _admin;
}

export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getAdminClient()[prop as keyof SupabaseClient];
  },
});
