// ─── Admin RBAC management service (SERVER ONLY) ────────────────────────────
// Backs the /admin/roles tab. Every write here also appends to
// admin_role_audit_log — this file is the ONLY place that table is written,
// so "who changed what, when" can never be bypassed by a call site forgetting
// to log it.

import { adminClient } from "@/lib/supabase/admin";
import { ADMIN_RESOURCE_KEYS, type AdminResourceKey } from "@/lib/auth/permissions";
import type { AdminRole, AdminRoleAuditEntry, AdminSearchResult, RolePermissionRow } from "@/features/admin-roles/types";

interface RoleRow { id: string; key: string; label_ar: string; label_en: string; created_at: string; updated_at: string }
interface PermRow { role_id: string; resource_key: string; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }

async function namesFor(userIds: (string | null)[]): Promise<Record<string, string | null>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return {};
  const { data } = await adminClient.from("profiles").select("id, full_name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
}

export async function fetchRoles(): Promise<AdminRole[]> {
  const [{ data: roles }, { data: perms }, { data: assignedCounts }] = await Promise.all([
    adminClient.from("admin_roles").select("*").order("created_at", { ascending: true }),
    adminClient.from("admin_role_permissions").select("*"),
    adminClient.from("profiles").select("admin_role_id").not("admin_role_id", "is", null),
  ]);

  const permsByRole: Record<string, RolePermissionRow[]> = {};
  for (const p of (perms ?? []) as PermRow[]) {
    (permsByRole[p.role_id] ??= []).push({
      resourceKey: p.resource_key, canRead: p.can_read, canCreate: p.can_create, canUpdate: p.can_update, canDelete: p.can_delete,
    });
  }

  const countByRole: Record<string, number> = {};
  for (const row of assignedCounts ?? []) {
    if (row.admin_role_id) countByRole[row.admin_role_id] = (countByRole[row.admin_role_id] ?? 0) + 1;
  }

  return ((roles ?? []) as RoleRow[]).map((r) => ({
    id: r.id, key: r.key, labelAr: r.label_ar, labelEn: r.label_en,
    createdAt: r.created_at, updatedAt: r.updated_at,
    permissions: permsByRole[r.id] ?? [],
    assignedCount: countByRole[r.id] ?? 0,
  }));
}

export async function createRole(input: { key: string; labelAr: string; labelEn: string }, createdBy: string): Promise<AdminRole | null> {
  const { data: role, error } = await adminClient
    .from("admin_roles")
    .insert({ key: input.key, label_ar: input.labelAr, label_en: input.labelEn, created_by: createdBy })
    .select("*")
    .single();
  if (error || !role) return null;

  // Seed an explicit all-false row per resource key — makes the matrix
  // predictable to edit (every cell already exists as a row to update,
  // never an implicit insert) and gives the audit log a real "old value"
  // baseline for the first permission granted.
  await adminClient.from("admin_role_permissions").insert(
    ADMIN_RESOURCE_KEYS.map((key) => ({
      role_id: role.id, resource_key: key, can_read: false, can_create: false, can_update: false, can_delete: false,
    }))
  );

  await adminClient.from("admin_role_audit_log").insert({
    changed_by: createdBy, role_id: role.id, role_key: role.key, action: "role_created",
    new_value: { key: role.key, labelAr: role.label_ar, labelEn: role.label_en },
  });

  return { id: role.id, key: role.key, labelAr: role.label_ar, labelEn: role.label_en, createdAt: role.created_at, updatedAt: role.updated_at, permissions: [], assignedCount: 0 };
}

export async function deleteRole(roleId: string, changedBy: string): Promise<boolean> {
  const { data: role } = await adminClient.from("admin_roles").select("key").eq("id", roleId).single();
  if (!role) return false;

  // Anyone holding this role falls back to NULL = full access — a safe,
  // non-destructive default (see lib/auth/permissions.ts) rather than
  // silently locking people out because their role vanished.
  await adminClient.from("profiles").update({ admin_role_id: null }).eq("admin_role_id", roleId);
  const { error } = await adminClient.from("admin_roles").delete().eq("id", roleId);
  if (error) return false;

  await adminClient.from("admin_role_audit_log").insert({
    changed_by: changedBy, role_id: null, role_key: role.key, action: "role_deleted", old_value: { key: role.key },
  });
  return true;
}

/** Upserts one (role, resource) permission cell and logs only if it actually
 *  changed — editing a matrix by re-saving unchanged cells shouldn't spam
 *  the audit trail. */
export async function updateRolePermission(
  roleId: string,
  resourceKey: AdminResourceKey,
  next: { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean },
  changedBy: string
): Promise<boolean> {
  const { data: role } = await adminClient.from("admin_roles").select("key").eq("id", roleId).single();
  if (!role) return false;

  const { data: existing } = await adminClient
    .from("admin_role_permissions")
    .select("can_read, can_create, can_update, can_delete")
    .eq("role_id", roleId).eq("resource_key", resourceKey).maybeSingle();

  const oldValue = existing
    ? { canRead: existing.can_read, canCreate: existing.can_create, canUpdate: existing.can_update, canDelete: existing.can_delete }
    : { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  const changed = oldValue.canRead !== next.canRead || oldValue.canCreate !== next.canCreate
    || oldValue.canUpdate !== next.canUpdate || oldValue.canDelete !== next.canDelete;

  const { error } = await adminClient
    .from("admin_role_permissions")
    .upsert({
      role_id: roleId, resource_key: resourceKey,
      can_read: next.canRead, can_create: next.canCreate, can_update: next.canUpdate, can_delete: next.canDelete,
    }, { onConflict: "role_id,resource_key" });
  if (error) return false;

  if (changed) {
    await adminClient.from("admin_role_audit_log").insert({
      changed_by: changedBy, role_id: roleId, role_key: role.key, action: "permission_changed",
      resource_key: resourceKey, old_value: oldValue, new_value: next,
    });
  }
  return true;
}

/** `roleId: null` reverts the admin to full access. */
export async function assignRole(userId: string, roleId: string | null, changedBy: string): Promise<boolean> {
  const { data: before } = await adminClient.from("profiles").select("admin_role_id").eq("id", userId).single();
  const [{ data: oldRole }, { data: newRole }] = await Promise.all([
    before?.admin_role_id ? adminClient.from("admin_roles").select("key").eq("id", before.admin_role_id).single() : Promise.resolve({ data: null }),
    roleId ? adminClient.from("admin_roles").select("key").eq("id", roleId).single() : Promise.resolve({ data: null }),
  ]);

  const { error } = await adminClient.from("profiles").update({ admin_role_id: roleId }).eq("id", userId);
  if (error) return false;

  await adminClient.from("admin_role_audit_log").insert({
    changed_by: changedBy, role_id: roleId, role_key: newRole?.key ?? null, action: "assignment_changed",
    target_user_id: userId,
    old_value: { roleKey: oldRole?.key ?? null },
    new_value: { roleKey: newRole?.key ?? null },
  });
  return true;
}

/** Derives a handle the same way registration does (CLAUDE.md §5): the
 *  email local-part, lowercased, non-[a-z0-9-] stripped — with the same
 *  retry-with-suffix on a collision, since `handle` is UNIQUE. */
function deriveHandle(email: string): string {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export interface CreateAdminInput {
  email: string;
  password: string;
  fullName: string;
  /** null = full access (unrestricted admin). */
  roleId: string | null;
}

// Flat shape (not a discriminated union) — matches lib/email/send.ts's
// sendEmail() result convention. `strict: false` in this repo's tsconfig
// widens boolean literal types more eagerly, which breaks `ok`-discriminant
// narrowing on a `{ok:true;...} | {ok:false;...}` union (confirmed: fails
// under strict:false, works under --strict). A flat optional-fields shape
// sidesteps the issue entirely instead of fighting the compiler config.
export interface CreateAdminResult {
  ok: boolean;
  userId?: string;
  error?: string;
}

/** Creates a real, login-capable admin account — not just a role
 *  assignment. Only ever called from a requireSuperAdmin()-gated route:
 *  minting new admins is at least as sensitive as reassigning an existing
 *  one's permissions. */
export async function createAdmin(input: CreateAdminInput, createdBy: string): Promise<CreateAdminResult> {
  const { data: created, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true, // no confirmation email round-trip for an admin-created account
    user_metadata: { role: "admin", full_name: input.fullName },
  });

  if (authError || !created.user) {
    return { ok: false, error: authError?.message ?? "failed to create auth user" };
  }

  const userId = created.user.id;
  let handle = deriveHandle(input.email);
  let { error: profileError } = await adminClient
    .from("profiles")
    .insert({ id: userId, handle, full_name: input.fullName, role: "admin", admin_role_id: input.roleId });

  if (profileError?.code === "23505") {
    handle = `${handle}-${Math.random().toString(36).slice(2, 6)}`;
    ({ error: profileError } = await adminClient
      .from("profiles")
      .insert({ id: userId, handle, full_name: input.fullName, role: "admin", admin_role_id: input.roleId }));
  }

  if (profileError) {
    // Roll back the auth user so a failed profile write doesn't leave a
    // login-capable account with no profiles row behind (the self-healing
    // /api/me path assumes role defaults to "talent", which would be wrong
    // and confusing here).
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    return { ok: false, error: "failed to create profile" };
  }

  const roleKey = input.roleId
    ? (await adminClient.from("admin_roles").select("key").eq("id", input.roleId).single()).data?.key ?? null
    : null;

  await adminClient.from("admin_role_audit_log").insert({
    changed_by: createdBy, role_id: input.roleId, role_key: roleKey, action: "assignment_changed",
    target_user_id: userId,
    old_value: { roleKey: null }, new_value: { roleKey, created: true },
  });

  return { ok: true, userId };
}

export async function searchAdmins(query: string): Promise<AdminSearchResult[]> {
  let q = adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, admin_role_id")
    .eq("role", "admin")
    .order("created_at", { ascending: false })
    .limit(20);

  if (query) {
    const safe = query.replace(/[(),]/g, " ").trim();
    if (safe) q = q.or(`full_name.ilike.%${safe}%,handle.ilike.%${safe}%`);
  }

  const { data } = await q;
  const roleIds = Array.from(new Set((data ?? []).map((p) => p.admin_role_id).filter((id): id is string => !!id)));
  const { data: roles } = roleIds.length
    ? await adminClient.from("admin_roles").select("id, label_ar").in("id", roleIds)
    : { data: [] };
  const roleLabelById = Object.fromEntries((roles ?? []).map((r) => [r.id, r.label_ar]));

  return (data ?? []).map((p) => ({
    id: p.id, fullName: p.full_name, handle: p.handle, avatarUrl: p.avatar_url,
    adminRoleId: p.admin_role_id, adminRoleLabel: p.admin_role_id ? roleLabelById[p.admin_role_id] ?? null : null,
  }));
}

export interface AuditLogPage { entries: AdminRoleAuditEntry[]; total: number }

export async function fetchAuditLog(page: number, pageSize: number): Promise<AuditLogPage> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await adminClient
    .from("admin_role_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error || !data) return { entries: [], total: 0 };

  const names = await namesFor(data.flatMap((r) => [r.changed_by, r.target_user_id]));
  return {
    entries: data.map((r) => ({
      id: r.id, changedBy: r.changed_by, changedByName: r.changed_by ? names[r.changed_by] ?? null : null,
      roleId: r.role_id, roleKey: r.role_key, action: r.action, resourceKey: r.resource_key,
      targetUserId: r.target_user_id, targetUserName: r.target_user_id ? names[r.target_user_id] ?? null : null,
      oldValue: r.old_value, newValue: r.new_value, createdAt: r.created_at,
    })),
    total: count ?? 0,
  };
}
