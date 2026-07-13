-- ============================================================
-- 002_full_admin_system.sql
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. REVIEWS: add moderation + proof fields ───────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status       text        NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS proof_link   text,
  ADD COLUMN IF NOT EXISTS review_type  text        DEFAULT 'brand'
    CHECK (review_type IN ('ugc', 'brand', 'collaboration')),
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid        REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Only approved reviews appear publicly (drop old open policy first)
DROP POLICY IF EXISTS "reviews_select_public"         ON public.reviews;
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- ─── 2. BOOKINGS: full pipeline status machine ──────────────
-- Drop old constraint, add new pipeline states
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add pipeline metadata columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS brief_url    text,
  ADD COLUMN IF NOT EXISTS notes        text,
  ADD COLUMN IF NOT EXISTS amount       numeric(10,2),
  ADD COLUMN IF NOT EXISTS paid_at      timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add new constraint with full pipeline
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'contacting','brief_sent','accepted',
    'payment_pending','in_progress','completed','paid','cancelled'
  ));

-- Migrate old statuses → new pipeline
UPDATE public.bookings SET status = 'contacting' WHERE status = 'pending';
UPDATE public.bookings SET status = 'completed'  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- ─── 3. BOOKING HISTORY: audit trail for transitions ────────
CREATE TABLE IF NOT EXISTS public.booking_history (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id  uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status   text        NOT NULL,
  changed_by  uuid        REFERENCES public.profiles(id),
  note        text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id
  ON public.booking_history(booking_id);

ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_history_select" ON public.booking_history;
CREATE POLICY "booking_history_select"
  ON public.booking_history FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE brand_id = auth.uid()
         OR talent_id IN (
              SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()
            )
    )
  );

-- ─── 4. PROFILES: brand approval + is_verified + balance ────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_status          text    DEFAULT 'approved'
    CHECK (brand_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS tax_document_url      text,
  ADD COLUMN IF NOT EXISTS brand_approved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS brand_approved_by     uuid,
  ADD COLUMN IF NOT EXISTS brand_rejection_reason text,
  ADD COLUMN IF NOT EXISTS is_verified           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at           timestamptz,
  ADD COLUMN IF NOT EXISTS balance               numeric(10,2) NOT NULL DEFAULT 0;

-- Set brand_status = approved for all existing rows that have none yet
-- (application code only reads brand_status for brand-role profiles, so this is safe)
UPDATE public.profiles
  SET brand_status = 'approved'
  WHERE brand_status IS NULL;

-- Simple index on brand_status — no role filter to avoid enum/immutability issues
-- Note: brands are stored with role = 'client' in this platform
CREATE INDEX IF NOT EXISTS idx_profiles_brand_status
  ON public.profiles(brand_status);

-- ─── 5. TALENT VERIFICATIONS: verification request table ────
CREATE TABLE IF NOT EXISTS public.talent_verifications (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_document_url  text,
  selfie_url       text,
  social_proof     text,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  submitted_at     timestamptz DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES public.profiles(id),
  rejection_reason text
);

CREATE INDEX IF NOT EXISTS idx_talent_verifications_talent_id
  ON public.talent_verifications(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_verifications_status
  ON public.talent_verifications(status);

ALTER TABLE public.talent_verifications ENABLE ROW LEVEL SECURITY;

-- Talents can view and submit their own verification requests
DROP POLICY IF EXISTS "verifications_talent_select"  ON public.talent_verifications;
CREATE POLICY "verifications_talent_select"
  ON public.talent_verifications FOR SELECT
  USING (talent_id = auth.uid());

DROP POLICY IF EXISTS "verifications_talent_insert"  ON public.talent_verifications;
CREATE POLICY "verifications_talent_insert"
  ON public.talent_verifications FOR INSERT
  WITH CHECK (talent_id = auth.uid());

-- ─── 6. RLS: brands only post campaigns if approved ─────────
-- (Enforced server-side via adminClient checks — no separate policy needed
--  since campaign/booking INSERT checks are done in API routes)

-- ============================================================
-- DONE. Verify with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'reviews' ORDER BY ordinal_position;
-- ============================================================
