export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

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

    const { error: insertErr } = await adminClient.from("profiles").insert({
      id:        userId,
      role:      meta.role ?? "talent",
      full_name: meta.full_name ?? emailHandle,
      handle:    emailHandle,
    });

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ created: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}