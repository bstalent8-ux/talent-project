-- ============================================================
-- 20260808_seed_talent_core_sections.sql
-- Campaign launch — config seed, NOT schema.
--
-- 20260806_08 seeded only the sections the dynamic renderer needed for the
-- admin preview (bio, portfolio + three dynamic ones). The public talent page
-- now renders through DynamicProfileRenderer, so every core section that has a
-- real component must exist as a row — otherwise the layout cannot order it and
-- the profile loses its hero, packages and reviews.
--
-- Keys are byte-identical to:
--   components/profile/dynamic/adapters/core-keys.ts   (renderable / inline)
--   lib/profile-completion.ts                          (completion weights)
-- so a section that scores for completion is the same section that can appear.
--
-- Weights mirror lib/profile-completion.ts exactly; nobody's score moves.
--
-- Idempotent. Re-running never resets an admin's is_enabled toggle.
-- Depends on: 20260806_03, 20260806_04, 20260806_08
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TALENT CORE SECTIONS
--
-- render_component is a KEY into components/profile/dynamic/registry.ts, used
-- only when no adapter claims the section. Core sections here are all claimed
-- by the talent adapter, so the value is a fallback, never executable content.
--
-- display_order leaves gaps of 10 so an admin can insert between rows without
-- a renumbering migration.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, title, description, title_ar, title_en,
   kind, weight, visibility, render_component, display_order)
SELECT t.id, v.key, v.title, v.description, v.title_ar, v.title_en,
       v.kind, v.weight, v.visibility, v.render_component, v.display_order
FROM public.profile_types t
JOIN (VALUES
  -- Identity block. `avatar` and `personal` are completion keys that render
  -- INSIDE the hero, which is why all three map to ProfileHero in the adapter.
  ('hero',         'Hero',          'Name, avatar, title, location. Backed by profiles + talent_profiles.',
                   'الملف الرئيسي',   'Hero',
                   'core',    0, 'public', 'hero',           5),
  ('avatar',       'Profile photo', 'Avatar image. Part of the hero block.',
                   'صورة الملف',      'Profile photo',
                   'core',   15, 'public', 'hero',           6),
  ('personal',     'Personal info', 'Full name and city. Part of the hero block.',
                   'المعلومات الشخصية','Personal info',
                   'core',   10, 'public', 'hero',           7),

  -- Rendered inside the hero, so no standalone component and no layout slot.
  ('categories',   'Categories',    'Main category and specialties.',
                   'التخصص والفئات',  'Categories',
                   'core',   10, 'public', 'about',          8),
  ('social',       'Social media',  'Instagram / TikTok / YouTube / LinkedIn handles.',
                   'مواقع التواصل',   'Social media',
                   'core',   10, 'public', 'social',         9),
  ('physical',     'Physical details','Height, weight, hair, languages, dialect.',
                   'البيانات الجسدية','Physical details',
                   'core',   10, 'public', 'attributes',    11),
  ('availability', 'Availability',  'Whether the talent is currently taking work.',
                   'حالة الإتاحة',    'Availability',
                   'core',    5, 'public', 'availability',  12),

  -- Standalone components, each claimed by the talent adapter.
  ('packages',     'Packages',      'Pricing tiers. Backed by talent_profiles.packages.',
                   'الباقات والأسعار','Packages',
                   'core',   10, 'public', 'packages',      25),
  ('usage_addons', 'Usage rights',  'Paid usage add-ons. Backed by social_links.usage_addons.',
                   'حقوق الاستخدام',  'Usage rights',
                   'core',   10, 'public', 'usage_rights',  35),
  ('performance',  'Performance',   'Rating and booking counts. Trigger-maintained.',
                   'الأداء',          'Performance',
                   'core',    0, 'public', 'stat_grid',     45),
  ('reviews',      'Reviews',       'Approved reviews. Backed by the reviews table.',
                   'التقييمات',       'Reviews',
                   'core',    0, 'public', 'card_grid',     55),
  ('brands',       'Brands',        'Collaborations. Backed by the talent_brands table.',
                   'البراندات',       'Brands',
                   'core',    0, 'public', 'chip_list',     65),
  ('trust',        'Trust',         'Static platform guarantees. Not user data.',
                   'الأمان',          'Trust',
                   'core',    0, 'public', 'trust',         75),

  -- Weight 0 and deliberately not public: "coming soon" in
  -- lib/profile-completion.ts. `admin` visibility keeps it out of every
  -- viewer-facing section list while still existing for the config screens.
  ('payment',      'Payment details','Payout details. Not built yet.',
                   'بيانات الدفع',    'Payment details',
                   'core',    0, 'admin',  'payment',       85)
) AS v(key, title, description, title_ar, title_en,
       kind, weight, visibility, render_component, display_order) ON true
WHERE t.slug = 'talent'
ON CONFLICT (profile_type_id, key) DO UPDATE
  SET title            = EXCLUDED.title,
      description      = EXCLUDED.description,
      title_ar         = EXCLUDED.title_ar,
      title_en         = EXCLUDED.title_en,
      kind             = EXCLUDED.kind,
      weight           = EXCLUDED.weight,
      visibility       = EXCLUDED.visibility,
      render_component = EXCLUDED.render_component,
      display_order    = EXCLUDED.display_order;
      -- is_enabled deliberately not overwritten.

-- 20260806_08 seeded `portfolio` at display_order 20 and `bio` at 10; the
-- experience/equipment/awards dynamic sections keep 30/40/50. Re-order the two
-- core ones into the new scheme so the fallback (displayOrder) ordering matches
-- the layout below when no layout row exists.
UPDATE public.profile_sections s
   SET display_order = 15
  FROM public.profile_types t
 WHERE t.id = s.profile_type_id AND t.slug = 'talent' AND s.key = 'portfolio';

UPDATE public.profile_sections s
   SET display_order = 10, render_component = 'about'
  FROM public.profile_types t
 WHERE t.id = s.profile_type_id AND t.slug = 'talent' AND s.key = 'bio';

-- ─────────────────────────────────────────────────────────────────────────────
-- BRAND CORE SECTIONS — the three the brand provider already scores.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, title, description, title_ar, title_en,
   kind, weight, visibility, render_component, display_order)
SELECT t.id, v.key, v.title, v.description, v.title_ar, v.title_en,
       v.kind, v.weight, v.visibility, v.render_component, v.display_order
FROM public.profile_types t
JOIN (VALUES
  ('logo',         'Logo',         'Brand logo. Backed by profiles.avatar_url.',
                   'الشعار',        'Logo',
                   'core',   15, 'public', 'hero',    5),
  ('social',       'Social media', 'Brand social accounts.',
                   'مواقع التواصل', 'Social media',
                   'core',   15, 'public', 'social', 25),
  ('verification', 'Verification', 'Brand approval state. Backed by brand_profiles.status.',
                   'التوثيق',       'Verification',
                   'core',   20, 'public', 'trust',  35)
) AS v(key, title, description, title_ar, title_en,
       kind, weight, visibility, render_component, display_order) ON true
WHERE t.slug = 'brand'
ON CONFLICT (profile_type_id, key) DO UPDATE
  SET title            = EXCLUDED.title,
      title_ar         = EXCLUDED.title_ar,
      title_en         = EXCLUDED.title_en,
      kind             = EXCLUDED.kind,
      weight           = EXCLUDED.weight,
      visibility       = EXCLUDED.visibility,
      render_component = EXCLUDED.render_component,
      display_order    = EXCLUDED.display_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- LAYOUTS
--
-- Reproduces the two-column composition TalentModelProfile hardcodes today
-- (its lines 96-110), so switching the public page to the layout-driven
-- renderer is not also a visual redesign.
--
-- Keys absent from a layout still render: DynamicProfileSections falls back to
-- displayOrder only when NO layout exists, so anything omitted here is
-- intentionally hidden. `hero` is chrome rendered above the slots by the page,
-- and the inline keys (avatar, personal, categories, social, physical,
-- availability, bio) render inside the hero — none of them belongs in a slot.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_layouts (profile_type_id, variant, layout)
SELECT t.id, 'public',
  '{"main":["portfolio","experience","packages","usage_addons","equipment","awards"],
    "sidebar":["bio","performance","reviews","brands","trust"]}'::jsonb
FROM public.profile_types t WHERE t.slug = 'talent'
ON CONFLICT (profile_type_id, variant) DO UPDATE SET layout = EXCLUDED.layout;

INSERT INTO public.profile_layouts (profile_type_id, variant, layout)
SELECT t.id, 'public',
  '{"main":["company_info","industry","campaign_preferences"],
    "sidebar":["verification","social"]}'::jsonb
FROM public.profile_types t WHERE t.slug = 'brand'
ON CONFLICT (profile_type_id, variant) DO UPDATE SET layout = EXCLUDED.layout;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE talent_secs integer; brand_secs integer; orphan_keys integer;
BEGIN
  SELECT count(*) INTO talent_secs
    FROM public.profile_sections s
    JOIN public.profile_types t ON t.id = s.profile_type_id
   WHERE t.slug = 'talent';

  SELECT count(*) INTO brand_secs
    FROM public.profile_sections s
    JOIN public.profile_types t ON t.id = s.profile_type_id
   WHERE t.slug = 'brand';

  SELECT count(*) INTO orphan_keys
    FROM public.profile_layouts l
    CROSS JOIN LATERAL jsonb_array_elements_text(
      COALESCE(l.layout->'main','[]'::jsonb) || COALESCE(l.layout->'sidebar','[]'::jsonb)
    ) AS k(section_key)
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profile_sections s
      WHERE s.profile_type_id = l.profile_type_id AND s.key = k.section_key
   );

  RAISE NOTICE 'OK 20260808: % talent sections, % brand sections, % orphan layout keys',
    talent_secs, brand_secs, orphan_keys;

  IF orphan_keys > 0 THEN
    RAISE WARNING 'layout references % section keys that do not exist; they will be skipped at render time', orphan_keys;
  END IF;
END $$;
