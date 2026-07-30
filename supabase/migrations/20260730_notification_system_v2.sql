-- ============================================================================
-- 20260730_notification_system_v2.sql
-- Unified, event-driven notification system.
--
-- Supersedes 004_notifications.sql (which created a minimal notifications
-- table). This migration is written to run on BOTH a database that already has
-- the v1 table and a fresh database.
--
-- Run this in the Supabase SQL Editor. It is idempotent.
--
-- ⚠️ BREAKING: renames notifications.user_id -> notifications.recipient_id.
--    Deploy the matching application code in the same window.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. Notification type registry (extensibility + future templates)
--    A lookup table instead of a CHECK constraint: adding a new notification
--    type is an INSERT, not a migration that rewrites a table constraint.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_types (
  code             text        PRIMARY KEY,
  category         text        NOT NULL DEFAULT 'general',
  default_priority text        NOT NULL DEFAULT 'normal',
  -- Optional bilingual templates. `{{placeholder}}` tokens are interpolated by
  -- the application layer (lib/notifications/templates.ts).
  title_ar         text,
  title_en         text,
  message_ar       text,
  message_en       text,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notification_types_priority_check
    CHECK (default_priority IN ('low', 'normal', 'high', 'urgent'))
);

INSERT INTO public.notification_types (code, category, default_priority) VALUES
  ('JOB_CREATED',               'job',          'normal'),
  ('JOB_APPLICATION_RECEIVED',  'job',          'high'),
  ('APPLICATION_ACCEPTED',      'job',          'high'),
  ('APPLICATION_REJECTED',      'job',          'normal'),
  ('BOOKING_REQUEST',           'booking',      'high'),
  ('BOOKING_ACCEPTED',          'booking',      'high'),
  ('BOOKING_DECLINED',          'booking',      'normal'),
  ('BOOKING_UPDATED',           'booking',      'normal'),
  ('DELIVERABLE_SUBMITTED',     'booking',      'high'),
  ('CHAT_MESSAGE',              'chat',         'normal'),
  ('NEW_REVIEW',                'review',       'normal'),
  ('PROFILE_APPROVED',          'profile',      'high'),
  ('PROFILE_REJECTED',          'profile',      'high'),
  ('SUBSCRIPTION_UPDATED',      'billing',      'normal'),
  ('PAYMENT_SUCCESS',           'billing',      'high'),
  ('PAYMENT_FAILED',            'billing',      'urgent'),
  ('SYSTEM',                    'system',       'normal'),
  ('ADMIN_MESSAGE',             'system',       'high'),
  ('GENERAL',                   'general',      'normal')
ON CONFLICT (code) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Base table (fresh installs). Existing installs skip this and are patched
--    by step 3.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text        NOT NULL,
  title        text        NOT NULL,
  message      text        NOT NULL,
  is_read      boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. Upgrade the v1 shape -> v2 shape
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- 3a. user_id -> recipient_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN user_id TO recipient_id;
  END IF;
END $$;

-- 3b. New columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message    text,
  ADD COLUMN IF NOT EXISTS sender_id   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action_url  text,
  ADD COLUMN IF NOT EXISTS metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at     timestamptz,
  ADD COLUMN IF NOT EXISTS priority    text        NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz,
  -- broadcast grouping: lets the admin center report on / revoke a blast
  ADD COLUMN IF NOT EXISTS broadcast_id uuid;

-- Some early production tables only stored `title`; use it as the initial
-- body so the new NOT NULL message contract can be enforced without losing
-- those rows.
UPDATE public.notifications
   SET message = title
 WHERE message IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN message SET NOT NULL;

-- 3c. Fold the v1 reference_id / reference_type columns into metadata, then
--     drop them. Keeping two parallel "what does this point at" mechanisms is
--     exactly the kind of drift this migration exists to remove.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'reference_id'
  ) THEN
    UPDATE public.notifications
       SET metadata = metadata
         || jsonb_strip_nulls(jsonb_build_object(
              'reference_id',   reference_id,
              'reference_type', reference_type
            ))
     WHERE reference_id IS NOT NULL OR reference_type IS NOT NULL;

    ALTER TABLE public.notifications DROP COLUMN IF EXISTS reference_id;
    ALTER TABLE public.notifications DROP COLUMN IF EXISTS reference_type;
  END IF;
END $$;

-- 3d. Migrate legacy lowercase type values to the canonical registry codes.
--     Drop the old CHECK constraints first — they reject the new values.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_ref_type_check;

UPDATE public.notifications SET type = CASE type
  WHEN 'message'          THEN 'CHAT_MESSAGE'
  WHEN 'job_application'  THEN 'JOB_APPLICATION_RECEIVED'
  WHEN 'brief'            THEN 'BOOKING_REQUEST'
  WHEN 'booking_request'  THEN 'BOOKING_REQUEST'
  WHEN 'booking'          THEN 'BOOKING_UPDATED'
  WHEN 'payment'          THEN 'PAYMENT_SUCCESS'
  WHEN 'review'           THEN 'NEW_REVIEW'
  WHEN 'system'           THEN 'SYSTEM'
  ELSE type
END
WHERE type IN ('message','job_application','brief','booking_request','booking','payment','review','system');

-- Anything unrecognised (hand-inserted rows, older experiments) becomes GENERAL
-- so the FK in 3e can be added without failing.
UPDATE public.notifications n
   SET type = 'GENERAL'
 WHERE NOT EXISTS (SELECT 1 FROM public.notification_types t WHERE t.code = n.type);

-- 3e. Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_type_fkey
      FOREIGN KEY (type) REFERENCES public.notification_types(code)
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_priority_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;

-- 3f. read_at backfill for rows already marked read before the column existed
UPDATE public.notifications
   SET read_at = created_at
 WHERE is_read = true AND read_at IS NULL;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. Broadcast audit log — one row per admin blast
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_broadcasts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  audience        text        NOT NULL,
  audience_filter jsonb       NOT NULL DEFAULT '{}'::jsonb,
  type            text        NOT NULL REFERENCES public.notification_types(code) ON UPDATE CASCADE,
  title           text        NOT NULL,
  message         text        NOT NULL,
  action_url      text,
  priority        text        NOT NULL DEFAULT 'normal',
  expires_at      timestamptz,
  recipient_count integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notification_broadcasts_audience_check
    CHECK (audience IN ('single', 'multiple', 'role', 'category', 'everyone')),
  CONSTRAINT notification_broadcasts_priority_check
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_broadcast_id_fkey') THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_broadcast_id_fkey
      FOREIGN KEY (broadcast_id) REFERENCES public.notification_broadcasts(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. Indexes
--    The dominant query is:
--      WHERE recipient_id = $1 [AND is_read = false] ORDER BY created_at DESC
--    so every index is a composite led by recipient_id.
-- ────────────────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_notifications_created_at;
DROP INDEX IF EXISTS public.idx_notifications_unread;

-- Feed / pagination (keyset on created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC, id DESC);

-- Unread badge — partial index keeps it tiny and hot
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, created_at DESC)
  WHERE is_read = false;

-- Filtered feed by type
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type
  ON public.notifications (recipient_id, type, created_at DESC);

-- Expiry sweeper
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at
  ON public.notifications (expires_at)
  WHERE expires_at IS NOT NULL;

-- Broadcast reporting
CREATE INDEX IF NOT EXISTS idx_notifications_broadcast
  ON public.notifications (broadcast_id)
  WHERE broadcast_id IS NOT NULL;

-- Metadata lookups (e.g. "did we already notify about this booking?")
CREATE INDEX IF NOT EXISTS idx_notifications_metadata
  ON public.notifications USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_notification_broadcasts_created
  ON public.notification_broadcasts (created_at DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;

-- Helper: is the current JWT an admin? STABLE + SECURITY DEFINER so the policy
-- can read profiles without recursing through the profiles policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Drop v1 policy names as well as v2 so re-running is clean
DROP POLICY IF EXISTS "notifications_select_own"    ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"    ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own"    ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_admin"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_admin"  ON public.notifications;

-- Read: only your own, and only if not expired.
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = recipient_id
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Update: only your own. The WITH CHECK clause prevents re-assigning a
-- notification to another user via UPDATE.
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Delete: only your own (dismiss).
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = recipient_id);

-- Insert: NO policy for `authenticated`. A user can never create a notification
-- for anyone — themselves included. All writes go through the service role
-- (lib/supabase/admin.ts), which bypasses RLS, behind an app-level role check.
-- Admins additionally get a defence-in-depth insert path:
CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- Type registry: readable by everyone (the UI renders icons/labels from it),
-- writable only by the service role.
DROP POLICY IF EXISTS "notification_types_select_all" ON public.notification_types;
CREATE POLICY "notification_types_select_all" ON public.notification_types
  FOR SELECT TO authenticated, anon
  USING (true);

-- Broadcast log: admins only.
DROP POLICY IF EXISTS "notification_broadcasts_admin_all" ON public.notification_broadcasts;
CREATE POLICY "notification_broadcasts_admin_all" ON public.notification_broadcasts
  FOR SELECT TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────────────────
-- 7. Realtime
--    REPLICA IDENTITY FULL is required for `filter:` to work on UPDATE/DELETE
--    events — without it Postgres only ships the primary key in the OLD image,
--    so Realtime cannot evaluate `recipient_id=eq.<uuid>` and drops the event.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename  = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 8. Set-based fan-out
--    Broadcasting to "everyone" from JS would mean SELECTing every profile id
--    into the Worker and POSTing a giant array back. This does it as a single
--    INSERT ... SELECT inside Postgres: one round trip, no unbounded payload.
--
--    p_audience:
--      'single'   -> p_user_ids (first element)
--      'multiple' -> p_user_ids
--      'role'     -> profiles.role = ANY(p_roles)
--      'category' -> profile_categories.category_id = ANY(p_categories)
--      'everyone' -> all active profiles
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fan_out_notification(
  p_type         text,
  p_title        text,
  p_message      text,
  p_audience     text,
  p_sender_id    uuid        DEFAULT NULL,
  p_action_url   text        DEFAULT NULL,
  p_metadata     jsonb       DEFAULT '{}'::jsonb,
  p_priority     text        DEFAULT 'normal',
  p_expires_at   timestamptz DEFAULT NULL,
  p_user_ids     uuid[]      DEFAULT NULL,
  p_roles        text[]      DEFAULT NULL,
  p_categories   text[]      DEFAULT NULL,
  p_broadcast_id uuid        DEFAULT NULL,
  p_exclude_self boolean     DEFAULT true
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer;
BEGIN
  WITH audience AS (
    SELECT DISTINCT p.id
      FROM public.profiles p
      LEFT JOIN public.profile_categories pc ON pc.profile_id = p.id
     WHERE COALESCE(p.account_status, 'active') = 'active'
       AND CASE p_audience
             WHEN 'single'   THEN p.id = ANY(COALESCE(p_user_ids, '{}'::uuid[]))
             WHEN 'multiple' THEN p.id = ANY(COALESCE(p_user_ids, '{}'::uuid[]))
             WHEN 'role'     THEN p.role::text = ANY(COALESCE(p_roles, '{}'::text[]))
             WHEN 'category' THEN pc.category_id = ANY(COALESCE(p_categories, '{}'::text[]))
             WHEN 'everyone' THEN true
             ELSE false
           END
       AND (NOT p_exclude_self OR p_sender_id IS NULL OR p.id <> p_sender_id)
  )
  INSERT INTO public.notifications (
    recipient_id, sender_id, type, title, message,
    action_url, metadata, priority, expires_at, broadcast_id
  )
  SELECT a.id, p_sender_id, p_type, p_title, p_message,
         p_action_url, COALESCE(p_metadata, '{}'::jsonb), p_priority, p_expires_at, p_broadcast_id
    FROM audience a;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF p_broadcast_id IS NOT NULL THEN
    UPDATE public.notification_broadcasts
       SET recipient_count = v_inserted
     WHERE id = p_broadcast_id;
  END IF;

  RETURN v_inserted;
END;
$$;

-- Service role only. `authenticated` must never be able to fan out.
REVOKE ALL ON FUNCTION public.fan_out_notification(
  text, text, text, text, uuid, text, jsonb, text, timestamptz,
  uuid[], text[], text[], uuid, boolean
) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.fan_out_notification(
  text, text, text, text, uuid, text, jsonb, text, timestamptz,
  uuid[], text[], text[], uuid, boolean
) TO service_role;


-- Dry-run counterpart for the admin composer's "Preview" — counts recipients
-- without writing anything.
CREATE OR REPLACE FUNCTION public.count_notification_audience(
  p_audience   text,
  p_user_ids   uuid[] DEFAULT NULL,
  p_roles      text[] DEFAULT NULL,
  p_categories text[] DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT p.id)::integer
    FROM public.profiles p
    LEFT JOIN public.profile_categories pc ON pc.profile_id = p.id
   WHERE COALESCE(p.account_status, 'active') = 'active'
     AND CASE p_audience
           WHEN 'single'   THEN p.id = ANY(COALESCE(p_user_ids, '{}'::uuid[]))
           WHEN 'multiple' THEN p.id = ANY(COALESCE(p_user_ids, '{}'::uuid[]))
           WHEN 'role'     THEN p.role::text = ANY(COALESCE(p_roles, '{}'::text[]))
           WHEN 'category' THEN pc.category_id = ANY(COALESCE(p_categories, '{}'::text[]))
           WHEN 'everyone' THEN true
           ELSE false
         END;
$$;

REVOKE ALL ON FUNCTION public.count_notification_audience(text, uuid[], text[], text[])
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_notification_audience(text, uuid[], text[], text[])
  TO service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 9. Housekeeping
--    Hard-deletes expired notifications. Call from pg_cron if available:
--      SELECT cron.schedule('purge-notifications','0 3 * * *',
--                           $$SELECT public.purge_expired_notifications()$$);
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purge_expired_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.notifications
   WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_notifications() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_notifications() TO service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 9b. Chat presence
--     "Do not notify a chat message to someone already reading that thread"
--     needs a server-side signal. The open thread heartbeats into this table
--     (POST /api/chat/conversations/[id]/presence) and the message route skips
--     the notification when the receiver was seen within the last 45s.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_presence (
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_presence_seen
  ON public.conversation_presence (conversation_id, last_seen_at DESC);

ALTER TABLE public.conversation_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_presence_select_own" ON public.conversation_presence;
CREATE POLICY "conversation_presence_select_own" ON public.conversation_presence
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 10. Keep read_at in sync with is_read regardless of which client writes it
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_notification_read_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_read AND OLD.is_read IS DISTINCT FROM NEW.is_read THEN
    NEW.read_at := COALESCE(NEW.read_at, now());
  ELSIF NOT NEW.is_read THEN
    NEW.read_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_notification_read_at ON public.notifications;
CREATE TRIGGER trg_sync_notification_read_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_read_at();
