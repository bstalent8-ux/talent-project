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

// PATCH: approve or reject a review
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json() as { action: "approve" | "reject" };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";

  const { data: review, error: fetchErr } = await adminClient
    .from("reviews").select("id, talent_id, status").eq("id", id).single();

  if (fetchErr || !review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const { error } = await adminClient
    .from("reviews")
    .update({ status, moderated_at: new Date().toISOString(), moderated_by: admin.id })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalc rating whenever moderation status changes (approve = include, reject = exclude)
  if (review.talent_id) {
    const { recalcRating } = await import("@/lib/recalcRating");
    await recalcRating(review.talent_id);
  }

  revalidatePath("/admin/reviews");
  return NextResponse.json({ ok: true, status });
}

// DELETE: remove a review entirely
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: review } = await adminClient
    .from("reviews").select("talent_id").eq("id", id).single();

  const { error } = await adminClient.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (review?.talent_id) {
    const { recalcRating } = await import("@/lib/recalcRating");
    await recalcRating(review.talent_id);
  }

  revalidatePath("/admin/reviews");
  return NextResponse.json({ ok: true });
}
