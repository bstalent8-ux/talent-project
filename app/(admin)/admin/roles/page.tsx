export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import AdminShell from "@/components/admin/AdminShell";
import RolesView from "./_components/RolesView";

// Extra gate beyond the (admin) layout's plain "role === admin" check —
// only an unrestricted admin (admin_role_id IS NULL) may manage roles, same
// rule as requireSuperAdmin() in lib/auth/permissions.ts. Redirects instead
// of notFound() so a restricted admin who lands here via a stale bookmark
// just lands back on their own dashboard, not a dead end.
export default async function AdminRolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient.from("profiles").select("admin_role_id").eq("id", user.id).single();
  if (profile?.admin_role_id) redirect("/admin");

  return (
    <AdminShell title="Roles & Permissions">
      <RolesView />
    </AdminShell>
  );
}
