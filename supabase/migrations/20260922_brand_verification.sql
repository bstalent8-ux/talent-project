-- ─── Brand verification: self-serve type + evidence photos ──────────────────
-- Closes a real gap found 2026-09-22: `profiles.brand_status` (pending/
-- approved/rejected) already gates a brand's public visibility, and an admin
-- can already flip it from /admin/brands — but with ZERO evidence. No UI
-- anywhere let a brand submit a business type or any document/photo, and
-- `profiles.tax_document_url` (selected by fetchAdminBrandsPage, shown as a
-- link in BrandsTable.tsx) had no writer either. This migration adds the one
-- column tax_document_url's shape didn't cover — a small photo gallery
-- (storefront / proof-of-business shots) alongside it — plus a demand-log
-- table for a brand that doesn't fit any existing category, mirroring
-- talent_type_requests exactly (analytics only, never auto-promoted into a
-- real category — an admin adds it through the existing /admin/categories
-- page if they decide to).
--
-- profiles.brand_category and profiles.tax_document_url already exist and
-- are untouched by this migration — this only adds their missing companion
-- and the demand-log table. Idempotent; safe to re-run.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_verification_photos jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.brand_verification_photos IS
  'Cloudinary URLs of brand-uploaded proof-of-business photos (storefront, office, product...), submitted alongside tax_document_url. Reviewed by an admin in /admin/brands before brand_status -> approved.';

CREATE TABLE IF NOT EXISTS public.brand_type_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_type_text  text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_type_requests_user       ON public.brand_type_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_type_requests_created_at ON public.brand_type_requests(created_at);

-- RLS enabled with no policies — service-role only, same pattern as
-- talent_type_requests / notifications / user_events.
ALTER TABLE public.brand_type_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  photos_col_exists boolean;
  requests_table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'brand_verification_photos'
  ) INTO photos_col_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brand_type_requests'
  ) INTO requests_table_exists;

  RAISE NOTICE 'brand_verification migration: profiles.brand_verification_photos exists = %, brand_type_requests table exists = %',
    photos_col_exists, requests_table_exists;
END $$;
