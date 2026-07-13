import { NextResponse } from "next/server";

const SQL = `
-- ═══════════════════════════════════════════════════════════════════
-- Marketplace Workflow Migration — run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add missing columns to bookings ─────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS job_id             uuid REFERENCES public.jobs(id)             ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_type       text,
  ADD COLUMN IF NOT EXISTS talent_user_id     uuid REFERENCES public.profiles(id)         ON DELETE SET NULL;

-- 2. booking_briefs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_briefs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  description   text,
  requirements  text,
  attachments   text[],
  deadline      date,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected')),
  reject_reason text,
  created_at    timestamptz DEFAULT now(),
  responded_at  timestamptz,
  UNIQUE(booking_id)
);

ALTER TABLE public.booking_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "briefs_select" ON public.booking_briefs;
CREATE POLICY "briefs_select" ON public.booking_briefs FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE brand_id = auth.uid()
         OR talent_user_id = auth.uid()
         OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "briefs_insert" ON public.booking_briefs;
CREATE POLICY "briefs_insert" ON public.booking_briefs FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE brand_id = auth.uid()));

DROP POLICY IF EXISTS "briefs_update" ON public.booking_briefs;
CREATE POLICY "briefs_update" ON public.booking_briefs FOR UPDATE
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE brand_id = auth.uid()
         OR talent_user_id = auth.uid()
         OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  );

-- 3. deliverables ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deliverables (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  submitted_by uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  files        text[],
  links        text[],
  notes        text,
  status       text        NOT NULL DEFAULT 'submitted'
               CHECK (status IN ('submitted','approved','revision_requested')),
  feedback     text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliverables_select" ON public.deliverables;
CREATE POLICY "deliverables_select" ON public.deliverables FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE brand_id = auth.uid()
         OR talent_user_id = auth.uid()
         OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "deliverables_insert" ON public.deliverables;
CREATE POLICY "deliverables_insert" ON public.deliverables FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "deliverables_update" ON public.deliverables;
CREATE POLICY "deliverables_update" ON public.deliverables FOR UPDATE
  USING (booking_id IN (SELECT id FROM public.bookings WHERE brand_id = auth.uid()));

-- 4. payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid          NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount     numeric(10,2) NOT NULL,
  status     text          NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','paid','refunded')),
  paid_at    timestamptz,
  created_at timestamptz   DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE brand_id = auth.uid()
         OR talent_user_id = auth.uid()
         OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE brand_id = auth.uid()));

-- 5. Allow brand to update/add reviews ────────────────────────────────
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE
  USING (brand_id = auth.uid());

-- Done ✓
SELECT 'Marketplace migration complete' AS result;
`;

export async function GET() {
  return new NextResponse(SQL, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
