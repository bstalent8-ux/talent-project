-- ============================================================
-- 20260806_05_booking_provider_shadow.sql
-- Profile Architecture V2 — Phase 1, step 5 of 7: booking shadow columns.
--
-- ★ THE HIGHEST-RISK FILE IN PHASE 1. READ BEFORE RUNNING. ★
--
-- bookings.talent_id is NOT replaced, NOT renamed, NOT made nullable, and NOT
-- dropped. Its foreign key to talent_profiles.id is untouched. Every existing
-- query, RLS policy, admin report, and the reviews rating trigger keep working
-- against it, unchanged, forever in this phase.
--
-- This file only ADDS three nullable shadow columns that mirror talent_id, so
-- that a future non-talent provider (agency, studio) can be booked without a
-- destructive migration on a live bookings table.
--
-- Nothing in the application reads or writes these columns in Phase 1.
--
-- ADDITIVE ONLY. Idempotent.
-- Depends on: 20260806_01_profile_types.sql
-- ============================================================

ALTER TABLE public.bookings
  -- Which kind of provider is on the other side of this booking.
  -- FK targets profile_types.slug (UNIQUE) rather than the uuid, so the column
  -- stays human-readable in ad-hoc SQL and admin exports.
  ADD COLUMN IF NOT EXISTS provider_type       text
    REFERENCES public.profile_types(slug) ON UPDATE CASCADE ON DELETE RESTRICT,

  -- The provider's row id in ITS OWN core table (talent_profiles.id today,
  -- agency_profiles.id later).
  --
  -- Deliberately NOT a foreign key: the target table varies by provider_type,
  -- and Postgres has no polymorphic FK. Integrity is enforced by
  -- trg_sync_booking_provider plus the booking_provider_drift view below,
  -- which must always return zero rows.
  ADD COLUMN IF NOT EXISTS provider_profile_id uuid,

  -- Denormalized owner, mirroring the existing bookings.talent_user_id
  -- convention from 20260727_fix_schema_drift.sql.
  ADD COLUMN IF NOT EXISTS provider_user_id    uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.bookings.provider_type IS
  'MIGRATION SHADOW COLUMN (Profile Architecture V2, Phase 1). Mirrors talent_id as provider_type=''talent''. Unused by application code until Phase 5. Do not read this in place of talent_id yet.';
COMMENT ON COLUMN public.bookings.provider_profile_id IS
  'MIGRATION SHADOW COLUMN. Equals talent_id for every talent booking — asserted by the booking_provider_drift view. Intentionally not a foreign key: the target table is polymorphic by provider_type.';
COMMENT ON COLUMN public.bookings.provider_user_id IS
  'MIGRATION SHADOW COLUMN. Mirrors talent_user_id for talent bookings.';

CREATE INDEX IF NOT EXISTS idx_bookings_provider
  ON public.bookings(provider_type, provider_profile_id);

CREATE INDEX IF NOT EXISTS idx_bookings_provider_user
  ON public.bookings(provider_user_id);

-- ─── Backfill: every existing booking is a talent booking ────────────────────
-- Bounded by `provider_type IS NULL`, so re-running is a no-op.
-- On a large bookings table, run this in batches instead (see the note below).
UPDATE public.bookings b
   SET provider_type       = 'talent',
       provider_profile_id = b.talent_id,
       provider_user_id    = COALESCE(
         b.talent_user_id,
         (SELECT tp.user_id FROM public.talent_profiles tp WHERE tp.id = b.talent_id)
       )
 WHERE b.provider_type IS NULL
   AND b.talent_id IS NOT NULL;

-- Batched variant for a large table — run repeatedly until it reports 0 rows:
--
--   WITH batch AS (
--     SELECT id FROM public.bookings
--      WHERE provider_type IS NULL AND talent_id IS NOT NULL
--      LIMIT 5000 FOR UPDATE SKIP LOCKED
--   )
--   UPDATE public.bookings b
--      SET provider_type = 'talent', provider_profile_id = b.talent_id,
--          provider_user_id = COALESCE(b.talent_user_id,
--            (SELECT tp.user_id FROM public.talent_profiles tp WHERE tp.id = b.talent_id))
--     FROM batch WHERE b.id = batch.id;

-- ─── Drift detector ──────────────────────────────────────────────────────────
-- MUST always return zero rows. Wire this into CI and a scheduled admin check.
-- A non-empty result means the shadow columns and talent_id have diverged and
-- Phase 5 cannot proceed.
--
-- security_invoker = true so the view respects the caller's RLS on bookings
-- rather than running with the view owner's privileges (which would leak every
-- booking row to anyone who can SELECT the view).
--
-- security_invoker requires PostgreSQL 15+. Supabase projects created in the
-- last few years are 15+; the block below degrades safely on 14 by creating the
-- view without the option and relying on the REVOKE further down instead.
DROP VIEW IF EXISTS public.booking_provider_drift;

DO $mig$
DECLARE
  body text := $body$
  SELECT
    b.id,
    b.status,
    b.talent_id,
    b.provider_type,
    b.provider_profile_id,
    b.talent_user_id,
    b.provider_user_id,
    CASE
      WHEN b.provider_type IS NULL                                  THEN 'missing_provider_type'
      WHEN b.provider_type = 'talent'
       AND b.talent_id IS DISTINCT FROM b.provider_profile_id       THEN 'talent_id_mismatch'
      WHEN b.provider_type = 'talent'
       AND b.talent_user_id IS NOT NULL
       AND b.provider_user_id IS DISTINCT FROM b.talent_user_id     THEN 'user_id_mismatch'
      WHEN b.provider_type <> 'talent' AND b.talent_id IS NOT NULL  THEN 'non_talent_with_talent_id'
      ELSE 'unknown'
    END AS drift_reason
  FROM public.bookings b
  -- A booking with no talent_id at all is pre-existing bad data, not V2 drift —
  -- it is excluded so this invariant only reports divergence this migration
  -- could have caused. Audit those rows separately:
  --   SELECT id, status FROM public.bookings WHERE talent_id IS NULL;
  WHERE (b.provider_type IS NULL AND b.talent_id IS NOT NULL)
     OR (b.provider_type =  'talent' AND b.talent_id      IS DISTINCT FROM b.provider_profile_id)
     -- Only a mismatch when talent_user_id is actually populated: the backfill
     -- resolves provider_user_id from talent_profiles when talent_user_id is
     -- NULL, and that is a fill-in, not a divergence.
     OR (b.provider_type = 'talent' AND b.talent_user_id IS NOT NULL
         AND b.provider_user_id IS DISTINCT FROM b.talent_user_id)
     OR (b.provider_type <> 'talent' AND b.talent_id      IS NOT NULL)
  $body$;
BEGIN
  IF current_setting('server_version_num')::integer >= 150000 THEN
    EXECUTE 'CREATE VIEW public.booking_provider_drift WITH (security_invoker = true) AS ' || body;
  ELSE
    RAISE WARNING 'PostgreSQL < 15: creating booking_provider_drift without security_invoker. Access is restricted by the REVOKE below — do not grant this view to anon or authenticated.';
    EXECUTE 'CREATE VIEW public.booking_provider_drift AS ' || body;
  END IF;
END $mig$;

COMMENT ON VIEW public.booking_provider_drift IS
  'Profile Architecture V2 invariant check. MUST return zero rows. Non-empty = shadow columns diverged from talent_id; block Phase 5 until resolved.';

-- Ops tooling, not a public surface.
REVOKE ALL ON public.booking_provider_drift FROM anon, authenticated;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE drift integer; total integer; orphan integer;
BEGIN
  SELECT count(*) INTO drift  FROM public.booking_provider_drift;
  SELECT count(*) INTO total  FROM public.bookings;
  SELECT count(*) INTO orphan FROM public.bookings WHERE talent_id IS NULL;

  RAISE NOTICE 'OK 20260806_05: % bookings, % drifted, % with NULL talent_id', total, drift, orphan;

  IF orphan > 0 THEN
    RAISE WARNING
      '% bookings have a NULL talent_id. Pre-existing data issue, not caused by this migration, but they were skipped by the backfill and must be resolved before Phase 5.', orphan;
  END IF;

  IF drift > 0 THEN
    RAISE EXCEPTION
      'booking_provider_drift returned % rows immediately after backfill. Do NOT proceed. Inspect: SELECT * FROM public.booking_provider_drift;', drift;
  END IF;
END $$;

-- ─── Verification: shadow columns exist on bookings ──────────────────────────
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'bookings'
   AND column_name IN ('provider_type', 'provider_profile_id', 'provider_user_id');

-- ─── Verification: view exists ────────────────────────────────────────────────
SELECT to_regclass('public.booking_provider_drift') AS drift_view;

-- ─── Verification: the REVOKE ALL on the view actually took (given this
-- project's default privileges grant ALL automatically on new objects,
-- confirmed by the 20260811 hardening migration) ─────────────────────────────
-- Expect ZERO rows for anon/authenticated. service_role rows are expected and correct.
SELECT table_name, grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name = 'booking_provider_drift'
 ORDER BY grantee, privilege_type;

-- ─── PostgREST cache ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Post-NOTIFY PostgREST-side checks (service-role REST):
--   GET /booking_provider_drift?select=id&limit=1  -> expect 200, empty array
-- Anon-role check (expected to fail, this is an ops-only view):
--   GET /booking_provider_drift?select=id&limit=1  with anon key -> expect 401/403
