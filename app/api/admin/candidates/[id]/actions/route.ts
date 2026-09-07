export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { addCandidateAction } from "@/features/candidates/services/candidates.service";
import { CANDIDATE_ACTION_TYPES } from "@/features/candidates/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { actionType?: string; note?: string; followUpAt?: string | null; assignedTo?: string | null };

  if (!body.actionType || !CANDIDATE_ACTION_TYPES.includes(body.actionType as (typeof CANDIDATE_ACTION_TYPES)[number])) {
    return NextResponse.json({ error: "invalid actionType" }, { status: 400 });
  }

  const action = await addCandidateAction(id, {
    actionType: body.actionType,
    note: body.note ?? null,
    performedBy: admin.id,
    followUpAt: body.followUpAt,
    assignedTo: body.assignedTo ?? null,
  });

  if (!action) return NextResponse.json({ error: "failed to log action" }, { status: 500 });
  return NextResponse.json({ action }, { status: 201 });
}
