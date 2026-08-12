-- ============================================================
-- 20260812_04a_profile_layouts_category_scope_expand.sql
-- Sprint 1 (Profile Category Foundation) - step 4A of 4.
--
-- Safe expand step for category-aware layout support.
--
-- Adds ONE nullable column:
--   profile_layouts.category_scope text
--
-- NULL = shared/default layout for the (profile_type_id, variant) pair.
-- Existing rows remain NULL. The old production uniqueness constraint on
-- (profile_type_id, variant) is deliberately kept intact in this expand step
-- so pre-Sprint-1 deployed application code remains fully compatible.
--
-- This file does NOT create category-specific uniqueness and does NOT drop or
-- replace any existing constraint. That contract step is deferred to 04B.
--
-- Depends on:
--   20260806_04_profile_values_layouts.sql
--   20260812_01_category_taxonomy_model.sql
--
-- MVP enum-reachability repair: the validating trigger below also requires
-- category_scope to be a talent_category enum member, not just an active
-- categories row — see 20260812_03 for the same decision and reasoning.
-- ============================================================

ALTER TABLE public.profile_layouts
  ADD COLUMN IF NOT EXISTS category_scope text;

COMMENT ON COLUMN public.profile_layouts.category_scope IS
  'Sprint 1 (profile-category-foundation). NULL = shared/default layout for this profile_type_id + variant. Non-null = future category-specific override for talent layouts only. Added in 04A without changing the existing profile_type_id + variant uniqueness contract.';

-- Format-only validation. Semantic validation against live categories is done
-- by the trigger below because CHECK constraints cannot query other tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.profile_layouts'::regclass
       AND conname = 'profile_layouts_category_scope_format'
  ) THEN
    ALTER TABLE public.profile_layouts
      ADD CONSTRAINT profile_layouts_category_scope_format CHECK (
        category_scope IS NULL
        OR category_scope ~ '^[a-z][a-z0-9_]*$'
      );
  END IF;
END $$;

-- Validating trigger:
--   - NULL is always valid and means shared/default.
--   - Non-null category_scope is allowed only for the Talent profile type.
--   - Non-null category_scope must reference an active talent category.
--   - MVP enum-reachability repair: it must ALSO be a member of the
--     talent_category enum — otherwise no talent_profiles row could ever
--     match this layout override, and it would be unreachable configuration
--     rather than a future-ready one. See 20260812_03 for the identical
--     decision on profile_sections.category_scope.
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

  SELECT pt.slug
    INTO type_slug
    FROM public.profile_types pt
   WHERE pt.id = NEW.profile_type_id;

  IF type_slug IS DISTINCT FROM 'talent' THEN
    RAISE EXCEPTION 'category_scope is only valid on talent layouts (got profile_type=%)', type_slug
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.categories c
     WHERE c.id = NEW.category_scope
       AND c.role_type = 'talent'
       AND c.is_active = true
  ) THEN
    RAISE EXCEPTION 'category_scope references an unknown or inactive talent category: %', NEW.category_scope
      USING ERRCODE = '23503';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
     JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'talent_category' AND e.enumlabel = NEW.category_scope
  ) THEN
    RAISE EXCEPTION 'category_scope % is not a member of the talent_category enum and could never match a talent profile', NEW.category_scope
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_profile_layout_category_scope() IS
  'Sprint 1 (profile-category-foundation) + MVP enum-reachability repair. Validates profile_layouts.category_scope without changing the old layout uniqueness contract. Non-null scopes are talent-only and must reference an active talent category that is also a talent_category enum member (otherwise no profile could ever match it).';

DROP TRIGGER IF EXISTS trg_validate_layout_category_scope ON public.profile_layouts;
CREATE TRIGGER trg_validate_layout_category_scope
  BEFORE INSERT OR UPDATE OF category_scope ON public.profile_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_layout_category_scope();

-- Verification assertions.
DO $$
DECLARE
  total_rows integer;
  shared_rows integer;
  scoped_rows integer;
  old_unique_count integer;
  format_constraint_count integer;
  trigger_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'profile_layouts'
       AND column_name = 'category_scope'
       AND data_type = 'text'
       AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION '20260812_04A failed: nullable text category_scope column missing';
  END IF;

  SELECT count(*)
    INTO old_unique_count
    FROM pg_constraint con
   WHERE con.conrelid = 'public.profile_layouts'::regclass
     AND con.contype = 'u'
     AND (
       SELECT array_agg(att.attname::text ORDER BY ord.ordinality)
         FROM unnest(con.conkey) WITH ORDINALITY AS ord(attnum, ordinality)
         JOIN pg_attribute att
           ON att.attrelid = con.conrelid
          AND att.attnum = ord.attnum
     ) = ARRAY['profile_type_id', 'variant'];

  IF old_unique_count <> 1 THEN
    RAISE EXCEPTION '20260812_04A failed: expected old UNIQUE(profile_type_id, variant) to remain intact, found %', old_unique_count;
  END IF;

  SELECT count(*)
    INTO format_constraint_count
    FROM pg_constraint
   WHERE conrelid = 'public.profile_layouts'::regclass
     AND conname = 'profile_layouts_category_scope_format'
     AND contype = 'c';

  SELECT count(*)
    INTO trigger_count
    FROM pg_trigger t
   WHERE t.tgrelid = 'public.profile_layouts'::regclass
     AND t.tgname = 'trg_validate_layout_category_scope'
     AND NOT t.tgisinternal
     AND t.tgenabled <> 'D';

  IF format_constraint_count <> 1 OR trigger_count <> 1 THEN
    RAISE EXCEPTION '20260812_04A failed: category_scope validation mechanism missing (format constraint %, trigger %)', format_constraint_count, trigger_count;
  END IF;

  SELECT count(*) INTO total_rows FROM public.profile_layouts;
  SELECT count(*) INTO shared_rows FROM public.profile_layouts WHERE category_scope IS NULL;
  SELECT count(*) INTO scoped_rows FROM public.profile_layouts WHERE category_scope IS NOT NULL;

  IF scoped_rows <> 0 THEN
    RAISE EXCEPTION '20260812_04A failed: expected zero scoped layouts immediately after migration, found %', scoped_rows;
  END IF;

  IF shared_rows <> total_rows THEN
    RAISE EXCEPTION '20260812_04A failed: expected all existing layouts to remain shared, found shared % of total %', shared_rows, total_rows;
  END IF;

  RAISE NOTICE 'OK 20260812_04A: category_scope column and validation exist; old unique constraint preserved; % existing layouts remain shared; 0 scoped layouts exist', shared_rows;
END $$;

-- Verification detail queries for SQL Editor output.
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'profile_layouts'
   AND column_name = 'category_scope';

SELECT conname, contype
  FROM pg_constraint
 WHERE conrelid = 'public.profile_layouts'::regclass
   AND conname = 'profile_layouts_category_scope_format';

SELECT con.conname
  FROM pg_constraint con
 WHERE con.conrelid = 'public.profile_layouts'::regclass
   AND con.contype = 'u'
   AND (
     SELECT array_agg(att.attname::text ORDER BY ord.ordinality)
       FROM unnest(con.conkey) WITH ORDINALITY AS ord(attnum, ordinality)
       JOIN pg_attribute att
         ON att.attrelid = con.conrelid
        AND att.attnum = ord.attnum
   ) = ARRAY['profile_type_id', 'variant'];

SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
 WHERE NOT t.tgisinternal
   AND t.tgname = 'trg_validate_layout_category_scope';

SELECT
  count(*) FILTER (WHERE category_scope IS NULL)     AS shared_layouts,
  count(*) FILTER (WHERE category_scope IS NOT NULL) AS scoped_layouts
FROM public.profile_layouts;

NOTIFY pgrst, 'reload schema';
