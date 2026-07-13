-- ─── bookings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id   uuid        NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  package_id  text,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','completed','cancelled')),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_talent_id ON public.bookings(talent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_brand_id  ON public.bookings(brand_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON public.bookings(status);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- talent can view their own bookings; brand can view bookings they made
CREATE POLICY "bookings_select"
  ON public.bookings FOR SELECT
  USING (
    brand_id = auth.uid() OR
    talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
  );

-- only authenticated users can create bookings
CREATE POLICY "bookings_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (brand_id = auth.uid());

-- only admin (service role) can update status
-- (adminClient bypasses RLS, so no extra policy needed)

-- ─── reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id  uuid        NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  talent_id   uuid        NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  rating      smallint    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_talent_id ON public.reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_brand_id  ON public.reviews(brand_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- anyone can read reviews
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT USING (true);

-- only the brand that made the booking can write a review
CREATE POLICY "reviews_insert"
  ON public.reviews FOR INSERT
  WITH CHECK (brand_id = auth.uid());
