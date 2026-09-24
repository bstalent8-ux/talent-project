-- Community "Follow" — powers the reference layout's Follow button on
-- Suggested Talents and the Followers/Following stats on the profile
-- sidebar. Hand-run per CLAUDE.md §6 (pasted into the Supabase SQL editor).
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS public.follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_followee_idx ON public.follows (followee_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Same posture as notifications/user_events: the app reads/writes through
-- adminClient (service role) with auth enforced in the route handler, RLS
-- here is just a defence-in-depth backstop against direct/anon access.
DROP POLICY IF EXISTS "follows service role only" ON public.follows;
CREATE POLICY "follows service role only" ON public.follows
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Public can still read follow edges directly (follower/following counts
-- are public info on a profile, same as a talent's rating) — but never
-- write outside the service role.
DROP POLICY IF EXISTS "follows public read" ON public.follows;
CREATE POLICY "follows public read" ON public.follows
  FOR SELECT
  USING (true);

DO $$
DECLARE
  row_count INT;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.follows;
  RAISE NOTICE '[20260923_community_follows] follows table ready, % existing row(s)', row_count;
END $$;
