-- ─── talent_brands.verified ───────────────────────────────────────────────────
-- Backs the "Verified Through Talents" grid on the Model profile page: a brand
-- collaboration the admin has confirmed (vs. a talent-entered, unverified
-- claim). Defaults false — nothing is verified until an admin flips it.
ALTER TABLE public.talent_brands
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
