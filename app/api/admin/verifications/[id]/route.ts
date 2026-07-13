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

  const { id } = await params;
  const { action, reason } = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get verification request to find the talent_id
  const { data: verification, error: fetchErr } = await adminClient
    .from("talent_verifications")
    .select("id, talent_id, status")
    .eq("id", id)
    .single();

  if (fetchErr || !verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  // Update verification record
  const { error: verErr } = await adminClient
    .from("talent_verifications")
    .update({
      status:           action === "approve" ? "approved" : "rejected",
      reviewed_at:      new Date().toISOString(),
      reviewed_by:      admin.id,
      rejection_reason: action === "reject" ? (reason ?? null) : null,
    })
    .eq("id", id);

  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });

  // If approved → mark talent profile as verified
  if (action === "approve") {
    const { error: profErr } = await adminClient
      .from("profiles")
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq("id", verification.talent_id);

    // Fallback: try without verified_at if column doesn't exist yet
    if (profErr) {
      await adminClient
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", verification.talent_id);
    }
  }

  // If rejected → ensure is_verified stays false
  if (action === "reject") {
    await adminClient
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", verification.talent_id);
  }

  revalidatePath("/admin/verifications");
  return NextResponse.json({ ok: true });
}
