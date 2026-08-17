-- ============================================================
-- 20260818_fix_favorites_table_conflict.sql
--
-- Fixes the live `PUT /api/favorites/[talentUserId]` 500. Root cause:
-- a `favorites` table already existed live BEFORE 20260817_favorites.sql
-- ran, with an unrelated legacy schema (`client_id` FK -> `client_profiles`,
-- `talent_id`, a 4th unnamed nullable column, `created_at` — no `user_id`/
-- `talent_user_id`). `client_profiles` predates the client->brand rename
-- (CLAUDE.md §8) and is not referenced anywhere else in this codebase —
-- confirmed via full-repo grep, and the live table is empty (0 rows).
--
-- 20260817_favorites.sql used `CREATE TABLE IF NOT EXISTS`, so it silently
-- no-op'd against this legacy table instead of creating the intended one.
-- The app's route.ts (unchanged, already correct) then queries columns
-- that don't exist on the live table, producing PGRST204 / 42703, which
-- the route surfaces as a 500.
--
-- This migration drops the empty, dead legacy table and recreates the
-- correct one. Confirmed empty via `select * from favorites limit 5` on
-- the live service-role connection before writing this file — nothing is
-- destroyed. Idempotent — safe to re-run.
-- ============================================================

DROP TABLE IF EXISTS public.favorites CASCADE;

CREATE TABLE public.favorites (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_user_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_no_self_favorite CHECK (user_id <> talent_user_id),
  CONSTRAINT favorites_unique_pair UNIQUE (user_id, talent_user_id)
);

CREATE INDEX idx_favorites_talent_user_id
  ON public.favorites(talent_user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Verification ──────────────────────────────────────────────────────────
SELECT table_name, row_security
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name = 'favorites';

SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'favorites'
 ORDER BY ordinal_position;

SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'favorites';

-- ─── PostgREST cache ───────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
