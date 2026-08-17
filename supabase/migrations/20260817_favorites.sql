-- ============================================================
-- 20260817_favorites.sql
--
-- Adds real DB-backed "favorite talent" storage. Audited first: no
-- favorites/saved-talents table, API, or RLS policy existed anywhere in
-- the repo before this migration — every "Favorite"/"Save" button
-- (ProfileHero.tsx, StickyBookingBar.tsx, the UGC hero) was wired to
-- ProtectedAction with NO real onClick behind it. This is the first and
-- only favorites table; nothing is duplicated.
--
-- One row = one (user, talent) pair the user has saved. user_id is
-- whoever saved it (talent, brand, or admin — docs/guest-permissions.md
-- allows all three, only guests are blocked). talent_user_id is
-- profiles.id of the saved talent (NOT talent_profiles.id — the app's
-- TalentData.id is already the profiles.id, see talent.context.ts's
-- toTalentData(), so the API takes the same id every other real action
-- on the talent page already uses).
--
-- Idempotent — CREATE TABLE/INDEX/POLICY IF NOT EXISTS, safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_user_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_no_self_favorite CHECK (user_id <> talent_user_id),
  CONSTRAINT favorites_unique_pair UNIQUE (user_id, talent_user_id)
);

-- Lookup "did I favorite this talent" / "list my favorites" — the unique
-- constraint above already creates a (user_id, talent_user_id) index that
-- serves both, since user_id is the leading column.
CREATE INDEX IF NOT EXISTS idx_favorites_talent_user_id
  ON public.favorites(talent_user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- A user may only see, create, or delete their OWN favorites — never
-- another user's saved list, and never favorite on someone else's behalf.
-- Defence in depth: the app reads/writes this table through adminClient
-- (service role, RLS bypassed) per CLAUDE.md §8/§9, with the same check
-- enforced in app/api/favorites/[talentUserId]/route.ts.
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Verification: table + RLS exist ──────────────────────────────────────
SELECT table_name, row_security
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name = 'favorites';

SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'favorites';

-- ─── PostgREST cache ───────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
