-- ============================================================
-- 20260812_02_talent_category_fk_sync.sql  (REVISED — v1 AND v2 failed in production)
-- Sprint 1 (Profile Category Foundation) — step 2 of 4.
--
-- v1 of this file attempted a direct FK between talent_profiles.category
-- (the Postgres ENUM public.talent_category) and categories.id (text) and
-- failed with ERROR 42804 — Postgres does not allow a FK across an
-- enum/text type boundary, full stop, so v1's FK is REMOVED for good; the
-- guarantee it would have given (reject an invalid category) is enforced
-- by validate_talent_profiles_category() below instead, which CAN read
-- across that boundary because plpgsql can cast NEW.category::text at
-- runtime.
--
-- v2 replaced the FK with triggers correctly, but its sync function and
-- backfill both wrote with `INSERT ... ON CONFLICT (profile_id,
-- category_id) DO NOTHING`. That target requires a unique or exclusion
-- constraint on EXACTLY those two columns. profile_categories' only
-- confirmed key is a surrogate `id uuid` primary key (verified against the
-- live schema) — there is no evidence a (profile_id, category_id) unique
-- constraint exists, and attempting to positively confirm one via a live
-- no-op upsert probe was refused by this environment's write-safety
-- classifier (an unsolicited write to production, correctly blocked; not
-- something to route around). If that composite constraint is absent,
-- Postgres raises 42P10 ("there is no unique or exclusion constraint
-- matching the ON CONFLICT specification") on the very first row the
-- backfill loop processes — which, being an unhandled exception inside a
-- DO block, aborts the WHOLE script's implicit transaction, rolling back
-- the CREATE TRIGGER statements above it too. This is the most likely
-- explanation for "the migration ran but drift did not change": either it
-- visibly errored and nothing committed, or an equivalent conflict-target
-- problem silently no-op'd depending on how it was pasted. Flagged as the
-- leading, evidence-based hypothesis — not empirically proven, because
-- proving it live was correctly refused.
--
-- v3 (this version) removes ON CONFLICT entirely from both the trigger and
-- the backfill and replaces it with an explicit `IF NOT EXISTS (...) THEN
-- INSERT` check. This is correct regardless of whether that composite
-- unique constraint exists or not — it does not depend on the answer to
-- the open question above, which is why this file does not attempt to
-- create that constraint either; doing so would be a schema change beyond
-- this migration's stated scope (sync + validation only), and profile_id
-- lacking a role_type-scoped uniqueness rule is orthogonal to whether the
-- mirror is correct.
--
-- Depends on:
--   20260812_01  (categories row for 'model' exists)
--   20260812_01B (talent_category enum has 'model' as a member, committed
--                 in its own prior transaction)
--
-- ADDITIVE ONLY + one backfill UPDATE-shaped correction. Idempotent.
-- Known live drift before this migration: at least 1 row (talent_profiles
-- id 2f4f9833-3036-4611-bf9e-c13bb4e98b46, user_id d0f50259-cd73-4a28-9dd9-
-- 90dab1b43c46, category 'ugc') has no mirroring profile_categories row —
-- recompute the live count when running this, do not assume it is still
-- exactly 1. The backfill below closes it and any other drift present
-- using the same logic the trigger applies going forward.
-- ============================================================

-- ─── profile_categories semantics (established before writing this file) ────
-- profile_categories has no column distinguishing "primary" from
-- "secondary" category (its only columns, confirmed against the live
-- schema, are id/profile_id/category_id/created_at) — so the table cannot
-- structurally represent a talent having a secondary category even if one
-- existed. It doesn't: talent_profiles.category is a single enum column,
-- not an array, so there is exactly one canonical category per talent
-- profile upstream of this table, full stop. Live data confirms this in
-- practice too — every existing talent-role profile_categories row is
-- exactly the mirror of that one talent_profiles.category value, never a
-- second one. Brand-role rows (role_type='brand', e.g. brand_fashion) are
-- a completely separate set of rows for a separate set of profiles and are
-- filtered out of every DELETE/EXISTS check below by the `c.role_type =
-- 'talent'` condition — this migration cannot see or touch them. Given
-- that, "delete the stale talent-role mirror for this profile, ensure the
-- current one exists" is not a design ambiguity to stop on: there is no
-- legitimate second talent-role row this logic could ever mistake for
-- "secondary taxonomy," because that concept does not exist anywhere
-- upstream of talent_profiles.category today.
--
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
  'Sprint 1 (profile-category-foundation), repair v2 (unchanged in v3). Replaces the impossible enum-to-text FK: rejects any talent_profiles.category value that is not an active talent-role row in categories. The enum type already rejects unknown labels; this rejects known-but-inactive/non-existent-in-categories labels (e.g. makeup/kids/commercial/parts today).';

DROP TRIGGER IF EXISTS trg_validate_talent_profiles_category ON public.talent_profiles;
CREATE TRIGGER trg_validate_talent_profiles_category
  BEFORE INSERT OR UPDATE OF category ON public.talent_profiles
  FOR EACH ROW
  WHEN (NEW.category IS NOT NULL)
  EXECUTE FUNCTION public.validate_talent_profiles_category();

CREATE INDEX IF NOT EXISTS idx_talent_profiles_category
  ON public.talent_profiles(category);

-- ─── 2. Sync trigger: talent_profiles.category → profile_categories ────────
-- SECURITY DEFINER (justification): this function must write
-- profile_categories rows OWNED BY THE PROFILE BEING SYNCED regardless of
-- who/what triggered the talent_profiles write (registration route, admin
-- editor, a future job) — none of those callers necessarily hold INSERT
-- rights on profile_categories for that profile_id under RLS. search_path
-- is pinned to `public, pg_temp` so it cannot be redirected by a session
-- that has changed its own search_path, per the same convention as
-- sync_profile_type_from_role() (20260806_06).
--
-- A talent has exactly one category today (talent_profiles.category is a
-- single enum column, not an array or a set) — see the header note on
-- profile_categories semantics for why this makes "delete the stale
-- talent-role mirror, then ensure the current one" safe rather than
-- ambiguous: no legitimate second talent-role row can exist upstream of
-- this trigger, so there is nothing "secondary" to accidentally delete.
-- It never touches a profile's BRAND-role profile_categories rows (the
-- role_type filter makes that assumption explicit rather than load-bearing,
-- and prevents any cross-role mutation). This function only ever writes to
-- profile_categories, never back to talent_profiles, so there is no
-- trigger recursion risk between the two triggers on this table, and no
-- update loop.
--
-- No ON CONFLICT: see the file header for why v2's `ON CONFLICT
-- (profile_id, category_id)` is removed. `IF NOT EXISTS ... THEN INSERT`
-- is correct whether or not that composite constraint exists, at the cost
-- of a narrow theoretical race under concurrent writes to the SAME
-- profile_id from two sessions at once — not a realistic shape for this
-- app (a user only ever updates their own profile, one request at a time;
-- there is no bulk/admin path that writes another user's category), and
-- strictly no worse than v2's silent failure mode.
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

  IF NOT EXISTS (
    SELECT 1 FROM public.profile_categories
     WHERE profile_id = NEW.user_id AND category_id = category_text
  ) THEN
    INSERT INTO public.profile_categories (profile_id, category_id)
    VALUES (NEW.user_id, category_text);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_talent_category_to_profile_categories() IS
  'Sprint 1 (profile-category-foundation), repair v3. Keeps profile_categories in sync with talent_profiles.category (cast to text) so the two tables documented in CLAUDE.md cannot silently diverge. Runs regardless of which code path wrote talent_profiles, after validate_talent_profiles_category() has already confirmed the value is an active talent category. Uses an explicit existence check instead of ON CONFLICT — v2 assumed a (profile_id, category_id) unique constraint that is not confirmed to exist.';

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
-- profile's rows. Same no-ON-CONFLICT reasoning as the trigger above.
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

    IF NOT EXISTS (
      SELECT 1 FROM public.profile_categories
       WHERE profile_id = r.user_id AND category_id = r.category_text
    ) THEN
      INSERT INTO public.profile_categories (profile_id, category_id)
      VALUES (r.user_id, r.category_text);
    END IF;

    n := n + 1;
  END LOOP;

  RAISE NOTICE 'OK 20260812_02 (v3): backfill reconciled % talent_profiles rows into profile_categories', n;
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

-- ─── Verification: the specific known-drift row is fixed ────────────────────
-- Expect exactly one row: category_id = 'ugc'.
SELECT profile_id, category_id
  FROM public.profile_categories
 WHERE profile_id = 'd0f50259-cd73-4a28-9dd9-90dab1b43c46';

NOTIFY pgrst, 'reload schema';
