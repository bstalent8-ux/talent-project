export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/require-admin";
import { TALENT_ACTION_TYPES } from "@/features/admin/types";
import { updateTalentAction, deleteTalentAction } from "@/features/admin/services/admin.service";

// Editable by any admin, not just the action's author — same posture as the
// leads CRM's follow-up dates (a shared team schedule). Body may carry any
// mix of actionType/note/followUpAt — only the provided fields are patched.
// `getAdminUser()` here is only for the audit-log "changed_by" attribution,
// not an ownership check.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ actionId: string }> }) {
  const denied = await requirePermission("talents", "update");
  if (denied) return denied;
  const admin = await getAdminUser();

  const { actionId } = await params;
  const body = await req.json() as { actionType?: string; note?: string | null; followUpAt?: string | null };

  if (body.actionType !== undefined && !TALENT_ACTION_TYPES.includes(body.actionType as (typeof TALENT_ACTION_TYPES)[number])) {
    return NextResponse.json({ error: "invalid actionType" }, { status: 400 });
  }

  const ok = await updateTalentAction(actionId, body, admin?.id ?? null);
  if (!ok) return NextResponse.json({ error: "failed to update action" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ actionId: string }> }) {
  const denied = await requirePermission("talents", "delete");
  if (denied) return denied;
  const admin = await getAdminUser();

  const { actionId } = await params;
  const ok = await deleteTalentAction(actionId, admin?.id ?? null);
  if (!ok) return NextResponse.json({ error: "failed to delete action" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
