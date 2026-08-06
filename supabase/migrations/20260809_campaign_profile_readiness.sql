-- ============================================================
-- 20260809_campaign_profile_readiness.sql
-- Campaign launch — config + data backfill. NO schema changes.
--
-- Three independent fixes, all required before the public profile pages switch
-- to DynamicProfileRenderer:
--
--   1. talent `experience` becomes a CORE section.
--   2. brand gains a `bio` core section.
--   3. brand_profiles rows are created / status-synced from profiles.brand_status.
--
-- Idempotent. Re-running never resets an admin's is_enabled toggle and never
-- downgrades an already-approved brand.
-- Depends on: 20260723, 20260806_03, 20260806_08, 20260808
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TALENT: `experience` is CORE, not dynamic
--
-- 20260806_08 seeded it as kind='dynamic', which routes it through the generic
-- TimelineSection reading `profile_values`. But every talent's experience data
-- lives in `talent_profiles.social_links.experience` (CLAUDE.md §7), and the
-- component that reads that blob — ExperienceSection — is only reachable through
-- the core adapter, which the renderer picks by `kind`.
--
-- Left as 'dynamic' the public page would show an empty Experience card for
-- every existing talent while their real entries sat unread in the blob. This
-- is a routing fix, not a data migration: no row moves.
--
-- render_component stays 'timeline'. It is the fallback used only when no
-- adapter claims the key; the talent adapter does claim `experience`
-- (core-keys.ts TALENT_RENDERABLE_CORE_KEYS), so it never executes.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.profile_sections s
   SET kind   = 'core',
       weight = 0
  FROM public.profile_types t
 WHERE t.id = s.profile_type_id
   AND t.slug = 'talent'
   AND s.key  = 'experience'
   AND s.kind <> 'core';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BRAND: `bio` core section
--
-- The brand public page has always rendered profiles.bio as its main body, but
-- no section row backed it — so under the layout-driven renderer the brand
-- description would simply vanish. Weight 15; the brand provider's other five
-- sections sum to 100, so the service's normalization keeps the score honest.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, title, description, title_ar, title_en,
   kind, weight, visibility, render_component, display_order)
SELECT t.id, 'bio', 'About', 'Brand description. Backed by profiles.bio.',
       'نبذة عن العلامة', 'About',
       'core', 15, 'public', 'about', 15
FROM public.profile_types t WHERE t.slug = 'brand'
ON CONFLICT (profile_type_id, key) DO UPDATE
  SET title            = EXCLUDED.title,
      title_ar         = EXCLUDED.title_ar,
      title_en         = EXCLUDED.title_en,
      kind             = EXCLUDED.kind,
      visibility       = EXCLUDED.visibility,
      render_component = EXCLUDED.render_component,
      display_order    = EXCLUDED.display_order;
      -- weight deliberately not overwritten: an admin may have retuned it.

-- Re-state the brand layout so `bio` gets a slot. Keys absent from a layout are
-- hidden, so adding the section without adding the slot would change nothing.
UPDATE public.profile_layouts l
   SET layout = '{"main":["bio","company_info","industry","campaign_preferences"],
                  "sidebar":["verification","social"]}'::jsonb
  FROM public.profile_types t
 WHERE t.id = l.profile_type_id
   AND t.slug = 'brand'
   AND l.variant = 'public';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BRAND: backfill brand_profiles and reconcile the two approval flags
--
-- CLAUDE.md §8 documents three overlapping status concepts. Brands carry two:
--   • profiles.brand_status        — what the admin back-office writes today
--   • brand_profiles.status        — what BrandProvider's public gate reads
--
-- brand_profiles.status DEFAULTS to 'pending'. Any brand approved through the
-- admin UI before this migration therefore has brand_status='approved' and
-- status='pending', and would 404 the moment the public page starts asking the
-- provider. Every approved brand disappearing on launch day is the single
-- worst-case outcome of the switch, so it is fixed here rather than by
-- weakening the gate.
--
-- Direction is one-way on purpose: brand_status drives brand_profiles.status,
-- never the reverse, and an already-approved brand_profiles row is left alone.
-- Unifying the two flags onto one column is post-campaign work.
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. Create the missing core rows. A brand with no brand_profiles row cannot
--     be loaded by the provider at all — not a gate failure, a NOT_FOUND.
INSERT INTO public.brand_profiles (user_id, company_name, status)
SELECT p.id,
       p.full_name,
       CASE WHEN p.brand_status = 'approved' THEN 'approved' ELSE 'pending' END
FROM public.profiles p
WHERE p.role IN ('brand', 'client')
  AND NOT EXISTS (SELECT 1 FROM public.brand_profiles b WHERE b.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- 3b. Promote rows the admin already approved via the legacy flag.
UPDATE public.brand_profiles b
   SET status      = 'approved',
       approved_at = COALESCE(b.approved_at, p.brand_approved_at, now())
  FROM public.profiles p
 WHERE p.id = b.user_id
   AND p.brand_status = 'approved'
   AND b.status <> 'approved';

-- 3c. Carry over an explicit rejection so a rejected brand does not read as
--     merely pending. Approved rows are never touched.
UPDATE public.brand_profiles b
   SET status           = 'rejected',
       rejection_reason = COALESCE(b.rejection_reason, p.brand_rejection_reason)
  FROM public.profiles p
 WHERE p.id = b.user_id
   AND p.brand_status = 'rejected'
   AND b.status = 'pending';

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE
  exp_kind      text;
  brand_bio     integer;
  missing_rows  integer;
  status_drift  integer;
  orphan_keys   integer;
BEGIN
  SELECT s.kind INTO exp_kind
    FROM public.profile_sections s
    JOIN public.profile_types t ON t.id = s.profile_type_id
   WHERE t.slug = 'talent' AND s.key = 'experience';

  SELECT count(*) INTO brand_bio
    FROM public.profile_sections s
    JOIN public.profile_types t ON t.id = s.profile_type_id
   WHERE t.slug = 'brand' AND s.key = 'bio';

  SELECT count(*) INTO missing_rows
    FROM public.profiles p
   WHERE p.role IN ('brand', 'client')
     AND NOT EXISTS (SELECT 1 FROM public.brand_profiles b WHERE b.user_id = p.id);

  SELECT count(*) INTO status_drift
    FROM public.profiles p
    JOIN public.brand_profiles b ON b.user_id = p.id
   WHERE p.brand_status = 'approved' AND b.status <> 'approved';

  SELECT count(*) INTO orphan_keys
    FROM public.profile_layouts l
    CROSS JOIN LATERAL jsonb_array_elements_text(
      COALESCE(l.layout->'main','[]'::jsonb) || COALESCE(l.layout->'sidebar','[]'::jsonb)
    ) AS k(section_key)
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profile_sections s
      WHERE s.profile_type_id = l.profile_type_id AND s.key = k.section_key
   );

  RAISE NOTICE 'OK 20260809: experience kind=%, brand bio sections=%, brands missing core row=%, approved-but-pending=%, orphan layout keys=%',
    exp_kind, brand_bio, missing_rows, status_drift, orphan_keys;

  IF exp_kind IS DISTINCT FROM 'core' THEN
    RAISE WARNING 'talent.experience is still % — ExperienceSection will not render', exp_kind;
  END IF;

  IF missing_rows > 0 OR status_drift > 0 THEN
    RAISE WARNING 'brand backfill incomplete: % missing rows, % status drift — those brands will 404 publicly',
      missing_rows, status_drift;
  END IF;
END $$;
