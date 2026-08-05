-- ============================================================
-- 20260806_04_profile_values_layouts.sql
-- Profile Architecture V2 — Phase 1, step 4 of 7: value storage + layouts.
--
-- profile_values is the only V2 table that holds user data.
-- profile_layouts holds ORDERING ONLY — it is not a page builder.
--
-- ADDITIVE ONLY. Idempotent.
-- Depends on: 20260806_03_profile_sections_fields.sql
-- ============================================================

-- ─── profile_values ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- profiles.id is 1:1 with auth.users.id, so profile_id = auth.uid() for the
  -- owner. The RLS policies in step 7 rely on that identity.
  profile_id  uuid NOT NULL REFERENCES public.profiles(id)       ON DELETE CASCADE,
  field_id    uuid NOT NULL REFERENCES public.profile_fields(id) ON DELETE CASCADE,

  -- Always jsonb. Scalars are stored as jsonb scalars ("cairo", 42, true),
  -- never wrapped in an object. The application casts by profile_fields.field_type.
  value       jsonb NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_values_unique_field UNIQUE (profile_id, field_id)
);

COMMENT ON TABLE  public.profile_values IS
  'Profile Architecture V2: dynamic profile values. NEVER stores money, moderation state, ratings, or anything read by a booking, payment, or authorization check — those stay in strongly typed columns.';
COMMENT ON COLUMN public.profile_values.value IS
  'jsonb scalar or array. Cast by the field_type of the referenced profile_fields row.';

-- Primary read pattern: every value for one profile, in one indexed scan.
CREATE INDEX IF NOT EXISTS idx_profile_values_profile
  ON public.profile_values(profile_id);

-- Reverse lookup: "which profiles have a value for this field".
CREATE INDEX IF NOT EXISTS idx_profile_values_field
  ON public.profile_values(field_id);

-- Scalar equality filter, e.g. equipment.owns_studio = true.
-- `value #>> '{}'` extracts a jsonb scalar as text.
CREATE INDEX IF NOT EXISTS idx_profile_values_field_text
  ON public.profile_values(field_id, (value #>> '{}'));

-- Containment queries on array-valued fields (multi_select, json).
CREATE INDEX IF NOT EXISTS idx_profile_values_value_gin
  ON public.profile_values USING gin (value jsonb_path_ops);

DROP TRIGGER IF EXISTS set_profile_values_updated_at ON public.profile_values;
CREATE TRIGGER set_profile_values_updated_at
  BEFORE UPDATE ON public.profile_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── profile_layouts ─────────────────────────────────────────────────────────
-- Placement and ordering of already-defined sections. The layout jsonb contains
-- ONLY profile_sections.key strings inside named slots. It contains no markup,
-- no component source, no styles. Unknown keys are ignored at render time.
CREATE TABLE IF NOT EXISTS public.profile_layouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type_id uuid NOT NULL REFERENCES public.profile_types(id) ON DELETE CASCADE,

  -- Which surface this layout describes:
  --   'public' = /{route_prefix}/[handle]
  --   'edit'   = /profile/me
  --   'card'   = explore grid card
  variant         text NOT NULL DEFAULT 'public'
                    CHECK (variant IN ('public', 'edit', 'card')),

  -- { "main": ["bio","portfolio"], "sidebar": ["experience"] }
  layout          jsonb NOT NULL DEFAULT '{}'::jsonb,

  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (profile_type_id, variant)
);

COMMENT ON TABLE public.profile_layouts IS
  'Profile Architecture V2: section ORDERING only. Deliberately not a page builder — contains no markup, styles, or component definitions.';

CREATE INDEX IF NOT EXISTS idx_profile_layouts_type
  ON public.profile_layouts(profile_type_id, is_active);

DROP TRIGGER IF EXISTS set_profile_layouts_updated_at ON public.profile_layouts;
CREATE TRIGGER set_profile_layouts_updated_at
  BEFORE UPDATE ON public.profile_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.profile_values') IS NULL
     OR to_regclass('public.profile_layouts') IS NULL THEN
    RAISE EXCEPTION '20260806_04 failed: value/layout tables missing';
  END IF;
  RAISE NOTICE 'OK 20260806_04: profile_values + profile_layouts created';
END $$;
