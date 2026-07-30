export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canPerformAction } from "@/lib/permissions";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role, handle, account_status, is_suspended")
    .eq("id", user.id)
    .single();
  if (!canPerformAction("upload_portfolio", profile).allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
  }

  const { url, media_type, caption } = await req.json();

  // Get talent_profile id
  const { data: tp } = await adminClient
    .from("talent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tp) return NextResponse.json({ error: "no talent profile" }, { status: 404, headers: privateNoStoreHeaders() });

  const { data, error } = await adminClient
    .from("portfolio_items")
    .insert({ talent_id: tp.id, url, media_type: media_type ?? "photo", caption: caption ?? null, sort_order: 0, is_approved: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  invalidateTalent(profile?.handle ?? user.id);
  return NextResponse.json({ item: data }, { headers: privateNoStoreHeaders() });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role, handle, account_status, is_suspended")
    .eq("id", user.id)
    .single();
  if (!canPerformAction("upload_portfolio", profile).allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400, headers: privateNoStoreHeaders() });

  // Scope the delete to the caller's own talent profile — without this any
  // signed-in user can delete any talent's portfolio item by id.
  const { data: tp } = await adminClient
    .from("talent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tp) return NextResponse.json({ error: "no talent profile" }, { status: 404, headers: privateNoStoreHeaders() });

  const { error } = await adminClient
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("talent_id", tp.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  invalidateTalent(profile?.handle ?? user.id);
  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
