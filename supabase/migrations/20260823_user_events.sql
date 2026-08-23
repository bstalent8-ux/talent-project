-- ─── User action tracking (in-house event log) ────────────────────────────
-- Generic append-only event log for site-wide user-action tracking (page
-- views, talent-profile views, search, signups, logins, booking briefs, job
-- applications). Feeds two things that were previously fake/dead:
--   - talent_profiles.profile_views: existed as a column but was NEVER
--     incremented anywhere (only hand-seeded in app/api/admin/seed/route.ts).
--   - profiles.last_active_at: did not exist before this migration.
-- Idempotent; safe to re-run.
--
-- SECURITY: every SECURITY DEFINER function below explicitly sets
-- search_path (defends against search_path hijacking) and explicitly
-- revokes PUBLIC/anon/authenticated EXECUTE, granting only service_role.
-- Postgres grants EXECUTE to PUBLIC by default on function creation, and
-- Supabase auto-exposes every function as a PostgREST RPC endpoint — without
-- the explicit revokes, a client holding only the public anon key could call
-- these functions directly (e.g. POST /rest/v1/rpc/track_talent_profile_view)
-- and bypass /api/events entirely, including its dedupe/validation.

CREATE TABLE IF NOT EXISTS public.user_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL, -- nullable: guests
  session_id  text        NOT NULL,
  event_name  text        NOT NULL CHECK (event_name IN (
                'page_view', 'talent_profile_view', 'search',
                'booking_brief_sent', 'job_application', 'signup', 'login'
              )),
  target_type text        CHECK (target_type IS NULL OR target_type IN ('talent_profile', 'job', 'booking')),
  target_id   uuid,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user      ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_name_time ON public.user_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_target    ON public.user_events(target_type, target_id);

-- RLS enabled with no policies: locked to the service role (adminClient),
-- same "no general INSERT policy, writes go through service-role app code"
-- pattern as notifications / talent_type_requests. No SELECT policy either
-- — anon/authenticated get zero access to this table, read or write.
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- ─── Profile-view dedupe ────────────────────────────────────────────────────
-- One row per (session, talent) pair — last_counted_at is the anchor for the
-- 30-minute counting window used by track_talent_profile_view() below.
CREATE TABLE IF NOT EXISTS public.talent_profile_view_dedupe (
  session_id      text        NOT NULL,
  talent_user_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_counted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, talent_user_id)
);

-- RLS enabled, no policies — never exposed publicly, same as user_events.
ALTER TABLE public.talent_profile_view_dedupe ENABLE ROW LEVEL SECURITY;

-- Atomically decides whether this (session, talent) view counts — first view
-- ever, or the prior counted view for this pair is older than 30 minutes —
-- and if so, in the SAME statement set: increments talent_profiles.
-- profile_views and inserts the talent_profile_view row into user_events.
-- A refresh-spam loop from the same session neither inflates the public
-- profile_views counter nor the admin analytics table.
--
-- The INSERT ... ON CONFLICT ... DO UPDATE ... WHERE guard is a single
-- atomic statement — safe under concurrent calls for the same session+talent
-- (no separate read-then-write race window, unlike a SELECT-then-UPDATE
-- pattern would have).
CREATE OR REPLACE FUNCTION public.track_talent_profile_view(
  p_session_id     text,
  p_viewer_user_id uuid,
  p_talent_user_id uuid,
  p_metadata       jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counted boolean;
BEGIN
  INSERT INTO public.talent_profile_view_dedupe (session_id, talent_user_id, last_counted_at)
  VALUES (p_session_id, p_talent_user_id, now())
  ON CONFLICT (session_id, talent_user_id) DO UPDATE
    SET last_counted_at = now()
    WHERE public.talent_profile_view_dedupe.last_counted_at < now() - interval '30 minutes'
  RETURNING true INTO v_counted;

  IF v_counted THEN
    UPDATE public.talent_profiles
    SET profile_views = profile_views + 1
    WHERE user_id = p_talent_user_id;

    INSERT INTO public.user_events (user_id, session_id, event_name, target_type, target_id, metadata)
    VALUES (p_viewer_user_id, p_session_id, 'talent_profile_view', 'talent_profile', p_talent_user_id, COALESCE(p_metadata, '{}'::jsonb));
  END IF;

  RETURN COALESCE(v_counted, false);
END;
$$;

REVOKE ALL ON FUNCTION public.track_talent_profile_view(text, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_talent_profile_view(text, uuid, uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.track_talent_profile_view(text, uuid, uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_talent_profile_view(text, uuid, uuid, jsonb) TO service_role;

-- ─── last_active_at throttle ────────────────────────────────────────────────
-- A single guarded UPDATE is inherently atomic (no read-then-write race) —
-- many events within the 5-minute window all no-op here, so a signed-in
-- user's flurry of page views costs at most one profiles row write.
CREATE OR REPLACE FUNCTION public.touch_last_active(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET last_active_at = now()
  WHERE id = p_user_id
    AND (last_active_at IS NULL OR last_active_at < now() - interval '5 minutes');
$$;

REVOKE ALL ON FUNCTION public.touch_last_active(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_last_active(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.touch_last_active(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.touch_last_active(uuid) TO service_role;
