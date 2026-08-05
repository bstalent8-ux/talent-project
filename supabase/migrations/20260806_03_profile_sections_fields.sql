-- ============================================================
-- 20260806_03_profile_sections_fields.sql
-- Profile Architecture V2 — Phase 1, step 3 of 7: section + field definitions.
--
-- Config tables only. No user data lives here.
--
-- ADDITIVE ONLY. Idempotent.
-- Depends on: 20260806_01_profile_types.sql
-- ============================================================

-- ─── profile_sections ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_sections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type_id uuid NOT NULL REFERENCES public.profile_types(id) ON DELETE CASCADE,

  -- Stable machine key, unique within a type. Code references sections by
  -- (type slug, key) — never by uuid.
  key             text NOT NULL,

  -- Internal English title + admin note.
  title           text NOT NULL,
  description     text,

  -- User-facing bilingual copy (CLAUDE.md §15.5).
  title_ar        text,
  title_en        text,
  description_ar  text,
  description_en  text,

  display_order   integer NOT NULL DEFAULT 0,
  is_enabled      boolean NOT NULL DEFAULT true,

  -- ── Forward-compat columns, unused in Phase 1 ─────────────────────────────
  -- 'core'    = satisfied by a strongly typed column on talent_profiles /
  --             brand_profiles; scored by the Phase 3 provider adapter.
  -- 'dynamic' = satisfied by profile_values rows; scored generically.
  kind            text NOT NULL DEFAULT 'dynamic'
                    CHECK (kind IN ('core', 'dynamic')),
  -- Phase 3 completion engine weight. Relative; the engine normalizes to 100.
  weight          integer NOT NULL DEFAULT 0
                    CHECK (weight >= 0 AND weight <= 100),
  -- Phase 3 read gating. Enforced in the service layer AND by the RLS policy
  -- on profile_values (see 20260806_07_dynamic_profile_rls.sql).
  visibility      text NOT NULL DEFAULT 'public'
                    CHECK (visibility IN ('public', 'authenticated', 'owner', 'admin')),
  -- Key into a COMPILE-TIME React renderer registry. Never dynamic code.
  -- An unknown value falls back to a generic renderer; it can never break a page.
  render_component text,
  icon            text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (profile_type_id, key),
  CONSTRAINT profile_sections_key_format CHECK (key ~ '^[a-z][a-z0-9_]*$')
);

COMMENT ON TABLE  public.profile_sections IS
  'Profile Architecture V2: configurable profile sections per profile type.';
COMMENT ON COLUMN public.profile_sections.kind IS
  'core = backed by a typed column on talent_profiles/brand_profiles; dynamic = backed by profile_values.';
COMMENT ON COLUMN public.profile_sections.render_component IS
  'Lookup key into a compile-time component registry. NOT executable content.';
COMMENT ON COLUMN public.profile_sections.is_enabled IS
  'Soft disable. Sections are NEVER hard-deleted once profile_values rows exist.';

CREATE INDEX IF NOT EXISTS idx_profile_sections_type_enabled
  ON public.profile_sections(profile_type_id, is_enabled, display_order);

DROP TRIGGER IF EXISTS set_profile_sections_updated_at ON public.profile_sections;
CREATE TRIGGER set_profile_sections_updated_at
  BEFORE UPDATE ON public.profile_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── profile_fields ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_fields (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      uuid NOT NULL REFERENCES public.profile_sections(id) ON DELETE CASCADE,

  key             text NOT NULL,

  -- Internal English label.
  label           text NOT NULL,
  -- User-facing bilingual copy.
  label_ar        text,
  label_en        text,
  placeholder_ar  text,
  placeholder_en  text,
  help_text_ar    text,
  help_text_en    text,

  -- Deliberately a CHECK constraint, NOT a Postgres enum.
  -- Enum values cannot be removed, which would violate this phase's
  -- reversibility requirement. A CHECK can be altered or dropped freely.
  field_type      text NOT NULL CHECK (field_type IN (
                    'text',
                    'number',
                    'boolean',
                    'select',
                    'multi_select',
                    'media',
                    'json'
                  )),

  is_required     boolean NOT NULL DEFAULT false,

  -- Constraint bag consumed by the Phase 3 Zod schema builder.
  -- Shape: { minLength, maxLength, pattern, min, max, step, maxItems, accept }
  validation_schema jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- ── Forward-compat, unused in Phase 1 ─────────────────────────────────────
  -- select / multi_select choices: [{ value, label_ar, label_en }]
  -- json fields: child field definitions for repeater-style rendering.
  options         jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Weight WITHIN the parent section. The section's weight is split across its
  -- fields by this ratio. 0 = field does not count toward completion.
  weight          integer NOT NULL DEFAULT 1 CHECK (weight >= 0),
  is_enabled      boolean NOT NULL DEFAULT true,

  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (section_id, key),
  CONSTRAINT profile_fields_key_format CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  -- `options` must always be a JSON array, never an object or scalar.
  -- Checked separately so the constraint below can never be handed a non-array.
  CONSTRAINT profile_fields_options_is_array CHECK (jsonb_typeof(options) = 'array'),

  -- select / multi_select are meaningless without choices.
  -- Postgres does not guarantee OR short-circuit evaluation, so the array-type
  -- guard is repeated here rather than relied upon from the constraint above.
  CONSTRAINT profile_fields_options_required CHECK (
    field_type NOT IN ('select', 'multi_select')
    OR (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) > 0)
  )
);

COMMENT ON TABLE  public.profile_fields IS
  'Profile Architecture V2: typed field definitions inside a dynamic profile section.';
COMMENT ON COLUMN public.profile_fields.field_type IS
  'CHECK constraint rather than an enum: enum values cannot be dropped, which would make this migration irreversible.';
COMMENT ON COLUMN public.profile_fields.validation_schema IS
  'Constraint bag compiled to a Zod schema server-side in Phase 3. The server always re-validates; client validation is advisory.';

CREATE INDEX IF NOT EXISTS idx_profile_fields_section_enabled
  ON public.profile_fields(section_id, is_enabled, display_order);

DROP TRIGGER IF EXISTS set_profile_fields_updated_at ON public.profile_fields;
CREATE TRIGGER set_profile_fields_updated_at
  BEFORE UPDATE ON public.profile_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.profile_sections') IS NULL
     OR to_regclass('public.profile_fields') IS NULL THEN
    RAISE EXCEPTION '20260806_03 failed: section/field tables missing';
  END IF;
  RAISE NOTICE 'OK 20260806_03: profile_sections + profile_fields created';
END $$;
