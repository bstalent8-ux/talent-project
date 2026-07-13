export const runtime = 'edge';

import { NextResponse } from "next/server";

const SQL = `
-- ═══════════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Create table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.job_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID NOT NULL,
  talent_id      UUID NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, talent_id)
);

-- 2. Add/ensure all columns exist
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS message       TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS proposed_price NUMERIC;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS delivery_days  INTEGER;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS portfolio_links TEXT[];
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS reject_reason  TEXT;

-- 3. Fix status check constraint (drop old, add new with 'withdrawn')
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_status_check
  CHECK (status IN ('pending','accepted','rejected','withdrawn'));

-- 4. Fix FK on job_id → must reference jobs(id)
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_job_id_fkey;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- 5. Fix FK on talent_id → must reference profiles(id)
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_talent_id_fkey;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_talent_id_fkey
  FOREIGN KEY (talent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS job_applications_job_id_idx    ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS job_applications_talent_id_idx ON public.job_applications(talent_id);
CREATE INDEX IF NOT EXISTS job_applications_status_idx    ON public.job_applications(status);

-- 7. RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "talent sees own applications"     ON public.job_applications;
DROP POLICY IF EXISTS "brand sees job applications"      ON public.job_applications;
DROP POLICY IF EXISTS "talent inserts own application"   ON public.job_applications;
DROP POLICY IF EXISTS "brand updates application status" ON public.job_applications;
DROP POLICY IF EXISTS "talent updates own application"   ON public.job_applications;

CREATE POLICY "talent sees own applications"
  ON public.job_applications FOR SELECT
  USING (talent_id = auth.uid());

CREATE POLICY "brand sees job applications"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.brand_id = auth.uid())
  );

CREATE POLICY "talent inserts own application"
  ON public.job_applications FOR INSERT
  WITH CHECK (talent_id = auth.uid());

CREATE POLICY "brand updates application status"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.brand_id = auth.uid())
  );

CREATE POLICY "talent updates own application"
  ON public.job_applications FOR UPDATE
  USING (talent_id = auth.uid());
`;

export async function GET() {
  return new NextResponse(SQL, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}