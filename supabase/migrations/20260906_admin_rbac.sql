-- ─── Admin RBAC: roles, per-tab CRUD permissions, audit log ────────────────
-- Purely additive. `profiles.admin_role_id` defaults to NULL, and every
-- existing admin with a NULL role is treated as full-access by the app
-- layer (see lib/auth/permissions.ts) — nothing changes for today's admins
-- until a super-admin explicitly assigns one of these roles to someone.
-- Per CLAUDE.md §6, this file is pasted into the Supabase SQL editor by a
-- human — it is not auto-applied.

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE, -- slug, e.g. 'full_admin' — stable id for seeds/checks
  label_ar    text        NOT NULL,
  label_en    text        NOT NULL,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One row per (role, admin tab). `resource_key` matches the `key` used in
-- components/admin/AdminSidebar.tsx's NAV_ITEM map — that list IS the set of
-- permissionable tabs, so the two are kept in lockstep deliberately.
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  role_id       uuid        NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  resource_key  text        NOT NULL,
  can_read      boolean     NOT NULL DEFAULT false,
  can_create    boolean     NOT NULL DEFAULT false,
  can_update    boolean     NOT NULL DEFAULT false,
  can_delete    boolean     NOT NULL DEFAULT false,
  PRIMARY KEY (role_id, resource_key)
);

-- profiles.role is unchanged ('talent' | 'brand' | 'admin') — this only
-- narrows what a role='admin' profile can do. NULL = full access (today's
-- behavior), so adding this column can't lock anyone out by itself.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_role_id uuid REFERENCES public.admin_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_admin_role_id ON public.profiles(admin_role_id) WHERE admin_role_id IS NOT NULL;

-- Every change to a role's permission matrix, or to who a role is assigned
-- to, lands here — "which admin changed what, when" per the RBAC spec.
CREATE TABLE IF NOT EXISTS public.admin_role_audit_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  role_id       uuid        REFERENCES public.admin_roles(id) ON DELETE SET NULL,
  role_key      text,       -- denormalized snapshot — survives the role being deleted later
  action        text        NOT NULL CHECK (action IN ('role_created', 'role_deleted', 'permission_changed', 'assignment_changed')),
  resource_key  text,       -- set for 'permission_changed', null otherwise
  target_user_id uuid       REFERENCES public.profiles(id) ON DELETE SET NULL, -- set for 'assignment_changed'
  old_value     jsonb,
  new_value     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_role_audit_log_created_at ON public.admin_role_audit_log(created_at DESC);

ALTER TABLE public.admin_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_audit_log    ENABLE ROW LEVEL SECURITY;
-- No policies — same service-role-only pattern as leads/notifications/
-- user_events. Every read/write goes through adminClient with an app-layer
-- requirePermission()/requireAdmin() check (see CLAUDE.md §3, §9).

CREATE OR REPLACE FUNCTION public.touch_admin_role_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_roles_touch_updated_at ON public.admin_roles;
CREATE TRIGGER trg_admin_roles_touch_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.touch_admin_role_updated_at();

-- ─── Seed the 3 roles from the RBAC spec ────────────────────────────────────
-- The full resource-key list mirrors AdminSidebar.tsx's NAV_ITEM keys.
-- 'full_admin' and 'admin_no_delete' get every key; 'leads_moderator' only
-- gets 'leads' (every other key stays absent — no row = no access, and the
-- sidebar hides tabs with no read row, see lib/auth/permissions.ts).

INSERT INTO public.admin_roles (key, label_ar, label_en) VALUES
  ('full_admin',      'أدمن كامل الصلاحيات', 'Full admin'),
  ('admin_no_delete', 'أدمن بدون مسح',        'Admin (no delete)'),
  ('leads_moderator', 'مسؤول لييدز',           'Leads moderator')
ON CONFLICT (key) DO NOTHING;

DO $$
DECLARE
  v_full_id   uuid;
  v_nodel_id  uuid;
  v_leads_id  uuid;
  v_resource  text;
  v_all_resources text[] := ARRAY[
    'dashboard','leads','talents','verifications','talentDemand','bookings','reviews',
    'brands','trustedBrands','support','emails','notifications','notificationsLog',
    'userActivity','testimonials','brandMoments','categories','packages','profileConfig','settings'
  ];
BEGIN
  SELECT id INTO v_full_id  FROM public.admin_roles WHERE key = 'full_admin';
  SELECT id INTO v_nodel_id FROM public.admin_roles WHERE key = 'admin_no_delete';
  SELECT id INTO v_leads_id FROM public.admin_roles WHERE key = 'leads_moderator';

  FOREACH v_resource IN ARRAY v_all_resources LOOP
    INSERT INTO public.admin_role_permissions (role_id, resource_key, can_read, can_create, can_update, can_delete)
    VALUES (v_full_id, v_resource, true, true, true, true)
    ON CONFLICT (role_id, resource_key) DO NOTHING;

    INSERT INTO public.admin_role_permissions (role_id, resource_key, can_read, can_create, can_update, can_delete)
    VALUES (v_nodel_id, v_resource, true, true, true, false)
    ON CONFLICT (role_id, resource_key) DO NOTHING;
  END LOOP;

  INSERT INTO public.admin_role_permissions (role_id, resource_key, can_read, can_create, can_update, can_delete)
  VALUES (v_leads_id, 'leads', true, true, true, false)
  ON CONFLICT (role_id, resource_key) DO NOTHING;
END $$;

DO $$
DECLARE v_roles int; v_perms int;
BEGIN
  SELECT count(*) INTO v_roles FROM public.admin_roles WHERE key IN ('full_admin','admin_no_delete','leads_moderator');
  SELECT count(*) INTO v_perms FROM public.admin_role_permissions;
  RAISE NOTICE 'admin_roles seeded: % of 3 expected. admin_role_permissions rows: %', v_roles, v_perms;
END $$;
