-- ============================================================
-- 20260812_02_talent_category_fk_sync.sql
-- Sprint 1 (Profile Category Foundation) — step 2 of 4.
--
-- Fixes the drift risk documented in the audit (§3.1, §12): talent_profiles
-- .category (single free-text column, no FK) and profile_categories
-- (proper many-to-many, FK'd to categories) are written by the same
-- application code path but nothing at the DB level keeps them in sync.
--
-- Two independent guarantees, both required:
--
--   1. FK on talent_profiles.category → categories(id). Makes an invalid
--      category (e.g. the registration form's old "media_buyers" bug)
--      IMPOSSIBLE to write to talent_profiles, from ANY code path — the
--      registration route, /profile/me, or the admin talent editor.
--
--   2. AFTER trigger that keeps profile_categories in sync with
--      talent_profiles.category automatically, on every insert/update —
--      so the two can never silently diverge no matter which write path
--      touches talent_profiles, without requiring every caller to
--      remember to also call setProfileCategories().
--
-- Depends on: 20260812_01 (model must exist before the FK is added, or the
-- FK would still be correct but model would remain unselectable).
--
-- ADDITIVE + one backfill UPDATE-shaped correction. Idempotent.
-- Verified against live data before writing this file: 36/36 talent_profiles
-- rows have a category in {fashion, ugc}, both already valid — the FK will
-- apply with zero violations.
-- ============================================================

-- ─── 1. FK: talent_profiles.category → categories(id) ───────────────────────
-- ON DELETE SET NULL: if an admin ever deactivates+removes a category (not
-- possible today via the admin UI, which only soft-disables), an existing
-- talent falls back to "no category" rather than the row becoming
-- unrepresentable. ON UPDATE CASCADE: category ids are meant to be stable
-- (matches profile_types.slug's own stated convention), but if one is ever
-- renamed, talent_profiles follows automatically instead of orphaning.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'talent_profiles_category_fkey'
  ) THEN
    ALTER TABLE public.talent_profiles
      ADD CONSTRAINT talent_profiles_category_fkey
      FOREIGN KEY (category) REFERENCES public.categories(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_talent_profiles_category_fk
  ON public.talent_profiles(category);

-- ─── 2. Sync trigger: talent_profiles.category → profile_categories ─────────
-- SECURITY DEFINER + pinned search_path, same convention as
-- sync_profile_type_from_role() in 20260806_06.
--
-- A talent has exactly one category today (talent_profiles.category is a
-- single column, not an array), so this trigger enforces "at most one
-- talent-role row in profile_categories per profile" as a side effect —
-- removing any stale prior category link before inserting the current one.
-- It never touches a profile's BRAND-role category_categories rows (a user
-- is never both, but the role_type filter makes that assumption explicit
-- rather than load-bearing).
CREATE OR REPLACE FUNCTION public.sync_talent_category_to_profile_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.category IS NULL THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.profile_categories pc
   USING public.categories c
   WHERE pc.category_id = c.id
     AND c.role_type = 'talent'
     AND pc.profile_id = NEW.user_id
     AND pc.category_id <> NEW.category;

  INSERT INTO public.profile_categories (profile_id, category_id)
  VALUES (NEW.user_id, NEW.category)
  ON CONFLICT (profile_id, category_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_talent_category_to_profile_categories() IS
  'Sprint 1 (profile-category-foundation). Keeps profile_categories in sync with talent_profiles.category so the two tables documented in CLAUDE.md §3.1 of the profile audit cannot silently diverge. Runs regardless of which code path wrote talent_profiles.';

DROP TRIGGER IF EXISTS trg_sync_talent_category ON public.talent_profiles;
CREATE TRIGGER trg_sync_talent_category
  AFTER INSERT OR UPDATE OF category ON public.talent_profiles
  FOR EACH ROW
  WHEN (NEW.category IS NOT NULL)
  EXECUTE FUNCTION public.sync_talent_category_to_profile_categories();

-- ─── 3. One-time backfill: reconcile every existing row ─────────────────────
-- The audit's live baseline found talent_profiles.category ugc=19 vs
-- profile_categories ugc=18 — a pre-existing 1-row drift. This closes it,
-- and closes any other drift already present, using the exact same logic
-- the trigger now applies automatically going forward.
DO $backfill$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN
    SELECT id, user_id, category FROM public.talent_profiles WHERE category IS NOT NULL
  LOOP
    DELETE FROM public.profile_categories pc
     USING public.categories c
     WHERE pc.category_id = c.id
       AND c.role_type = 'talent'
       AND pc.profile_id = r.user_id
       AND pc.category_id <> r.category;

    INSERT INTO public.profile_categories (profile_id, category_id)
    VALUES (r.user_id, r.category)
    ON CONFLICT (profile_id, category_id) DO NOTHING;

    n := n + 1;
  END LOOP;

  RAISE NOTICE 'OK 20260812_02: backfill reconciled % talent_profiles rows into profile_categories', n;
END $backfill$;

-- ─── Verification: FK exists ─────────────────────────────────────────────────
SELECT conname, confrelid::regclass AS references_table
  FROM pg_constraint
 WHERE conname = 'talent_profiles_category_fkey';

-- ─── Verification: trigger exists and enabled ────────────────────────────────
SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
 WHERE NOT t.tgisinternal
   AND t.tgname = 'trg_sync_talent_category';

-- ─── Verification: drift is now zero ─────────────────────────────────────────
-- Expect 0 rows both ways.
SELECT tp.id AS talent_profile_id, tp.user_id, tp.category
  FROM public.talent_profiles tp
 WHERE tp.category IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.profile_categories pc
      WHERE pc.profile_id = tp.user_id AND pc.category_id = tp.category
   );

SELECT pc.profile_id, pc.category_id
  FROM public.profile_categories pc
  JOIN public.categories c ON c.id = pc.category_id AND c.role_type = 'talent'
  JOIN public.talent_profiles tp ON tp.user_id = pc.profile_id
 WHERE tp.category IS DISTINCT FROM pc.category_id;

NOTIFY pgrst, 'reload schema';
