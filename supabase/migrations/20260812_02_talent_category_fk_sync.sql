-- ============================================================
-- 20260812_02_talent_category_fk_sync.sql  (REVISED — v1 failed in production)
-- Sprint 1 (Profile Category Foundation) — step 2 of 4.
--
-- v1 of this file attempted:
--   ALTER TABLE talent_profiles ADD CONSTRAINT talent_profiles_category_fkey
--     FOREIGN KEY (category) REFERENCES categories(id);
-- and failed in production with:
--   ERROR 42804: foreign key constraint "talent_profiles_category_fkey"
--   cannot be implemented
-- Root cause: talent_profiles.category is the Postgres ENUM
-- `public.talent_category` (fashion, makeup, ugc, kids, commercial, parts,
-- model — after 20260812_01B), not text. categories.id is text. Postgres
-- does not allow a FK between an enum column and a text column, full stop
-- — there is no cast that makes this legal as a table-level constraint.
--
-- This is why a direct FK is REMOVED from this revision. It is not a
-- workaround for a permissions or naming problem — it is structurally
-- impossible, so the repair uses the same guarantee (reject an invalid
-- category, keep profile_categories in sync) via triggers instead, which
-- CAN read across the type boundary because plpgsql can cast
-- NEW.category::text and compare it to categories.id at runtime.
--
-- Depends on:
--   20260812_01  (categories row for 'model' exists)
--   20260812_01B (talent_category enum has 'model' as a member, committed
--                 in its own prior transaction)
--
-- ADDITIVE ONLY + one backfill UPDATE-shaped correction. Idempotent.
-- Known live drift before this migration: 1 row (talent_profiles id
-- 2f4f9833-3036-4611-bf9e-c13bb4e98b46, user_id d0f50259-cd73-4a28-9dd9-
-- 90dab1b43c46, category 'ugc') has no mirroring profile_categories row.
-- The backfill below closes this specific row and any other drift present
-- using the same logic the trigger applies going forward.
-- ============================================================

-- ─── 1. Validation trigger: reject a category with no active Talent row ────
-- The enum type itself already guarantees "is a valid enum value" — Postgres
-- rejects any input that isn't one of talent_category's labels before this
-- trigger ever runs. This trigger adds the guarantee the removed FK would
-- have given: the value must also be a live, active, talent-role row in
-- `categories` (the taxonomy table the rest of the app reads for display,
-- search-filtering, and profile_categories). NEW.category::text is a plain
-- enum-to-text cast of the already-validated column value, not a literal —
-- safe to run in any transaction, unlike casting a string literal to the
-- enum type itself.
CREATE OR REPLACE FUNCTION public.validate_talent_profiles_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.category IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.categories c
     WHERE c.id = NEW.category::text
       AND c.role_type = 'talent'
       AND c.is_active = true
  ) THEN
    RAISE EXCEPTION 'talent_profiles.category % has no active talent row in categories', NEW.category
      USING ERRCODE = '23503'; -- foreign_key_violation family — this IS the soft FK the removed constraint would have enforced
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_talent_profiles_category() IS
  'Sprint 1 (profile-category-foundation), repair v2. Replaces the impossible enum-to-text FK: rejects any talent_profiles.category value that is not an active talent-role row in categories. The enum type already rejects unknown labels; this rejects known-but-inactive/non-existent-in-categories labels (e.g. makeup/kids/commercial/parts today).';

DROP TRIGGER IF EXISTS trg_validate_talent_profiles_category ON public.talent_profiles;
CREATE TRIGGER trg_validate_talent_profiles_category
  BEFORE INSERT OR UPDATE OF category ON public.talent_profiles
  FOR EACH ROW
  WHEN (NEW.category IS NOT NULL)
  EXECUTE FUNCTION public.validate_talent_profiles_category();

CREATE INDEX IF NOT EXISTS idx_talent_profiles_category
  ON public.talent_profiles(category);

-- ─── 2. Sync trigger: talent_profiles.category → profile_categories ────────
-- Unchanged in intent from v1, only the column comparison is cast-safe now
-- (NEW.category::text instead of comparing enum to text implicitly).
-- SECURITY DEFINER + pinned search_path, same convention as
-- sync_profile_type_from_role() in 20260806_06.
--
-- A talent has exactly one category today (talent_profiles.category is a
-- single column, not an array), so this trigger enforces "at most one
-- talent-role row in profile_categories per profile" as a side effect —
-- removing any stale prior category link before inserting the current one.
-- It never touches a profile's BRAND-role profile_categories rows (a user
-- is never both, but the role_type filter makes that assumption explicit
-- rather than load-bearing, and prevents any recursion into brand data).
-- This function only ever writes to profile_categories, never back to
-- talent_profiles, so there is no trigger recursion risk between the two
-- triggers on this table.
CREATE OR REPLACE FUNCTION public.sync_talent_category_to_profile_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  category_text text;
BEGIN
  IF NEW.category IS NULL THEN
    RETURN NEW;
  END IF;

  category_text := NEW.category::text;

  DELETE FROM public.profile_categories pc
   USING public.categories c
   WHERE pc.category_id = c.id
     AND c.role_type = 'talent'
     AND pc.profile_id = NEW.user_id
     AND pc.category_id <> category_text;

  INSERT INTO public.profile_categories (profile_id, category_id)
  VALUES (NEW.user_id, category_text)
  ON CONFLICT (profile_id, category_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_talent_category_to_profile_categories() IS
  'Sprint 1 (profile-category-foundation), repair v2. Keeps profile_categories in sync with talent_profiles.category (cast to text) so the two tables documented in CLAUDE.md cannot silently diverge. Runs regardless of which code path wrote talent_profiles, after validate_talent_profiles_category() has already confirmed the value is an active talent category.';

DROP TRIGGER IF EXISTS trg_sync_talent_category ON public.talent_profiles;
CREATE TRIGGER trg_sync_talent_category
  AFTER INSERT OR UPDATE OF category ON public.talent_profiles
  FOR EACH ROW
  WHEN (NEW.category IS NOT NULL)
  EXECUTE FUNCTION public.sync_talent_category_to_profile_categories();

-- ─── 3. One-time backfill: reconcile every existing row ─────────────────────
-- Idempotent: re-running finds 0 remaining drift and does nothing on a
-- second pass. Only touches talent-role profile_categories rows for the
-- exact profile being reconciled — never a Brand row, never another
-- profile's rows.
DO $backfill$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN
    SELECT id, user_id, category::text AS category_text
      FROM public.talent_profiles
     WHERE category IS NOT NULL
  LOOP
    DELETE FROM public.profile_categories pc
     USING public.categories c
     WHERE pc.category_id = c.id
       AND c.role_type = 'talent'
       AND pc.profile_id = r.user_id
       AND pc.category_id <> r.category_text;

    INSERT INTO public.profile_categories (profile_id, category_id)
    VALUES (r.user_id, r.category_text)
    ON CONFLICT (profile_id, category_id) DO NOTHING;

    n := n + 1;
  END LOOP;

  RAISE NOTICE 'OK 20260812_02 (v2): backfill reconciled % talent_profiles rows into profile_categories', n;
END $backfill$;

-- ─── Verification: no FK exists (by design — see header) ────────────────────
-- Expect 0 rows. A non-zero result here means something else created this
-- constraint name; investigate before proceeding, do not drop blindly.
SELECT conname FROM pg_constraint WHERE conname = 'talent_profiles_category_fkey';

-- ─── Verification: both triggers exist and enabled ───────────────────────────
SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
 WHERE NOT t.tgisinternal
   AND t.tgname IN ('trg_validate_talent_profiles_category', 'trg_sync_talent_category');

-- ─── Verification: drift is now zero, both directions ───────────────────────
-- Expect 0 rows from each of the next two queries.
SELECT tp.id AS talent_profile_id, tp.user_id, tp.category
  FROM public.talent_profiles tp
 WHERE tp.category IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.profile_categories pc
      WHERE pc.profile_id = tp.user_id AND pc.category_id = tp.category::text
   );

SELECT pc.profile_id, pc.category_id
  FROM public.profile_categories pc
  JOIN public.categories c ON c.id = pc.category_id AND c.role_type = 'talent'
  JOIN public.talent_profiles tp ON tp.user_id = pc.profile_id
 WHERE tp.category::text IS DISTINCT FROM pc.category_id;

NOTIFY pgrst, 'reload schema';
