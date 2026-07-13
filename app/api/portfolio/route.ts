import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { url, media_type, caption } = await req.json();

  // Get talent_profile id
  const { data: tp } = await adminClient
    .from("talent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tp) return NextResponse.json({ error: "no talent profile" }, { status: 404 });

  const { data, error } = await adminClient
    .from("portfolio_items")
    .insert({ talent_id: tp.id, url, media_type: media_type ?? "photo", caption: caption ?? null, sort_order: 0, is_approved: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await adminClient.from("portfolio_items").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
