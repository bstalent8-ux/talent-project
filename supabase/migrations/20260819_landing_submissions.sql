-- ============================================================
-- 20260819_landing_submissions.sql
--
-- Home page "Testimonials" and "Brand Moments" were 100% hardcoded fake
-- content (app/(main)/home/_components/landing/content.ts) — fabricated
-- names, quotes, and stock photos with nothing real behind them. This adds
-- two real, submit-then-moderate tables so the sections can be genuinely
-- user-submitted and admin-approved before going public, instead of either
-- staying fake or being silently removed.
--
-- One row = one submission. `submitter_id` is whoever submitted it (any
-- authenticated user — brand or talent). Public SELECT only sees
-- status='approved'; the submitter can also see their own row regardless of
-- status (so they can tell it's pending, not lost). Admin reads/writes go
-- through adminClient (service role) per CLAUDE.md §8/§9 — these policies
-- are defence in depth, not the primary gate.
--
-- Idempotent — CREATE TABLE/INDEX/POLICY IF NOT EXISTS, safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.landing_testimonials (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  submitter_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote            text        NOT NULL,
  author_name      text        NOT NULL,
  author_role      text,
  company          text,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  sort_order       int         NOT NULL DEFAULT 0,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES public.profiles(id),
  rejection_reason text
);

CREATE INDEX IF NOT EXISTS idx_landing_testimonials_status
  ON public.landing_testimonials(status);
CREATE INDEX IF NOT EXISTS idx_landing_testimonials_submitter_id
  ON public.landing_testimonials(submitter_id);

ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landing_testimonials_select_approved" ON public.landing_testimonials;
CREATE POLICY "landing_testimonials_select_approved"
  ON public.landing_testimonials FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "landing_testimonials_select_own" ON public.landing_testimonials;
CREATE POLICY "landing_testimonials_select_own"
  ON public.landing_testimonials FOR SELECT
  USING (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "landing_testimonials_insert_own" ON public.landing_testimonials;
CREATE POLICY "landing_testimonials_insert_own"
  ON public.landing_testimonials FOR INSERT
  WITH CHECK (auth.uid() = submitter_id);

CREATE TABLE IF NOT EXISTS public.landing_brand_moments (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  submitter_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  location         text,
  image_url        text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  sort_order       int         NOT NULL DEFAULT 0,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES public.profiles(id),
  rejection_reason text
);

CREATE INDEX IF NOT EXISTS idx_landing_brand_moments_status
  ON public.landing_brand_moments(status);
CREATE INDEX IF NOT EXISTS idx_landing_brand_moments_submitter_id
  ON public.landing_brand_moments(submitter_id);

ALTER TABLE public.landing_brand_moments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landing_brand_moments_select_approved" ON public.landing_brand_moments;
CREATE POLICY "landing_brand_moments_select_approved"
  ON public.landing_brand_moments FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "landing_brand_moments_select_own" ON public.landing_brand_moments;
CREATE POLICY "landing_brand_moments_select_own"
  ON public.landing_brand_moments FOR SELECT
  USING (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "landing_brand_moments_insert_own" ON public.landing_brand_moments;
CREATE POLICY "landing_brand_moments_insert_own"
  ON public.landing_brand_moments FOR INSERT
  WITH CHECK (auth.uid() = submitter_id);

-- NOTE: CLAUDE.md §10.4 documents a `notification_types` canonical registry
-- table, but it doesn't actually exist on this DB (confirmed: 42P01 on
-- INSERT) — the doc is aspirational here. Nothing in app code reads that
-- table (grepped lib/notifications/*), so skipping it is safe; the two new
-- types work purely from lib/notifications/types.ts's NOTIFICATION_TYPES.

-- ─── Verification: tables + RLS exist ─────────────────────────────────────
-- (information_schema.tables has no row_security column on this Postgres
-- version — pg_tables.rowsecurity is the real source for RLS on/off.)
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN ('landing_testimonials', 'landing_brand_moments');

SELECT tablename, policyname, cmd FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('landing_testimonials', 'landing_brand_moments');

-- ─── PostgREST cache ───────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
