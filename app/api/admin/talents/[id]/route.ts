export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notifyProfileApproved, notifyProfileRejected } from "@/lib/notifications/events";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;
  const body = await req.json() as { action: string; reason?: string };

  const updates: Record<string, unknown> = {};

  switch (body.action) {
    case "approve":
      updates.status = "approved";
      updates.approved_at = new Date().toISOString();
      updates.approved_by = admin.id;
      updates.rejection_reason = null;
      break;
    case "reject":
      updates.status = "rejected";
      updates.rejection_reason = body.reason ?? null;
      updates.approved_at = null;
      updates.approved_by = null;
      break;
    case "suspend":
      updates.status = "suspended";
      break;
    case "restore":
      updates.status = "approved";
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { data: updated, error } = await adminClient
    .from("talent_profiles")
    .update(updates)
    .eq("id", id)
    .select("user_id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  // Tell the talent what the moderator decided.
  if (updated?.user_id) {
    if (body.action === "approve" || body.action === "restore") {
      await notifyProfileApproved({ recipientId: updated.user_id, adminId: admin.id, kind: "talent" });
    } else if (body.action === "reject" || body.action === "suspend") {
      await notifyProfileRejected({
        recipientId: updated.user_id,
        adminId:     admin.id,
        reason:      body.reason ?? null,
        kind:        "talent",
      });
    }
  }

  // The detail-page cache tag is keyed by HANDLE (talent:${handle}) — see
  // app/(main)/talent/[handle]/page.tsx and /api/profile's own invalidateTalent
  // call. Passing the talent_profiles.id or user_id here (as this route used
  // to) invalidates a tag nobody reads: a handle that a guest had already
  // hit while pending (and got cached as "not found") would stay 404 for up
  // to CACHE_SECONDS.tenMinutes after approval instead of going live
  // immediately.
  let handle: string | null = null;
  if (updated?.user_id) {
    const { data: ownerProfile } = await adminClient
      .from("profiles")
      .select("handle")
      .eq("id", updated.user_id)
      .maybeSingle();
    handle = ownerProfile?.handle ?? null;
  }

  revalidatePath("/admin/talents");
  revalidatePath("/explore");
  invalidateTalent(handle ?? updated?.user_id ?? id);
  if (handle) revalidatePath(`/talent/${handle}`);

  return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;

  // Handle must be read BEFORE the delete — same tag-key reasoning as PATCH
  // above (talent:${handle}, not talent:${id}).
  const { data: existing } = await adminClient
    .from("talent_profiles")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  let handle: string | null = null;
  if (existing?.user_id) {
    const { data: ownerProfile } = await adminClient
      .from("profiles")
      .select("handle")
      .eq("id", existing.user_id)
      .maybeSingle();
    handle = ownerProfile?.handle ?? null;
  }

  const { error } = await adminClient
    .from("talent_profiles")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  revalidatePath("/admin/talents");
  revalidatePath("/explore");
  invalidateTalent(handle ?? id);
  if (handle) revalidatePath(`/talent/${handle}`);

  return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
}
