export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { deleteStageField, updateStageField } from "@/features/leads/services/lead-stages.service";
import { STAGE_FIELD_TYPES } from "@/features/leads/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;

  const { fieldId } = await params;
  const body = await req.json() as {
    labelAr?: string; labelEn?: string; fieldType?: string;
    options?: { value: string; labelAr: string; labelEn: string }[] | null; required?: boolean;
  };

  if (body.fieldType && !STAGE_FIELD_TYPES.includes(body.fieldType as (typeof STAGE_FIELD_TYPES)[number])) {
    return NextResponse.json({ error: "invalid fieldType" }, { status: 400 });
  }

  const ok = await updateStageField(fieldId, {
    labelAr: body.labelAr, labelEn: body.labelEn,
    fieldType: body.fieldType as (typeof STAGE_FIELD_TYPES)[number] | undefined,
    options: body.options, required: body.required,
  });
  if (!ok) return NextResponse.json({ error: "failed to update field" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  const denied = await requirePermission("leads", "delete");
  if (denied) return denied;

  const { fieldId } = await params;
  const ok = await deleteStageField(fieldId);
  if (!ok) return NextResponse.json({ error: "failed to delete field" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
