-- ─── Portfolio media moderation ──────────────────────────────────────────────
-- Every photo/video a talent uploads now waits for an admin to approve it before
-- it can appear on their public profile — even if the profile itself is already
-- approved. The public read paths already filter on portfolio_items.is_approved
-- (talent.repository.ts findPortfolio, and the explore public-read policy), so
-- `is_approved` stays the single "visible to the public" switch; this migration
-- adds the review trail around it:
--
--   review_status    pending | approved | rejected   (approved <=> is_approved = true)
--   reviewed_by      admin who decided
--   reviewed_at      when
--   rejection_reason shown to the talent
--
-- Idempotent — safe to paste into the Supabase SQL editor more than once.
-- Existing rows keep their current visibility: every row that is is_approved = true
-- is back-filled as 'approved', so nothing on a live profile disappears.

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS review_status    text,
  ADD COLUMN IF NOT EXISTS reviewed_by      uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Back-fill BEFORE tightening the column: visible rows -> approved, hidden -> pending.
UPDATE public.portfolio_items
SET review_status = CASE WHEN COALESCE(is_approved, false) THEN 'approved' ELSE 'pending' END
WHERE review_status IS NULL;

ALTER TABLE public.portfolio_items
  ALTER COLUMN review_status SET NOT NULL,
  -- Any insert path that forgets to say otherwise lands in the review queue,
  -- never straight on a public profile.
  ALTER COLUMN review_status SET DEFAULT 'pending',
  ALTER COLUMN is_approved   SET DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_items_review_status_check'
  ) THEN
    ALTER TABLE public.portfolio_items
      ADD CONSTRAINT portfolio_items_review_status_check
      CHECK (review_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- The two invariants the app relies on: only 'approved' rows are public, and a
-- row flagged is_approved can never be 'pending'/'rejected'. Keep them in step.
UPDATE public.portfolio_items SET is_approved = (review_status = 'approved')
WHERE is_approved IS DISTINCT FROM (review_status = 'approved');

CREATE INDEX IF NOT EXISTS idx_portfolio_items_review_queue
  ON public.portfolio_items (review_status, created_at DESC);

-- Verify: how many rows landed in each state.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT review_status, count(*) AS n FROM public.portfolio_items GROUP BY 1 ORDER BY 1 LOOP
    RAISE NOTICE 'portfolio_items.review_status % = %', r.review_status, r.n;
  END LOOP;
END $$;
