export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminPermissions } from "@/lib/auth/permissions";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, city, bio, role, admin_role_id")
    .eq("id", user.id)
    .single();

  // `null` = full access (unrestricted admin) — the sidebar shows every
  // tab in that case; a non-null map hides any tab with no read permission.
  const permissions = await getAdminPermissions(user.id);

  return NextResponse.json({ profile: data, email: user.email, permissions });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Verify admin role
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, unknown>;
  const allowed = ["full_name", "handle", "city", "bio", "avatar_url"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { error: updateErr } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
