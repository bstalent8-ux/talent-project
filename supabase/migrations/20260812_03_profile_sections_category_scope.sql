-- ============================================================
-- 20260812_03_profile_sections_category_scope.sql
-- Sprint 1 (Profile Category Foundation) — step 3 of 4.
--
-- Implements the approved Option A (docs/audits/profile-system-mvp-audit-
-- 2026-08-11.md §0.1/§15.5): profile_type stays "talent" — UGC and Model
-- become CATEGORY-scoped sections inside the existing Talent provider, not
-- new profile_types.
--
-- Adds ONE nullable column. NULL/empty = shared by every category of this
-- profile_type — every section seeded by 20260806_08/20260809 stays in this
-- state after this migration, so nothing currently rendered changes.
--
-- Brand is structurally unaffected: brand sections are never given a
-- category_scope value (categories only exist for talent in this table's
-- semantics — see the validating trigger below, which is scoped to talent).
--
-- ADDITIVE ONLY. Idempotent.
-- Depends on: 20260806_03 (profile_sections must exist), 20260812_01 (the
-- category ids this column's values are validated against, including model).
--
-- MVP enum-reachability repair (decision: prefer prevention over proof-of-
-- harmlessness): the validating trigger below also requires every
-- category_scope value to be a member of the `talent_category` enum, not
-- just an active `categories` row, so an admin cannot configure a section
-- scoped to a category no live talent profile can ever actually have.
-- ============================================================

ALTER TABLE public.profile_sections
  ADD COLUMN IF NOT EXISTS category_scope text[];

COMMENT ON COLUMN public.profile_sections.category_scope IS
  'Sprint 1 (profile-category-foundation), Option A. NULL/empty array = section applies to every talent category (the default — every pre-Sprint-1 row is in this state). Non-null = visible only to a talent whose talent_profiles.category is one of these values. Only meaningful for profile_type_id = talent; a brand section must never set this (enforced by the validating trigger below).';

-- Structural format check only (matches the id format every existing
-- category id already follows) — semantic existence is checked by the
-- trigger, which can see the live categories table; a CHECK constraint
-- cannot query another table.
CREATE OR REPLACE FUNCTION public.is_valid_category_scope_format(scopes text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT scopes IS NULL
      OR (
        cardinality(scopes) > 0
        AND NOT EXISTS (
          SELECT 1
            FROM unnest(scopes) AS v
           WHERE v !~ '^[a-z][a-z0-9_]*$'
        )
      );
$$;

COMMENT ON FUNCTION public.is_valid_category_scope_format(text[]) IS
  'Sprint 1 (profile-category-foundation). Immutable format-only validator for profile_sections.category_scope CHECK constraint. Semantic category existence is enforced by validate_profile_section_category_scope().';

ALTER TABLE public.profile_sections
  DROP CONSTRAINT IF EXISTS profile_sections_category_scope_format;

ALTER TABLE public.profile_sections
  ADD CONSTRAINT profile_sections_category_scope_format CHECK (
    public.is_valid_category_scope_format(category_scope)
  );

-- ─── Validating trigger ───────────────────────────────────────────────────────
-- Rejects (a) a category_scope on a non-talent section, (b) a category id
-- that isn't a real, active, talent-role row in `categories`, (c) — MVP
-- repair addition — a category id that `talent_profiles.category` cannot
-- currently even hold. `categories` (role_type='talent', active) and the
-- Postgres enum `talent_category` are two independent taxonomies that only
-- partially overlap today (see docs from the enum-sync repair): a
-- category_scope of e.g. 'tech_reviewer' would pass the old check (it is an
-- active `categories` row) but could never match any real talent profile,
-- because no talent_profiles row can hold that value until the enum is
-- widened. That is unreachable, not merely unused, configuration — this
-- trigger now refuses it outright rather than allowing it to sit inert.
-- Mirrors the rigor of profile_fields_options_required (20260806_03) —
-- reject at write time, not silently at render time.
CREATE OR REPLACE FUNCTION public.validate_profile_section_category_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  type_slug text;
  unknown_ids text[];
BEGIN
  IF NEW.category_scope IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT slug INTO type_slug FROM public.profile_types WHERE id = NEW.profile_type_id;

  IF type_slug IS DISTINCT FROM 'talent' THEN
    RAISE EXCEPTION 'category_scope is only valid on talent sections (got profile_type=%)', type_slug
      USING ERRCODE = '23514'; -- check_violation, matches the CHECK-constraint family of errors
  END IF;

  SELECT array_agg(v) INTO unknown_ids
    FROM unnest(NEW.category_scope) AS v
   WHERE NOT EXISTS (
     SELECT 1 FROM public.categories c
      WHERE c.id = v AND c.role_type = 'talent' AND c.is_active = true
   )
   OR NOT EXISTS (
     SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'talent_category' AND e.enumlabel = v
   );

  IF unknown_ids IS NOT NULL THEN
    RAISE EXCEPTION 'category_scope contains id(s) that are not both an active talent category and a talent_category enum member: %', unknown_ids
      USING ERRCODE = '23503'; -- foreign_key_violation family — this IS a soft FK
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_profile_section_category_scope() IS
  'Sprint 1 (profile-category-foundation) + MVP enum-reachability repair. category_scope cannot reference an unknown/inactive talent category, cannot reference a category that talent_profiles.category (enum talent_category) cannot currently hold, and cannot be set on a non-talent section. A trigger, not a CHECK constraint, because it must read the live categories table and pg_enum.';

DROP TRIGGER IF EXISTS trg_validate_section_category_scope ON public.profile_sections;
CREATE TRIGGER trg_validate_section_category_scope
  BEFORE INSERT OR UPDATE OF category_scope ON public.profile_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_section_category_scope();

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE non_null_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profile_sections'
       AND column_name = 'category_scope'
  ) THEN
    RAISE EXCEPTION '20260812_03 failed: category_scope column missing';
  END IF;

  -- Must be 0 immediately after this migration — nothing has set it yet.
  SELECT count(*) INTO non_null_count
    FROM public.profile_sections WHERE category_scope IS NOT NULL;

  RAISE NOTICE 'OK 20260812_03: category_scope column present, % sections currently scoped (expect 0 immediately after this migration)', non_null_count;
END $$;

-- ─── Verification: column + constraint exist ─────────────────────────────────
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'profile_sections' AND column_name = 'category_scope';

SELECT conname FROM pg_constraint WHERE conname = 'profile_sections_category_scope_format';

SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
 WHERE NOT t.tgisinternal AND t.tgname = 'trg_validate_section_category_scope';

-- ─── Verification: every existing section is still shared (zero drift) ──────
-- Expect every row in the 26-row live baseline (docs/audits/
-- sprint1-db-baseline-before.txt) to have category_scope IS NULL here.
SELECT key, category_scope
  FROM public.profile_sections
 WHERE category_scope IS NOT NULL;

NOTIFY pgrst, 'reload schema';
