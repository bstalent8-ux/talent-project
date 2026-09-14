-- ─── Booking negotiation support — 2026-09-14 ───────────────────────────────
-- Two things bundled here because they were discovered together while
-- building the new "Send Brief" flow (package-fixed-price vs custom-range):
--
-- 1. bookings_status_check does NOT allow 'rejected' or 'changes_requested' —
--    confirmed live by direct probe (insert/update attempts against a
--    throwaway row, immediately reverted). app/api/bookings/[id]/brief/
--    respond/route.ts has been writing exactly those two values since it was
--    written, so every talent "Reject" or "Request Changes" on any real
--    booking has been throwing a 500 the whole time — not new, not specific
--    to this feature. Same for booking_briefs_status_check (own column,
--    own constraint, same two missing values).
--
-- 2. New columns for the two "Send Brief" flows:
--    - Package flow: fixed price from a talent_profiles.packages entry,
--      a chosen date + time slot from the talent's own real
--      talent_profiles.availability_schedule (see lib/availability-schedule.ts),
--      no free-text brief needed — the package/scheduled_* columns ARE the
--      scope. No negotiation: talent only accepts or declines.
--    - Custom flow: brand proposes a budget_min/budget_max range instead of
--      one fixed number; talent and brand then go back and forth on
--      proposed_amount until both sides ack the same figure, at which point
--      the app copies proposed_amount into the real `amount` column (the one
--      that already drives payments.amount and increment_balance — see
--      CLAUDE.md's Manual Payment Proof Flow section). `amount` itself is
--      already nullable (confirmed live) so it stays null until agreed.
--
-- Idempotent — safe to run more than once.

-- 1a. bookings.status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'contacting', 'brief_sent', 'accepted', 'payment_pending',
    'in_progress', 'completed', 'paid', 'cancelled',
    'rejected', 'changes_requested'
  ));

-- 1b. booking_briefs.status (own, separate constraint — same missing values)
ALTER TABLE booking_briefs DROP CONSTRAINT IF EXISTS booking_briefs_status_check;
ALTER TABLE booking_briefs ADD CONSTRAINT booking_briefs_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'changes_requested'));

-- 2a. Package-flow columns (no negotiation — fixed price + a real slot).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_start text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_end text;

-- 2b. Custom-flow price negotiation columns.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS budget_min numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS budget_max numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS proposed_amount numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS proposed_by text;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_proposed_by_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_proposed_by_check
  CHECK (proposed_by IS NULL OR proposed_by IN ('brand', 'talent'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS brand_price_ack boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS talent_price_ack boolean NOT NULL DEFAULT false;

-- Verification
DO $$
DECLARE
  col_count int;
BEGIN
  SELECT count(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'bookings'
    AND column_name IN (
      'package_id','package_name','scheduled_date','scheduled_start','scheduled_end',
      'budget_min','budget_max','proposed_amount','proposed_by','brand_price_ack','talent_price_ack'
    );
  RAISE NOTICE 'bookings: % of 11 new negotiation columns present', col_count;
END $$;
