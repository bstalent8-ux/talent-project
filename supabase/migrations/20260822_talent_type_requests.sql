-- Talent registration demand tracking: which talent type each new talent
-- signup selected (ugc | model | other), plus free-text detail and campaign
-- source when "other" is picked. Used only for admin analytics/demand
-- tracking — never promotes a custom "other" value into a real category.
-- Idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS public.talent_type_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_type    text        NOT NULL CHECK (selected_type IN ('ugc', 'model', 'other')),
  other_type_text  text,
  utm_source       text,
  utm_campaign     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_type_requests_user          ON public.talent_type_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_type_requests_selected_type ON public.talent_type_requests(selected_type);
CREATE INDEX IF NOT EXISTS idx_talent_type_requests_created_at    ON public.talent_type_requests(created_at);

-- RLS enabled with no policies: locked to the service role (adminClient),
-- matching notifications' "no general INSERT policy, writes go through
-- service-role app code" pattern. Only admin-facing code ever reads this.
ALTER TABLE public.talent_type_requests ENABLE ROW LEVEL SECURITY;
