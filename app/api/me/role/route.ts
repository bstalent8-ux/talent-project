import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  // adminClient bypasses RLS — works regardless of policies on profiles table
  const { data } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ role: data?.role ?? null });
}
