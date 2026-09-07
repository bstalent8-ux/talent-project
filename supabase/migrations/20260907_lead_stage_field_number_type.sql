-- ─── Leads CRM: "number" as a stage-question answer type ────────────────────
-- Adds "number" alongside text/date/select/textarea for lead_stage_fields.field_type.
-- Per CLAUDE.md §6, pasted into the Supabase SQL editor by a human.

ALTER TABLE public.lead_stage_fields DROP CONSTRAINT IF EXISTS lead_stage_fields_field_type_check;
ALTER TABLE public.lead_stage_fields ADD CONSTRAINT lead_stage_fields_field_type_check
  CHECK (field_type IN ('text', 'date', 'select', 'textarea', 'number'));

DO $$
BEGIN
  RAISE NOTICE 'lead_stage_fields.field_type now allows number.';
END $$;
