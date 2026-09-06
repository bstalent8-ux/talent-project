// ─── Admin RBAC domain types ─────────────────────────────────────────────
import type { AdminResourceKey } from "@/lib/auth/permissions";

export interface RolePermissionRow {
  resourceKey: AdminResourceKey | string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface AdminRole {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermissionRow[];
  /** Count of profiles currently assigned this role — shown so an admin
   *  knows the blast radius before editing or deleting it. */
  assignedCount: number;
}

export type AuditAction = "role_created" | "role_deleted" | "permission_changed" | "assignment_changed";

export interface AdminRoleAuditEntry {
  id: string;
  changedBy: string | null;
  changedByName: string | null;
  roleId: string | null;
  roleKey: string | null;
  action: AuditAction;
  resourceKey: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
}

export interface AdminSearchResult {
  id: string;
  fullName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  adminRoleId: string | null;
  adminRoleLabel: string | null;
}
