export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { moveCandidateStage } from "@/features/candidates/services/candidates.service";

// The one endpoint that changes candidates.stage_id — board drag, table
// pill-drop, and the detail page's stage picker all funnel through here so
// a move always validates the target stage's required questions and
// always produces a stage_change history entry.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { stageId?: string; answers?: Record<string, string>; followUpAt?: string | null };
  if (!body.stageId) return NextResponse.json({ error: "stageId is required" }, { status: 400 });

  const result = await moveCandidateStage(id, body.stageId, { answers: body.answers, followUpAt: body.followUpAt, performedBy: admin.id });
  if (!result.ok) return NextResponse.json({ error: result.error ?? "failed to move stage" }, { status: 400 });
  return NextResponse.json({ ok: true, action: result.action });
}
