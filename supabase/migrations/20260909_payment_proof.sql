-- ─── Payment proof (manual off-platform payment) ─────────────────────────────
-- The `payments` table already carries a real escrow shape (platform_fee /
-- talent_payout auto-computed, held_at / released_at / refunded_at, a status
-- CHECK constraint allowing pending|held|released|refunded|disputed) — but no
-- application code ever wrote to it correctly (app/api/bookings/[id]/payment
-- inserted a non-existent `paid_at` column and an invalid `status: "paid"`,
-- so the payments table has been permanently empty; every booking on the
-- platform has been stuck at "accepted" forever). This migration adds the one
-- missing piece needed for the new flow: a place to store the brand's
-- uploaded proof-of-payment screenshot (bank transfer / InstaPay) so the
-- talent can review it before confirming.
--
-- Idempotent — safe to run again.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url text;

COMMENT ON COLUMN payments.proof_url IS
  'Cloudinary URL of the brand-uploaded payment proof screenshot (bank transfer / InstaPay). Set when status is pending, reviewed by the talent before they confirm (status -> held).';
