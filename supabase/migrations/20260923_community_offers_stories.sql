-- Phase 1 of the Jobs -> Community restructure (see the "Community Restructure
-- Plan" report). Deliberately does NOT touch `jobs` / `job_applications` or
-- the bookings.job_id / bookings.job_application_id FKs at all — the
-- apply -> accept -> booking conversion on a job stays exactly as it is
-- today, zero risk to that pipeline. The standalone /jobs PAGE goes away in
-- a later phase (UI-only); its data and booking-conversion logic keep living
-- in these same jobs/job_applications tables, just rendered from within the
-- Community page.
--
-- What's genuinely new here: two content types that don't exist yet.
--   - "offer" — the REVERSE of a job: a talent posts a limited-time
--     package, brands apply to it (community_post_applications, brand_id
--     is the applicant instead of talent_id).
--   - "story" — a 24-hour ephemeral post. No cron/scheduled delete needed:
--     every read already filters `expires_at > now()`, so an unexpired-but-
--     unread story simply stops being returned once its time is up; actual
--     row cleanup can happen later on a periodic pass, same posture as
--     other "not a correctness requirement" cleanup in this codebase.
--
-- `community_questions` is untouched — the existing Q&A keeps working as-is.
--
-- Idempotent — safe to paste more than once.

CREATE TABLE IF NOT EXISTS public.community_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type    text        NOT NULL CHECK (post_type IN ('offer', 'story')),
  title        text,
  content      text,
  price        numeric,
  category     text,
  media_url    text,
  status       text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  -- Stories: always created_at + 24h, set by the app at insert time.
  -- Offers: the talent's own chosen "apply by" date — nullable means open-ended.
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id    ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type  ON public.community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_expires_at ON public.community_posts(expires_at);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts_public_read" ON public.community_posts;
CREATE POLICY "community_posts_public_read" ON public.community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_posts_owner_write" ON public.community_posts;
CREATE POLICY "community_posts_owner_write" ON public.community_posts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Applications to an offer — a brand applying to a talent's post,
--     symmetric to job_applications but with the roles swapped. ───────────
CREATE TABLE IF NOT EXISTS public.community_post_applications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid        NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  brand_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message         text,
  proposed_price  numeric,
  reject_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_post_apps_post_id  ON public.community_post_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_apps_brand_id ON public.community_post_applications(brand_id);

ALTER TABLE public.community_post_applications ENABLE ROW LEVEL SECURITY;

-- Only the applicant (brand) and the post owner (talent) can see an
-- application — never public, same posture as job_applications' manual
-- ownership checks (that table has no RLS at all; this one gets real RLS
-- since community_* already relies on it).
DROP POLICY IF EXISTS "community_post_apps_participants_read" ON public.community_post_applications;
CREATE POLICY "community_post_apps_participants_read" ON public.community_post_applications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = brand_id
    OR auth.uid() IN (SELECT user_id FROM public.community_posts WHERE id = post_id)
  );

DROP POLICY IF EXISTS "community_post_apps_brand_insert" ON public.community_post_applications;
CREATE POLICY "community_post_apps_brand_insert" ON public.community_post_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = brand_id);

-- Only the post owner (talent) accepts/rejects an application to their offer.
DROP POLICY IF EXISTS "community_post_apps_owner_update" ON public.community_post_applications;
CREATE POLICY "community_post_apps_owner_update" ON public.community_post_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.community_posts WHERE id = post_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.community_posts WHERE id = post_id));

-- ─── Additive, nullable FKs on bookings for traceability when a booking
--     comes from an accepted offer application — mirrors the existing
--     job_id/job_application_id columns exactly, does not touch them. ─────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS community_post_id uuid REFERENCES public.community_posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS community_post_application_id uuid REFERENCES public.community_post_applications(id) ON DELETE SET NULL;

DO $$
DECLARE
  posts_exists boolean;
  apps_exists boolean;
  fk1_exists boolean;
  fk2_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='community_posts') INTO posts_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='community_post_applications') INTO apps_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='community_post_id') INTO fk1_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='community_post_application_id') INTO fk2_exists;
  RAISE NOTICE 'community_offers_stories migration: community_posts = %, community_post_applications = %, bookings.community_post_id = %, bookings.community_post_application_id = %',
    posts_exists, apps_exists, fk1_exists, fk2_exists;
END $$;
