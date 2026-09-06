// ─── Admin RBAC — permission checks (SERVER ONLY) ───────────────────────────
// Sits alongside require-admin.ts: that file answers "is this an admin at
// all"; this one answers "is this admin allowed to do THIS on THIS tab".
// `profiles.admin_role_id IS NULL` means full access — every admin created
// before this system existed keeps working exactly as before. A role is
// only ever a restriction, never an escalation beyond plain admin.
//
// Never import this from a "use client" file.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  ADMIN_RESOURCE_KEYS,
  type AdminResourceKey,
  type PermissionAction,
  type PermissionMap,
  type ResourcePermission,
} from "@/lib/auth/admin-resources";
import { fetchPermissionsForRoleId, getAdminPermissions } from "@/lib/auth/get-admin-permissions";

export { ADMIN_RESOURCE_KEYS, getAdminPermissions };
export type { AdminResourceKey, PermissionAction, PermissionMap, ResourcePermission };

const FULL_ACCESS: ResourcePermission = { canRead: true, canCreate: true, canUpdate: true, canDelete: true };
const NO_ACCESS: ResourcePermission = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

export function permissionFor(map: PermissionMap | null, resource: AdminResourceKey): ResourcePermission {
  if (map === null) return FULL_ACCESS; // unrestricted admin
  return map[resource] ?? NO_ACCESS; // no row for this tab = no access, fails closed
}

function actionField(action: PermissionAction): keyof ResourcePermission {
  switch (action) {
    case "read": return "canRead";
    case "create": return "canCreate";
    case "update": return "canUpdate";
    case "delete": return "canDelete";
  }
}

/**
 * Route guard for a specific tab + CRUD action — use alongside (not instead
 * of) requireAdmin()'s "is this an admin" check. Returns a ready-to-return
 * NextResponse on denial, or `null` (with the resolved user id) when
 * allowed, matching requireAdmin()'s calling convention:
 *
 *   const denied = await requirePermission("leads", "delete");
 *   if (denied) return denied;
 */
export async function requirePermission(
  resource: AdminResourceKey,
  action: PermissionAction
): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient.from("profiles").select("role, admin_role_id").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // One query for role + admin_role_id together (not two) — see
  // fetchPermissionsForRoleId's doc comment.
  const permissions = await fetchPermissionsForRoleId(profile.admin_role_id);
  const perm = permissionFor(permissions, resource);
  if (!perm[actionField(action)]) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

/** Only unrestricted admins (admin_role_id IS NULL) may manage roles
 *  themselves — otherwise a restricted admin could grant their own role
 *  more power through the Roles & Permissions tab. */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient.from("profiles").select("role, admin_role_id").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (profile.admin_role_id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}

/** Same check as requireSuperAdmin(), but returns the user id when allowed —
 *  every roles-management write needs it for the audit log's `changed_by`. */
export async function getSuperAdminUser(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await adminClient.from("profiles").select("role, admin_role_id").eq("id", user.id).single();
  if (profile?.role !== "admin" || profile.admin_role_id) return null;
  return { id: user.id };
}
