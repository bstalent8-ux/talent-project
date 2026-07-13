-- ══════════════════════════════════════════════
-- STEP 1: Run this block first
-- ══════════════════════════════════════════════
DROP TABLE IF EXISTS public.reviews  CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;

CREATE TABLE public.bookings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id   uuid        NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  package_id  text,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','completed','cancelled')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.reviews (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id  uuid        NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  talent_id   uuid        NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  rating      smallint    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "bookings_select" ON public.bookings FOR SELECT
  USING (brand_id = auth.uid() OR talent_id IN (
    SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()
  ));


-- ══════════════════════════════════════════════
-- STEP 2: Run this block separately after Step 1
-- ══════════════════════════════════════════════
WITH
  brand AS (
    SELECT id AS brand_id FROM public.profiles LIMIT 1
  ),
  b1 AS (
    INSERT INTO public.bookings (talent_id, brand_id, status)
    SELECT tp.id, b.brand_id, 'completed'
    FROM   public.talent_profiles tp, brand b
    RETURNING id AS booking_id, talent_id, brand_id
  ),
  r1 AS (
    INSERT INTO public.reviews (booking_id, talent_id, brand_id, rating, comment)
    SELECT booking_id, talent_id, brand_id, 5,
           'تعاون رائع! محترف جداً وتسليم في الوقت. زاد مبيعاتنا بشكل ملحوظ.'
    FROM   b1
    RETURNING talent_id
  ),
  b2 AS (
    INSERT INTO public.bookings (talent_id, brand_id, status)
    SELECT tp.id, b.brand_id, 'completed'
    FROM   public.talent_profiles tp, brand b
    RETURNING id AS booking_id, talent_id, brand_id
  ),
  r2 AS (
    INSERT INTO public.reviews (booking_id, talent_id, brand_id, rating, comment)
    SELECT booking_id, talent_id, brand_id, 4,
           'خبرة ممتازة ونتائج قوية. إبداع واضح في كل تفصيلة.'
    FROM   b2
    RETURNING talent_id
  )
UPDATE public.talent_profiles tp
SET    avg_rating = 4.5, total_reviews = 2
FROM   (SELECT talent_id FROM r1 UNION SELECT talent_id FROM r2) done
WHERE  tp.id = done.talent_id;
