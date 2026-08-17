export const runtime = 'edge';

// ─── List the current user's favorited talents ─────────────────────────────
// GET → { data: FavoriteTalentCard[] }
//
// Per-talent favorite/unfavorite already lives in [talentUserId]/route.ts —
// this is the one new endpoint /favorites (the page) needs. Query logic
// lives in features/favorites/service.ts, shared with the server-rendered
// initial page load so the two call sites can't drift on the public-gate
// filters.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteTalentCards } from "@/features/favorites/service";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const data = await getFavoriteTalentCards(user.id);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
