export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params; // talent_profiles.id
  const body = await req.json() as {
    category?: string;
    bio?: string;
    specialties?: string[];
    availability?: string;
    packages?: unknown;
    social_links?: Record<string, unknown>;
    // profile fields
    full_name?: string;
    city?: string;
    handle?: string;
    profile_user_id?: string;
  };

  const { profile_user_id, full_name, city, handle, ...tpFields } = body;

  // Update talent_profiles
  if (Object.keys(tpFields).length) {
    const { error } = await adminClient
      .from("talent_profiles")
      .update(tpFields)
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update profiles if profile fields provided
  if (profile_user_id && (full_name !== undefined || city !== undefined || handle !== undefined)) {
    const profileUpdate: Record<string, unknown> = {};
    if (full_name !== undefined) profileUpdate.full_name = full_name;
    if (city !== undefined) profileUpdate.city = city;
    if (handle !== undefined) profileUpdate.handle = handle;

    const { error } = await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", profile_user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Revalidate
  if (handle) revalidatePath(`/talent/${handle}`);
  revalidatePath("/explore");
  revalidatePath("/admin/talents");

  return NextResponse.json({ ok: true });
}