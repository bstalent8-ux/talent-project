"use client";
import { createContext, useContext } from "react";

export interface AdminIdentity {
  name: string | null;
  avatarUrl: string | null;
}

// Server-computed by the (admin) layout, same story as
// AdminPermissionsContext — AdminSidebar used to `fetch("/api/admin/me")`
// on every mount for just the name/photo, and because every admin page
// wraps its own AdminShell (not one persisted root layout — see AdminShell's
// own comment on why 27+ pages do it that way), that fetch re-ran, with its
// own getUser() + profile + permissions round trip, on EVERY single page
// navigation. This context makes that data free: it rides along on the
// query the layout already has to run for the role check.
const AdminIdentityContext = createContext<AdminIdentity>({ name: null, avatarUrl: null });

export function AdminIdentityProvider({ value, children }: { value: AdminIdentity; children: React.ReactNode }) {
  return <AdminIdentityContext.Provider value={value}>{children}</AdminIdentityContext.Provider>;
}

export function useAdminIdentity(): AdminIdentity {
  return useContext(AdminIdentityContext);
}
