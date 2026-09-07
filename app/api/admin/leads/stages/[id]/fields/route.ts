export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { addStageField } from "@/features/leads/services/lead-stages.service";
import { STAGE_FIELD_TYPES } from "@/features/leads/types";

// Adds one custom question to a stage — asked in a small form whenever a
// lead is moved onto it (board drag or the detail page's stage picker).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as {
    labelAr?: string; labelEn?: string; fieldType?: string;
    options?: { value: string; labelAr: string; labelEn: string }[]; required?: boolean;
  };

  if (!body.labelAr?.trim() || !body.labelEn?.trim()) {
    return NextResponse.json({ error: "labelAr and labelEn are required" }, { status: 400 });
  }
  if (!body.fieldType || !STAGE_FIELD_TYPES.includes(body.fieldType as (typeof STAGE_FIELD_TYPES)[number])) {
    return NextResponse.json({ error: "invalid fieldType" }, { status: 400 });
  }
  if (body.fieldType === "select" && (!body.options || body.options.length === 0)) {
    return NextResponse.json({ error: "select fields need at least one option" }, { status: 400 });
  }

  const field = await addStageField(id, {
    labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim(),
    fieldType: body.fieldType as (typeof STAGE_FIELD_TYPES)[number],
    options: body.options, required: body.required,
  });
  if (!field) return NextResponse.json({ error: "failed to add field" }, { status: 400 });
  return NextResponse.json({ field }, { status: 201 });
}
