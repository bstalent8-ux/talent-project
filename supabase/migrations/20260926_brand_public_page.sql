-- ─── Brand public page (2026-09-26) ─────────────────────────────────────────
-- Backs the redesigned /brand/[id] page. Hand-run in the Supabase SQL editor
-- (CLAUDE.md §6). Idempotent. Until it runs, the page reads these columns and
-- the brand_reviews table fault-tolerantly and falls back (default cover,
-- "—" for size/founded, industry as the only tag, preview reviews).

-- 1) Extra brand identity fields shown in the page hero / About card.
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS cover_url    text,
  ADD COLUMN IF NOT EXISTS tagline      text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS tags         text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_profiles_founded_year_check') THEN
    ALTER TABLE public.brand_profiles
      ADD CONSTRAINT brand_profiles_founded_year_check
      CHECK (founded_year IS NULL OR founded_year BETWEEN 1800 AND 2100);
  END IF;
END $$;

-- 2) Talents reviewing brands — the reverse of public.reviews (brand → talent).
--    One review per booking; only the booking's talent may write it (enforced
--    in the API route, since writes go through the service role).
CREATE TABLE IF NOT EXISTS public.brand_reviews (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         uuid        NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  brand_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating             smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  communication      smallint    CHECK (communication   BETWEEN 1 AND 5),
  professionalism    smallint    CHECK (professionalism BETWEEN 1 AND 5),
  payment            smallint    CHECK (payment         BETWEEN 1 AND 5),
  comment            text,
  status             text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_reviews_brand_idx ON public.brand_reviews (brand_id, status, created_at DESC);

-- Service-role only (same posture as notifications / user_events): RLS on, no
-- policies, so the anon key can neither read unmoderated rows nor write.
ALTER TABLE public.brand_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE 'brand_profiles extra columns: %', (
    SELECT string_agg(column_name, ', ') FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brand_profiles'
      AND column_name IN ('cover_url', 'tagline', 'company_size', 'founded_year', 'tags'));
  RAISE NOTICE 'brand_reviews exists: %', to_regclass('public.brand_reviews') IS NOT NULL;
END $$;
