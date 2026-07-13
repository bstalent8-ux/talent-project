export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const handle = searchParams.get("handle");
  const id = searchParams.get("id");

  // 1. Find auth user
  let authUser: { id: string; email?: string } | null = null;
  if (email) {
    const { data: users } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const userList = (users as { users?: { id: string; email?: string }[] } | null)?.users ?? [];
    authUser = userList.find(u => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  }

  const profileId = id ?? authUser?.id ?? null;

  // 2. Find profile by id or handle
  let profile: Record<string, unknown> | null = null;
  if (profileId) {
    const { data } = await adminClient
      .from("profiles")
      .select("id, handle, full_name, role, is_verified, is_approved, is_suspended, created_at")
      .eq("id", profileId)
      .single();
    profile = data ?? null;
  } else if (handle) {
    const { data } = await adminClient
      .from("profiles")
      .select("id, handle, full_name, role, is_verified, is_approved, is_suspended, created_at")
      .eq("handle", handle)
      .single();
    profile = data ?? null;
  }

  // 3. talent_profiles
  const { data: tp } = profile
    ? await adminClient
        .from("talent_profiles")
        .select("id, category, avg_rating, total_reviews, status")
        .eq("user_id", profile.id)
        .single()
    : { data: null };

  // 4. Reviews for this talent_profile
  const { data: reviews, error: revErr } = tp
    ? await adminClient
        .from("reviews")
        .select("id, rating, comment, status, created_at")
        .eq("talent_id", tp.id)
        .limit(10)
    : { data: [], error: null };

  // 5. List all profiles to help locate user
  const { data: allAdmins } = await adminClient
    .from("profiles")
    .select("id, handle, full_name, role")
    .eq("role", "admin");

  // Try to create profile if missing
  let createResult = null;
  if (authUser && !profile) {
    const { data: created, error: createErr } = await adminClient
      .from("profiles")
      .upsert({
        id: authUser.id,
        role: "talent",
        handle: "andrew-sherif",
        full_name: "Andrew Sherif",
      }, { onConflict: "id" })
      .select();
    createResult = { data: created, error: createErr?.message ?? null };
  }

  return NextResponse.json({
    auth_user: authUser ? { id: authUser.id, email: authUser.email } : null,
    profile_found: !!profile,
    profile,
    talent_profile: tp ?? null,
    reviews_count: reviews?.length ?? 0,
    reviews_error: revErr?.message ?? null,
    reviews: reviews ?? [],
    page_url: profile?.handle ? `/talent/${profile.handle}` : null,
    all_admins: allAdmins,
    create_attempt: createResult,
  });
}