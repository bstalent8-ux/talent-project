export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { moveLeadStage } from "@/features/leads/services/leads.service";

// Body: { stageId, answers?: Record<fieldKey, string>, followUpAt? }
// The single entry point that changes a lead's stage — board drag-and-drop
// and the detail page's stage picker both call this, never leads/[id]'s
// generic PATCH, so a move always produces a stage_change history entry.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { stageId?: string; answers?: Record<string, string>; followUpAt?: string | null };
  if (!body.stageId) return NextResponse.json({ error: "stageId required" }, { status: 400 });

  const result = await moveLeadStage(id, body.stageId, { answers: body.answers, followUpAt: body.followUpAt, performedBy: admin.id });
  if (!result.ok) return NextResponse.json({ error: result.error ?? "failed to move lead" }, { status: 400 });
  return NextResponse.json({ ok: true, action: result.action });
}
