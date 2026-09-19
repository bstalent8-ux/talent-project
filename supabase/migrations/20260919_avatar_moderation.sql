-- ─── Profile-photo moderation (talents) ──────────────────────────────────────
-- A talent's new profile photo now waits for an admin to approve it before the
-- public sees it, the same way portfolio media does (20260919_media_moderation.sql).
--
-- profiles.avatar_url stays "the approved, public avatar" — every public read
-- (explore cards, profile pages, chat, navbar) already uses it, so nothing on the
-- read side changes. A new upload is parked in pending_avatar_url until reviewed:
--
--   pending_avatar_url        the new photo waiting for a decision (or the rejected one)
--   avatar_review_status      NULL = nothing waiting | 'pending' | 'rejected'
--   avatar_rejection_reason   shown to the talent
--   avatar_submitted_at       when the current pending photo was uploaded
--   avatar_reviewed_by / _at  who decided, when
--
-- Approve  -> avatar_url := pending_avatar_url, pending cleared, status NULL.
-- Reject   -> avatar_url untouched (the last approved photo stays live), status
--             'rejected' + reason, so the talent can upload another.
-- Existing avatars are NOT touched: every profile that has an avatar_url today
-- keeps it (status NULL). Only brands are exempt from review (unchanged behaviour).
--
-- Idempotent — safe to paste into the Supabase SQL editor more than once.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_avatar_url      text,
  ADD COLUMN IF NOT EXISTS avatar_review_status    text,
  ADD COLUMN IF NOT EXISTS avatar_rejection_reason text,
  ADD COLUMN IF NOT EXISTS avatar_submitted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_reviewed_by      uuid,
  ADD COLUMN IF NOT EXISTS avatar_reviewed_at      timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_avatar_review_status_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_review_status_check
      CHECK (avatar_review_status IS NULL OR avatar_review_status IN ('pending', 'rejected'));
  END IF;
END $$;

-- Review queue lookup (small: only rows with something waiting or rejected).
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_review
  ON public.profiles (avatar_review_status, avatar_submitted_at DESC)
  WHERE avatar_review_status IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'profiles avatar review columns ready; pending now = %',
    (SELECT count(*) FROM public.profiles WHERE avatar_review_status = 'pending');
END $$;
