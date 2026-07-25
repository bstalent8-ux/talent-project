-- Seed three visible pricing cards for every marketplace role/category.
-- Safe to run repeatedly. IDs are deterministic from category + tier.

WITH package_seed AS (
  SELECT
    c.id AS category_id,
    c.role_type,
    c.label_en,
    tier.tier_key,
    tier.tier_name,
    tier.sort_order,
    CASE
      WHEN c.role_type = 'brand' THEN tier.brand_price
      ELSE tier.talent_price
    END AS price,
    (
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 1, 8) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 9, 4) || '-4' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 14, 3) || '-8' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 18, 3) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 21, 12)
    )::uuid AS package_id
  FROM public.categories c
  CROSS JOIN (
    VALUES
      ('starter', 'Starter', 1, 490::numeric, 1490::numeric),
      ('pro', 'Professional', 2, 990::numeric, 2990::numeric),
      ('scale', 'Company', 3, 1890::numeric, 5490::numeric)
  ) AS tier(tier_key, tier_name, sort_order, talent_price, brand_price)
  WHERE c.is_active = true
    AND c.role_type IN ('talent', 'brand')
)
INSERT INTO public.packages (id, name, description, is_active)
SELECT
  package_id,
  label_en || ' ' || tier_name,
  CASE
    WHEN role_type = 'brand' THEN tier_name || ' package for brands testing campaigns and creator shortlists.'
    ELSE tier_name || ' package for talents testing visibility, applications, and profile growth.'
  END,
  true
FROM package_seed
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

WITH package_seed AS (
  SELECT
    c.id AS category_id,
    tier.tier_key,
    (
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 1, 8) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 9, 4) || '-4' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 14, 3) || '-8' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 18, 3) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 21, 12)
    )::uuid AS package_id
  FROM public.categories c
  CROSS JOIN (VALUES ('starter'), ('pro'), ('scale')) AS tier(tier_key)
  WHERE c.is_active = true
    AND c.role_type IN ('talent', 'brand')
)
INSERT INTO public.package_categories (package_id, category_id)
SELECT package_id, category_id
FROM package_seed
ON CONFLICT (package_id, category_id) DO NOTHING;

WITH package_seed AS (
  SELECT
    c.id AS category_id,
    c.role_type,
    tier.tier_key,
    CASE
      WHEN c.role_type = 'brand' THEN tier.brand_price
      ELSE tier.talent_price
    END AS price,
    (
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 1, 8) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 9, 4) || '-4' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 14, 3) || '-8' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 18, 3) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 21, 12)
    )::uuid AS package_id
  FROM public.categories c
  CROSS JOIN (
    VALUES
      ('starter', 490::numeric, 1490::numeric),
      ('pro', 990::numeric, 2990::numeric),
      ('scale', 1890::numeric, 5490::numeric)
  ) AS tier(tier_key, talent_price, brand_price)
  WHERE c.is_active = true
    AND c.role_type IN ('talent', 'brand')
)
INSERT INTO public.package_plans (package_id, duration_months, price, currency, is_active)
SELECT package_id, 1, price, 'EGP', true
FROM package_seed
ON CONFLICT (package_id, duration_months, currency) DO UPDATE SET
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

WITH package_seed AS (
  SELECT
    c.id AS category_id,
    c.role_type,
    tier.tier_key,
    (
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 1, 8) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 9, 4) || '-4' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 14, 3) || '-8' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 18, 3) || '-' ||
      substr(md5('v1-demo-package:' || c.id || ':' || tier.tier_key), 21, 12)
    )::uuid AS package_id
  FROM public.categories c
  CROSS JOIN (VALUES ('starter'), ('pro'), ('scale')) AS tier(tier_key)
  WHERE c.is_active = true
    AND c.role_type IN ('talent', 'brand')
),
feature_seed AS (
  SELECT package_id, 'monthly_actions' AS feature_key,
    CASE tier_key WHEN 'starter' THEN '10' WHEN 'pro' THEN '30' ELSE '75' END AS feature_value
  FROM package_seed
  UNION ALL
  SELECT package_id, 'priority_visibility',
    CASE tier_key WHEN 'starter' THEN 'basic' WHEN 'pro' THEN 'high' ELSE 'premium' END
  FROM package_seed
  UNION ALL
  SELECT package_id, 'support_level',
    CASE tier_key WHEN 'starter' THEN 'standard' WHEN 'pro' THEN 'priority' ELSE 'dedicated' END
  FROM package_seed
)
INSERT INTO public.package_features (package_id, feature_key, feature_value)
SELECT package_id, feature_key, feature_value
FROM feature_seed
ON CONFLICT (package_id, feature_key) DO UPDATE SET
  feature_value = EXCLUDED.feature_value;
