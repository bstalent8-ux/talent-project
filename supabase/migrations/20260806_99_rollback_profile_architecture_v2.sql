-- ============================================================
-- 20260806_99_rollback_profile_architecture_v2.sql
-- Profile Architecture V2 — Phase 1 DOWN migration.
--
-- ⚠ DO NOT RUN THIS AS PART OF A NORMAL DEPLOY. ⚠
-- This file exists so Phase 1 is provably reversible. Run it only to abort
-- Phase 1.
--
-- Safe to run at any point during Phase 1, because Phase 1 adds nothing that
-- existing application code reads. After Phase 2 ships, this file is NO LONGER
-- SAFE — application code will depend on these tables by then.
--
-- What is destroyed:  the five V2 tables and any dynamic values in them.
-- What is preserved:  profiles, talent_profiles, brand_profiles, bookings and
--                     every column, row, index, constraint and policy that
--                     existed before Phase 1. Nothing pre-existing is dropped.
--
-- Idempotent.
-- ============================================================

-- ─── Step 1: triggers first, so nothing repopulates during teardown ─────────
DROP TRIGGER  IF EXISTS trg_sync_booking_provider ON public.bookings;
DROP TRIGGER  IF EXISTS trg_sync_profile_type     ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_booking_provider();
DROP FUNCTION IF EXISTS public.sync_profile_type_from_role();

-- ─── Step 2: the drift view (depends on the bookings shadow columns) ────────
DROP VIEW IF EXISTS public.booking_provider_drift;

-- ─── Step 3: bookings shadow columns ────────────────────────────────────────
-- bookings.talent_id, talent_user_id and their foreign keys are NOT touched.
-- Only the three columns added by 20260806_05 are removed.
DROP INDEX IF EXISTS public.idx_bookings_provider;
DROP INDEX IF EXISTS public.idx_bookings_provider_user;

ALTER TABLE public.bookings
  DROP COLUMN IF EXISTS provider_user_id,
  DROP COLUMN IF EXISTS provider_profile_id,
  DROP COLUMN IF EXISTS provider_type;

-- ─── Step 4: V2 tables, child-first ─────────────────────────────────────────
-- ⚠ DESTRUCTIVE: profile_values holds user-entered dynamic data. If any exists,
-- export it before running this file:
--   COPY (SELECT * FROM public.profile_values) TO STDOUT WITH CSV HEADER;
DROP TABLE IF EXISTS public.profile_values   CASCADE;
DROP TABLE IF EXISTS public.profile_fields   CASCADE;
DROP TABLE IF EXISTS public.profile_layouts  CASCADE;
DROP TABLE IF EXISTS public.profile_sections CASCADE;

-- ─── Step 5: the profiles seam ──────────────────────────────────────────────
-- Dropped BEFORE profile_types, because of the foreign key.
-- profiles.role is untouched and remains the sole type discriminator, exactly
-- as it was before Phase 1.
DROP INDEX IF EXISTS public.idx_profiles_profile_type;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS profile_type_id;

-- ─── Step 6: the registry ───────────────────────────────────────────────────
DROP TABLE IF EXISTS public.profile_types CASCADE;

-- public.set_updated_at() is deliberately NOT dropped: it predates Phase 1 and
-- is used by categories, packages, subscriptions and brand_profiles triggers.

-- ─── Verification ───────────────────────────────────────────────────────────
DO $$
DECLARE leftovers text[];
BEGIN
  SELECT array_agg(t) INTO leftovers FROM (
    SELECT unnest(ARRAY[
      'profile_types','profile_sections','profile_fields','profile_values','profile_layouts'
    ]) AS t
  ) x WHERE to_regclass('public.' || x.t) IS NOT NULL;

  IF leftovers IS NOT NULL THEN
    RAISE EXCEPTION 'rollback incomplete, still present: %', leftovers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'bookings'
       AND column_name IN ('provider_type','provider_profile_id','provider_user_id')
  ) THEN
    RAISE EXCEPTION 'rollback incomplete: bookings shadow columns still present';
  END IF;

  -- Assert the pre-Phase-1 world is intact.
  IF to_regclass('public.talent_profiles') IS NULL
     OR to_regclass('public.brand_profiles') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='bookings' AND column_name='talent_id'
     ) THEN
    RAISE EXCEPTION 'ROLLBACK DAMAGED PRE-EXISTING SCHEMA — investigate immediately';
  END IF;

  RAISE NOTICE 'OK: Profile Architecture V2 Phase 1 fully rolled back. Pre-existing schema intact.';
END $$;
