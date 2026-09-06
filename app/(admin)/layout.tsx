export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getAdminPermissions } from "@/lib/auth/get-admin-permissions";
import { AdminPermissionsProvider } from "@/contexts/AdminPermissionsContext";

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  // getUser() revalidates the token with Supabase — more secure than getSession()
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    redirect("/login");
  }

  // Use adminClient (service role) to bypass RLS — anon key cannot read profiles if no SELECT policy
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Computed server-side and handed down via context so a restricted
  // admin's sidebar never has a wider first frame to narrow down from —
  // see AdminPermissionsContext.tsx.
  const permissions = await getAdminPermissions(user.id);

  return <AdminPermissionsProvider value={permissions}>{children}</AdminPermissionsProvider>;
}
