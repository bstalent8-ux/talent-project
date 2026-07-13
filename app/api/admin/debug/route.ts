import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const out: Record<string, unknown> = {};

  // 1. Auth layer
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  out["auth_user"]  = user ? { id: user.id, email: user.email } : null;
  out["auth_error"] = authErr?.message ?? null;

  if (!user) return NextResponse.json({ ...out, stop: "no session" });

  // 2. Anon-key query (subject to RLS)
  const { data: anonProfile, error: anonErr } = await supabase
    .from("profiles").select("id, role").eq("id", user.id).single();
  out["anon_profile"] = anonProfile;
  out["anon_error"]   = anonErr?.message ?? null;

  // 3. Service-role query (bypasses RLS)
  const { data: adminProfile, error: adminErr } = await adminClient
    .from("profiles").select("id, role, handle, full_name").eq("id", user.id).single();
  out["admin_profile"] = adminProfile;
  out["admin_error"]   = adminErr?.message ?? null;

  // 4. Check profiles table columns
  const { data: cols, error: colErr } = await adminClient
    .from("information_schema.columns" as never)
    .select("column_name, data_type")
    .eq("table_schema", "public")
    .eq("table_name", "profiles");
  out["profiles_columns"] = cols;
  out["columns_error"]    = colErr?.message ?? null;

  // 5. Check RLS policies
  const { data: policies, error: polErr } = await adminClient
    .from("pg_policies" as never)
    .select("policyname, cmd, qual")
    .eq("tablename", "profiles");
  out["rls_policies"] = policies;
  out["policies_error"] = polErr?.message ?? null;

  return NextResponse.json(out, { status: 200 });
}
