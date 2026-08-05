-- ============================================================
-- 20260806_08_seed_profile_schema.sql
-- Profile Architecture V2 — Phase 1: config seed.
--
-- Seeds sections, fields and layouts. This is CONFIG DATA, not schema.
-- Nothing renders it yet — Phase 3 builds the renderer.
--
-- Idempotent: every insert is ON CONFLICT DO UPDATE on the natural key, and
-- re-running never resets an admin's is_enabled toggle.
--
-- Depends on: 20260806_03, 20260806_04
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TALENT SECTIONS
--
-- kind = 'core'    → satisfied by an existing strongly typed column. Listed so
--                    Phase 3 can score and order it, but NO profile_values row
--                    will ever exist for it and no fields are defined.
-- kind = 'dynamic' → new capability, backed by profile_values.
--
-- Weights are seeded to match the existing hardcoded weights in
-- lib/profile-completion.ts where a section already exists there, so the
-- Phase 3 engine can reproduce today's scores exactly. New dynamic sections
-- get weight 0 — they must not change anybody's completion score on day one.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, title, description, title_ar, title_en,
   kind, weight, visibility, render_component, display_order)
SELECT t.id, v.key, v.title, v.description, v.title_ar, v.title_en,
       v.kind, v.weight, v.visibility, v.render_component, v.display_order
FROM public.profile_types t
JOIN (VALUES
  ('bio',       'Bio',        'Short personal bio. Backed by profiles.bio / talent_profiles.bio.',
                'النبذة الشخصية', 'Bio',
                'core',    5, 'public', 'about',          10),
  ('portfolio', 'Portfolio',  'Work samples. Backed by the portfolio_items table.',
                'معرض الأعمال',   'Portfolio',
                'core',   15, 'public', 'portfolio',      20),
  ('experience','Experience', 'Past collaborations and roles.',
                'الخبرات',        'Experience',
                'dynamic', 0, 'public', 'timeline',       30),
  ('equipment', 'Equipment',  'Gear the talent owns and can shoot with.',
                'المعدات',        'Equipment',
                'dynamic', 0, 'public', 'key_value_list', 40),
  ('awards',    'Awards',     'Awards, features and recognitions.',
                'الجوائز',        'Awards',
                'dynamic', 0, 'public', 'timeline',       50)
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

-- ─────────────────────────────────────────────────────────────────────────────
-- BRAND SECTIONS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, title, description, title_ar, title_en,
   kind, weight, visibility, render_component, display_order)
SELECT t.id, v.key, v.title, v.description, v.title_ar, v.title_en,
       v.kind, v.weight, v.visibility, v.render_component, v.display_order
FROM public.profile_types t
JOIN (VALUES
  ('company_info',        'Company info',
                          'Company name, website. Backed by brand_profiles columns.',
                          'بيانات الشركة', 'Company info',
                          'core',   30, 'public', 'hero',           10),
  ('industry',            'Industry',
                          'Industry / category. Backed by brand_profiles.industry + category_id.',
                          'المجال',        'Industry',
                          'core',   20, 'public', 'about',          20),
  ('campaign_preferences','Campaign preferences',
                          'What kind of campaigns this brand runs and who it wants to work with.',
                          'تفضيلات الحملات','Campaign preferences',
                          'dynamic', 0, 'public', 'key_value_list', 30)
) AS v(key, title, description, title_ar, title_en,
       kind, weight, visibility, render_component, display_order) ON true
WHERE t.slug = 'brand'
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

-- No sections are seeded for 'agency': the type is inactive and agency_profiles
-- does not exist. Phase 5 seeds them.

-- ─────────────────────────────────────────────────────────────────────────────
-- FIELDS — talent / equipment
-- Exercises: text, multi_select, boolean, number.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_fields
  (section_id, key, label, label_ar, label_en, field_type,
   is_required, validation_schema, options, weight, display_order)
SELECT s.id, v.key, v.label, v.label_ar, v.label_en, v.field_type,
       v.is_required, v.validation_schema::jsonb, v.options::jsonb, v.weight, v.display_order
FROM public.profile_sections s
JOIN public.profile_types t ON t.id = s.profile_type_id
JOIN (VALUES
  ('camera_body', 'Camera body', 'الكاميرا', 'Camera body', 'text',
   false, '{"maxLength":80}', '[]', 1, 10),

  ('lenses', 'Lenses', 'العدسات', 'Lenses', 'multi_select',
   false, '{"maxItems":12}',
   '[{"value":"24_70","label_ar":"24-70 مم","label_en":"24-70mm"},
     {"value":"50",   "label_ar":"50 مم",   "label_en":"50mm"},
     {"value":"85",   "label_ar":"85 مم",   "label_en":"85mm"},
     {"value":"macro","label_ar":"ماكرو",   "label_en":"Macro"}]', 1, 20),

  ('owns_studio', 'Owns a studio', 'يمتلك استوديو', 'Owns a studio', 'boolean',
   false, '{}', '[]', 1, 30),

  ('lighting_kits', 'Lighting kits', 'وحدات الإضاءة', 'Lighting kits', 'number',
   false, '{"min":0,"max":50,"step":1}', '[]', 1, 40)
) AS v(key, label, label_ar, label_en, field_type,
       is_required, validation_schema, options, weight, display_order) ON true
WHERE t.slug = 'talent' AND s.key = 'equipment'
ON CONFLICT (section_id, key) DO UPDATE
  SET label             = EXCLUDED.label,
      label_ar          = EXCLUDED.label_ar,
      label_en          = EXCLUDED.label_en,
      field_type        = EXCLUDED.field_type,
      is_required       = EXCLUDED.is_required,
      validation_schema = EXCLUDED.validation_schema,
      options           = EXCLUDED.options,
      weight            = EXCLUDED.weight,
      display_order     = EXCLUDED.display_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIELDS — talent / awards
-- Exercises: text, number, media.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_fields
  (section_id, key, label, label_ar, label_en, field_type,
   is_required, validation_schema, options, weight, display_order)
SELECT s.id, v.key, v.label, v.label_ar, v.label_en, v.field_type,
       v.is_required, v.validation_schema::jsonb, v.options::jsonb, v.weight, v.display_order
FROM public.profile_sections s
JOIN public.profile_types t ON t.id = s.profile_type_id
JOIN (VALUES
  ('award_title', 'Award title', 'اسم الجائزة', 'Award title', 'text',
   true, '{"minLength":2,"maxLength":120}', '[]', 1, 10),
  ('award_year', 'Year', 'السنة', 'Year', 'number',
   false, '{"min":1980,"max":2100,"step":1}', '[]', 1, 20),
  ('award_image', 'Certificate image', 'صورة الشهادة', 'Certificate image', 'media',
   false, '{"accept":"image/*"}', '[]', 0, 30)
) AS v(key, label, label_ar, label_en, field_type,
       is_required, validation_schema, options, weight, display_order) ON true
WHERE t.slug = 'talent' AND s.key = 'awards'
ON CONFLICT (section_id, key) DO UPDATE
  SET label             = EXCLUDED.label,
      label_ar          = EXCLUDED.label_ar,
      label_en          = EXCLUDED.label_en,
      field_type        = EXCLUDED.field_type,
      validation_schema = EXCLUDED.validation_schema,
      weight            = EXCLUDED.weight,
      display_order     = EXCLUDED.display_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIELDS — talent / experience
-- Exercises: json (a repeating structured list; child shape lives in `options`).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_fields
  (section_id, key, label, label_ar, label_en, field_type,
   is_required, validation_schema, options, weight, display_order)
SELECT s.id, 'entries', 'Experience entries', 'سجل الخبرات', 'Experience entries', 'json',
       false, '{"maxItems":25}'::jsonb,
       '[{"key":"name","field_type":"text","label_ar":"الجهة","label_en":"Organisation"},
         {"key":"year","field_type":"number","label_ar":"السنة","label_en":"Year"},
         {"key":"role","field_type":"text","label_ar":"الدور","label_en":"Role"}]'::jsonb,
       1, 10
FROM public.profile_sections s
JOIN public.profile_types t ON t.id = s.profile_type_id
WHERE t.slug = 'talent' AND s.key = 'experience'
ON CONFLICT (section_id, key) DO UPDATE
  SET validation_schema = EXCLUDED.validation_schema,
      options           = EXCLUDED.options;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIELDS — brand / campaign_preferences
-- Exercises: select, multi_select, number, text.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_fields
  (section_id, key, label, label_ar, label_en, field_type,
   is_required, validation_schema, options, weight, display_order)
SELECT s.id, v.key, v.label, v.label_ar, v.label_en, v.field_type,
       v.is_required, v.validation_schema::jsonb, v.options::jsonb, v.weight, v.display_order
FROM public.profile_sections s
JOIN public.profile_types t ON t.id = s.profile_type_id
JOIN (VALUES
  ('campaign_frequency', 'Campaign frequency', 'معدل الحملات', 'Campaign frequency', 'select',
   false, '{}',
   '[{"value":"monthly",   "label_ar":"شهري",   "label_en":"Monthly"},
     {"value":"quarterly", "label_ar":"ربع سنوي","label_en":"Quarterly"},
     {"value":"seasonal",  "label_ar":"موسمي",  "label_en":"Seasonal"},
     {"value":"one_off",   "label_ar":"مرة واحدة","label_en":"One-off"}]', 1, 10),

  ('preferred_content', 'Preferred content types', 'أنواع المحتوى المفضلة', 'Preferred content types', 'multi_select',
   false, '{"maxItems":8}',
   '[{"value":"ugc",      "label_ar":"محتوى المستخدم","label_en":"UGC"},
     {"value":"reels",    "label_ar":"ريلز",          "label_en":"Reels"},
     {"value":"photo",    "label_ar":"تصوير فوتوغرافي","label_en":"Photography"},
     {"value":"event",    "label_ar":"فعاليات",        "label_en":"Events"}]', 1, 20),

  ('typical_budget', 'Typical campaign budget (EGP)', 'الميزانية المعتادة (ج.م)', 'Typical campaign budget (EGP)', 'number',
   false, '{"min":0,"max":10000000}', '[]', 0, 30),

  ('notes', 'Notes for talents', 'ملاحظات للمواهب', 'Notes for talents', 'text',
   false, '{"maxLength":600}', '[]', 0, 40)
) AS v(key, label, label_ar, label_en, field_type,
       is_required, validation_schema, options, weight, display_order) ON true
WHERE t.slug = 'brand' AND s.key = 'campaign_preferences'
ON CONFLICT (section_id, key) DO UPDATE
  SET label             = EXCLUDED.label,
      label_ar          = EXCLUDED.label_ar,
      label_en          = EXCLUDED.label_en,
      field_type        = EXCLUDED.field_type,
      validation_schema = EXCLUDED.validation_schema,
      options           = EXCLUDED.options,
      weight            = EXCLUDED.weight,
      display_order     = EXCLUDED.display_order;

-- NOTE: `typical_budget` is display-only marketing context, NOT a price the
-- platform transacts on. Money the platform actually charges (packages, usage
-- add-ons) stays in strongly typed columns and must never move into
-- profile_values.

-- ─────────────────────────────────────────────────────────────────────────────
-- LAYOUTS — ordering only. Values are profile_sections.key strings.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_layouts (profile_type_id, variant, layout)
SELECT t.id, 'public',
  '{"main":["portfolio","experience","equipment","awards"],
    "sidebar":["bio"]}'::jsonb
FROM public.profile_types t WHERE t.slug = 'talent'
ON CONFLICT (profile_type_id, variant) DO UPDATE SET layout = EXCLUDED.layout;

INSERT INTO public.profile_layouts (profile_type_id, variant, layout)
SELECT t.id, 'public',
  '{"main":["company_info","industry","campaign_preferences"],
    "sidebar":[]}'::jsonb
FROM public.profile_types t WHERE t.slug = 'brand'
ON CONFLICT (profile_type_id, variant) DO UPDATE SET layout = EXCLUDED.layout;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE secs integer; flds integer; lays integer; orphan_keys integer;
BEGIN
  SELECT count(*) INTO secs FROM public.profile_sections;
  SELECT count(*) INTO flds FROM public.profile_fields;
  SELECT count(*) INTO lays FROM public.profile_layouts;

  -- Every key referenced by a layout must resolve to a real section.
  SELECT count(*) INTO orphan_keys
    FROM public.profile_layouts l
    CROSS JOIN LATERAL jsonb_array_elements_text(
      COALESCE(l.layout->'main','[]'::jsonb) || COALESCE(l.layout->'sidebar','[]'::jsonb)
    ) AS k(section_key)
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profile_sections s
      WHERE s.profile_type_id = l.profile_type_id AND s.key = k.section_key
   );

  RAISE NOTICE 'OK 20260806_08: % sections, % fields, % layouts, % orphan layout keys',
    secs, flds, lays, orphan_keys;

  IF orphan_keys > 0 THEN
    RAISE WARNING 'layout references % section keys that do not exist; they will be skipped at render time', orphan_keys;
  END IF;
END $$;
