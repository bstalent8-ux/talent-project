export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { privateNoStoreHeaders } from "@/lib/cache";

type RoleProfile = {
  role?: string | null;
  account_status?: string | null;
  brand_status?: string | null;
  is_suspended?: boolean | null;
  talent_profiles?: { status?: string | null } | Array<{ status?: string | null }> | null;
};

const GUEST_ROLE = {
  role:           null,
  id:             null,
  account_status: null,
  brand_status:   null,
  is_suspended:   null,
  talent_status:  null,
  is_guest:       true,
};

async function fetchRoleProfile(userId: string): Promise<RoleProfile | null> {
  const attempts = [
    "role, account_status, brand_status, is_suspended, talent_profiles(status)",
    "role, brand_status, is_suspended, talent_profiles(status)",
    "role, brand_status, talent_profiles(status)",
    "role, talent_profiles(status)",
  ];

  let lastError: unknown = null;

  for (const select of attempts) {
    const { data, error } = await adminClient
      .from("profiles")
      .select(select)
      .eq("id", userId)
      .maybeSingle();

    if (!error) return data as RoleProfile | null;

    lastError = error;
    if (error.code !== "42703") break;
  }

  console.error("[api/me/role] profile lookup failed", lastError);
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(GUEST_ROLE, { headers: privateNoStoreHeaders() });
  }

  // adminClient bypasses RLS — works regardless of policies on profiles table
  const data = await fetchRoleProfile(user.id);

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
  }, { headers: privateNoStoreHeaders() });
}
