export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { addStageField } from "@/features/candidates/services/candidate-stages.service";
import type { StageFieldOption, StageFieldType } from "@/features/candidates/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { labelAr?: string; labelEn?: string; fieldType?: StageFieldType; required?: boolean; options?: StageFieldOption[]; fieldKey?: string };
  if (!body.labelAr?.trim() || !body.labelEn?.trim() || !body.fieldType) {
    return NextResponse.json({ error: "labelAr, labelEn and fieldType are required" }, { status: 400 });
  }

  const field = await addStageField(id, {
    labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim(), fieldType: body.fieldType,
    required: body.required, options: body.options, fieldKey: body.fieldKey,
  });
  if (!field) return NextResponse.json({ error: "failed to add question" }, { status: 400 });
  return NextResponse.json({ field }, { status: 201 });
}
