-- ══════════════════════════════════════════════════════════════════════════
-- P0 — rate limiting for unauthenticated write endpoints          2026-09-10
-- ══════════════════════════════════════════════════════════════════════════
-- /api/contact, /api/support/tickets and /api/auth/otp/* are public,
-- unauthenticated, and had no throttle — anyone could flood contact_messages
-- (each insert also fires an admin notification + a Resend email) or burn
-- Twilio credit. This adds a small fixed-window counter and one atomic RPC
-- the edge routes call via the service role.
--
-- Idempotent — safe to re-run.
-- Same lockdown as the other SECURITY DEFINER helpers (CLAUDE.md "User
-- Action Tracking"): pinned search_path, EXECUTE only for service_role.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

-- Service-role only, same pattern as notifications / user_events / leads.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- rl_hit(bucket, window_seconds, max_hits)
--   Buckets time into fixed windows of `window_seconds`, atomically bumps the
--   counter for the current window, opportunistically clears this bucket's
--   stale windows, and returns TRUE when the caller is still under the cap.
CREATE OR REPLACE FUNCTION public.rl_hit(
  p_bucket        text,
  p_window_seconds integer,
  p_max_hits      integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_start timestamptz;
  new_count integer;
BEGIN
  w_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits (bucket, window_start, count)
  VALUES (p_bucket, w_start, 1)
  ON CONFLICT (bucket, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO new_count;

  -- keep the table from growing forever — drop this bucket's old windows
  DELETE FROM public.rate_limits
   WHERE bucket = p_bucket AND window_start < w_start;

  RETURN new_count <= p_max_hits;
END;
$$;

REVOKE ALL ON FUNCTION public.rl_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rl_hit(text, integer, integer) TO service_role;

DO $$
BEGIN
  IF public.rl_hit('migration-selftest', 60, 5) IS NOT TRUE THEN
    RAISE WARNING 'rl_hit self-test returned unexpected value';
  ELSE
    RAISE NOTICE 'VERIFIED: rl_hit(text, integer, integer) exists and is callable.';
  END IF;
  DELETE FROM public.rate_limits WHERE bucket = 'migration-selftest';
END $$;
