"use client";
import { createContext, useContext } from "react";
import type { PermissionMap } from "@/lib/auth/admin-resources";

// Server-computed, passed down once from the (admin) layout — the sidebar
// used to fetch this client-side via /api/admin/me, which meant a
// restricted admin's very first paint showed every tab (the "full access"
// default while the fetch was in flight) before narrowing down a beat
// later. Reading it from context instead means the correct, final tab set
// is what renders on the very first frame — nothing to flash away from.
const AdminPermissionsContext = createContext<PermissionMap | null>(null);

export function AdminPermissionsProvider({
  value,
  children,
}: {
  value: PermissionMap | null;
  children: React.ReactNode;
}) {
  return <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>;
}

/** `null` means full access (unrestricted admin) — same convention as
 *  PermissionMap itself. Used outside a provider only by mistake; the
 *  (admin) layout always wraps every /admin/* page. */
export function useAdminPermissions(): PermissionMap | null {
  return useContext(AdminPermissionsContext);
}
