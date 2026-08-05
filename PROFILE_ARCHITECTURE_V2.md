# Profile Architecture V2 — Hybrid Dynamic Profile System

> **Status:** Implementation plan. Not yet built.
> **Author role:** Staff architecture / DB migration.
> **Companion docs:** [CLAUDE.md](./CLAUDE.md) (current real system), [PRODUCT.md](./PRODUCT.md).
> **Scope:** Evolve the rigid role-based profile system into a hybrid dynamic one **without**
> rewriting the app, breaking bookings, or taking downtime.

---

## 0. Baseline — what actually exists today

Verified against the repo, not the aspirational docs.

| Concern | Reality |
|---|---|
| Identity | `profiles` (1:1 `auth.users`), `role` enum (`talent` \| `brand` \| `admin` \| legacy `client`) |
| Talent core | `talent_profiles` (`user_id` UNIQUE → `profiles.id`) |
| Brand core | `brand_profiles` (`user_id` UNIQUE → `profiles.id`), created in `20260723_marketplace_categories_architecture.sql` |
| Categories | `categories` (`role_type`) + `profile_categories` join |
| Booking target | `bookings.talent_id` → **`talent_profiles.id`**, plus denormalized `bookings.talent_user_id` → `profiles.id` |
| Profile writes | Single route `app/api/profile/route.ts`, hardcoded allowlists `PROFILE_FIELDS` / `TALENT_FIELDS` / `BRAND_FIELDS` (lines 14–24) |
| Profile reads | `features/talent-profile/{services,transformers,types}` — talent only; brand reads are ad-hoc |
| Completion | `lib/profile-completion.ts` — 11 hardcoded talent sections, reads `social_links` JSONB keys directly |
| Public routes | `/talent/[handle]` (canonical, 16 components) · `/profile/[username]` (duplicate, 13 orphan components) · `/brand/[id]` |
| Runtime | Cloudflare Workers edge on every route. Almost all data access via `adminClient` (service role, **RLS bypassed**); authorization is hand-written in route handlers |
| Validation | Hand-rolled. `zod@4` installed, zero imports |
| Tests | None. Gate is `npx tsc --noEmit` + `npm run build` + manual QA |

### The five coupling points that block multi-profile

1. `profiles.role` is the sole type discriminator, read by middleware, layouts, and ~100 call sites.
2. Writable-field allowlists are `const` arrays per role in one route file.
3. Completion logic is talent-shaped and reads a JSONB grab-bag.
4. `bookings.talent_id` hard-points at `talent_profiles.id` across bookings, reviews, payments, deliverables, applications.
5. `talent_profiles.social_links` mixes social identity, business attributes, and arbitrary dynamic fields.

V2 addresses all five **without** removing any of them in V1.

---

## 1. Database migration strategy

### 1.1 Design rules

- **Additive only in Phases 1–3.** No `DROP COLUMN`, no `DROP TABLE`, no type changes on hot tables.
- **Every migration idempotent** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`) — they are pasted into the Supabase SQL editor by hand, per repo convention.
- **Dynamic data never holds a foreign key that marketplace flows traverse.** Bookings, payments, reviews stay on typed columns forever.
- **New tables are config + values only.** No page-builder tables, no component trees in the DB.

### 1.2 New tables

```
profile_types      ── registry of profile kinds (talent, brand, agency…)
   │
   ├── profile_sections   ── ordered groups per type; carry completion weight + visibility
   │      │
   │      └── profile_fields   ── typed field definitions inside a dynamic section
   │             │
   │             └── profile_values  ── EAV values, one row per (profile, field)
   │
   └── profile_layouts    ── ordering/placement only, whitelisted variants

profile_completion_snapshots  ── cached score per profile (read path never recomputes)
```

### 1.3 SQL — Migration 1 (`20260806_profile_types_registry.sql`)

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Architecture V2 — Migration 1 of 5: type registry
-- Additive only. Safe to run on a live database.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profile_types (
  id            text PRIMARY KEY,                 -- 'talent' | 'brand' | 'agency' | 'studio'
  label_ar      text NOT NULL,
  label_en      text NOT NULL,
  -- Which typed table holds this type's core marketplace columns.
  -- NULL means "shared profiles row only" (not used in V1).
  core_table    text,
  -- Code-side adapter key. Must match a key in the TS provider registry.
  provider_key  text NOT NULL,
  -- Can this type receive bookings/briefs? Drives routing + adapter capability.
  is_bookable   boolean NOT NULL DEFAULT false,
  -- Public URL prefix, e.g. 'talent' -> /talent/[handle]. Unique so routes never collide.
  route_prefix  text NOT NULL UNIQUE,
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- The seam: profiles gains a type pointer WITHOUT losing `role`.
-- Nullable during backfill, made NOT NULL in Migration 5 (Phase 3) once 100% populated.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_type_id text REFERENCES public.profile_types(id);

CREATE INDEX IF NOT EXISTS idx_profiles_profile_type
  ON public.profiles(profile_type_id) WHERE profile_type_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_profile_types_updated_at ON public.profile_types;
CREATE TRIGGER set_profile_types_updated_at
  BEFORE UPDATE ON public.profile_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Seed the two live types ──────────────────────────────────────────────────
INSERT INTO public.profile_types
  (id, label_ar, label_en, core_table, provider_key, is_bookable, route_prefix, sort_order)
VALUES
  ('talent', 'موهبة',     'Talent', 'talent_profiles', 'talent', true,  'talent', 10),
  ('brand',  'علامة تجارية','Brand',  'brand_profiles',  'brand',  false, 'brand',  20)
ON CONFLICT (id) DO UPDATE
  SET label_ar = EXCLUDED.label_ar,
      label_en = EXCLUDED.label_en,
      core_table = EXCLUDED.core_table,
      provider_key = EXCLUDED.provider_key,
      is_bookable = EXCLUDED.is_bookable,
      route_prefix = EXCLUDED.route_prefix;

-- ── Backfill from the existing role enum ─────────────────────────────────────
UPDATE public.profiles SET profile_type_id = 'talent'
  WHERE profile_type_id IS NULL AND role = 'talent';
UPDATE public.profiles SET profile_type_id = 'brand'
  WHERE profile_type_id IS NULL AND role IN ('brand', 'client');
-- admins intentionally left NULL: they have no public profile surface.

-- ── Keep role and profile_type_id in lockstep during the transition ──────────
-- Writes still come from legacy code paths that only set `role`.
CREATE OR REPLACE FUNCTION public.sync_profile_type_from_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_type_id IS NULL THEN
    NEW.profile_type_id := CASE
      WHEN NEW.role = 'talent'            THEN 'talent'
      WHEN NEW.role IN ('brand','client') THEN 'brand'
      ELSE NULL
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_type ON public.profiles;
CREATE TRIGGER trg_sync_profile_type
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_type_from_role();

ALTER TABLE public.profile_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_types public read" ON public.profile_types;
CREATE POLICY "profile_types public read" ON public.profile_types
  FOR SELECT USING (is_active = true);
-- Writes: service role only (admin UI), no policy needed.
```

**Why a trigger and not app code:** legacy signup paths (`POST /api/profile`, `GET /api/me` self-heal, `POST /api/sync-profile`) all insert `profiles` rows and none of them know about `profile_type_id`. The trigger guarantees zero orphans during the transition without touching those routes. It is dropped in Phase 4 once all writers set the column explicitly.

### 1.4 SQL — Migration 2 (`20260806_profile_sections_fields.sql`)

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Architecture V2 — Migration 2 of 5: section + field definitions
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.profile_section_kind AS ENUM ('core', 'dynamic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_visibility AS ENUM ('public', 'authenticated', 'owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_field_type AS ENUM (
    'text', 'long_text', 'number', 'boolean', 'date',
    'select', 'multi_select', 'url', 'email', 'phone',
    'media', 'repeater'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profile_sections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type_id text NOT NULL REFERENCES public.profile_types(id) ON DELETE CASCADE,
  key             text NOT NULL,              -- stable slug, referenced by code for 'core' sections
  label_ar        text NOT NULL,
  label_en        text NOT NULL,
  kind            public.profile_section_kind NOT NULL,
  -- 'core'    -> evaluated by the provider adapter against the typed table
  -- 'dynamic' -> evaluated from profile_values
  visibility      public.profile_visibility NOT NULL DEFAULT 'public',
  -- Completion weight. Relative, not required to sum to 100 — the engine normalizes.
  weight          integer NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  is_required     boolean NOT NULL DEFAULT false,
  -- Whitelisted renderer key. NOT arbitrary component source. Unknown key -> generic renderer.
  render_component text,
  icon            text,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_type_id, key)
);

CREATE TABLE IF NOT EXISTS public.profile_fields (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    uuid NOT NULL REFERENCES public.profile_sections(id) ON DELETE CASCADE,
  key           text NOT NULL,
  label_ar      text NOT NULL,
  label_en      text NOT NULL,
  placeholder_ar text,
  placeholder_en text,
  data_type     public.profile_field_type NOT NULL,
  is_required   boolean NOT NULL DEFAULT false,
  -- Weight WITHIN the section. Section weight is split across its fields by this ratio.
  weight        integer NOT NULL DEFAULT 1 CHECK (weight >= 0),
  -- Constraint bag: { min, max, minLength, maxLength, pattern, step, accept, maxItems }
  validation    jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- For select/multi_select/repeater: [{ value, label_ar, label_en }] or child field defs
  options       jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, key)
);

CREATE INDEX IF NOT EXISTS idx_profile_sections_type_active
  ON public.profile_sections(profile_type_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_profile_fields_section_active
  ON public.profile_fields(section_id, is_active, sort_order);

DROP TRIGGER IF EXISTS set_profile_sections_updated_at ON public.profile_sections;
CREATE TRIGGER set_profile_sections_updated_at
  BEFORE UPDATE ON public.profile_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_profile_fields_updated_at ON public.profile_fields;
CREATE TRIGGER set_profile_fields_updated_at
  BEFORE UPDATE ON public.profile_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_fields   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sections public read" ON public.profile_sections;
CREATE POLICY "sections public read" ON public.profile_sections
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "fields public read" ON public.profile_fields;
CREATE POLICY "fields public read" ON public.profile_fields
  FOR SELECT USING (is_active = true);
```

**Note on `is_active` vs delete:** section/field rows are never hard-deleted once values exist. Deactivation hides them from render and drops them from completion; the values survive for audit and for reactivation.

### 1.5 SQL — Migration 3 (`20260806_profile_values.sql`)

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Architecture V2 — Migration 3 of 5: value storage
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profile_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_id    uuid NOT NULL REFERENCES public.profile_fields(id) ON DELETE CASCADE,
  -- Always jsonb. Scalars stored as jsonb scalars ("cairo", 42, true), not objects.
  -- Application layer casts by profile_fields.data_type.
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, field_id)
);

-- Primary read pattern: "give me every dynamic value for this profile".
CREATE INDEX IF NOT EXISTS idx_profile_values_profile
  ON public.profile_values(profile_id);

-- Filter pattern: "every profile whose field X equals Y" (explore facets).
CREATE INDEX IF NOT EXISTS idx_profile_values_field_text
  ON public.profile_values(field_id, (value #>> '{}'));

-- Containment queries on array-valued fields (multi_select, repeater).
CREATE INDEX IF NOT EXISTS idx_profile_values_value_gin
  ON public.profile_values USING gin (value jsonb_path_ops);

DROP TRIGGER IF EXISTS set_profile_values_updated_at ON public.profile_values;
CREATE TRIGGER set_profile_values_updated_at
  BEFORE UPDATE ON public.profile_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- App reads via service role, so these are defence-in-depth against direct/anon
-- access. They must still be correct: a 'owner' section must never leak.
ALTER TABLE public.profile_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "values public read" ON public.profile_values;
CREATE POLICY "values public read" ON public.profile_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profile_fields f
      JOIN public.profile_sections s ON s.id = f.section_id
      WHERE f.id = profile_values.field_id
        AND f.is_active AND s.is_active
        AND (
          s.visibility = 'public'
          OR (s.visibility = 'authenticated' AND auth.uid() IS NOT NULL)
          OR profile_values.profile_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "values owner write" ON public.profile_values;
CREATE POLICY "values owner write" ON public.profile_values
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── Layouts: ordering + placement ONLY. Not a page builder. ──────────────────
CREATE TABLE IF NOT EXISTS public.profile_layouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type_id text NOT NULL REFERENCES public.profile_types(id) ON DELETE CASCADE,
  -- 'public' = the /[prefix]/[handle] page, 'edit' = /profile/me, 'card' = explore card
  variant         text NOT NULL DEFAULT 'public',
  -- { "main": ["hero","portfolio","packages"], "sidebar": ["about","reviews"] }
  -- Values are profile_sections.key. Unknown keys are ignored at render time.
  layout          jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_type_id, variant)
);

ALTER TABLE public.profile_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "layouts public read" ON public.profile_layouts;
CREATE POLICY "layouts public read" ON public.profile_layouts
  FOR SELECT USING (is_active = true);
```

**Why EAV here is acceptable:** the set of dynamic fields is bounded (tens per type, authored by admins, not end users), values are read as a whole-profile batch (one indexed query per profile), and nothing in the marketplace transaction path joins them. Faceted filtering is served by the `(field_id, value #>> '{}')` btree and the GIN index; if `/explore` facets ever outgrow that, the escape hatch is a materialized view — not a schema change.

### 1.6 SQL — Migration 4 (`20260806_booking_provider_shadow.sql`)

The critical one. **`bookings.talent_id` is not touched.**

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Architecture V2 — Migration 4 of 5: future-proof booking target
-- Adds SHADOW columns. Existing reads/writes on talent_id keep working unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS provider_type       text REFERENCES public.profile_types(id),
  -- The provider's row id in ITS OWN core table (talent_profiles.id, agency_profiles.id…).
  -- Deliberately NOT a foreign key: the target table varies by provider_type.
  -- Integrity is enforced by the adapter layer + the consistency check below.
  ADD COLUMN IF NOT EXISTS provider_profile_id uuid,
  -- Denormalized owner, mirrors the existing talent_user_id convention.
  ADD COLUMN IF NOT EXISTS provider_user_id    uuid REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_bookings_provider
  ON public.bookings(provider_type, provider_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_user
  ON public.bookings(provider_user_id);

-- ── Backfill every existing booking as a talent booking ──────────────────────
UPDATE public.bookings
   SET provider_type       = 'talent',
       provider_profile_id = talent_id,
       provider_user_id    = COALESCE(
         talent_user_id,
         (SELECT tp.user_id FROM public.talent_profiles tp WHERE tp.id = bookings.talent_id)
       )
 WHERE provider_type IS NULL;

-- ── Keep shadow columns in sync while legacy writers still exist ─────────────
-- Legacy routes (POST /api/bookings/direct, job application accept) write only
-- talent_id. This trigger fills the shadow columns so both views agree at all times.
CREATE OR REPLACE FUNCTION public.sync_booking_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Legacy write: talent_id set, provider_* absent -> derive provider_*.
  IF NEW.talent_id IS NOT NULL AND NEW.provider_profile_id IS NULL THEN
    NEW.provider_type       := 'talent';
    NEW.provider_profile_id := NEW.talent_id;
    NEW.provider_user_id    := COALESCE(
      NEW.talent_user_id,
      (SELECT tp.user_id FROM public.talent_profiles tp WHERE tp.id = NEW.talent_id)
    );
  END IF;

  -- V2 write for a talent: mirror back into the legacy column so every existing
  -- query, RLS policy, and admin report keeps returning the same rows.
  IF NEW.provider_type = 'talent' AND NEW.talent_id IS NULL THEN
    NEW.talent_id      := NEW.provider_profile_id;
    NEW.talent_user_id := COALESCE(NEW.talent_user_id, NEW.provider_user_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_booking_provider ON public.bookings;
CREATE TRIGGER trg_sync_booking_provider
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_booking_provider();

-- ── Drift detector. Run in CI / a scheduled admin check. Must always return 0. ──
CREATE OR REPLACE VIEW public.booking_provider_drift AS
  SELECT id, talent_id, provider_type, provider_profile_id
    FROM public.bookings
   WHERE provider_type = 'talent'
     AND talent_id IS DISTINCT FROM provider_profile_id;
```

`bookings.talent_id` stays `NOT NULL`-compatible and non-nullable in V1. It is only relaxed in Phase 4, and only together with a `CHECK` that keeps talent bookings consistent:

```sql
-- PHASE 4 ONLY. Do not run before a non-talent provider actually ships.
ALTER TABLE public.bookings ALTER COLUMN talent_id DROP NOT NULL;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_provider_consistency CHECK (
  (provider_type = 'talent' AND talent_id IS NOT NULL AND talent_id = provider_profile_id)
  OR (provider_type <> 'talent' AND talent_id IS NULL AND provider_profile_id IS NOT NULL)
);
```

### 1.7 SQL — Migration 5 (`20260806_completion_config.sql`)

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Architecture V2 — Migration 5 of 5: completion config + score cache
-- ─────────────────────────────────────────────────────────────────────────────

-- Gates, per type, replacing the hardcoded COMPLETION_THRESHOLDS object.
CREATE TABLE IF NOT EXISTS public.profile_completion_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type_id text NOT NULL REFERENCES public.profile_types(id) ON DELETE CASCADE,
  -- 'apply_to_jobs' | 'appear_in_search' | 'receive_briefs' | 'become_verified' | 'post_job'
  gate_key        text NOT NULL,
  min_score       integer NOT NULL CHECK (min_score BETWEEN 0 AND 100),
  -- Section keys that must be complete regardless of total score.
  required_sections text[] NOT NULL DEFAULT '{}',
  is_enforced     boolean NOT NULL DEFAULT false,   -- ships OFF; flipped per gate after audit
  message_ar      text,
  message_en      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_type_id, gate_key)
);

-- Score cache. The public profile read path must never recompute completion.
CREATE TABLE IF NOT EXISTS public.profile_completion_snapshots (
  profile_id   uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score        integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  -- [{ key, label_ar, label_en, weight, done, href }] — exactly what the UI renders.
  breakdown    jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at  timestamptz NOT NULL DEFAULT now(),
  -- Bumped on every profile write; a stale snapshot is recomputed lazily on read.
  dirty        boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_completion_score ON public.profile_completion_snapshots(score);
CREATE INDEX IF NOT EXISTS idx_completion_dirty
  ON public.profile_completion_snapshots(dirty) WHERE dirty = true;

ALTER TABLE public.profile_completion_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "completion owner read" ON public.profile_completion_snapshots;
CREATE POLICY "completion owner read" ON public.profile_completion_snapshots
  FOR SELECT USING (profile_id = auth.uid());

ALTER TABLE public.profile_completion_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "completion rules public read" ON public.profile_completion_rules;
CREATE POLICY "completion rules public read" ON public.profile_completion_rules
  FOR SELECT USING (true);

-- ── Seed: mirror today's hardcoded thresholds, enforcement OFF ───────────────
INSERT INTO public.profile_completion_rules
  (profile_type_id, gate_key, min_score, is_enforced, message_ar, message_en)
VALUES
  ('talent','apply_to_jobs',   50, false, 'أكمل ملفك للتقديم على الوظائف', 'Complete your profile to apply for jobs'),
  ('talent','appear_in_search',60, false, 'أكمل ملفك للظهور في البحث',      'Complete your profile to appear in search'),
  ('talent','receive_briefs',  70, false, 'أكمل ملفك لاستقبال طلبات العمل', 'Complete your profile to receive briefs'),
  ('talent','become_verified', 80, false, 'أكمل ملفك للحصول على التوثيق',   'Complete your profile to get verified'),
  ('brand', 'post_job',        40, false, 'أكمل ملف علامتك التجارية لنشر وظيفة', 'Complete your brand profile to post a job')
ON CONFLICT (profile_type_id, gate_key) DO NOTHING;
```

### 1.8 Seed data — sections and fields

Talent sections mirror `lib/profile-completion.ts` **exactly**, so the configurable engine reproduces today's scores byte-for-byte on day one. That equality is the migration's acceptance test.

```sql
-- ── Talent: CORE sections (evaluated by the provider adapter, not profile_values) ──
INSERT INTO public.profile_sections
  (profile_type_id, key, label_ar, label_en, kind, weight, render_component, sort_order)
VALUES
  ('talent','avatar',       'صورة الملف الشخصي','Profile picture',   'core',15,'hero',        10),
  ('talent','personal',     'المعلومات الشخصية','Personal info',     'core',10,'hero',        20),
  ('talent','bio',          'النبذة الشخصية',   'Bio',               'core', 5,'about',       30),
  ('talent','categories',   'التخصص والفئات',   'Categories',        'core',10,'about',       40),
  ('talent','social',       'مواقع التواصل',    'Social media',      'core',10,'social',      50),
  ('talent','portfolio',    'معرض الأعمال',     'Portfolio',         'core',15,'portfolio',   60),
  ('talent','physical',     'البيانات الجسدية', 'Physical details',  'core',10,'attributes',  70),
  ('talent','packages',     'الباقات والأسعار', 'Packages & Pricing','core',10,'packages',    80),
  ('talent','usage_addons', 'حقوق الاستخدام',   'Usage Rights',      'core',10,'usage_rights',90),
  ('talent','availability', 'حالة الإتاحة',     'Availability',      'core', 5,'availability',100),
  ('talent','payment',      'بيانات الدفع',     'Payment details',   'core', 0,'payment',     110)
ON CONFLICT (profile_type_id, key) DO NOTHING;

-- ── Talent: DYNAMIC sections (the new capability) ────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, label_ar, label_en, kind, weight, render_component, sort_order)
VALUES
  ('talent','equipment','المعدات',        'Equipment',        'dynamic',0,'key_value_list',200),
  ('talent','awards',   'الجوائز',        'Awards',           'dynamic',0,'timeline',      210),
  ('talent','languages','اللغات',         'Languages',        'dynamic',0,'chip_list',     220),
  ('talent','campaigns','الحملات السابقة','Previous campaigns','dynamic',0,'card_grid',    230)
ON CONFLICT (profile_type_id, key) DO NOTHING;

-- ── Brand sections ───────────────────────────────────────────────────────────
INSERT INTO public.profile_sections
  (profile_type_id, key, label_ar, label_en, kind, weight, render_component, sort_order)
VALUES
  ('brand','company',      'بيانات الشركة',     'Company details',     'core',   30,'hero',       10),
  ('brand','industry',     'المجال',            'Industry',            'core',   20,'about',      20),
  ('brand','verification', 'التوثيق',           'Verification',        'core',   20,'trust',      30),
  ('brand','logo',         'الشعار',            'Logo',                'core',   15,'hero',       40),
  ('brand','social',       'مواقع التواصل',     'Social media',        'core',   15,'social',     50),
  ('brand','campaign_prefs','تفضيلات الحملات',  'Campaign preferences','dynamic', 0,'key_value_list',200),
  ('brand','brand_values', 'قيم العلامة',       'Brand values',        'dynamic', 0,'chip_list',  210),
  ('brand','audience',     'الجمهور المستهدف',  'Audience',            'dynamic', 0,'stat_grid',  220)
ON CONFLICT (profile_type_id, key) DO NOTHING;

-- ── Fields for one dynamic section, as the pattern to copy ───────────────────
INSERT INTO public.profile_fields
  (section_id, key, label_ar, label_en, data_type, is_required, weight, validation, options, sort_order)
SELECT s.id, v.key, v.label_ar, v.label_en, v.data_type::public.profile_field_type,
       v.is_required, v.weight, v.validation::jsonb, v.options::jsonb, v.sort_order
FROM public.profile_sections s
JOIN (VALUES
  ('camera_body','الكاميرا','Camera body','text',   false,1,'{"maxLength":80}','[]',10),
  ('lenses',     'العدسات', 'Lenses',     'multi_select',false,1,'{"maxItems":12}',
    '[{"value":"24-70","label_ar":"24-70","label_en":"24-70"},
      {"value":"50mm","label_ar":"50 مم","label_en":"50mm"},
      {"value":"85mm","label_ar":"85 مم","label_en":"85mm"}]',20),
  ('lighting',   'الإضاءة', 'Lighting',   'long_text',false,1,'{"maxLength":400}','[]',30),
  ('owns_studio','استوديو خاص','Owns a studio','boolean',false,1,'{}','[]',40)
) AS v(key,label_ar,label_en,data_type,is_required,weight,validation,options,sort_order)
  ON true
WHERE s.profile_type_id = 'talent' AND s.key = 'equipment'
ON CONFLICT (section_id, key) DO NOTHING;

-- ── Layouts ──────────────────────────────────────────────────────────────────
INSERT INTO public.profile_layouts (profile_type_id, variant, layout) VALUES
 ('talent','public','{"main":["hero","portfolio","packages","usage_addons","equipment","awards","campaigns"],
                      "sidebar":["about","social","availability","languages"]}'),
 ('brand','public', '{"main":["company","industry","campaign_prefs","brand_values"],
                      "sidebar":["verification","social","audience"]}')
ON CONFLICT (profile_type_id, variant) DO UPDATE SET layout = EXCLUDED.layout;
```

### 1.9 Migration order

Strict. Each step is independently deployable and independently revertible.

| # | Migration | Depends on | Reversible by |
|---|---|---|---|
| 1 | `profile_types` + `profiles.profile_type_id` + sync trigger | — | drop trigger, drop column |
| 2 | `profile_sections`, `profile_fields` | 1 | drop tables |
| 3 | `profile_values`, `profile_layouts` | 2 | drop tables |
| 4 | booking shadow columns + sync trigger + drift view | 1 | drop trigger, drop columns |
| 5 | completion rules + snapshots | 1, 2 | drop tables |
| 6 | seed sections/fields/layouts/rules | 2, 3, 5 | delete seeded rows |
| 7 | **backfill** `social_links` → `profile_values` (§8) | 6 | delete `profile_values` rows |

Run 1–6 in one window; they are pure DDL plus small seeds and take seconds. Run 7 separately, in batches, after verifying 1–6 in production.

---

## 2. Profile Provider Adapter Layer

### 2.1 Directory layout

```
features/profiles/
├── types/
│   ├── provider.ts            ProfileProvider interface + shared view-model types
│   └── dynamic.ts             SectionDef, FieldDef, ProfileValueMap
├── registry.ts                providerRegistry: Record<string, ProfileProvider>
├── providers/
│   ├── talent.provider.ts     wraps features/talent-profile/* — no rewrite
│   ├── brand.provider.ts
│   └── agency.provider.ts     (Phase 4)
├── services/
│   ├── profile-schema.service.ts   loads types/sections/fields, cached
│   ├── profile-values.service.ts   read/write profile_values
│   ├── completion.service.ts       the engine
│   └── booking-target.service.ts   resolves a bookable provider
└── validation/
    └── build-schema.ts        FieldDef[] -> Zod schema
```

`features/talent-profile/` is **not deleted or moved.** `talent.provider.ts` calls into its existing service and transformer. Zero churn on 575 working lines.

### 2.2 The interface

```ts
// features/profiles/types/provider.ts

export interface SharedIdentity {
  id: string; handle: string | null; fullName: string | null;
  avatarUrl: string | null; city: string | null; bio: string | null;
  isVerified: boolean; createdAt: string; profileTypeId: string;
}

export interface CoreSectionState {
  /** section key -> is this core section satisfied */
  [sectionKey: string]: boolean;
}

export interface BookingTarget {
  providerType: string;        // 'talent' | 'agency' | …
  providerProfileId: string;   // row id in the provider's own core table
  providerUserId: string;      // profiles.id
  /** Legacy mirror. Non-null ONLY for the talent provider. */
  legacyTalentId: string | null;
}

export interface ProfileProvider<TCore = unknown, TView = unknown> {
  readonly typeId: string;
  readonly coreTable: string;
  readonly bookable: boolean;

  /** Replaces the hardcoded TALENT_FIELDS / BRAND_FIELDS consts. */
  readonly writableCoreFields: readonly string[];

  loadCore(userId: string): Promise<TCore | null>;
  loadCoreByHandle(handle: string): Promise<{ core: TCore; shared: SharedIdentity } | null>;

  /** Upsert the typed columns. Moderation/trust/money columns are never in scope. */
  upsertCore(userId: string, patch: Record<string, unknown>): Promise<void>;

  /** Build the public view model from typed core + dynamic values. */
  toViewModel(input: {
    shared: SharedIdentity;
    core: TCore;
    dynamic: ProfileValueMap;
  }): Promise<TView>;

  /**
   * Completion for 'core' sections. Dynamic sections are handled generically
   * by the engine — a provider never scores them.
   */
  evaluateCoreSections(input: { shared: SharedIdentity; core: TCore }): Promise<CoreSectionState>;

  /** Only implemented when bookable === true. */
  resolveBookingTarget?(userId: string): Promise<BookingTarget | null>;
}
```

### 2.3 `TalentProfileProvider`

Thin wrapper. It owns no new logic in V1 — it delegates.

```ts
// features/profiles/providers/talent.provider.ts
import { adminClient } from "@/lib/supabase/admin";
import { fetchTalentPageData } from "@/features/talent-profile/services/talent-profile.service";
import { calculateCompletion } from "@/lib/profile-completion";   // reused verbatim in V1
import type { ProfileProvider } from "../types/provider";

export const talentProvider: ProfileProvider = {
  typeId:    "talent",
  coreTable: "talent_profiles",
  bookable:  true,

  // Identical to the TALENT_FIELDS const in app/api/profile/route.ts today.
  writableCoreFields: ["category","specialties","social_links","bio","packages","availability"],

  async loadCore(userId) {
    const { data } = await adminClient
      .from("talent_profiles").select("*").eq("user_id", userId).maybeSingle();
    return data;
  },

  async loadCoreByHandle(handle) { /* delegates to the existing service */ },

  async upsertCore(userId, patch) {
    const { error } = await adminClient
      .from("talent_profiles")
      .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" });
    if (error) throw new Error(`talent_profiles: ${error.message}`);
  },

  async toViewModel({ shared, core, dynamic }) {
    // Existing transformer output, plus the dynamic sections appended.
    const base = await buildTalentPageData(shared, core);   // existing transformer
    return { ...base, dynamicSections: dynamic };
  },

  async evaluateCoreSections({ shared, core }) {
    // V1: reuse the battle-tested function so scores cannot regress.
    const portfolio = await loadPortfolio(core.id);
    const { sections } = calculateCompletion(shared, core, portfolio);
    return Object.fromEntries(sections.map(s => [s.key, s.done]));
  },

  async resolveBookingTarget(userId) {
    const { data } = await adminClient
      .from("talent_profiles").select("id, user_id").eq("user_id", userId).maybeSingle();
    if (!data) return null;
    return {
      providerType:      "talent",
      providerProfileId: data.id,
      providerUserId:    data.user_id,
      legacyTalentId:    data.id,        // ← bookings.talent_id keeps its exact meaning
    };
  },
};
```

**That last field is the whole booking strategy.** Every booking-creating route asks the provider for a `BookingTarget` and writes **both** `talent_id: target.legacyTalentId` and `provider_*: target.*`. For talents the two agree, so every existing query, RLS policy, admin report, and rating trigger behaves identically. Nothing downstream is aware a change happened.

### 2.4 `BrandProfileProvider`

Same shape, `bookable: false`, `writableCoreFields` = today's `BRAND_FIELDS`, `evaluateCoreSections` implemented natively against `brand_profiles` (no legacy function exists to reuse — the brand path is new completion logic, but it is written once against the generic interface, not bolted into `lib/profile-completion.ts`).

### 2.5 Adding `AgencyProfileProvider` later — the full checklist

1. `CREATE TABLE agency_profiles` (`user_id` UNIQUE → `profiles.id`, typed core columns, `status`).
2. `INSERT INTO profile_types` — `('agency', …, 'agency_profiles', 'agency', true, 'agency')`.
3. Seed its `profile_sections` / `profile_fields` / `profile_layouts` / `profile_completion_rules`.
4. Write `agency.provider.ts` (~120 lines) and register it.
5. Run the Phase-4 `talent_id` nullability + CHECK migration **once**, before the first agency booking.
6. Add `app/(main)/agency/[handle]/page.tsx` — 15 lines, delegating to the unified renderer.

No changes to bookings routes, payments, reviews, deliverables, or applications. That is the acceptance criterion for the adapter design.

### 2.6 Refactoring `app/api/profile/route.ts`

The only behavioural change in Phase 2:

```ts
const provider = getProvider(profileTypeId);            // from profiles.profile_type_id
await adminClient.from("profiles").upsert({ ...pick(profileData, PROFILE_FIELDS), id: targetId, role });
await provider.upsertCore(targetId, pick(coreData, provider.writableCoreFields));
await saveDynamicValues(targetId, profileTypeId, dynamicValues);   // Zod-validated, §3.3
await markCompletionDirty(targetId);
```

`PROFILE_FIELDS` stays a hardcoded const — shared identity columns are genuinely fixed, and the mass-assignment guard comment at `route.ts:9-13` still applies. Only the per-role branches disappear.

---

## 3. Dynamic Section System

### 3.1 Where the line sits

| Stays strongly typed (never dynamic) | May be dynamic |
|---|---|
| `rating`, `avg_rating`, `total_reviews`, `total_bookings` | equipment, awards, languages, previous campaigns |
| `category_id`, `specialties`, `city` | brand values, campaign preferences, audience stats |
| `packages`, `availability`, `status` | anything not read by bookings, jobs, search ranking, or payments |
| `company_name`, `industry`, `is_verified` | |

**Rule of thumb for reviewers:** if a field is read by a marketplace transaction, a ranking query, or an authorization check, it is core. Everything else may be dynamic.

### 3.2 Schema loading + caching

`profile-schema.service.ts` loads sections + fields for a type in **one** query pair and caches per request and per isolate:

```ts
const cache = new Map<string, { at: number; schema: ProfileSchema }>();
const TTL = 5 * 60_000;                     // config changes rarely; 5 min is plenty

export async function getProfileSchema(typeId: string): Promise<ProfileSchema> {
  const hit = cache.get(typeId);
  if (hit && Date.now() - hit.at < TTL) return hit.schema;
  const [{ data: sections }, { data: fields }] = await Promise.all([
    adminClient.from("profile_sections").select("*")
      .eq("profile_type_id", typeId).eq("is_active", true).order("sort_order"),
    adminClient.from("profile_fields").select("*, profile_sections!inner(profile_type_id)")
      .eq("profile_sections.profile_type_id", typeId).eq("is_active", true).order("sort_order"),
  ]);
  const schema = buildSchema(sections ?? [], fields ?? []);
  cache.set(typeId, { at: Date.now(), schema });
  return schema;
}
```

Module-level `Map` on Cloudflare Workers is per-isolate — bounded staleness, no cross-request leak of user data (schema is public config only). Admin schema edits call an explicit `/api/admin/profile-schema/invalidate` that bumps a version key.

### 3.3 Validation strategy — this is where Zod earns its place

Field definitions compile to a Zod schema once per (type, schema version), then validate every write:

```ts
// features/profiles/validation/build-schema.ts
import { z } from "zod";

export function buildFieldSchema(f: FieldDef): z.ZodTypeAny {
  const v = f.validation ?? {};
  let s: z.ZodTypeAny;
  switch (f.data_type) {
    case "text":
    case "long_text":
      s = z.string().max(v.maxLength ?? 2000);
      if (v.minLength) s = (s as z.ZodString).min(v.minLength);
      if (v.pattern)   s = (s as z.ZodString).regex(new RegExp(v.pattern));
      break;
    case "number":  s = z.number().min(v.min ?? -1e12).max(v.max ?? 1e12); break;
    case "boolean": s = z.boolean(); break;
    case "date":    s = z.string().datetime({ offset: true }); break;
    case "url":     s = z.string().url().max(500); break;
    case "email":   s = z.string().email(); break;
    case "select":  s = z.enum(f.options.map(o => o.value) as [string, ...string[]]); break;
    case "multi_select":
      s = z.array(z.enum(f.options.map(o => o.value) as [string, ...string[]]))
           .max(v.maxItems ?? 20);
      break;
    case "media":   s = z.string().url().startsWith("https://res.cloudinary.com/"); break;
    case "repeater":
      s = z.array(z.object(Object.fromEntries(
            f.options.map((c: FieldDef) => [c.key, buildFieldSchema(c).optional()])
          ))).max(v.maxItems ?? 20);
      break;
    default: s = z.unknown();
  }
  return f.is_required ? s : s.optional().nullable();
}

export function buildProfileSchema(fields: FieldDef[]) {
  return z.object(Object.fromEntries(fields.map(f => [f.key, buildFieldSchema(f)]))).strict();
}
```

`.strict()` is load-bearing: unknown keys are rejected, so a client cannot smuggle values for fields that do not exist or are deactivated. `media` fields are pinned to the Cloudinary host, matching the existing CSP posture in `next.config.ts`.

Server is the authority. The same builder runs client-side for inline errors, but the API route re-validates unconditionally.

### 3.4 Rendering strategy — registry, not a page builder

```ts
// components/profile/dynamic/registry.ts
export const SECTION_RENDERERS = {
  key_value_list: KeyValueListSection,
  timeline:       TimelineSection,
  chip_list:      ChipListSection,
  card_grid:      CardGridSection,
  stat_grid:      StatGridSection,
} as const;

export const FIELD_RENDERERS = {
  text: TextField, long_text: LongTextField, number: NumberField,
  boolean: BooleanField, date: DateField, select: SelectField,
  multi_select: MultiSelectField, url: UrlField, email: EmailField,
  phone: PhoneField, media: MediaField, repeater: RepeaterField,
} as const;
```

`profile_sections.render_component` is a **key lookup**, never dynamic code. An unknown key falls back to `KeyValueListSection` — a bad config row degrades one section, never white-screens a profile. Renderers follow existing conventions: `useSite()` for `dark`/`lang`, `useIsMobile()` for responsive, inline style objects, bilingual labels from the DB (`label_ar`/`label_en`) instead of a component-local `TX` object.

Ordering comes from `profile_layouts.layout`; unknown section keys in that JSON are skipped.

---

## 4. Completion Engine

### 4.1 Model

- **Weights** live on `profile_sections.weight`, split across `profile_fields.weight` within dynamic sections.
- **Core sections** are scored by `provider.evaluateCoreSections()` — a typed function, because "does this talent have packages" cannot be expressed as row-presence in `profile_values`.
- **Dynamic sections** are scored generically: a field is done when a non-empty `profile_values` row exists.
- **Normalization** guarantees 100 is always reachable, which is why `payment` (weight 0) is harmless today and stays harmless when weights change.

### 4.2 Algorithm

```ts
// features/profiles/services/completion.service.ts

export async function computeCompletion(profileId: string): Promise<CompletionResult> {
  const shared   = await loadSharedIdentity(profileId);
  const provider = getProvider(shared.profileTypeId);
  const [schema, core, values] = await Promise.all([
    getProfileSchema(shared.profileTypeId),
    provider.loadCore(profileId),
    loadProfileValues(profileId),
  ]);

  const coreState = core ? await provider.evaluateCoreSections({ shared, core }) : {};

  const rows = schema.sections.map(section => {
    let done: boolean;

    if (section.kind === "core") {
      done = coreState[section.key] === true;
    } else {
      const fields = schema.fieldsBySection[section.id] ?? [];
      const scored = fields.filter(f => f.weight > 0);
      if (scored.length === 0) {
        done = false;                                  // an unscored section never blocks 100%
      } else {
        const totalW = scored.reduce((a, f) => a + f.weight, 0);
        const gotW   = scored.reduce((a, f) => a + (isFilled(values[f.id]) ? f.weight : 0), 0);
        done = gotW === totalW;                        // partial credit applied below
        section.__partial = totalW ? gotW / totalW : 0;
      }
    }

    return { key: section.key, label: { ar: section.label_ar, en: section.label_en },
             weight: section.weight, done, href: hrefFor(section) };
  });

  // Normalize so the achievable maximum is always exactly 100.
  const totalWeight = rows.reduce((a, r) => a + r.weight, 0) || 1;
  const earned = rows.reduce((a, r, i) => {
    const section = schema.sections[i];
    const ratio = section.kind === "core" ? (r.done ? 1 : 0) : (section.__partial ?? 0);
    return a + r.weight * ratio;
  }, 0);

  const score = Math.round((earned / totalWeight) * 100);
  return { score, sections: rows };
}

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v))      return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;                              // numbers, booleans: presence is completion
}
```

Partial credit on dynamic sections is a deliberate difference from today's all-or-nothing core sections: it keeps the "fill one more field" nudge meaningful when a dynamic section has eight fields.

### 4.3 Caching + invalidation

- Every profile write path calls `markCompletionDirty(profileId)` (`UPDATE … SET dirty = true`).
- `GET /api/profile/completion` returns the snapshot; if `dirty`, it recomputes, writes back, and returns fresh.
- Public profile pages read `score` from the snapshot only, never recompute. A stale-by-seconds score on a public page is acceptable; a recompute on every page view is not.

### 4.4 Gates

```ts
export async function checkGate(profileId: string, gateKey: string): Promise<GateResult> {
  const rule = await loadRule(profileTypeId, gateKey);
  if (!rule || !rule.is_enforced) return { allowed: true };          // ships OFF
  const { score, sections } = await getCompletion(profileId);
  const missing = rule.required_sections.filter(k => !sections.find(s => s.key === k)?.done);
  if (score >= rule.min_score && missing.length === 0) return { allowed: true };
  return { allowed: false, score, required: rule.min_score, missing,
           message: { ar: rule.message_ar, en: rule.message_en } };
}
```

Every gate ships with `is_enforced = false`. Enforcement is turned on one gate at a time, after querying how many live profiles would be locked out:

```sql
SELECT count(*) FROM profile_completion_snapshots s
JOIN profiles p ON p.id = s.profile_id
WHERE p.profile_type_id = 'talent' AND s.score < 70;   -- would lose brief eligibility
```

This is why `COMPLETION_THRESHOLDS` was never enforced: nobody could safely answer that question. Now it is one query.

---

## 5. Route migration strategy

### 5.1 Target

Keep **type-prefixed public URLs** (`/talent/[handle]`, `/brand/[handle]`, `/agency/[handle]`). Do **not** collapse to a bare `/[handle]` — it would collide with `/jobs`, `/about`, `/explore`, and every other top-level static route, and it destroys the SEO value of the existing `/talent/*` corpus.

Unify the **renderer**, not the URL.

```
                    ┌──────────────────────────────────┐
/talent/[handle] ──►│                                  │
/brand/[handle]  ──►│  UnifiedProfilePage (server)     │──► provider.toViewModel()
/agency/[handle] ──►│  resolve type → provider →       │──► layout + section registry
                    │  schema → values → renderer      │
/p/[handle]      ──►│  (308 → canonical prefix)        │
                    └──────────────────────────────────┘
/profile/[username] ──► 301 → /{route_prefix}/{handle}
/profile/me         ──► stays (owner edit surface)
```

### 5.2 Steps

**Step 1 — extract the renderer (no route changes).**
Move `app/(main)/talent/[handle]/_components/TalentModelProfile.tsx` and siblings to `components/profile/unified/`. `/talent/[handle]/page.tsx` imports from the new location. Pure move. Verify with `npx tsc --noEmit` + visual diff on three live handles.

**Step 2 — introduce the resolver.**

```ts
// features/profiles/services/resolve-profile-route.ts
export async function resolveProfileRoute(handle: string) {
  const { data } = await adminClient
    .from("profiles")
    .select("id, handle, profile_type_id, account_status, profile_types(route_prefix, is_active)")
    .eq("handle", handle).maybeSingle();
  if (!data || data.account_status !== "active") return null;
  return { profileId: data.id, typeId: data.profile_type_id,
           canonicalPath: `/${data.profile_types.route_prefix}/${data.handle}` };
}
```

**Step 3 — `/talent/[handle]` delegates.** Page becomes: resolve → if type ≠ `talent`, `redirect(canonicalPath)` (308) → else render unified. Existing talent URLs behave identically; a handle that later becomes an agency now redirects instead of 404ing.

**Step 4 — retire the duplicate.** `/profile/[username]/page.tsx` becomes a permanent redirect and its 13 orphan `_components/` are deleted:

```ts
export const runtime = 'edge';
import { redirect, notFound } from "next/navigation";
import { resolveProfileRoute } from "@/features/profiles/services/resolve-profile-route";

export default async function LegacyProfilePage({ params }) {
  const { username } = await params;
  const r = await resolveProfileRoute(username);
  if (!r) notFound();
  redirect(r.canonicalPath);            // 307; see note below
}
```

For SEO, prefer a static 308 in `next.config.ts` where the mapping is unconditional, and keep the dynamic redirect only as the fallback:

```ts
async redirects() {
  return [{ source: '/profile/:username((?!me$).*)', destination: '/talent/:username', permanent: true }];
}
```

Guard the `me` segment explicitly — `/profile/me` must not be swallowed. Ship the redirect only **after** confirming with analytics that `/profile/*` traffic is non-trivial or zero; if zero, delete the route outright.

**Step 5 — add `/p/[handle]`** as a type-agnostic permalink for links shared before a type is known (emails, QR codes). It 308s to the canonical path. New links only; nothing depends on it.

**Step 6 — new types are 15-line pages.** `/agency/[handle]/page.tsx` calls the same resolver and renderer.

### 5.3 Link-integrity checklist before flipping any redirect

- [ ] `grep -rn "/profile/" app components features` — update internal links first.
- [ ] `sitemap.xml` / metadata `alternates.canonical` emit the canonical prefix.
- [ ] Notification `action_url` values already stored in the DB: audit `notifications.action_url LIKE '/profile/%'` and confirm the redirect covers them.
- [ ] Chat system messages with embedded profile links.
- [ ] `next.config.ts` redirect ordering — static redirects run before dynamic routes.

---

## 6. Risks

### 6.1 Migration risks

| Risk | Severity | Mitigation |
|---|---|---|
| Backfill of `social_links` → `profile_values` loses or mangles data | **High** | Never delete from `social_links` in V1. Backfill copies; both sources coexist for a full release cycle. Dual-read (values first, `social_links` fallback). Diff report before promotion. |
| `profile_type_id` NULL for rows created by legacy writers | High | `BEFORE INSERT/UPDATE` trigger (§1.3) plus a `count(*) WHERE profile_type_id IS NULL` alert. Column made `NOT NULL` only after 7 days at zero. |
| Booking shadow columns drift from `talent_id` | **Critical** | Bidirectional sync trigger + `booking_provider_drift` view asserted to return 0 rows in CI and on a scheduled admin check. |
| Seeded weights produce different scores than `lib/profile-completion.ts` | Medium | Acceptance test: compute both for every live talent, assert identical. Seed values in §1.8 are copied from the current file exactly. |
| Migrations are hand-pasted (no CLI) → partial application | Medium | Each migration is a single transactional script, idempotent, with a `SELECT` verification block at the bottom. Log applied migrations in a `schema_migrations` table. |

### 6.2 Performance risks

| Risk | Mitigation |
|---|---|
| N+1 on `profile_values` for `/explore` grids | Explore cards never read `profile_values` — card data stays entirely on typed columns. Dynamic sections load only on the profile detail page. |
| EAV join cost on profile page | One indexed query by `profile_id` returns all values; join to field defs happens in JS against the cached schema, matching the repo's existing `Promise.all` + lookup-map convention. |
| Schema query on every request | 5-minute per-isolate cache (§3.2). Worst case one extra query pair per isolate per 5 min. |
| Completion recomputed on public page views | Snapshot table; public reads never recompute (§4.3). |
| Faceted search over dynamic fields | Not supported in V1 by design. If needed: materialized view refreshed on write, not a live EAV scan. |
| Cloudflare Workers CPU limit on large schemas | Schemas are tens of fields. Zod compilation is memoized per schema version, not per request. |

### 6.3 Security / RLS risks

| Risk | Severity | Mitigation |
|---|---|---|
| New tables read through `adminClient` → RLS bypassed, no ownership check written | **Critical** | Non-negotiable rule (CLAUDE.md §8): every route touching `profile_values` writes an explicit `profile_id === user.id` check. Code review blocks any route without one. |
| Private dynamic sections leak on the public profile page | High | `profile_sections.visibility` filtered **server-side in the service**, not in the component. RLS policy in §1.5 mirrors it as defence in depth. |
| Mass assignment via dynamic fields | High | Zod `.strict()` rejects unknown keys; writes resolve `field_id` by looking the key up in the type's schema — a client-supplied `field_id` is never trusted. |
| Client writes values for a field belonging to another profile type | Medium | Write path validates every `field_id` belongs to the caller's `profile_type_id` before upsert. |
| Stored XSS via `long_text` / `media` values | Medium | No `dangerouslySetInnerHTML` in any dynamic renderer. `media` restricted to the Cloudinary host, consistent with the CSP in `next.config.ts`. |
| Admin schema editor becomes an arbitrary-content vector | Medium | `render_component` is a key into a compile-time registry; unknown keys fall back. Admin-only, service-role, role-checked. |
| The ~20 ad-hoc `/api/admin/*` endpoints gain access to new tables | Medium | Do not extend them. New admin surface is one route with its own `getUser()` + role check. |

### 6.4 Data consistency risks

| Risk | Mitigation |
|---|---|
| `role` and `profile_type_id` disagree | Sync trigger + nightly assertion query. Single source of truth becomes `profile_type_id` in Phase 4; `role` retained for auth/middleware. |
| Orphan `profile_values` after a field is deleted | `ON DELETE CASCADE` from `profile_fields`. Policy: deactivate, never delete, once values exist. |
| `bookings.talent_id` points at `profiles.id` on some seeded review rows (known legacy defect) | Pre-existing; documented in CLAUDE.md §12.3. The backfill copies the value as-is and does **not** try to repair it. Repair is a separate, audited migration. |
| Two providers claim the same `handle` | `profiles.handle` is already globally unique — one namespace across all types. Keep it that way. |
| Completion snapshot stale after an admin edits weights | Schema-version bump marks all snapshots of that type dirty in one `UPDATE`. |

---

## 7. Implementation phases

Each phase is independently shippable and independently revertible. **No phase requires downtime.**

### Phase 1 — Foundation (additive DB only)
*Ships nothing user-visible.*

- [ ] Migrations 1–5 (§1.3–§1.7).
- [ ] Seed `profile_types`, sections, fields, layouts, completion rules (§1.8).
- [ ] Backfill `profiles.profile_type_id`; verify `count(*) WHERE profile_type_id IS NULL AND role <> 'admin'` = 0.
- [ ] Backfill `bookings.provider_*`; verify `booking_provider_drift` returns 0 rows.
- [ ] Add the drift check to CI.

**Exit criteria:** all existing flows green on manual QA; `npx tsc --noEmit` and `npm run build` clean; drift view empty.
**Rollback:** drop the new tables, columns, and triggers. Nothing in the app reads them yet.

### Phase 2 — Adapter layer (code only, no behaviour change)

- [ ] `features/profiles/` scaffold: types, registry, `talent.provider.ts`, `brand.provider.ts`.
- [ ] Refactor `app/api/profile/route.ts` to use `provider.writableCoreFields` + `provider.upsertCore()`. Field lists must be byte-identical to the current consts.
- [ ] Booking-creating routes (`POST /api/bookings/direct`, job-application accept) route through `resolveBookingTarget()` and write both legacy and shadow columns.
- [ ] Adopt Zod for these route bodies — the first real `zod` import in the codebase.

**Exit criteria:** create a booking end-to-end; assert `talent_id === provider_profile_id`; assert the rating trigger still fires; assert the admin bookings list is unchanged.
**Rollback:** revert the commit. DB is untouched by this phase.

### Phase 3 — Dynamic sections + completion engine (user-visible)

- [ ] `profile-schema.service.ts`, `profile-values.service.ts`, `build-schema.ts`.
- [ ] `GET/PUT /api/profile/[id]/sections` with ownership checks.
- [ ] Section + field renderer registries; render dynamic sections on `/talent/[handle]` **below** existing content (purely additive to the page).
- [ ] Dynamic-section editor on `/profile/me`.
- [ ] `completion.service.ts` + snapshots. **Run in shadow first:** compute both old and new scores, log divergences, ship the new engine only at zero divergence.
- [ ] Delete `lib/profile-completion.ts` only after the shadow period passes.

**Exit criteria:** zero score divergence across all live talent profiles; dynamic sections render in both themes, both languages, mobile and desktop.
**Rollback:** feature-flag the dynamic section block off; completion falls back to the legacy function (kept until the flag is removed).

### Phase 4 — Route unification + `social_links` split

- [ ] Extract the unified renderer; `/talent/[handle]` delegates to it.
- [ ] Build `/brand/[handle]` on the same renderer.
- [ ] Redirect `/profile/[username]`; delete the orphan `_components/` tree.
- [ ] Backfill `social_links` → `profile_values` for `experience`, `usage_addons`, `campaign_stats`, `featured_campaign`, physical attributes. Dual-read for one release; then stop reading those keys from `social_links` — **but do not delete them.**
- [ ] Narrow `social_links` to genuine social identity only (`instagram`, `tiktok`, `youtube`, `linkedin` + follower counts) at the *read* layer.
- [ ] Make `profiles.profile_type_id` `NOT NULL`; drop the `sync_profile_type_from_role` trigger.

**Exit criteria:** every internal `/profile/*` link updated; no 404s in logs; dual-read diff report clean for 7 days.

### Phase 5 — New profile types

- [ ] `agency_profiles` table + provider + seeds + route (the §2.5 checklist).
- [ ] Phase-4 booking migration: `talent_id` nullable + `bookings_provider_consistency` CHECK.
- [ ] Switch booking reads from `talent_id` to `provider_profile_id`, one route at a time.
- [ ] Enable completion gates one at a time, each preceded by an impact query (§4.4).

**Exit criteria:** an agency receives, accepts, and is paid for a brief, with zero changes to payments, reviews, or deliverables code.

### Explicitly out of scope

- Collapsing `talent_profiles` and `brand_profiles`.
- Removing `bookings.talent_id`.
- Many-to-many user → profile.
- Runtime page builder / arbitrary component trees.
- Dynamic fields participating in search ranking or authorization.

---

## 8. `social_links` decomposition — target state

| Current `social_links` key | Goes to |
|---|---|
| `instagram`, `tiktok`, `youtube`, `linkedin` (+ follower counts) | **stays** in `social_links` — this is what it is for |
| `title`, `member_since`, `views_display`, `fast_response`, `premium` | promoted to typed `talent_profiles` columns (Phase 4) |
| `height`, `weight`, `hair_color`, `shoe_size`, `age`, `languages`, `dialect`, `gender` | `profile_values` under a `physical` dynamic section |
| `experience[]` | `profile_values` under `awards`/`experience` (repeater field) |
| `usage_addons[]` | promoted to a typed `talent_usage_addons` table — it carries **prices**, so it is core, not dynamic |
| `campaign_stats`, `featured_campaign` | `profile_values` under a `campaigns` dynamic section |
| `brands[]` (legacy) | already migrated to `talent_brands`; delete the key |

`usage_addons` moving to a typed table rather than `profile_values` is the single most important call in this table: money-bearing fields never live in EAV.

---

## 9. Definition of done, per phase

1. `npx tsc --noEmit` clean.
2. `npm run build` clean, and `npm run pages:build` succeeds (edge constraints: no Node-only APIs, `export const runtime = 'edge'` on every new route/page).
3. Manual QA: signup → profile edit → brief → accept → pay → deliver → review, as both talent and brand.
4. `SELECT count(*) FROM booking_provider_drift` = 0.
5. Completion divergence report = 0 rows (Phase 3+).
6. CLAUDE.md updated (new tables, new routes, new dependency usage), per its own §15.2 rule.
```
