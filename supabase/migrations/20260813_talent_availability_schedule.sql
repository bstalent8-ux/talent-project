-- ============================================================
-- 20260813_talent_availability_schedule.sql
--
-- Adds a DEDICATED talent_profiles.availability_schedule column.
--
-- Confirmed live before writing this file: the column did not exist
-- (PostgREST 42703 on `select availability_schedule`), and the
-- `exec_sql` RPC referenced by app/api/admin/run-migration/route.ts does
-- not exist either — that admin route is stale and cannot self-apply
-- this. Per CLAUDE.md §6, this file must be pasted into the Supabase SQL
-- editor by a human; it is not auto-applied by CI or app code.
--
-- Prior to this migration, an earlier iteration of the Availability step
-- stored structured schedule detail inside the existing social_links
-- JSONB catch-all under the key "availability_schedule" (same pattern as
-- usage_addons/physical fields). That was a stopgap, not a design
-- decision — this migration promotes it to a real column and backfills
-- any such data, then strips the key out of social_links so the same
-- data is never held in two places at once.
--
-- talent_profiles.availability (text: "available"/"unavailable") is
-- untouched — it stays the on/off switch. This column only carries the
-- structured detail shown when it is "available":
--   { "timezone": "Africa/Cairo",
--     "dates": { "2026-08-16": [{ "start": "10:00", "end": "14:00" }] },
--     "exceptions": [] }
--
-- Idempotent — ADD COLUMN IF NOT EXISTS, backfill is bounded by
-- availability_schedule IS NULL, safe to re-run.
-- ============================================================

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS availability_schedule jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill from the social_links stopgap key, only where the column is
-- still at its default and social_links actually carries the key.
UPDATE public.talent_profiles
   SET availability_schedule = social_links->'availability_schedule'
 WHERE availability_schedule = '{}'::jsonb
   AND social_links ? 'availability_schedule';

-- Remove the stopgap key from social_links now that it lives in its own
-- column — prevents the same data existing in two places going forward.
UPDATE public.talent_profiles
   SET social_links = social_links - 'availability_schedule'
 WHERE social_links ? 'availability_schedule';

-- ─── Verification: column exists ──────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'talent_profiles'
   AND column_name  = 'availability_schedule';

-- ─── Verification: no row still carries the stopgap key ──────────────────
-- Expect 0 rows.
SELECT id FROM public.talent_profiles WHERE social_links ? 'availability_schedule';

-- ─── Verification: backfill overview ──────────────────────────────────────
SELECT
  count(*) AS total_talent_profiles,
  count(*) FILTER (WHERE availability_schedule <> '{}'::jsonb) AS with_schedule
FROM public.talent_profiles;

-- ─── PostgREST cache ───────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Post-NOTIFY PostgREST-side check (service-role REST):
--   GET /talent_profiles?select=id,availability_schedule&limit=1
--   -> expect 200, not 42703.
