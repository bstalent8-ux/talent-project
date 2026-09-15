export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { updateTalentActionFollowUp } from "@/features/admin/services/admin.service";

// Editable by any admin, not just the action's author — same posture as the
// leads CRM's follow-up dates (a shared team schedule).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ actionId: string }> }) {
  const denied = await requirePermission("talents", "update");
  if (denied) return denied;

  const { actionId } = await params;
  const body = await req.json() as { followUpAt: string | null };

  const ok = await updateTalentActionFollowUp(actionId, body.followUpAt);
  if (!ok) return NextResponse.json({ error: "failed to update follow-up" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
