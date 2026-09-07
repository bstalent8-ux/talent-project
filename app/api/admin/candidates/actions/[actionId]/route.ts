export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { updateActionFollowUp } from "@/features/candidates/services/candidates.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ actionId: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { actionId } = await params;
  const body = await req.json() as { followUpAt?: string | null };

  const ok = await updateActionFollowUp(actionId, body.followUpAt ?? null);
  if (!ok) return NextResponse.json({ error: "failed to update follow-up" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
