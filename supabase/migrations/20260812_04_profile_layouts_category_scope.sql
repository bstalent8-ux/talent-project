-- ============================================================
-- 20260812_04_profile_layouts_category_scope.sql
-- Sprint 1 (Profile Category Foundation) — step 4 of 4.
--
-- Category-aware layout support (audit §0/§15.5's "shared Talent layout +
-- optional category-specific override" shape).
--
-- Adds ONE nullable column, `category_scope text` (a single category, unlike
-- profile_sections.category_scope which is an array — a LAYOUT is a whole
-- ordering for one category, not a set of categories that share one
-- ordering, so a single value is the correct shape here).
--
-- NULL = the shared/default layout for a (profile_type_id, variant) pair —
-- exactly what both live rows (talent/public, brand/public) are today, and
-- exactly what stays true after this migration: this file changes 0 rows.
--
-- The old UNIQUE(profile_type_id, variant) constraint is replaced with an
-- expression-based unique INDEX that treats NULL category_scope as its own
-- distinguishable value (Postgres's standard UNIQUE constraint would allow
-- unlimited rows with category_scope=NULL, since NULL <> NULL — that would
-- silently break the "exactly one shared layout per type+variant" guarantee
-- this system depends on, so a plain UNIQUE(a,b,c) is NOT used here).
--
-- ADDITIVE ONLY (constraint is replaced, not the table). Idempotent.
-- Depends on: 20260806_04 (profile_layouts must exist), 20260812_01 (the
-- category ids category_scope is validated against).
-- ============================================================

ALTER TABLE public.profile_layouts
  ADD COLUMN IF NOT EXISTS category_scope text;

COMMENT ON COLUMN public.profile_layouts.category_scope IS
  'Sprint 1 (profile-category-foundation). NULL = the shared/default layout for this (profile_type_id, variant) — both live rows (talent/public, brand/public) are in this state and this migration does not change them. A single category id = an override layout, read only through dynamicProfileRepository.findLayoutOverride(), never through findLayout() (which always filters to category_scope IS NULL, unchanged behaviour).';

-- ─── Replace the old unique constraint ───────────────────────────────────────
-- Name confirmed live before writing this file (a deliberate duplicate-key
-- probe against production returned constraint name
-- "profile_layouts_profile_type_id_variant_key" — the standard Postgres
-- auto-generated name for UNIQUE (profile_type_id, variant)).
ALTER TABLE public.profile_layouts
  DROP CONSTRAINT IF EXISTS profile_layouts_profile_type_id_variant_key;

-- COALESCE(category_scope, '') collapses every NULL to the same sentinel for
-- uniqueness purposes ONLY — the stored value is untouched — so exactly one
-- shared (NULL) layout per (type, variant) is enforced, while any number of
-- DISTINCT category overrides for the same (type, variant) is allowed.
DROP INDEX IF EXISTS public.idx_profile_layouts_unique_scope;
CREATE UNIQUE INDEX idx_profile_layouts_unique_scope
  ON public.profile_layouts (profile_type_id, variant, COALESCE(category_scope, ''));

-- ─── Validating trigger ───────────────────────────────────────────────────────
-- Reuses the same two rules as profile_sections' trigger (talent-only,
-- must be a real active talent category) — kept as a separate function
-- rather than sharing one, because the two tables validate different
-- shapes (array vs scalar) and a shared function would need a branch on
-- table name, which is worse than two small, single-purpose functions.
CREATE OR REPLACE FUNCTION public.validate_profile_layout_category_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  type_slug text;
BEGIN
  IF NEW.category_scope IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT slug INTO type_slug FROM public.profile_types WHERE id = NEW.profile_type_id;

  IF type_slug IS DISTINCT FROM 'talent' THEN
    RAISE EXCEPTION 'category_scope is only valid on talent layouts (got profile_type=%)', type_slug
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.categories c
     WHERE c.id = NEW.category_scope AND c.role_type = 'talent' AND c.is_active = true
  ) THEN
    RAISE EXCEPTION 'category_scope references an unknown or inactive talent category: %', NEW.category_scope
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_profile_layout_category_scope() IS
  'Sprint 1 (profile-category-foundation). A layout category_scope cannot reference an unknown/inactive talent category, and cannot be set on a non-talent layout.';

DROP TRIGGER IF EXISTS trg_validate_layout_category_scope ON public.profile_layouts;
CREATE TRIGGER trg_validate_layout_category_scope
  BEFORE INSERT OR UPDATE OF category_scope ON public.profile_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_layout_category_scope();

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE non_null_count integer; shared_rows integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profile_layouts'
       AND column_name = 'category_scope'
  ) THEN
    RAISE EXCEPTION '20260812_04 failed: category_scope column missing';
  END IF;

  SELECT count(*) INTO non_null_count FROM public.profile_layouts WHERE category_scope IS NOT NULL;
  SELECT count(*) INTO shared_rows    FROM public.profile_layouts WHERE category_scope IS NULL;

  RAISE NOTICE 'OK 20260812_04: category_scope column present, % shared rows (expect 2: talent+brand /public), % category-scoped rows (expect 0 immediately after this migration)',
    shared_rows, non_null_count;

  IF shared_rows <> 2 THEN
    RAISE WARNING 'expected exactly 2 shared (NULL category_scope) layout rows post-migration, found %. Investigate before adding any override row.', shared_rows;
  END IF;
END $$;

-- ─── Verification: old constraint gone, new index present ───────────────────
SELECT conname FROM pg_constraint WHERE conname = 'profile_layouts_profile_type_id_variant_key'; -- expect 0 rows
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_profile_layouts_unique_scope';            -- expect 1 row

-- ─── Verification: trigger exists ────────────────────────────────────────────
SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
 WHERE NOT t.tgisinternal AND t.tgname = 'trg_validate_layout_category_scope';

-- ─── Verification: the new unique index still rejects a real duplicate ──────
-- Run manually in a transaction you ROLL BACK, if you want to see it fire:
-- BEGIN;
--   INSERT INTO public.profile_layouts (profile_type_id, variant, layout)
--   SELECT profile_type_id, variant, layout FROM public.profile_layouts
--    WHERE variant = 'public' LIMIT 1;
--   -- expect: duplicate key value violates unique constraint "idx_profile_layouts_unique_scope"
-- ROLLBACK;

NOTIFY pgrst, 'reload schema';
