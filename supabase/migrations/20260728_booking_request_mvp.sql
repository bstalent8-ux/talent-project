-- ============================================================
-- 20260728_booking_request_mvp.sql
-- MVP booking request flow.
--
-- Idempotent. Paste into the Supabase SQL editor.
-- ============================================================

-- 1. Booking request fields on the existing bookings table.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS budget_type              text,
  ADD COLUMN IF NOT EXISTS budget_amount            numeric(10,2),
  ADD COLUMN IF NOT EXISTS start_date               date,
  ADD COLUMN IF NOT EXISTS duration                 integer,
  ADD COLUMN IF NOT EXISTS deadline                 date,
  ADD COLUMN IF NOT EXISTS negotiation_message      text,
  ADD COLUMN IF NOT EXISTS negotiation_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz NOT NULL DEFAULT now();

-- Keep the legacy amount field aligned with the structured budget field.
UPDATE public.bookings
   SET budget_amount = amount
 WHERE budget_amount IS NULL
   AND amount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_request_status
  ON public.bookings(status, brand_id, talent_id);

CREATE INDEX IF NOT EXISTS idx_bookings_request_talent_status
  ON public.bookings(status, talent_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_active_request
  ON public.bookings(brand_id, talent_id)
  WHERE status IN (
    'pending',
    'changes_requested',
    'accepted',
    'payment_pending',
    'in_progress',
    'brief_sent',
    'contacting'
  );

-- 2. Expand the booking status machine without removing the existing pipeline states.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending',
    'contacting',
    'brief_sent',
    'changes_requested',
    'accepted',
    'rejected',
    'payment_pending',
    'in_progress',
    'completed',
    'paid',
    'cancelled'
  ));

-- 3. Keep booking_briefs compatible with request changes.
ALTER TABLE public.booking_briefs
  DROP CONSTRAINT IF EXISTS booking_briefs_status_check;

ALTER TABLE public.booking_briefs
  ADD CONSTRAINT booking_briefs_status_check
  CHECK (status IN ('pending','accepted','rejected','changes_requested'));

-- 4. Notifications: add booking_request as a first-class type.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN ('message', 'job_application', 'brief', 'booking', 'booking_request', 'payment', 'review', 'system')
  );

-- 5. RLS defence-in-depth for direct Supabase access.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select" ON public.bookings;
CREATE POLICY "bookings_select"
  ON public.bookings FOR SELECT
  USING (
    brand_id = auth.uid()
    OR talent_user_id = auth.uid()
    OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "bookings_insert" ON public.bookings;
CREATE POLICY "bookings_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (
    brand_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role = 'brand'
    )
  );

DROP POLICY IF EXISTS "bookings_update_participants" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_talent_owner" ON public.bookings;
CREATE POLICY "bookings_update_talent_owner"
  ON public.bookings FOR UPDATE
  USING (
    talent_user_id = auth.uid()
    OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    talent_user_id = auth.uid()
    OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "briefs_select" ON public.booking_briefs;
CREATE POLICY "briefs_select" ON public.booking_briefs FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
       WHERE brand_id = auth.uid()
          OR talent_user_id = auth.uid()
          OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "briefs_insert" ON public.booking_briefs;
CREATE POLICY "briefs_insert" ON public.booking_briefs FOR INSERT
  WITH CHECK (
    booking_id IN (SELECT id FROM public.bookings WHERE brand_id = auth.uid())
  );

DROP POLICY IF EXISTS "briefs_update" ON public.booking_briefs;
CREATE POLICY "briefs_update" ON public.booking_briefs FOR UPDATE
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
       WHERE talent_user_id = auth.uid()
          OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings
       WHERE talent_user_id = auth.uid()
          OR talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid())
    )
  );
