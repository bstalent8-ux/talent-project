-- ============================================================================
-- 20260801_p0_schema_sync_supplement.sql
-- P0 production schema drift supplement.
--
-- The 2026-07 migrations introduce the booking request, notification, package,
-- subscription, and usage systems. A production audit also found a few direct
-- compatibility columns expected by deployed code/admin tooling but not covered
-- by those migration files. This migration is idempotent and safe to re-run.
-- ============================================================================

BEGIN;

-- Booking list/detail code reads currency directly from bookings in some paths.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EGP';

UPDATE public.bookings
   SET currency = 'EGP'
 WHERE currency IS NULL;

-- Direct package metadata columns used by earlier package payloads/admin tools.
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS slug       text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audience   text NOT NULL DEFAULT 'talent',
  ADD COLUMN IF NOT EXISTS features   jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.packages
   SET slug = trim(both '-' from lower(regexp_replace(coalesce(name, 'package'), '[^a-zA-Z0-9]+', '-', 'g')))
              || '-' || left(id::text, 8)
 WHERE slug IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_audience_check'
  ) THEN
    ALTER TABLE public.packages
      ADD CONSTRAINT packages_audience_check
      CHECK (audience IN ('talent', 'brand', 'user', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_packages_audience_active
  ON public.packages(audience, is_active, sort_order);

-- Compatibility columns for subscription consumers that address package and
-- billing period directly instead of resolving through package_plans.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end   timestamptz;

UPDATE public.subscriptions s
   SET package_id = pp.package_id
  FROM public.package_plans pp
 WHERE s.plan_id = pp.id
   AND s.package_id IS NULL;

UPDATE public.subscriptions
   SET current_period_start = starts_at
 WHERE current_period_start IS NULL;

UPDATE public.subscriptions
   SET current_period_end = expires_at
 WHERE current_period_end IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_package_status
  ON public.subscriptions(package_id, status);

COMMIT;
