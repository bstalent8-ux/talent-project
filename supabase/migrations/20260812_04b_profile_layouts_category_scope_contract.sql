-- ============================================================
-- 20260812_04b_profile_layouts_category_scope_contract.sql
-- Sprint 1 (Profile Category Foundation) - step 4B of 4.
--
-- Contract step for category-aware layout uniqueness.
--
-- DO NOT APPLY until:
--   - 01, 02, 03, and 04A are live and verified
--   - Sprint 1 runtime code is live and smoke-tested
--   - human auth/admin checkpoint has passed
--
-- This migration removes the old UNIQUE(profile_type_id, variant) constraint
-- and replaces it with a nullable-safe unique expression index:
--
--   UNIQUE(profile_type_id, variant, COALESCE(category_scope, ''))
--
-- Because 04A's CHECK constraint only allows category ids that start with a
-- letter, the empty-string sentinel cannot collide with a real category id.
-- This enforces exactly one shared NULL layout while allowing category-scoped
-- overrides such as ugc and model for the same profile_type_id + variant.
-- ============================================================

-- Fail loudly if 04A has not added the column.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'profile_layouts'
       AND column_name = 'category_scope'
  ) THEN
    RAISE EXCEPTION '20260812_04B refused: profile_layouts.category_scope is missing; apply 04A first';
  END IF;
END $$;

-- Verify there are no duplicate groups before changing the uniqueness model.
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT count(*)
    INTO duplicate_count
    FROM (
      SELECT profile_type_id, variant, COALESCE(category_scope, '') AS category_scope_key, count(*) AS n
        FROM public.profile_layouts
       GROUP BY profile_type_id, variant, COALESCE(category_scope, '')
      HAVING count(*) > 1
    ) dupes;

  IF duplicate_count <> 0 THEN
    RAISE EXCEPTION '20260812_04B refused: found % duplicate profile_layout groups before scoped uniqueness change', duplicate_count;
  END IF;
END $$;

-- Remove the old UNIQUE(profile_type_id, variant) constraint, whatever name
-- Postgres assigned to it. This intentionally removes only a table constraint
-- with exactly those two columns in that order.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
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
       ) = ARRAY['profile_type_id', 'variant']
  LOOP
    EXECUTE format('ALTER TABLE public.profile_layouts DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

-- Nullable-safe scoped uniqueness. A plain UNIQUE(profile_type_id, variant,
-- category_scope) is not sufficient because Postgres treats NULL values as
-- distinct; that would allow multiple shared layouts.
DROP INDEX IF EXISTS public.idx_profile_layouts_unique_scope;
CREATE UNIQUE INDEX idx_profile_layouts_unique_scope
  ON public.profile_layouts (profile_type_id, variant, COALESCE(category_scope, ''));

COMMENT ON INDEX public.idx_profile_layouts_unique_scope IS
  'Sprint 1 (profile-category-foundation). Nullable-safe uniqueness for shared and category-scoped profile layouts: one NULL shared layout plus one layout per category_scope for each profile_type_id + variant.';

-- Verification assertions.
DO $$
DECLARE
  old_unique_count integer;
  new_unique_count integer;
  duplicate_count integer;
  total_rows integer;
  shared_rows integer;
BEGIN
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

  IF old_unique_count <> 0 THEN
    RAISE EXCEPTION '20260812_04B failed: old UNIQUE(profile_type_id, variant) still exists (% found)', old_unique_count;
  END IF;

  SELECT count(*)
    INTO new_unique_count
    FROM pg_indexes
   WHERE schemaname = 'public'
     AND tablename = 'profile_layouts'
     AND indexname = 'idx_profile_layouts_unique_scope';

  IF new_unique_count <> 1 THEN
    RAISE EXCEPTION '20260812_04B failed: scoped unique index missing';
  END IF;

  SELECT count(*)
    INTO duplicate_count
    FROM (
      SELECT profile_type_id, variant, COALESCE(category_scope, '') AS category_scope_key, count(*) AS n
        FROM public.profile_layouts
       GROUP BY profile_type_id, variant, COALESCE(category_scope, '')
      HAVING count(*) > 1
    ) dupes;

  IF duplicate_count <> 0 THEN
    RAISE EXCEPTION '20260812_04B failed: found % duplicate scoped layout groups after uniqueness change', duplicate_count;
  END IF;

  SELECT count(*) INTO total_rows FROM public.profile_layouts;
  SELECT count(*) INTO shared_rows FROM public.profile_layouts WHERE category_scope IS NULL;

  IF shared_rows = 0 OR shared_rows > total_rows THEN
    RAISE EXCEPTION '20260812_04B failed: existing shared layout rows are not intact (shared %, total %)', shared_rows, total_rows;
  END IF;

  RAISE NOTICE 'OK 20260812_04B: old unique constraint removed; scoped unique index exists; no duplicate groups; % shared layouts preserved', shared_rows;
END $$;

-- Verification detail queries for SQL Editor output.
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

SELECT indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename = 'profile_layouts'
   AND indexname = 'idx_profile_layouts_unique_scope';

SELECT profile_type_id, variant, category_scope, count(*) AS n
  FROM public.profile_layouts
 GROUP BY profile_type_id, variant, category_scope
HAVING count(*) > 1;

SELECT
  count(*) FILTER (WHERE category_scope IS NULL)     AS shared_layouts,
  count(*) FILTER (WHERE category_scope IS NOT NULL) AS scoped_layouts
FROM public.profile_layouts;

NOTIFY pgrst, 'reload schema';
