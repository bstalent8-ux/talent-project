-- ─── Leads CRM: source channel + talent category ───────────────────────────
-- Two more admin-manageable taxonomies, same shape as lead_stages but
-- simpler (no per-term custom questions, no "move stage" history — these
-- are plain descriptive tags an admin can change any time):
--   lead_channels   — where the lead actually came from in real life
--                     (Facebook Ads, Instagram, a WhatsApp group...).
--                     Distinct from `leads.source`, which already means
--                     something else: HOW the row entered this CRM
--                     (manual/excel/sheet import method) — kept as-is,
--                     not touched by this migration.
--   lead_categories — what kind of talent this lead is (Model, UGC,
--                     Host...), independent of the real talent_profiles
--                     category system since a lead isn't a registered
--                     talent yet.
-- Per CLAUDE.md §6, this file is pasted into the Supabase SQL editor by a
-- human — it is not auto-applied.

CREATE TABLE IF NOT EXISTS public.lead_channels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_channels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_categories ENABLE ROW LEVEL SECURITY;
-- No policies — same service-role-only pattern as the rest of the leads CRM.

-- Nullable, ON DELETE SET NULL — unlike a stage, losing a channel/category
-- tag isn't a broken workflow state, just an unset descriptive field, so no
-- app-layer reassignment-on-delete logic is needed here (contrast with
-- lead_stages' delete handling in lead-stages.service.ts).
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS channel_id  uuid REFERENCES public.lead_channels(id)  ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.lead_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_channel_id  ON public.leads(channel_id);
CREATE INDEX IF NOT EXISTS idx_leads_category_id ON public.leads(category_id);

-- No seed rows — unlike stages, there's no existing fixed list to preserve
-- continuity with. The admin builds their own list from a blank slate
-- (e.g. "Facebook Ads", "Instagram", "WhatsApp Group" / "Model", "UGC",
-- "Host") from the Leads settings panel.

DO $$
BEGIN
  RAISE NOTICE 'lead_channels and lead_categories created; leads.channel_id / category_id added.';
END $$;
