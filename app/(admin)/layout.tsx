export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { fetchPermissionsForRoleId } from "@/lib/auth/get-admin-permissions";
import { AdminPermissionsProvider } from "@/contexts/AdminPermissionsContext";
import { AdminIdentityProvider } from "@/contexts/AdminIdentityContext";

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  // getUser() revalidates the token with Supabase — more secure than getSession()
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    redirect("/login");
  }

  // One query for everything this layout needs — role (the gate),
  // admin_role_id (permissions), full_name/avatar_url (sidebar identity).
  // This used to be 2-3 separate round trips (this file's own role query,
  // then getAdminPermissions()'s own admin_role_id re-fetch, then
  // AdminSidebar's client-side fetch("/api/admin/me") on every single page
  // navigation for name/photo alone) — all folded into the one query below,
  // since every admin page wraps its own AdminShell/AdminSidebar (no single
  // persisted root layout for the whole /admin tree), so this layout runs
  // fresh on every navigation and any redundancy here is paid every time.
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, admin_role_id, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Computed server-side and handed down via context so a restricted
  // admin's sidebar never has a wider first frame to narrow down from —
  // see AdminPermissionsContext.tsx.
  const permissions = await fetchPermissionsForRoleId(profile.admin_role_id);

  return (
    <AdminPermissionsProvider value={permissions}>
      <AdminIdentityProvider value={{ name: profile.full_name ?? null, avatarUrl: profile.avatar_url ?? null }}>
        {children}
      </AdminIdentityProvider>
    </AdminPermissionsProvider>
  );
}
