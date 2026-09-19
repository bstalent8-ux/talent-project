export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/require-admin";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";
import { notifyMediaReviewed } from "@/lib/notifications/events";

// Approve or reject one or many portfolio uploads waiting in the review queue.
//
//   PATCH { ids: string[], action: "approve" | "reject", reason?: string }
//
// Approving flips portfolio_items.is_approved on (the single "public" switch every
// public read already filters on); rejecting keeps it off and records why, so the
// talent sees the reason. An already-approved item can also be pulled back with
// "reject" (take-down). Each affected talent is notified once, and their public
// profile cache is invalidated so the change shows immediately.

const MAX_BATCH = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest) {
  const denied = await requirePermission("pendingData", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const body = await req.json().catch(() => null) as { ids?: unknown; action?: unknown; reason?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? [...new Set(body!.ids.filter((x): x is string => typeof x === "string" && UUID.test(x)))] : [];
  const action = body?.action;
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  if (ids.length === 0 || ids.length > MAX_BATCH) {
    return NextResponse.json({ error: `select 1-${MAX_BATCH} items` }, { status: 400, headers: privateNoStoreHeaders() });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid action" }, { status: 400, headers: privateNoStoreHeaders() });
  }
  if (action === "reject" && reason.length < 3) {
    return NextResponse.json({ error: "a rejection reason is required" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const approve = action === "approve";
  const now = new Date().toISOString();

  // Only touch rows that actually change state, so a double-click can't re-notify.
  const { data: existing, error: readErr } = await adminClient
    .from("portfolio_items")
    .select("id, talent_id, is_approved")
    .in("id", ids);
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500, headers: privateNoStoreHeaders() });
  const targets = (existing ?? []).filter((r) => (approve ? !r.is_approved : true));
  if (targets.length === 0) return NextResponse.json({ ok: true, updated: 0 }, { headers: privateNoStoreHeaders() });
  const targetIds = targets.map((r) => r.id as string);

  const full = {
    is_approved:      approve,
    review_status:    approve ? "approved" : "rejected",
    reviewed_by:      admin.id,
    reviewed_at:      now,
    rejection_reason: approve ? null : reason,
  };
  let { error } = await adminClient.from("portfolio_items").update(full).in("id", targetIds);
  if (error && /review_status|reviewed_|rejection_reason/.test(error.message)) {
    // Migration 20260919_media_moderation.sql not applied. Approving still works off is_approved;
    // a rejection needs the reason column, so it can't be recorded properly yet.
    if (!approve) {
      return NextResponse.json({ error: "migration_required" }, { status: 409, headers: privateNoStoreHeaders() });
    }
    ({ error } = await adminClient.from("portfolio_items").update({ is_approved: true }).in("id", targetIds));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  // Per talent: bust the public profile cache and send one notification.
  const perTalent = new Map<string, number>();
  for (const r of targets) perTalent.set(r.talent_id as string, (perTalent.get(r.talent_id as string) ?? 0) + 1);

  const talentIds = [...perTalent.keys()];
  const { data: tps } = await adminClient.from("talent_profiles").select("id, user_id").in("id", talentIds);
  const userIds = (tps ?? []).map((t) => t.user_id as string);
  const { data: people } = userIds.length
    ? await adminClient.from("profiles").select("id, handle").in("id", userIds)
    : { data: [] as { id: string; handle: string | null }[] };
  const handleByUser = new Map((people ?? []).map((p) => [p.id, p.handle]));

  for (const tp of tps ?? []) {
    invalidateTalent(handleByUser.get(tp.user_id as string) ?? (tp.user_id as string));
    notifyMediaReviewed({
      recipientId: tp.user_id as string,
      adminId:     admin.id,
      approved:    approve,
      count:       perTalent.get(tp.id as string) ?? 1,
      reason:      approve ? null : reason,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, updated: targetIds.length, status: approve ? "approved" : "rejected" }, { headers: privateNoStoreHeaders() });
}
