export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // Only the signed-in user may self-heal their own profile row.
    const supabase = await createClient();
    const { data: { user: authed } } = await supabase.auth.getUser();
    if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { userId: requestedId } = await req.json().catch(() => ({ userId: null }));
    if (requestedId && requestedId !== authed.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const userId = authed.id;

    // Get user from auth
    const { data: { user }, error: authErr } = await adminClient.auth.admin.getUserById(userId);
    if (authErr || !user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    // Check if profile already exists
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existing) return NextResponse.json({ created: false, existing: true });

    // Create basic profile from auth metadata
    const meta = user.user_metadata ?? {};
    const emailHandle = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ?? userId.slice(0, 8);

    // user_metadata is attacker-controlled at signUp — clamp to a public role.
    const safeRole = meta.role === "brand" ? "brand" : "talent";

    const { error: insertErr } = await adminClient.from("profiles").insert({
      id:        userId,
      role:      safeRole,
      full_name: meta.full_name ?? emailHandle,
      handle:    emailHandle,
    });

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ created: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}