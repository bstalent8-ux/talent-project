-- ─── Register this session's new notification types ───────────────────────
-- 20260730_notification_system_v2.sql adds notifications.type -> a FOREIGN
-- KEY on notification_types(code). Its own INSERT list only covers the
-- types that existed on 2026-07-30 — TESTIMONIAL_SUBMITTED,
-- BRAND_MOMENT_SUBMITTED and SUPPORT_TICKET_SUBMITTED were added to
-- lib/notifications/types.ts afterward and were never registered here, so
-- every notifyRole() call for them would violate the FK once v2 is applied.
-- Run this AFTER 20260730_notification_system_v2.sql.

INSERT INTO public.notification_types (code, category, default_priority) VALUES
  ('TESTIMONIAL_SUBMITTED',    'landing', 'normal'),
  ('BRAND_MOMENT_SUBMITTED',   'landing', 'normal'),
  ('SUPPORT_TICKET_SUBMITTED', 'support', 'high')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.notification_types
   WHERE code IN ('TESTIMONIAL_SUBMITTED', 'BRAND_MOMENT_SUBMITTED', 'SUPPORT_TICKET_SUBMITTED');
  RAISE NOTICE '% of 3 new notification types registered (expect 3)', v_count;
END $$;
