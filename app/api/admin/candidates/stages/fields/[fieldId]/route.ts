export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { deleteStageField, updateStageField } from "@/features/candidates/services/candidate-stages.service";
import type { StageFieldOption, StageFieldType } from "@/features/candidates/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { fieldId } = await params;
  const body = await req.json() as Partial<{ labelAr: string; labelEn: string; fieldType: StageFieldType; options: StageFieldOption[] | null; required: boolean }>;

  const ok = await updateStageField(fieldId, body);
  if (!ok) return NextResponse.json({ error: "failed to update question" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { fieldId } = await params;
  const ok = await deleteStageField(fieldId);
  if (!ok) return NextResponse.json({ error: "failed to delete question" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
