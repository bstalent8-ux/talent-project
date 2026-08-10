-- ============================================================
-- 20260806_04_profile_values_layouts.sql
-- Profile Architecture V2 — Phase 1, step 4 of 7: value storage + layouts.
--
-- profile_values is the only V2 table that holds user data.
-- profile_layouts holds ORDERING ONLY — it is not a page builder.
--
-- ADDITIVE ONLY. Idempotent.
-- Depends on: 20260806_03_profile_sections_fields.sql
-- ============================================================

-- ─── profile_values ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- profiles.id is 1:1 with auth.users.id, so profile_id = auth.uid() for the
  -- owner. The RLS policies in step 7 rely on that identity.
  profile_id  uuid NOT NULL REFERENCES public.profiles(id)       ON DELETE CASCADE,
  field_id    uuid NOT NULL REFERENCES public.profile_fields(id) ON DELETE CASCADE,

  -- Always jsonb. Scalars are stored as jsonb scalars ("cairo", 42, true),
  -- never wrapped in an object. The application casts by profile_fields.field_type.
  value       jsonb NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_values_unique_field UNIQUE (profile_id, field_id)
);

COMMENT ON TABLE  public.profile_values IS
  'Profile Architecture V2: dynamic profile values. NEVER stores money, moderation state, ratings, or anything read by a booking, payment, or authorization check — those stay in strongly typed columns.';
COMMENT ON COLUMN public.profile_values.value IS
  'jsonb scalar or array. Cast by the field_type of the referenced profile_fields row.';

-- Primary read pattern: every value for one profile, in one indexed scan.
CREATE INDEX IF NOT EXISTS idx_profile_values_profile
  ON public.profile_values(profile_id);

-- Reverse lookup: "which profiles have a value for this field".
CREATE INDEX IF NOT EXISTS idx_profile_values_field
  ON public.profile_values(field_id);

-- Scalar equality filter, e.g. equipment.owns_studio = true.
-- `value #>> '{}'` extracts a jsonb scalar as text.
CREATE INDEX IF NOT EXISTS idx_profile_values_field_text
  ON public.profile_values(field_id, (value #>> '{}'));

-- Containment queries on array-valued fields (multi_select, json).
CREATE INDEX IF NOT EXISTS idx_profile_values_value_gin
  ON public.profile_values USING gin (value jsonb_path_ops);

DROP TRIGGER IF EXISTS set_profile_values_updated_at ON public.profile_values;
CREATE TRIGGER set_profile_values_updated_at
  BEFORE UPDATE ON public.profile_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── profile_layouts ─────────────────────────────────────────────────────────
-- Placement and ordering of already-defined sections. The layout jsonb contains
-- ONLY profile_sections.key strings inside named slots. It contains no markup,
-- no component source, no styles. Unknown keys are ignored at render time.
CREATE TABLE IF NOT EXISTS public.profile_layouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type_id uuid NOT NULL REFERENCES public.profile_types(id) ON DELETE CASCADE,

  -- Which surface this layout describes:
  --   'public' = /{route_prefix}/[handle]
  --   'edit'   = /profile/me
  --   'card'   = explore grid card
  variant         text NOT NULL DEFAULT 'public'
                    CHECK (variant IN ('public', 'edit', 'card')),

  -- { "main": ["bio","portfolio"], "sidebar": ["experience"] }
  layout          jsonb NOT NULL DEFAULT '{}'::jsonb,

  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (profile_type_id, variant)
);

COMMENT ON TABLE public.profile_layouts IS
  'Profile Architecture V2: section ORDERING only. Deliberately not a page builder — contains no markup, styles, or component definitions.';

CREATE INDEX IF NOT EXISTS idx_profile_layouts_type
  ON public.profile_layouts(profile_type_id, is_active);

DROP TRIGGER IF EXISTS set_profile_layouts_updated_at ON public.profile_layouts;
CREATE TRIGGER set_profile_layouts_updated_at
  BEFORE UPDATE ON public.profile_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Explicit, same reason as 20260806_01/03: this project's default privileges
-- do not auto-apply to new public tables.
--
-- profile_layouts is ordering config only (no owner-gated rows), so it gets
-- the same open grant as profile_types/profile_sections/profile_fields.
--
-- profile_values is different and DELIBERATELY narrower: it is the only V2
-- table holding real user data, and 20260806_07_dynamic_profile_rls.sql
-- already grants anon/authenticated SELECT on it in the SAME file that
-- enables its visibility-gated RLS policies (public/authenticated/owner/admin
-- per section). Granting anon/authenticated here, before RLS exists, would be
-- unrestricted read access to every profile's dynamic values with zero row
-- filtering. service_role is granted now because the app already reads this
-- table exclusively through adminClient (server-only) — nothing today queries
-- it as anon/authenticated.
GRANT SELECT ON public.profile_layouts TO anon, authenticated, service_role;
GRANT SELECT ON public.profile_values  TO service_role;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.profile_values') IS NULL
     OR to_regclass('public.profile_layouts') IS NULL THEN
    RAISE EXCEPTION '20260806_04 failed: value/layout tables missing';
  END IF;
  RAISE NOTICE 'OK 20260806_04: profile_values + profile_layouts created';
END $$;

-- ─── Verification: table existence (PostgreSQL ground truth) ────────────────
SELECT to_regclass('public.profile_values')  AS profile_values_table,
       to_regclass('public.profile_layouts') AS profile_layouts_table;

SELECT schemaname, tablename
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN ('profile_values', 'profile_layouts');

-- ─── Verification: FK chain ───────────────────────────────────────────────────
SELECT
  tc.table_name        AS child_table,
  kcu.column_name       AS fk_column,
  ccu.table_name         AS references_table,
  ccu.column_name        AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profile_values', 'profile_layouts')
ORDER BY tc.table_name;

-- ─── Verification: grant scope is correct (values narrower than layouts) ────
SELECT table_name, grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name IN ('profile_values', 'profile_layouts')
   AND grantee IN ('anon', 'authenticated', 'service_role')
 ORDER BY table_name, grantee;

-- ─── PostgREST cache ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Post-NOTIFY PostgREST-side checks (service-role REST):
--   GET /profile_layouts?select=id&limit=1  -> expect 200 (empty until 08 seeds it)
--   GET /profile_values?select=id&limit=1   -> expect 200 (empty, no values written yet)
-- Anon-role check (expected to differ between the two tables):
--   GET /profile_layouts?select=id&limit=1  with anon key -> expect 200
--   GET /profile_values?select=id&limit=1   with anon key -> expect 401/403 until
--     migration 07 grants + RLS land. That is CORRECT, not a bug.
