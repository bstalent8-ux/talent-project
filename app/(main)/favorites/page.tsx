export const runtime = 'edge';

// ─── Saved Talents / Favorites ─────────────────────────────────────────────
// Guest access is already blocked by middleware.ts (/favorites is in
// PROTECTED_PREFIXES, redirects to /login?next=/favorites). This server
// component just does the initial fetch so the page isn't a client-side
// loading flash on first paint; FavoritesClient owns filtering, search and
// the remove action from there.

import { createClient } from "@/lib/supabase/server";
import { getFavoriteTalentCards } from "@/features/favorites/service";
import FavoritesClient from "./_components/FavoritesClient";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Belt and suspenders — middleware already redirects a guest before this
  // ever renders, but a stale/expired session between the middleware check
  // and this render shouldn't crash the page.
  const initialFavorites = user ? await getFavoriteTalentCards(user.id).catch(() => []) : [];

  return <FavoritesClient initialFavorites={initialFavorites} />;
}
