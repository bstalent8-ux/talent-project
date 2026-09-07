-- ─── Leads CRM: dynamic pipeline stages ────────────────────────────────────
-- Replaces the fixed 5-value `leads.status` enum with an admin-manageable
-- table of stages (add/remove/reorder), each optionally carrying its own set
-- of custom questions (asked when a lead is moved INTO that stage — e.g. a
-- "deal value" field on a "Converted" stage). Per CLAUDE.md §6, this file is
-- pasted into the Supabase SQL editor by a human — not auto-applied.

CREATE TABLE IF NOT EXISTS public.lead_stages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  color       text        NOT NULL DEFAULT '#00D26A', -- hex, board column header / status pill
  sort_order  int         NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_stages_sort_order ON public.lead_stages(sort_order);

-- Per-stage custom questions — asked in a small form when a lead is dropped
-- onto this stage's board column (or picked from the status dropdown).
-- Answers are stored per-transition on lead_actions.stage_answers, keyed by
-- field_key, so the CRM keeps a full history of what was answered each time
-- a lead moved, not just the latest value.
CREATE TABLE IF NOT EXISTS public.lead_stage_fields (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id    uuid        NOT NULL REFERENCES public.lead_stages(id) ON DELETE CASCADE,
  field_key   text        NOT NULL,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  field_type  text        NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'date', 'select', 'textarea')),
  options     jsonb,      -- for field_type = 'select': [{ "value": "...", "labelAr": "...", "labelEn": "..." }]
  required    boolean     NOT NULL DEFAULT false,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_lead_stage_fields_stage_id ON public.lead_stage_fields(stage_id);

ALTER TABLE public.lead_stages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_fields ENABLE ROW LEVEL SECURITY;
-- No policies — same service-role-only pattern as the rest of the leads CRM.

CREATE OR REPLACE FUNCTION public.touch_lead_stage_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_stages_touch_updated_at ON public.lead_stages;
CREATE TRIGGER trg_lead_stages_touch_updated_at
  BEFORE UPDATE ON public.lead_stages
  FOR EACH ROW EXECUTE FUNCTION public.touch_lead_stage_updated_at();

-- ─── leads.stage_id — the new source of truth ──────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES public.lead_stages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);

-- lead_actions gains two columns to record a stage-change event: which stage
-- it moved to, and the answers to that stage's custom questions (if any).
-- Both null for every other action_type (call/message/email/meeting/note).
ALTER TABLE public.lead_actions ADD COLUMN IF NOT EXISTS stage_id      uuid REFERENCES public.lead_stages(id) ON DELETE SET NULL;
ALTER TABLE public.lead_actions ADD COLUMN IF NOT EXISTS stage_answers jsonb;

-- ─── Seed the 5 stages that exactly match the old fixed status values ──────
-- Existing leads keep their effective stage — nothing visually changes for
-- data created before this migration ran.
INSERT INTO public.lead_stages (key, label_ar, label_en, color, sort_order) VALUES
  ('new',            'جديد',          'New',            '#0EA5E9', 0),
  ('contacted',      'تم التواصل',    'Contacted',      '#F4B740', 1),
  ('interested',     'مهتم',          'Interested',     '#00D26A', 2),
  ('not_interested', 'مش مهتم',       'Not interested', '#94A3B8', 3),
  ('converted',      'اتحول لعميل',   'Converted',      '#8B5CF6', 4)
ON CONFLICT (key) DO NOTHING;

-- Backfill leads.stage_id from the old leads.status text column.
UPDATE public.leads l
SET stage_id = s.id
FROM public.lead_stages s
WHERE l.stage_id IS NULL AND l.status = s.key;

-- Any lead whose old status somehow didn't match one of the 5 (shouldn't
-- happen — status had a CHECK constraint — but fails safe) lands on "new"
-- rather than staying null and disappearing from every board column.
UPDATE public.leads l
SET stage_id = (SELECT id FROM public.lead_stages WHERE key = 'new')
WHERE l.stage_id IS NULL;

-- Drop the fixed-5-value CHECK constraint — status is no longer written to
-- going forward (stage_id is authoritative), but the column and its old
-- values are left in place as a harmless historical record rather than
-- dropped outright.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

DO $$
DECLARE v_stages int; v_unmigrated int;
BEGIN
  SELECT count(*) INTO v_stages FROM public.lead_stages;
  SELECT count(*) INTO v_unmigrated FROM public.leads WHERE stage_id IS NULL;
  RAISE NOTICE 'lead_stages seeded: % (expect >= 5). leads with no stage_id (expect 0): %', v_stages, v_unmigrated;
END $$;
