import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

// DB-backed typo-tolerant search for the server-paginated lists that can't
// load their full dataset client-side (lib/fuzzy-search.ts handles the
// pages that can). Calls the RPCs in
// supabase/migrations/20260922_fuzzy_search.sql, which aren't auto-applied
// (CLAUDE.md §6) — every caller here falls back to `null` on a
// "function does not exist" error so the existing plain-ILIKE code path
// keeps working until that migration is pasted in.
const FUNCTION_MISSING = "42883";

/** Ids of profiles whose full_name/handle/phone_number fuzzy-match `term`,
 *  ranked by closeness. `null` = migration not applied yet — caller should
 *  fall back to its own ILIKE filter. */
export async function fuzzyProfileIds(
  term: string,
  roleFilter: string | null = null,
  matchLimit = 200,
): Promise<string[] | null> {
  const q = term.trim();
  if (!q) return null;
  const { data, error } = await adminClient.rpc("search_profiles_fuzzy", {
    search_term: q,
    role_filter: roleFilter,
    match_limit: matchLimit,
  });
  if (error) {
    if (error.code !== FUNCTION_MISSING) console.error("[fuzzy-search-db] search_profiles_fuzzy failed:", error.message);
    return null;
  }
  return (data ?? []).map((r: { id: string }) => r.id);
}

/** Same idea for community_questions — takes the caller's own Supabase
 *  client since that route runs unauthenticated (anon/SSR client, not
 *  adminClient) and the RPC is granted to anon/authenticated for exactly
 *  that reason. */
export async function fuzzyCommunityQuestionIds(
  supabase: SupabaseClient,
  term: string,
  matchLimit = 200,
): Promise<string[] | null> {
  const q = term.trim();
  if (!q) return null;
  const { data, error } = await supabase.rpc("search_community_questions_fuzzy", {
    search_term: q,
    match_limit: matchLimit,
  });
  if (error) {
    if (error.code !== FUNCTION_MISSING) console.error("[fuzzy-search-db] search_community_questions_fuzzy failed:", error.message);
    return null;
  }
  return (data ?? []).map((r: { id: string }) => r.id);
}
