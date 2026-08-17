export const runtime = 'edge';

// ─── Favorite a talent ─────────────────────────────────────────────────────
// GET    → { favorited: boolean }               is the current user favoriting this talent?
// PUT    → { favorited: true }                   save (idempotent)
// DELETE → { favorited: false }                  unsave
//
// Any authenticated user may favorite (talent, brand, or admin — see
// docs/guest-permissions.md), only guests are blocked. Ownership is
// enforced in code (adminClient bypasses RLS, per CLAUDE.md §8) by always
// scoping on user.id from the verified session, never a client-supplied id.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ talentUserId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { talentUserId } = await params;

  const { data, error } = await adminClient
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("talent_user_id", talentUserId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorited: Boolean(data) });
}

export async function PUT(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { talentUserId } = await params;
  if (talentUserId === user.id) {
    return NextResponse.json({ error: "cannot favorite yourself" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("favorites")
    .upsert(
      { user_id: user.id, talent_user_id: talentUserId },
      { onConflict: "user_id,talent_user_id", ignoreDuplicates: true },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorited: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { talentUserId } = await params;

  const { error } = await adminClient
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("talent_user_id", talentUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorited: false });
}
