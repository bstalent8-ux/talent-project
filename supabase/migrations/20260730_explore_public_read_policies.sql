-- Explore public-read hardening.
--
-- Idempotent: safe to paste into the Supabase SQL editor more than once.
-- Keeps RLS enabled and grants read-only access to active, approved talent
-- discovery data for guests and authenticated users.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS block_reason   text;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role_handle ON public.profiles(role, handle);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_status_user ON public.talent_profiles(status, user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_talent_approved ON public.portfolio_items(talent_id, is_approved);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public_approved_talents" ON public.profiles;
CREATE POLICY "profiles_select_public_approved_talents"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    role::text = 'talent'
    AND handle IS NOT NULL
    AND COALESCE(is_suspended, false) = false
    AND COALESCE(account_status, 'active') = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.talent_profiles tp
      WHERE tp.user_id = profiles.id
        AND tp.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "talent_profiles_select_public_approved" ON public.talent_profiles;
CREATE POLICY "talent_profiles_select_public_approved"
  ON public.talent_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = talent_profiles.user_id
        AND p.role::text = 'talent'
        AND p.handle IS NOT NULL
        AND COALESCE(p.is_suspended, false) = false
        AND COALESCE(p.account_status, 'active') = 'active'
    )
  );

DROP POLICY IF EXISTS "portfolio_items_select_public_approved" ON public.portfolio_items;
CREATE POLICY "portfolio_items_select_public_approved"
  ON public.portfolio_items
  FOR SELECT
  TO anon, authenticated
  USING (
    COALESCE(is_approved, false) = true
    AND EXISTS (
      SELECT 1
      FROM public.talent_profiles tp
      JOIN public.profiles p ON p.id = tp.user_id
      WHERE tp.id = portfolio_items.talent_id
        AND tp.status = 'approved'
        AND p.role::text = 'talent'
        AND p.handle IS NOT NULL
        AND COALESCE(p.is_suspended, false) = false
        AND COALESCE(p.account_status, 'active') = 'active'
    )
  );
