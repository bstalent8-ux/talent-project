-- ═══════════════════════════════════════════════════════════════════════════
-- 20260727 — Close the drift between application code and the live database.
--
-- WHY: the live schema (project kjtppolajcwoovrwnoqs) is missing objects that
-- shipped application code already reads and writes. Verified against the live
-- REST API on 2026-07-27:
--
--   bookings.service_type        → missing → GET /api/bookings 400s (project
--   bookings.talent_user_id      → missing   list + detail pages are dead, and
--   bookings.job_id              → missing   the talent can never respond to a
--   bookings.job_application_id  → missing   brief / submit work / get paid)
--   profiles.account_status      → missing → middleware block gate silently
--   profiles.blocked_at/_by      → missing   no-ops; admin block/suspend 500s
--   profiles.block_reason        → missing
--   public.deliverables          → missing → deliverables step 404s
--   profiles.brand_category      → missing → /brands page 400s
--   community_questions.updated_at → missing → /community/question/[id] 400s
--   community_answers.updated_at   → missing   (renders as "Question not found")
--
-- Idempotent — safe to re-run. Paste into the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. bookings: marketplace workflow columns ──────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_type       text,
  ADD COLUMN IF NOT EXISTS talent_user_id     uuid REFERENCES public.profiles(id)         ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_id             uuid REFERENCES public.jobs(id)             ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_talent_user ON public.bookings(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_job         ON public.bookings(job_id);

-- Backfill talent_user_id for existing rows.
-- bookings.talent_id references talent_profiles.id, so resolve through it.
UPDATE public.bookings b
   SET talent_user_id = tp.user_id
  FROM public.talent_profiles tp
 WHERE b.talent_id = tp.id
   AND b.talent_user_id IS NULL;

-- ── 2. profiles: account-level status (middleware + admin block/suspend) ───
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS blocked_at     timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_by     uuid,
  ADD COLUMN IF NOT EXISTS block_reason   text;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

UPDATE public.profiles SET account_status = 'active' WHERE account_status IS NULL;

-- Keep the legacy is_suspended flag consistent with the new field, so the
-- public /explore and /home listings (which still filter on is_suspended)
-- stop showing accounts an admin has blocked.
UPDATE public.profiles
   SET is_suspended = true
 WHERE account_status IN ('blocked', 'suspended', 'rejected')
   AND is_suspended IS DISTINCT FROM true;

-- ── 3. profiles.brand_category (read by the public /brands listing) ────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_category text;

-- ── 4. community updated_at (read by /community/question/[id], written on edit)
ALTER TABLE public.community_questions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.community_answers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ── 5. deliverables ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deliverables (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  submitted_by uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  files        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  links        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  notes        text,
  feedback     text,
  status       text        NOT NULL DEFAULT 'submitted'
               CHECK (status IN ('submitted','approved','revision_requested')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_booking ON public.deliverables(booking_id);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Defence in depth only: the app reads/writes this through the service role
-- and enforces ownership in app/api/bookings/[id]/deliverables/route.ts.
DROP POLICY IF EXISTS "deliverables_select_participants" ON public.deliverables;
CREATE POLICY "deliverables_select_participants" ON public.deliverables FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
       WHERE brand_id = auth.uid()
          OR talent_user_id = auth.uid()
    )
  );
