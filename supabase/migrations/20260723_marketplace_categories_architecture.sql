-- Marketplace categories architecture.
-- Safe phase: create new structures and backfill from legacy fields.
-- No legacy columns or tables are dropped in this migration.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.categories (
  id          text PRIMARY KEY,
  role_type   text NOT NULL CHECK (role_type IN ('talent','brand')),
  label_ar    text NOT NULL,
  label_en    text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  category_id     text REFERENCES public.categories(id),
  company_name    text,
  industry        text,
  website_url     text,
  social_links    jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_views   integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  approved_at     timestamptz,
  approved_by     uuid REFERENCES public.profiles(id),
  rejection_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.package_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.package_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  duration_months integer NOT NULL CHECK (duration_months > 0),
  price           numeric(12,2) NOT NULL CHECK (price >= 0),
  currency        text NOT NULL DEFAULT 'EGP',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, duration_months, currency)
);

CREATE TABLE IF NOT EXISTS public.package_features (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id    uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature_key   text NOT NULL,
  feature_value text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id      uuid NOT NULL REFERENCES public.package_plans(id),
  starts_at    timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','cancelled','expired')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_key        text NOT NULL,
  used_count       integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  limit_count      integer,
  period_start     timestamptz NOT NULL DEFAULT now(),
  period_end       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, usage_key, period_start)
);

CREATE INDEX IF NOT EXISTS idx_categories_role_active ON public.categories(role_type, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_profile_categories_profile ON public.profile_categories(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_categories_category ON public.profile_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user ON public.brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_package_categories_category ON public.package_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_package_categories_package ON public.package_categories(package_id);
CREATE INDEX IF NOT EXISTS idx_package_plans_package ON public.package_plans(package_id);
CREATE INDEX IF NOT EXISTS idx_package_features_package ON public.package_features(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
  ON public.subscriptions(user_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_key ON public.usage_tracking(user_id, usage_key);

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_brand_profiles_updated_at ON public.brand_profiles;
CREATE TRIGGER set_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_packages_updated_at ON public.packages;
CREATE TRIGGER set_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_package_plans_updated_at ON public.package_plans;
CREATE TRIGGER set_package_plans_updated_at
  BEFORE UPDATE ON public.package_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_package_features_updated_at ON public.package_features;
CREATE TRIGGER set_package_features_updated_at
  BEFORE UPDATE ON public.package_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER set_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.categories (id, role_type, label_ar, label_en, sort_order)
VALUES
  ('ugc', 'talent', 'UGC Creator', 'UGC Creator', 10),
  ('influencer', 'talent', 'Influencer', 'Influencer', 20),
  ('fashion', 'talent', 'Fashion', 'Fashion', 30),
  ('food_reviewer', 'talent', 'Food Reviewer', 'Food Reviewer', 40),
  ('tech_reviewer', 'talent', 'Tech Reviewer', 'Tech Reviewer', 50),
  ('unboxing', 'talent', 'Unboxing', 'Unboxing', 60),
  ('host', 'talent', 'Host', 'Host', 70),
  ('restaurant', 'brand', 'Restaurant', 'Restaurant', 110),
  ('cafe', 'brand', 'Cafe', 'Cafe', 120),
  ('events', 'brand', 'Events', 'Events', 130),
  ('technology', 'brand', 'Technology', 'Technology', 140),
  ('real_estate', 'brand', 'Real Estate', 'Real Estate', 150),
  ('brand_fashion', 'brand', 'Fashion Brand', 'Fashion Brand', 160),
  ('brand_food', 'brand', 'Food Brand', 'Food Brand', 170)
ON CONFLICT (id) DO UPDATE SET
  role_type = EXCLUDED.role_type,
  label_ar = EXCLUDED.label_ar,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

INSERT INTO public.profile_categories (profile_id, category_id)
SELECT tp.user_id, c.id
FROM public.talent_profiles tp
JOIN public.categories c
  ON c.role_type = 'talent'
 AND c.id = CASE
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%ugc%' THEN 'ugc'
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%fashion%' THEN 'fashion'
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%influencer%' THEN 'influencer'
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%food%review%' THEN 'food_reviewer'
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%tech%review%' THEN 'tech_reviewer'
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%unbox%' THEN 'unboxing'
    WHEN lower(coalesce(tp.category::text, '')) LIKE '%host%' THEN 'host'
    ELSE lower(coalesce(tp.category::text, ''))
  END
ON CONFLICT (profile_id, category_id) DO NOTHING;

INSERT INTO public.brand_profiles (user_id, category_id, company_name, status, approved_at)
SELECT p.id,
       CASE
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%restaurant%' THEN 'restaurant'
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%cafe%' THEN 'cafe'
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%event%' THEN 'events'
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%tech%' THEN 'technology'
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%real estate%' THEN 'real_estate'
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%fashion%' THEN 'brand_fashion'
        WHEN lower(coalesce(p.bio, '') || ' ' || coalesce(p.full_name, '')) LIKE '%food%' THEN 'brand_food'
        ELSE 'brand_fashion'
       END,
       p.full_name,
       coalesce(p.brand_status::text, 'pending'),
       p.brand_approved_at
FROM public.profiles p
WHERE p.role = 'brand'
ON CONFLICT (user_id) DO UPDATE SET
  company_name = coalesce(public.brand_profiles.company_name, EXCLUDED.company_name),
  category_id = coalesce(public.brand_profiles.category_id, EXCLUDED.category_id);

INSERT INTO public.profile_categories (profile_id, category_id)
SELECT bp.user_id, bp.category_id
FROM public.brand_profiles bp
WHERE bp.category_id IS NOT NULL
ON CONFLICT (profile_id, category_id) DO NOTHING;

INSERT INTO public.packages (id, name, description, is_active)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'UGC Pro', 'For UGC creators growing campaign access and portfolio capacity.', true),
  ('22222222-2222-4222-8222-222222222222', 'Influencer Elite', 'Premium visibility and campaign workflow for influencers.', true),
  ('33333333-3333-4333-8333-333333333333', 'Fashion Creator Plus', 'For fashion creators building a polished brand-facing profile.', true),
  ('44444444-4444-4444-8444-444444444444', 'Food Reviewer Pro', 'For food reviewers producing restaurant and cafe campaign content.', true),
  ('55555555-5555-4555-8555-555555555555', 'Restaurant Brand Pro', 'For restaurants hiring creators and managing campaign conversations.', true),
  ('66666666-6666-4666-8666-666666666666', 'Technology Brand Growth', 'For technology brands sourcing creators and reviewers.', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Fashion Brand Launch', 'For fashion brands sourcing creators, models, and campaign content.', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Food Brand Growth', 'For food brands hiring food reviewers and UGC creators.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

INSERT INTO public.package_categories (package_id, category_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'ugc'),
  ('22222222-2222-4222-8222-222222222222', 'influencer'),
  ('33333333-3333-4333-8333-333333333333', 'fashion'),
  ('44444444-4444-4444-8444-444444444444', 'food_reviewer'),
  ('55555555-5555-4555-8555-555555555555', 'restaurant'),
  ('55555555-5555-4555-8555-555555555555', 'cafe'),
  ('66666666-6666-4666-8666-666666666666', 'technology'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'brand_fashion'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'brand_food')
ON CONFLICT (package_id, category_id) DO NOTHING;

INSERT INTO public.package_plans (package_id, duration_months, price, currency, is_active)
SELECT p.id, d.duration_months, d.price, 'EGP', true
FROM public.packages p
JOIN (VALUES (1, 900::numeric), (3, 2450::numeric), (6, 4600::numeric), (12, 8200::numeric)) AS d(duration_months, price)
  ON p.id IN (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444'
  )
ON CONFLICT (package_id, duration_months, currency) DO NOTHING;

INSERT INTO public.package_plans (package_id, duration_months, price, currency, is_active)
SELECT p.id, d.duration_months, d.price, 'EGP', true
FROM public.packages p
JOIN (VALUES (1, 1800::numeric), (3, 5000::numeric), (6, 9400::numeric), (12, 17000::numeric)) AS d(duration_months, price)
  ON p.id IN (
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  )
ON CONFLICT (package_id, duration_months, currency) DO NOTHING;

INSERT INTO public.package_features (package_id, feature_key, feature_value)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'max_applications', '50'),
  ('11111111-1111-4111-8111-111111111111', 'portfolio_limit', '60'),
  ('11111111-1111-4111-8111-111111111111', 'featured_profile', 'true'),
  ('22222222-2222-4222-8222-222222222222', 'max_applications', '90'),
  ('22222222-2222-4222-8222-222222222222', 'max_chats', '120'),
  ('22222222-2222-4222-8222-222222222222', 'priority_discovery', 'true'),
  ('33333333-3333-4333-8333-333333333333', 'portfolio_limit', '55'),
  ('33333333-3333-4333-8333-333333333333', 'featured_profile', 'true'),
  ('44444444-4444-4444-8444-444444444444', 'restaurant_campaign_requests', '40'),
  ('44444444-4444-4444-8444-444444444444', 'review_portfolio_limit', '50'),
  ('55555555-5555-4555-8555-555555555555', 'job_posts', '20'),
  ('55555555-5555-4555-8555-555555555555', 'max_chats', '100'),
  ('66666666-6666-4666-8666-666666666666', 'job_posts', '30'),
  ('66666666-6666-4666-8666-666666666666', 'reviewer_shortlist', '150'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'job_posts', '20'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'creator_shortlist', '120'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'food_reviewer_shortlist', '120'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'max_chats', '100')
ON CONFLICT (package_id, feature_key) DO UPDATE SET
  feature_value = EXCLUDED.feature_value;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_active" ON public.categories;
CREATE POLICY "categories_select_active"
  ON public.categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "profile_categories_select_own_or_public" ON public.profile_categories;
CREATE POLICY "profile_categories_select_own_or_public"
  ON public.profile_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "brand_profiles_select_public" ON public.brand_profiles;
CREATE POLICY "brand_profiles_select_public"
  ON public.brand_profiles FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

DROP POLICY IF EXISTS "packages_select_active" ON public.packages;
CREATE POLICY "packages_select_active"
  ON public.packages FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "package_categories_select" ON public.package_categories;
CREATE POLICY "package_categories_select"
  ON public.package_categories FOR SELECT
  USING (package_id IN (SELECT id FROM public.packages WHERE is_active = true));

DROP POLICY IF EXISTS "package_plans_select_active" ON public.package_plans;
CREATE POLICY "package_plans_select_active"
  ON public.package_plans FOR SELECT
  USING (is_active = true AND package_id IN (SELECT id FROM public.packages WHERE is_active = true));

DROP POLICY IF EXISTS "package_features_select" ON public.package_features;
CREATE POLICY "package_features_select"
  ON public.package_features FOR SELECT
  USING (package_id IN (SELECT id FROM public.packages WHERE is_active = true));

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "usage_tracking_select_own" ON public.usage_tracking;
CREATE POLICY "usage_tracking_select_own"
  ON public.usage_tracking FOR SELECT
  USING (user_id = auth.uid());
