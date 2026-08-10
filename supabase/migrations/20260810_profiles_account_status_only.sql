-- ============================================================
-- 20260810_profiles_account_status_only.sql
-- Scoped extract of 20260727_fix_schema_drift.sql § 2 ONLY.
--
-- 20260727_fix_schema_drift.sql was never applied to this project and bundles
-- 5 unrelated concerns (bookings columns, profiles.account_status, brand
-- listing, community timestamps, deliverables table). Only the profiles
-- account-status group is in scope here — it's what findIdentityByHandle()'s
-- SHARED_COLUMNS select and middleware.ts's own select both require
-- (middleware.ts:89 selects "account_status, block_reason" together; the
-- admin block route at app/api/admin/users/[profileId]/status/route.ts:31-45
-- writes blocked_at/blocked_by/block_reason as the same group). Splitting
-- account_status out alone would still leave that middleware select failing.
--
-- The other 4 sections of 20260727 remain unapplied and out of scope for this
-- migration on purpose — do not fold them in here.
--
-- Idempotent — safe to re-run. No new GRANT required: profiles already has
-- base SELECT grants (existing columns resolve via PostgREST today); adding a
-- column to an already-granted table needs no re-grant.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS blocked_at     timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_by     uuid,
  ADD COLUMN IF NOT EXISTS block_reason   text;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

UPDATE public.profiles SET account_status = 'active' WHERE account_status IS NULL;

-- Keep the legacy is_suspended flag consistent, same as the source migration.
-- No-op today: every row lands on the 'active' default, so nothing currently
-- has 'blocked'/'suspended'/'rejected' to sync.
UPDATE public.profiles
   SET is_suspended = true
 WHERE account_status IN ('blocked', 'suspended', 'rejected')
   AND is_suspended IS DISTINCT FROM true;

-- ─── Verification: columns exist (PostgreSQL ground truth) ──────────────────
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'profiles'
   AND column_name IN ('account_status', 'blocked_at', 'blocked_by', 'block_reason');

-- ─── Verification: every row has a valid value, no unexpected NULLs ─────────
SELECT account_status, count(*) AS n
  FROM public.profiles
 GROUP BY account_status
 ORDER BY account_status;

-- Expect 0 rows.
SELECT id FROM public.profiles WHERE account_status IS NULL;

-- ─── PostgREST cache ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Post-NOTIFY PostgREST-side checks (run via service-role REST, not SQL Editor):
--   GET /profiles?select=account_status,block_reason&limit=1        (middleware's exact select)
--   GET /profiles?select=account_status,blocked_at,blocked_by,block_reason,profile_type_id,profile_types(slug)&handle=eq.e2e-talent
--     (findIdentityByHandle's SHARED_WITH_TYPE select, minus the columns migration 03+ still owes)
-- Both expect 200, not 42703.
