export const runtime = 'edge';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

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
    console.log("User profile:", profile);

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}