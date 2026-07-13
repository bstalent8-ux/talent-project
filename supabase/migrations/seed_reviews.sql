-- Seed 2 completed bookings + 2 reviews for every talent_profile
DO $$
DECLARE
  tp        RECORD;
  brand_uid uuid;
  bid1      uuid;
  bid2      uuid;
BEGIN
  -- Use the first existing profile as the "brand" reviewer
  SELECT id INTO brand_uid FROM public.profiles LIMIT 1;

  IF brand_uid IS NULL THEN
    RAISE NOTICE 'No profiles found — skipping review seed.';
    RETURN;
  END IF;

  FOR tp IN SELECT id FROM public.talent_profiles LOOP

    -- ── Booking 1 ──────────────────────────────────────────────────────────
    INSERT INTO public.bookings (talent_id, brand_id, status)
    VALUES (tp.id, brand_uid, 'completed')
    RETURNING id INTO bid1;

    INSERT INTO public.reviews (booking_id, talent_id, brand_id, rating, comment)
    VALUES (
      bid1, tp.id, brand_uid, 5,
      'تعاون رائع! محترف جداً وتسليم في الوقت. زاد مبيعاتنا بشكل ملحوظ.'
    )
    ON CONFLICT (booking_id) DO NOTHING;

    -- ── Booking 2 ──────────────────────────────────────────────────────────
    INSERT INTO public.bookings (talent_id, brand_id, status)
    VALUES (tp.id, brand_uid, 'completed')
    RETURNING id INTO bid2;

    INSERT INTO public.reviews (booking_id, talent_id, brand_id, rating, comment)
    VALUES (
      bid2, tp.id, brand_uid, 4,
      'خبرة ممتازة ونتائج قوية. إبداع واضح في كل تفصيلة.'
    )
    ON CONFLICT (booking_id) DO NOTHING;

    -- ── Update avg_rating + total_reviews ──────────────────────────────────
    UPDATE public.talent_profiles
    SET
      avg_rating    = 4.5,
      total_reviews = 2
    WHERE id = tp.id;

  END LOOP;

  RAISE NOTICE 'Review seed complete.';
END $$;
