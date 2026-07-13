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
        // Auto-recover from stale/invalid refresh tokens (e.g. after project pause).
        // When token refresh fails, sign out silently so the user gets a clean state.
        onAuthStateChange: undefined,
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
