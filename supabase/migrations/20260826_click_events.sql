-- ─── Click tracking ─────────────────────────────────────────────────────────
-- Adds "click" to user_events.event_name's allow-list. Fired by
-- components/analytics/ClickTracker.tsx on every click that lands on (or
-- inside) a link/button/interactive element, carrying:
--   metadata.path  — the page the click happened on
--   metadata.label — best-effort human-readable description of what was
--                    clicked (aria-label, then title, then trimmed text
--                    content, then tag name — see lib/analytics/click-
--                    tracking.ts's buildClickLabel())
--   metadata.href  — the link destination, when the clicked element (or an
--                    ancestor) is an <a href="...">
--
-- Idempotent: drops and re-adds the named CHECK constraint, safe to re-run.
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_event_name_check;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_event_name_check CHECK (event_name IN (
  'page_view', 'talent_profile_view', 'search',
  'booking_brief_sent', 'job_application', 'signup', 'login',
  'page_engagement', 'click'
));
