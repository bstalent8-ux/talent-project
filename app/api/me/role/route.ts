export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ role: null, id: null }, { status: 401 });
  }

  // adminClient bypasses RLS — works regardless of policies on profiles table
  const { data } = await adminClient
    .from("profiles")
    .select("role, account_status, brand_status, is_suspended, talent_profiles(status)")
    .eq("id", user.id)
    .single();

  // `id` is returned alongside the role so callers that need both do not have to
  // pay for a second `auth.getUser()` network round trip from the browser.
  const talentProfiles = Array.isArray(data?.talent_profiles)
    ? data?.talent_profiles
    : data?.talent_profiles
      ? [data.talent_profiles]
      : [];

  return NextResponse.json({
    role:           data?.role ?? null,
    id:             user.id,
    account_status: data?.account_status ?? null,
    brand_status:   data?.brand_status ?? null,
    is_suspended:   data?.is_suspended ?? null,
    talent_status:  talentProfiles[0]?.status ?? null,
  });
}
