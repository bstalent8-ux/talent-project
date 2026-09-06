// ─── getAdminPermissions — isolated on purpose ─────────────────────────────
// Pulled out of lib/auth/permissions.ts so middleware.ts can import ONLY
// this function. permissions.ts also exports requirePermission()/
// requireSuperAdmin(), which pull in lib/supabase/server.ts's createClient()
// — and that imports next/headers' cookies(), which middleware cannot use
// the way Server Components/Route Handlers do. Importing the whole
// permissions.ts module from middleware.ts caused a real dev-mode bundling
// break ("Cannot read properties of undefined (reading 'default')" on every
// page) — confirmed by reverting this exact import and watching it clear.
// This file imports ONLY adminClient (already used directly in
// middleware.ts, so it's a known-safe edge dependency) — nothing else.

import { adminClient } from "@/lib/supabase/admin";
import type { AdminResourceKey, PermissionMap } from "@/lib/auth/admin-resources";

/** `null` return means "full access" (unrestricted admin) — distinct from an
 *  empty map, which would mean "restricted admin with zero tabs granted".
 *  Takes the role id directly — use this (not getAdminPermissions) whenever
 *  the caller already has `profiles.admin_role_id` in hand (middleware and
 *  requirePermission() both do, from their own auth query), so the profiles
 *  table isn't queried twice for the same row in one request. */
export async function fetchPermissionsForRoleId(roleId: string | null): Promise<PermissionMap | null> {
  if (!roleId) return null;

  const { data: rows } = await adminClient
    .from("admin_role_permissions")
    .select("resource_key, can_read, can_create, can_update, can_delete")
    .eq("role_id", roleId);

  const map: PermissionMap = {};
  for (const row of rows ?? []) {
    map[row.resource_key as AdminResourceKey] = {
      canRead: row.can_read, canCreate: row.can_create, canUpdate: row.can_update, canDelete: row.can_delete,
    };
  }
  return map;
}

/** Convenience wrapper for callers that only have a userId (e.g.
 *  /api/admin/me) — looks up admin_role_id first. Prefer
 *  fetchPermissionsForRoleId directly when the role id is already known. */
export async function getAdminPermissions(userId: string): Promise<PermissionMap | null> {
  const { data: profile } = await adminClient.from("profiles").select("admin_role_id").eq("id", userId).single();
  return fetchPermissionsForRoleId(profile?.admin_role_id ?? null);
}
