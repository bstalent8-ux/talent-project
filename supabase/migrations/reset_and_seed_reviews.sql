-- Drop and recreate with correct schema
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

-- Seed 2 reviews per talent
DO $$
DECLARE
  tp        RECORD;
  brand_uid uuid;
  bid1      uuid;
  bid2      uuid;
BEGIN
  SELECT id INTO brand_uid FROM public.profiles LIMIT 1;
  IF brand_uid IS NULL THEN RAISE NOTICE 'No profiles found.'; RETURN; END IF;

  FOR tp IN SELECT id FROM public.talent_profiles LOOP
    INSERT INTO public.bookings (talent_id, brand_id, status)
      VALUES (tp.id, brand_uid, 'completed') RETURNING id INTO bid1;
    INSERT INTO public.reviews (booking_id, talent_id, brand_id, rating, comment)
      VALUES (bid1, tp.id, brand_uid, 5, 'تعاون رائع! محترف جداً وتسليم في الوقت.');

    INSERT INTO public.bookings (talent_id, brand_id, status)
      VALUES (tp.id, brand_uid, 'completed') RETURNING id INTO bid2;
    INSERT INTO public.reviews (booking_id, talent_id, brand_id, rating, comment)
      VALUES (bid2, tp.id, brand_uid, 4, 'خبرة ممتازة ونتائج قوية. إبداع واضح في كل تفصيلة.');

    UPDATE public.talent_profiles SET avg_rating = 4.5, total_reviews = 2 WHERE id = tp.id;
  END LOOP;
  RAISE NOTICE 'Done.';
END $$;
