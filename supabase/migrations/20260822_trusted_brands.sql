-- trusted_brands table — referenced by features/trusted-brands/trusted-brands.service.ts
-- and app/(admin)/admin/trusted-brands/page.tsx but never had a migration, so
-- it doesn't exist in the live DB ("Could not find the table
-- 'public.trusted_brands' in the schema cache"). Columns match the service's
-- selects/inserts/updates exactly. Idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS public.trusted_brands (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  logo_url      text,
  website_url   text,
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trusted_brands_active_order ON public.trusted_brands(is_active, display_order);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trusted_brands_updated_at ON public.trusted_brands;
CREATE TRIGGER trg_trusted_brands_updated_at
  BEFORE UPDATE ON public.trusted_brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public read (active only) via getCachedPublicTrustedBrands / the landing
-- page; admin writes go through adminClient (service role, bypasses RLS).
ALTER TABLE public.trusted_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trusted_brands_public_read_active" ON public.trusted_brands;
CREATE POLICY "trusted_brands_public_read_active"
  ON public.trusted_brands FOR SELECT
  USING (is_active = true);
