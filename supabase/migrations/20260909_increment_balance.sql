-- ─── increment_balance — was called, never existed ───────────────────────────
-- app/api/bookings/[id]/deliverables/route.ts's approve branch has called
-- `adminClient.rpc("increment_balance", { user_id, amount })` to credit a
-- talent's profiles.balance when a brand approves the final delivery — this
-- function has never existed in the database, so the call has always
-- silently failed (the original code discarded the error entirely with
-- `.then(() => null, () => null)`, fixed to log-not-swallow in the same pass
-- that found this). Every completed, brand-approved booking on this platform
-- has left the talent's balance uncredited.
--
-- Same lockdown pattern as track_talent_profile_view()/touch_last_active()
-- (CLAUDE.md's "User Action Tracking" section): SECURITY DEFINER + a pinned
-- search_path, EXECUTE revoked from PUBLIC/anon/authenticated and granted
-- only to service_role — this touches money, it must never be reachable as
-- a public PostgREST RPC endpoint, only from server code via the service role.
--
-- Idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION public.increment_balance(user_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET balance = COALESCE(balance, 0) + amount
   WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_balance(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_balance(uuid, numeric) TO service_role;
