-- ─── Per-page engagement tracking ──────────────────────────────────────────
-- Adds "page_engagement" to user_events.event_name's allow-list. Fired once
-- per page view (on route change, tab hidden, or page unload — see
-- lib/analytics/page-engagement.ts), carrying:
--   metadata.path         — same convention as page_view
--   metadata.duration_ms  — time the page stayed the active/visible tab
--   metadata.render_ms    — time from mount to the frame after paint
--                            (a cheap double-requestAnimationFrame estimate,
--                            not a Core Web Vitals metric); null if the page
--                            was hidden before that frame ever ran
--   metadata.scrolled     — whether the visitor scrolled at all (>40px)
--
-- Idempotent: drops and re-adds the named CHECK constraint, safe to re-run.
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_event_name_check;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_event_name_check CHECK (event_name IN (
  'page_view', 'talent_profile_view', 'search',
  'booking_brief_sent', 'job_application', 'signup', 'login',
  'page_engagement'
));
