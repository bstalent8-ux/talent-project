-- ─── /admin/pending-data — who may review uploaded media ─────────────────────
-- The new admin resource key "pendingData" (lib/auth/admin-resources.ts) has no rows
-- in admin_role_permissions yet, so every RESTRICTED role is locked out of the page
-- and its API (fail-closed by design) until it is granted here or on /admin/roles.
--
-- This copies each role's existing "talents" access onto "pendingData": a role that
-- can read/update talents can read and approve/reject their media, a role that
-- can't, can't. Delete is never granted (the queue has no delete). Idempotent — it
-- only adds missing rows and never overwrites one you already set.
--
-- Review the result before relying on it, and tighten it on /admin/roles if needed:
--   SELECT r.key, p.can_read, p.can_update
--   FROM admin_role_permissions p JOIN admin_roles r ON r.id = p.role_id
--   WHERE p.resource_key = 'pendingData' ORDER BY r.key;

INSERT INTO public.admin_role_permissions (role_id, resource_key, can_read, can_create, can_update, can_delete)
SELECT role_id, 'pendingData', can_read, can_create, can_update, false
FROM public.admin_role_permissions
WHERE resource_key = 'talents'
ON CONFLICT (role_id, resource_key) DO NOTHING;
