-- ─── Recruitment CRM: candidates ────────────────────────────────────────────
-- A second, parallel pipeline to the leads CRM — same dynamic-stage engine
-- (admin adds/removes stages + per-stage custom questions, exactly like
-- lead_stages/lead_stage_fields — see 20260907_leads_dynamic_stages.sql),
-- applied to job applicants instead of sales leads. Deliberately a SEPARATE
-- set of tables, not a "type" column on leads — a candidate isn't a lead,
-- has its own fields (job_title, expected_salary), and the two pipelines
-- must never share a stage/category list.
-- Per CLAUDE.md §6, pasted into the Supabase SQL editor by a human.

CREATE TABLE IF NOT EXISTS public.candidate_stages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  color       text        NOT NULL DEFAULT '#00D26A',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidate_stage_fields (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id    uuid        NOT NULL REFERENCES public.candidate_stages(id) ON DELETE CASCADE,
  field_key   text        NOT NULL,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  field_type  text        NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'date', 'select', 'textarea', 'number')),
  options     jsonb,
  required    boolean     NOT NULL DEFAULT false,
  sort_order  int         NOT NULL DEFAULT 0,
  UNIQUE (stage_id, field_key)
);

-- Job-type/category taxonomy — admin-manageable, filterable (e.g. Model,
-- UGC, Influencer, Developer...). Same shape/rules as lead_categories:
-- ON DELETE SET NULL, no reassignment-on-delete needed.
CREATE TABLE IF NOT EXISTS public.candidate_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidates (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name              text,
  phone                  text,
  email                  text,
  social_handle          text,
  extra                  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  stage_id               uuid        REFERENCES public.candidate_stages(id) ON DELETE SET NULL,
  category_id            uuid        REFERENCES public.candidate_categories(id) ON DELETE SET NULL,
  -- Free-text job title/role applied for — not a FK to `jobs`: most
  -- candidates come from manual/Excel/Sheet import, same messy-data
  -- reasoning as leads.
  job_title               text,
  expected_salary          numeric,
  source                 text        NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'excel', 'sheet')),
  assigned_to            uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by             uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  possible_duplicate_of  uuid        REFERENCES public.candidates(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidate_actions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   uuid        NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  action_type    text        NOT NULL,
  note           text,
  performed_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  follow_up_at   timestamptz,
  notified_at    timestamptz,
  stage_id       uuid        REFERENCES public.candidate_stages(id) ON DELETE SET NULL,
  stage_answers  jsonb,
  assigned_to    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_stage_fields_stage_id  ON public.candidate_stage_fields(stage_id);
CREATE INDEX IF NOT EXISTS idx_candidates_stage_id              ON public.candidates(stage_id);
CREATE INDEX IF NOT EXISTS idx_candidates_category_id           ON public.candidates(category_id);
CREATE INDEX IF NOT EXISTS idx_candidates_assigned_to           ON public.candidates(assigned_to);
CREATE INDEX IF NOT EXISTS idx_candidates_email                 ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone                 ON public.candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidate_actions_candidate_id   ON public.candidate_actions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_actions_follow_up      ON public.candidate_actions(follow_up_at) WHERE notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidate_actions_assigned_to    ON public.candidate_actions(assigned_to);

ALTER TABLE public.candidate_stages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_stage_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_actions      ENABLE ROW LEVEL SECURITY;
-- No policies — service-role-only, same pattern as the leads CRM tables.

-- Seed the pipeline the request described: New -> Contacted -> Interview
-- (report captured as a required custom field on that stage) -> two
-- terminal outcomes, Rejected (red, required reason) and Accepted (green,
-- required reason) — modeled as two ordinary stages rather than a special
-- "decision" concept, so the existing move-stage-with-required-fields flow
-- (MoveStageModal) just works unmodified. All of this stays fully
-- admin-editable afterward — add/remove/reorder stages and questions
-- exactly like the leads pipeline.
INSERT INTO public.candidate_stages (key, label_ar, label_en, color, sort_order)
VALUES
  ('new',        'جديد',         'New',        '#0EA5E9', 0),
  ('contacted',  'تم التواصل',   'Contacted',  '#F4B740', 1),
  ('interview',  'مقابلة',       'Interview',  '#8B5CF6', 2),
  ('rejected',   'مرفوض',        'Rejected',   '#EF4444', 3),
  ('accepted',   'مقبول',        'Accepted',   '#00D26A', 4)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.candidate_stage_fields (stage_id, field_key, label_ar, label_en, field_type, required, sort_order)
SELECT id, 'report', 'ريبورت المقابلة', 'Interview report', 'textarea', true, 0
FROM public.candidate_stages WHERE key = 'interview'
ON CONFLICT (stage_id, field_key) DO NOTHING;

INSERT INTO public.candidate_stage_fields (stage_id, field_key, label_ar, label_en, field_type, required, sort_order)
SELECT id, 'reason', 'سبب الرفض', 'Rejection reason', 'textarea', true, 0
FROM public.candidate_stages WHERE key = 'rejected'
ON CONFLICT (stage_id, field_key) DO NOTHING;

INSERT INTO public.candidate_stage_fields (stage_id, field_key, label_ar, label_en, field_type, required, sort_order)
SELECT id, 'reason', 'سبب القبول', 'Acceptance reason', 'textarea', true, 0
FROM public.candidate_stages WHERE key = 'accepted'
ON CONFLICT (stage_id, field_key) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'candidates recruitment CRM created: % stages seeded.',
    (SELECT count(*) FROM public.candidate_stages);
END $$;
