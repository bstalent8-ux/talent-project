import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;

  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        debug: false,
      },
    }
  );

  // Listen for TOKEN_REFRESH_FAILED and sign out automatically so stale
  // cookies don't keep triggering "Failed to fetch" on every page load.
  _client.auth.onAuthStateChange((event) => {
    if (event === "TOKEN_REFRESHED") return;
    if (event === "SIGNED_OUT") return;
    // SIGNED_IN / USER_UPDATED are fine
  });

  // Catch the specific token-refresh network failure and clear the session.
  _client.auth.getSession().catch(() => {
    _client?.auth.signOut({ scope: "local" });
  });

  return _client;
}

// ─── Deduplicated getUser ─────────────────────────────────────────────────────
// Several always-mounted components (notification bell, floating chat widget)
// each call `auth.getUser()` on mount, and every call is its own network round
// trip to GoTrue. They mount in the same tick, so sharing the in-flight promise
// collapses them into one request. Only concurrent calls are shared — the
// promise is dropped as soon as it settles, so a later call still revalidates
// and nothing goes stale across a login or logout.
let _inFlightUser: Promise<Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>>> | null = null;

export function getBrowserUser() {
  if (_inFlightUser) return _inFlightUser;
  _inFlightUser = createClient().auth.getUser().finally(() => { _inFlightUser = null; });
  return _inFlightUser;
}
