import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recalcRating } from "@/lib/recalcRating";

type Ctx = { params: Promise<{ id: string }> };

// ─── PATCH /api/reviews/[id] — edit rating or comment ────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const { rating, comment } = body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
    }

    // Verify ownership — only the reviewer (brand) can edit their own review
    const { data: existing, error: fetchErr } = await adminClient
      .from("reviews")
      .select("id, talent_id, brand_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "review not found" }, { status: 404 });
    }
    if (existing.brand_id !== user.id) {
      return NextResponse.json({ error: "not authorized" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (rating !== undefined) updates.rating = Number(rating);
    if (comment !== undefined) updates.comment = comment?.trim() || null;

    const { data: review, error: updateErr } = await adminClient
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    await recalcRating(existing.talent_id);

    return NextResponse.json({ review });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE /api/reviews/[id] ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Fetch first so we know the talent_id and can verify ownership
    const { data: existing, error: fetchErr } = await adminClient
      .from("reviews")
      .select("id, talent_id, brand_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "review not found" }, { status: 404 });
    }
    if (existing.brand_id !== user.id) {
      return NextResponse.json({ error: "not authorized" }, { status: 403 });
    }

    const { error: deleteErr } = await adminClient
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

    await recalcRating(existing.talent_id);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
