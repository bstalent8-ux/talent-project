-- Dynamic package and subscription system.
-- Safe to run more than once; does not modify legacy talent_profiles.packages.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_category text;

CREATE TABLE IF NOT EXISTS public.talent_types (
  id         text PRIMARY KEY,
  label_ar   text NOT NULL,
  label_en   text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.package_targets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'talent_type' CHECK (target_type IN ('talent_type','all_talents','role','all_roles')),
  target_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, target_type, target_id)
);

ALTER TABLE public.package_targets DROP CONSTRAINT IF EXISTS package_targets_target_id_fkey;
ALTER TABLE public.package_targets DROP CONSTRAINT IF EXISTS package_targets_target_type_check;
ALTER TABLE public.package_targets
  ADD CONSTRAINT package_targets_target_type_check
  CHECK (target_type IN ('talent_type','all_talents','role','all_roles'));

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
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('pending','active','cancelled','expired')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_package_targets_target
  ON public.package_targets(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_package_targets_package
  ON public.package_targets(package_id);
CREATE INDEX IF NOT EXISTS idx_package_plans_package
  ON public.package_plans(package_id);
CREATE INDEX IF NOT EXISTS idx_package_features_package
  ON public.package_features(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
  ON public.subscriptions(user_id)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS set_talent_types_updated_at ON public.talent_types;
CREATE TRIGGER set_talent_types_updated_at
  BEFORE UPDATE ON public.talent_types
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

INSERT INTO public.talent_types (id, label_ar, label_en, sort_order)
VALUES
  ('ugc', 'مبدع محتوى UGC', 'UGC Creator', 10),
  ('influencer', 'مؤثر', 'Influencer', 20),
  ('fashion', 'موضة وأزياء', 'Fashion', 30),
  ('food_reviewer', 'مراجع مطاعم وأكل', 'Food Reviewer', 40),
  ('media_buyers', 'ميديا بايرز', 'Media Buyers', 50),
  ('host', 'مذيع / مقدم', 'Host / Presenter', 60),
  ('model', 'موديل', 'Model', 70),
  ('actor', 'ممثل', 'Actor', 80),
  ('photographer', 'مصور', 'Photographer', 90),
  ('videographer', 'مصوري فيديو', 'Videographer', 100),
  ('designer', 'مصمم', 'Designer', 110)
ON CONFLICT (id) DO UPDATE SET
  label_ar = EXCLUDED.label_ar,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

INSERT INTO public.packages (id, name, description, is_active)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Creator Growth', 'A starter package available for every talent type to grow visibility and receive more campaign requests.', true),
  ('22222222-2222-4222-8222-222222222222', 'UGC Creator Pro', 'Built for UGC creators who need more portfolio capacity, briefs, and featured placement.', true),
  ('33333333-3333-4333-8333-333333333333', 'Influencer Elite', 'Premium discovery and campaign tools for influencers working with fast-moving brands.', true),
  ('44444444-4444-4444-8444-444444444444', 'Host Starter', 'A focused plan for hosts and presenters building a professional booking pipeline.', true),
  ('55555555-5555-4555-8555-555555555555', 'Brand Campaign Pro', 'For brands that want to post jobs, shortlist talent, and manage campaign conversations faster.', true),
  ('66666666-6666-4666-8666-666666666666', 'Marketplace Access', 'A universal package available for every account role across the marketplace.', true),
  ('77777777-7777-4777-8777-777777777777', 'Fashion Creator Plus', 'For fashion creators who need stronger profile visibility, portfolio space, and brand campaign discovery.', true),
  ('88888888-8888-4888-8888-888888888888', 'Food Reviewer Pro', 'For food reviewers creating restaurant content, reviews, and campaign-ready portfolio proof.', true),
  ('99999999-9999-4999-8999-999999999999', 'Media Buyer Growth', 'For media buyers who need campaign visibility, lead access, and professional marketplace credibility.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

INSERT INTO public.package_targets (package_id, target_type, target_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'all_talents', 'all'),
  ('22222222-2222-4222-8222-222222222222', 'talent_type', 'ugc'),
  ('33333333-3333-4333-8333-333333333333', 'talent_type', 'influencer'),
  ('44444444-4444-4444-8444-444444444444', 'talent_type', 'host'),
  ('55555555-5555-4555-8555-555555555555', 'role', 'brand'),
  ('66666666-6666-4666-8666-666666666666', 'all_roles', 'all'),
  ('77777777-7777-4777-8777-777777777777', 'talent_type', 'fashion'),
  ('88888888-8888-4888-8888-888888888888', 'talent_type', 'food_reviewer'),
  ('99999999-9999-4999-8999-999999999999', 'talent_type', 'media_buyers')
ON CONFLICT (package_id, target_type, target_id) DO NOTHING;

INSERT INTO public.package_plans (id, package_id, duration_months, price, currency, is_active)
VALUES
  ('11111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 1, 650, 'EGP', true),
  ('11111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111', 3, 1750, 'EGP', true),
  ('11111111-1111-4111-8111-111111111106', '11111111-1111-4111-8111-111111111111', 6, 3200, 'EGP', true),
  ('11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 12, 5800, 'EGP', true),
  ('22222222-2222-4222-8222-222222222201', '22222222-2222-4222-8222-222222222222', 1, 950, 'EGP', true),
  ('22222222-2222-4222-8222-222222222203', '22222222-2222-4222-8222-222222222222', 3, 2550, 'EGP', true),
  ('22222222-2222-4222-8222-222222222206', '22222222-2222-4222-8222-222222222222', 6, 4800, 'EGP', true),
  ('22222222-2222-4222-8222-222222222212', '22222222-2222-4222-8222-222222222222', 12, 8500, 'EGP', true),
  ('33333333-3333-4333-8333-333333333301', '33333333-3333-4333-8333-333333333333', 1, 1400, 'EGP', true),
  ('33333333-3333-4333-8333-333333333303', '33333333-3333-4333-8333-333333333333', 3, 3900, 'EGP', true),
  ('33333333-3333-4333-8333-333333333306', '33333333-3333-4333-8333-333333333333', 6, 7400, 'EGP', true),
  ('33333333-3333-4333-8333-333333333312', '33333333-3333-4333-8333-333333333333', 12, 13200, 'EGP', true),
  ('44444444-4444-4444-8444-444444444401', '44444444-4444-4444-8444-444444444444', 1, 500, 'EGP', true),
  ('44444444-4444-4444-8444-444444444403', '44444444-4444-4444-8444-444444444444', 3, 1350, 'EGP', true),
  ('44444444-4444-4444-8444-444444444406', '44444444-4444-4444-8444-444444444444', 6, 2500, 'EGP', true),
  ('44444444-4444-4444-8444-444444444412', '44444444-4444-4444-8444-444444444444', 12, 4600, 'EGP', true),
  ('55555555-5555-4555-8555-555555555501', '55555555-5555-4555-8555-555555555555', 1, 1800, 'EGP', true),
  ('55555555-5555-4555-8555-555555555503', '55555555-5555-4555-8555-555555555555', 3, 5000, 'EGP', true),
  ('55555555-5555-4555-8555-555555555506', '55555555-5555-4555-8555-555555555555', 6, 9400, 'EGP', true),
  ('55555555-5555-4555-8555-555555555512', '55555555-5555-4555-8555-555555555555', 12, 17000, 'EGP', true),
  ('66666666-6666-4666-8666-666666666601', '66666666-6666-4666-8666-666666666666', 1, 300, 'EGP', true),
  ('66666666-6666-4666-8666-666666666603', '66666666-6666-4666-8666-666666666666', 3, 800, 'EGP', true),
  ('66666666-6666-4666-8666-666666666606', '66666666-6666-4666-8666-666666666666', 6, 1500, 'EGP', true),
  ('66666666-6666-4666-8666-666666666612', '66666666-6666-4666-8666-666666666666', 12, 2800, 'EGP', true),
  ('77777777-7777-4777-8777-777777777701', '77777777-7777-4777-8777-777777777777', 1, 900, 'EGP', true),
  ('77777777-7777-4777-8777-777777777703', '77777777-7777-4777-8777-777777777777', 3, 2450, 'EGP', true),
  ('77777777-7777-4777-8777-777777777706', '77777777-7777-4777-8777-777777777777', 6, 4600, 'EGP', true),
  ('77777777-7777-4777-8777-777777777712', '77777777-7777-4777-8777-777777777777', 12, 8200, 'EGP', true),
  ('88888888-8888-4888-8888-888888888801', '88888888-8888-4888-8888-888888888888', 1, 850, 'EGP', true),
  ('88888888-8888-4888-8888-888888888803', '88888888-8888-4888-8888-888888888888', 3, 2300, 'EGP', true),
  ('88888888-8888-4888-8888-888888888806', '88888888-8888-4888-8888-888888888888', 6, 4300, 'EGP', true),
  ('88888888-8888-4888-8888-888888888812', '88888888-8888-4888-8888-888888888888', 12, 7600, 'EGP', true),
  ('99999999-9999-4999-8999-999999999901', '99999999-9999-4999-8999-999999999999', 1, 1200, 'EGP', true),
  ('99999999-9999-4999-8999-999999999903', '99999999-9999-4999-8999-999999999999', 3, 3300, 'EGP', true),
  ('99999999-9999-4999-8999-999999999906', '99999999-9999-4999-8999-999999999999', 6, 6200, 'EGP', true),
  ('99999999-9999-4999-8999-999999999912', '99999999-9999-4999-8999-999999999999', 12, 11200, 'EGP', true)
ON CONFLICT (package_id, duration_months, currency) DO UPDATE SET
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

INSERT INTO public.package_features (package_id, feature_key, feature_value)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'max_campaign_requests', '25'),
  ('11111111-1111-4111-8111-111111111111', 'portfolio_limit', '30'),
  ('11111111-1111-4111-8111-111111111111', 'profile_boost', 'standard'),
  ('22222222-2222-4222-8222-222222222222', 'max_campaign_requests', '50'),
  ('22222222-2222-4222-8222-222222222222', 'portfolio_limit', '60'),
  ('22222222-2222-4222-8222-222222222222', 'featured_profile', 'true'),
  ('22222222-2222-4222-8222-222222222222', 'ugc_brief_templates', '12'),
  ('33333333-3333-4333-8333-333333333333', 'max_campaign_requests', '90'),
  ('33333333-3333-4333-8333-333333333333', 'featured_profile', 'true'),
  ('33333333-3333-4333-8333-333333333333', 'priority_discovery', 'true'),
  ('33333333-3333-4333-8333-333333333333', 'analytics_snapshot', 'monthly'),
  ('44444444-4444-4444-8444-444444444444', 'max_campaign_requests', '20'),
  ('44444444-4444-4444-8444-444444444444', 'portfolio_limit', '20'),
  ('44444444-4444-4444-8444-444444444444', 'booking_visibility', 'standard'),
  ('55555555-5555-4555-8555-555555555555', 'job_posts', '20'),
  ('55555555-5555-4555-8555-555555555555', 'shortlist_limit', '150'),
  ('55555555-5555-4555-8555-555555555555', 'chat_sessions', '100'),
  ('55555555-5555-4555-8555-555555555555', 'campaign_support', 'priority'),
  ('66666666-6666-4666-8666-666666666666', 'marketplace_access', 'true'),
  ('66666666-6666-4666-8666-666666666666', 'profile_visibility', 'standard'),
  ('66666666-6666-4666-8666-666666666666', 'support_level', 'community'),
  ('77777777-7777-4777-8777-777777777777', 'portfolio_limit', '55'),
  ('77777777-7777-4777-8777-777777777777', 'style_campaign_requests', '45'),
  ('77777777-7777-4777-8777-777777777777', 'featured_profile', 'true'),
  ('88888888-8888-4888-8888-888888888888', 'restaurant_campaign_requests', '40'),
  ('88888888-8888-4888-8888-888888888888', 'review_portfolio_limit', '50'),
  ('88888888-8888-4888-8888-888888888888', 'featured_profile', 'true'),
  ('99999999-9999-4999-8999-999999999999', 'lead_access', '60'),
  ('99999999-9999-4999-8999-999999999999', 'campaign_case_studies', '25'),
  ('99999999-9999-4999-8999-999999999999', 'priority_discovery', 'true')
ON CONFLICT (package_id, feature_key) DO UPDATE SET
  feature_value = EXCLUDED.feature_value;

ALTER TABLE public.talent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "talent_types_select_active" ON public.talent_types;
CREATE POLICY "talent_types_select_active"
  ON public.talent_types FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "packages_select_active" ON public.packages;
CREATE POLICY "packages_select_active"
  ON public.packages FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "package_targets_select" ON public.package_targets;
CREATE POLICY "package_targets_select"
  ON public.package_targets FOR SELECT
  USING (
    package_id IN (SELECT id FROM public.packages WHERE is_active = true)
  );

DROP POLICY IF EXISTS "package_plans_select_active" ON public.package_plans;
CREATE POLICY "package_plans_select_active"
  ON public.package_plans FOR SELECT
  USING (
    is_active = true
    AND package_id IN (SELECT id FROM public.packages WHERE is_active = true)
  );

DROP POLICY IF EXISTS "package_features_select" ON public.package_features;
CREATE POLICY "package_features_select"
  ON public.package_features FOR SELECT
  USING (
    package_id IN (SELECT id FROM public.packages WHERE is_active = true)
  );

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());
