-- =============================================================================
-- Default Free membership + usage metering
-- =============================================================================
-- What this does:
--   1. Creates a HIDDEN "Free" package (+ 0 EGP plan). is_active = false, so it
--      never appears on the public pricing UI — it's only a baseline membership.
--   2. Creates a user_usage table (per-user, per-month counters).
--   3. Back-fills every EXISTING profile that has no active subscription with a
--      Free subscription, and gives every profile a current-period usage row.
--   4. Adds an AFTER INSERT trigger on public.profiles so every NEW account is
--      auto-provisioned with the Free subscription + a usage row — no backend code.
--
-- Schema notes (why this differs from a generic template):
--   * The real subscription table is public.subscriptions (NOT user_subscriptions),
--     keyed by user_id -> profiles.id and plan_id -> package_plans.id, with a
--     partial unique index allowing ONE active subscription per user.
--   * The trigger fires on public.profiles, NOT auth.users: subscriptions FK
--     reference profiles.id, and the app creates the profile row AFTER signup, so
--     an auth.users trigger would fail the foreign key.
--
-- Idempotent: safe to paste into the Supabase SQL editor and run more than once.
-- =============================================================================

BEGIN;

-- Reuse the shared updated_at helper (created in the packages migration).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1) Hidden Free package + 0 EGP plan
-- ---------------------------------------------------------------------------
INSERT INTO public.packages (id, name, description, is_active)
VALUES (
  '00000000-0000-4000-8000-000000000000',
  'Free',
  'Default free membership automatically assigned to every account.',
  false            -- hidden: never listed on the public pricing UI
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

INSERT INTO public.package_plans (id, package_id, duration_months, price, currency, is_active)
VALUES (
  '00000000-0000-4000-8000-0000000000f1',
  '00000000-0000-4000-8000-000000000000',
  12, 0, 'EGP', false
)
ON CONFLICT (package_id, duration_months, currency) DO UPDATE SET
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

-- ---------------------------------------------------------------------------
-- 2) Usage metering table (one row per user per calendar month)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_usage (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id         uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  period_start            timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end              timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  campaign_requests_used  integer NOT NULL DEFAULT 0,
  portfolio_used          integer NOT NULL DEFAULT 0,
  job_posts_used          integer NOT NULL DEFAULT 0,
  chat_sessions_used      integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_user   ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_period ON public.user_usage(user_id, period_start);

DROP TRIGGER IF EXISTS set_user_usage_updated_at ON public.user_usage;
CREATE TRIGGER set_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Back-fill existing users
-- ---------------------------------------------------------------------------
-- 3a. Give a Free subscription to every profile that has NO active subscription.
INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at, status)
SELECT
  p.id,
  fp.id,
  now(),
  now() + interval '100 years',   -- effectively non-expiring baseline
  'active'
FROM public.profiles p
CROSS JOIN LATERAL (
  SELECT id FROM public.package_plans
  WHERE package_id = '00000000-0000-4000-8000-000000000000'
  LIMIT 1
) fp
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s
  WHERE s.user_id = p.id AND s.status = 'active'
)
ON CONFLICT (user_id) WHERE status = 'active' DO NOTHING;

-- 3b. Give every profile a current-period usage row (counters at 0).
INSERT INTO public.user_usage (user_id, subscription_id, period_start, period_end)
SELECT
  p.id,
  (SELECT s.id FROM public.subscriptions s
     WHERE s.user_id = p.id AND s.status = 'active'
     ORDER BY s.created_at DESC LIMIT 1),
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
FROM public.profiles p
ON CONFLICT (user_id, period_start) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) Auto-provision NEW users (trigger on profiles, runs as owner / SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_default_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
  new_sub_id   uuid;
BEGIN
  SELECT id INTO free_plan_id
  FROM public.package_plans
  WHERE package_id = '00000000-0000-4000-8000-000000000000'
  LIMIT 1;

  -- Attach the Free subscription (skip if the account somehow already has an active one).
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, starts_at, expires_at, status)
    VALUES (NEW.id, free_plan_id, now(), now() + interval '100 years', 'active')
    ON CONFLICT (user_id) WHERE status = 'active' DO NOTHING
    RETURNING id INTO new_sub_id;
  END IF;

  -- Seed the current-period usage row with counters at 0.
  INSERT INTO public.user_usage (user_id, subscription_id, period_start, period_end)
  VALUES (
    NEW.id,
    new_sub_id,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month'
  )
  ON CONFLICT (user_id, period_start) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provision_default_membership_on_profile ON public.profiles;
CREATE TRIGGER provision_default_membership_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.provision_default_membership();

-- ---------------------------------------------------------------------------
-- 5) RLS: users may read their own usage; writes go through the service role /
--    the SECURITY DEFINER trigger, so no INSERT/UPDATE policy is exposed.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_usage_select_own" ON public.user_usage;
CREATE POLICY "user_usage_select_own"
  ON public.user_usage FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6) (Optional) SQL view for active subscriber counts per package.
--    The app currently computes this in TypeScript (features/packages/services/
--    package.service.ts -> fetchPackageSubscriberCounts), but this view is a
--    ready SQL/RPC alternative: SELECT * FROM public.package_subscriber_counts;
--    Packages with zero active subscribers still appear (subscribers_count = 0).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.package_subscriber_counts AS
SELECT
  pk.id AS package_id,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS subscribers_count
FROM public.packages pk
LEFT JOIN public.package_plans  pl ON pl.package_id = pk.id
LEFT JOIN public.subscriptions  s  ON s.plan_id = pl.id
GROUP BY pk.id;

COMMIT;
