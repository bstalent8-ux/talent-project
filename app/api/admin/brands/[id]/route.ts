export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notifyProfileApproved, notifyProfileRejected } from "@/lib/notifications/events";
import { invalidateBrand, privateNoStoreHeaders } from "@/lib/cache";

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
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;
  const { action, reason } = await req.json() as {
    action: "approve" | "reject" | "reset";
    reason?: string;
  };

  const updates: Record<string, unknown> = {};

  switch (action) {
    case "approve":
      updates.brand_status       = "approved";
      updates.brand_approved_at  = new Date().toISOString();
      updates.brand_approved_by  = admin.id;
      updates.brand_rejection_reason = null;
      break;
    case "reject":
      updates.brand_status             = "rejected";
      updates.brand_rejection_reason   = reason ?? null;
      updates.brand_approved_at        = null;
      break;
    case "reset":
      updates.brand_status             = "pending";
      updates.brand_approved_at        = null;
      updates.brand_rejection_reason   = null;
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { error } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .eq("role", "brand");

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  // `reset` puts the brand back into review — no notification for that.
  if (action === "approve") {
    await notifyProfileApproved({ recipientId: id, adminId: admin.id, kind: "brand" });
  } else if (action === "reject") {
    await notifyProfileRejected({ recipientId: id, adminId: admin.id, reason: reason ?? null, kind: "brand" });
  }

  revalidatePath("/admin/brands");
  invalidateBrand(id);
  return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
}
