import { createClient } from "@supabase/supabase-js";

// Server-only client (bypasses RLS).
// Passes cache: "no-store" so Next.js App Router never caches PostgREST responses.
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (url, opts = {}) =>
        fetch(url, { ...opts, cache: "no-store" }),
    },
  }
);
