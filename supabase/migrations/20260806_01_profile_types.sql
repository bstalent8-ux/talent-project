-- ============================================================
-- 20260806_01_profile_types.sql
-- Profile Architecture V2 — Phase 1, step 1 of 7: type registry.
--
-- Creates the registry of supported profile types. Nothing reads this table
-- yet; it is the anchor every other V2 table hangs off.
--
-- ADDITIVE ONLY. No existing table, column, constraint or policy is modified.
-- Idempotent. Paste into the Supabase SQL editor.
--
-- NOTE: an unrelated `talent_types` table already exists (talent CATEGORY
-- taxonomy, from 20260723_dynamic_packages_subscriptions.sql). `profile_types`
-- is a different concept — the kind of ACCOUNT, not the kind of talent.
-- Do not conflate them.
-- ============================================================

-- Reuse the existing shared updated_at helper. Redefined idempotently here so
-- this file can be run standalone against a fresh database.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Table ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_types (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stable machine key. This — not the uuid — is what code and the shadow
  -- column bookings.provider_type reference. Never change a slug in place.
  slug         text NOT NULL UNIQUE,

  -- Internal English name for the admin UI / logs.
  name         text NOT NULL,
  -- Internal note for admins. Not user-facing.
  description  text,

  -- User-facing bilingual labels (CLAUDE.md §15.5: every user-facing string
  -- needs both ar and en).
  name_ar      text,
  name_en      text,

  -- ── Forward-compat columns, unused in Phase 1 ─────────────────────────────
  -- Populated now because these tables are empty today; adding them later
  -- means ALTERing a table that already holds production config.

  -- Typed table holding this type's core marketplace columns.
  -- NULL = shared profiles row only.
  core_table   text,
  -- Key into the Phase 2 TypeScript provider registry.
  provider_key text,
  -- Can this type receive bookings/briefs? Drives Phase 5 booking routing.
  is_bookable  boolean NOT NULL DEFAULT false,
  -- Public URL prefix, e.g. 'talent' -> /talent/[handle]. Unique so the
  -- Phase 4 route resolver can never produce a collision.
  route_prefix text UNIQUE,

  is_active    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_types_slug_format CHECK (slug ~ '^[a-z][a-z0-9_]*$')
);

COMMENT ON TABLE  public.profile_types IS
  'Profile Architecture V2: registry of account profile types (talent, brand, agency). Not to be confused with talent_types, which is a talent category taxonomy.';
COMMENT ON COLUMN public.profile_types.slug IS
  'Stable machine key referenced by application code and by bookings.provider_type. Immutable once seeded.';
COMMENT ON COLUMN public.profile_types.core_table IS
  'Phase 2+: name of the strongly typed table holding this type''s core columns.';
COMMENT ON COLUMN public.profile_types.is_bookable IS
  'Phase 5: whether this profile type can be the provider side of a booking.';

CREATE INDEX IF NOT EXISTS idx_profile_types_active
  ON public.profile_types(is_active, sort_order);

DROP TRIGGER IF EXISTS set_profile_types_updated_at ON public.profile_types;
CREATE TRIGGER set_profile_types_updated_at
  BEFORE UPDATE ON public.profile_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Seed ────────────────────────────────────────────────────────────────────
-- talent + brand mirror what ships today.
-- agency is seeded as INACTIVE: the agency_profiles table does not exist yet,
-- so nothing must be able to select it until Phase 5. Seeding it now proves the
-- registry is genuinely extensible without a schema change.
INSERT INTO public.profile_types
  (slug, name, description, name_ar, name_en, core_table, provider_key, is_bookable, route_prefix, is_active, sort_order)
VALUES
  ('talent', 'Talent', 'Individual creators: models, influencers, UGC creators, hosts.',
   'موهبة', 'Talent', 'talent_profiles', 'talent', true,  'talent', true,  10),
  ('brand',  'Brand',  'Companies booking talents and posting jobs.',
   'علامة تجارية', 'Brand', 'brand_profiles', 'brand',  false, 'brand',  true,  20),
  ('agency', 'Agency', 'Phase 5 placeholder. INACTIVE — agency_profiles does not exist yet.',
   'وكالة', 'Agency', NULL, 'agency', true,  'agency', false, 30)
ON CONFLICT (slug) DO UPDATE
  SET name         = EXCLUDED.name,
      description  = EXCLUDED.description,
      name_ar      = EXCLUDED.name_ar,
      name_en      = EXCLUDED.name_en,
      core_table   = EXCLUDED.core_table,
      provider_key = EXCLUDED.provider_key,
      is_bookable  = EXCLUDED.is_bookable,
      route_prefix = EXCLUDED.route_prefix,
      sort_order   = EXCLUDED.sort_order;
      -- is_active deliberately NOT overwritten: re-running this file must never
      -- silently re-activate a type an admin has switched off.

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Public config, safe to read. Writes are service-role only (no write policy).
ALTER TABLE public.profile_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_types public read" ON public.profile_types;
CREATE POLICY "profile_types public read" ON public.profile_types
  FOR SELECT USING (is_active = true);

-- ─── Grant ───────────────────────────────────────────────────────────────────
-- Explicit because this project's default privileges were confirmed NOT to
-- auto-apply to new public tables: profile_types was invisible to PostgREST
-- (PGRST205) after creation even though RLS + policy above were correct. RLS
-- restricts ROWS; it does not substitute for a table-level GRANT.
GRANT SELECT ON public.profile_types TO anon, authenticated, service_role;

-- ─── Verification ────────────────────────────────────────────────────────────
-- Expect 3 rows, with agency inactive.
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.profile_types;
  IF n < 3 THEN
    RAISE EXCEPTION 'profile_types seed failed: expected >= 3 rows, found %', n;
  END IF;
  RAISE NOTICE 'OK 20260806_01: profile_types has % rows', n;
END $$;

-- ─── Verification: table existence (PostgreSQL ground truth) ────────────────
SELECT to_regclass('public.profile_types') AS profile_types_table;

SELECT schemaname, tablename
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename = 'profile_types';

-- ─── PostgREST cache ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
