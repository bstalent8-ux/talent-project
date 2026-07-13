-- ─── 1. Create talent_brands table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.talent_brands (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_profile_id uuid       NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  brand_name       text        NOT NULL,
  logo_url         text,
  year_collaborated text,
  sort_order       integer     DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- ─── 2. Index for fast lookup by talent ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_talent_brands_talent_profile_id
  ON public.talent_brands(talent_profile_id);

-- ─── 3. RLS policies ─────────────────────────────────────────────────────────
ALTER TABLE public.talent_brands ENABLE ROW LEVEL SECURITY;

-- Anyone can view brands
CREATE POLICY "talent_brands_select_public"
  ON public.talent_brands FOR SELECT
  USING (true);

-- Only the talent themselves can insert/update/delete their brands
CREATE POLICY "talent_brands_insert_own"
  ON public.talent_brands FOR INSERT
  WITH CHECK (
    talent_profile_id IN (
      SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "talent_brands_update_own"
  ON public.talent_brands FOR UPDATE
  USING (
    talent_profile_id IN (
      SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "talent_brands_delete_own"
  ON public.talent_brands FOR DELETE
  USING (
    talent_profile_id IN (
      SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()
    )
  );

-- ─── 4. Migrate existing data from social_links.brands JSON ──────────────────
INSERT INTO public.talent_brands (talent_profile_id, brand_name, sort_order)
SELECT
  tp.id                                   AS talent_profile_id,
  brand_name::text                        AS brand_name,
  ordinality - 1                          AS sort_order
FROM public.talent_profiles tp,
     jsonb_array_elements_text(
       CASE
         WHEN tp.social_links ? 'brands'
           AND jsonb_typeof(tp.social_links->'brands') = 'array'
         THEN tp.social_links->'brands'
         ELSE '[]'::jsonb
       END
     ) WITH ORDINALITY AS t(brand_name, ordinality)
WHERE brand_name IS NOT NULL
  AND brand_name <> ''
ON CONFLICT DO NOTHING;
