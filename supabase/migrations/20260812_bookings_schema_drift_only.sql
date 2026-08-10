-- ============================================================
-- 20260812_bookings_schema_drift_only.sql
-- Scoped extract of 20260727_fix_schema_drift.sql § 1 ONLY.
--
-- Prerequisite for 20260806_05_booking_provider_shadow.sql, which failed with
-- `42703: column b.talent_user_id does not exist` — its backfill reads
-- bookings.talent_user_id directly. service_type/job_id/job_application_id
-- are not referenced by migration 05 itself, but are included here (not in a
-- separate migration) because they are the same original ALTER TABLE
-- statement and are actively read/written by 13 live route handlers today
-- (app/api/bookings/**, app/(main)/bookings/**, job application flow) per
-- 20260727's own header — GET /api/bookings 400s without them right now.
-- Confirmed live: neither jobs nor job_applications (the FK targets) are
-- missing, both exist.
--
-- The other 4 sections of 20260727 (profiles.account_status — already handled
-- separately in 20260810_profiles_account_status_only.sql — plus
-- brand_category, community_*.updated_at, deliverables) remain OUT of scope
-- and unapplied on purpose.
--
-- Idempotent — every ADD COLUMN is IF NOT EXISTS, backfill is bounded by
-- talent_user_id IS NULL, safe to re-run.
-- No new GRANT required: bookings already has base grants (existing columns
-- resolve via PostgREST today); adding columns to an already-granted table
-- needs no re-grant, same precedent as migration 02/20260810.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_type       text,
  ADD COLUMN IF NOT EXISTS talent_user_id     uuid REFERENCES public.profiles(id)         ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_id             uuid REFERENCES public.jobs(id)             ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_talent_user ON public.bookings(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_job         ON public.bookings(job_id);

-- Backfill talent_user_id for existing rows only. bookings.talent_id
-- references talent_profiles.id, so resolve through it. Does not touch
-- service_type/job_id/job_application_id — those have no legacy source to
-- backfill from and stay NULL on existing rows, exactly as the source file
-- intended (they're populated going forward by the booking-creation routes).
UPDATE public.bookings b
   SET talent_user_id = tp.user_id
  FROM public.talent_profiles tp
 WHERE b.talent_id = tp.id
   AND b.talent_user_id IS NULL;

-- ─── Verification: columns exist ─────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'bookings'
   AND column_name IN ('service_type', 'talent_user_id', 'job_id', 'job_application_id');

-- ─── Verification: FK targets ─────────────────────────────────────────────────
SELECT
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
  AND tc.table_name   = 'bookings'
  AND kcu.column_name IN ('talent_user_id', 'job_id', 'job_application_id')
ORDER BY kcu.column_name;

-- ─── Verification: backfill correctness — no orphans, no unwanted overwrite ──
-- Every booking with a resolvable talent_id must now have talent_user_id set.
-- Expect 0 rows (bookings whose talent_id no longer resolves to a talent_profiles row
-- are a pre-existing data issue, not caused by this migration — reported, not fixed here).
SELECT b.id, b.talent_id
  FROM public.bookings b
  LEFT JOIN public.talent_profiles tp ON tp.id = b.talent_id
 WHERE b.talent_id IS NOT NULL
   AND tp.id IS NOT NULL
   AND b.talent_user_id IS NULL;

-- Sanity: talent_user_id must equal talent_profiles.user_id for every backfilled row.
-- Expect 0 rows.
SELECT b.id, b.talent_user_id, tp.user_id AS expected
  FROM public.bookings b
  JOIN public.talent_profiles tp ON tp.id = b.talent_id
 WHERE b.talent_user_id IS DISTINCT FROM tp.user_id;

-- Overview: how many bookings exist, how many got backfilled, how many still NULL
-- (talent_id NULL or unresolvable — pre-existing, not this migration's job).
SELECT
  count(*) AS total_bookings,
  count(*) FILTER (WHERE talent_user_id IS NOT NULL) AS backfilled,
  count(*) FILTER (WHERE talent_user_id IS NULL)      AS still_null
FROM public.bookings;

-- ─── PostgREST cache ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Post-NOTIFY PostgREST-side check (service-role REST):
--   GET /bookings?select=id,service_type,talent_user_id,job_id,job_application_id&limit=1
--   -> expect 200, not 42703.
