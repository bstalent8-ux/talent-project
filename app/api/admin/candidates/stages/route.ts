export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { createStage, fetchStages } from "@/features/candidates/services/candidate-stages.service";

export async function GET() {
  const denied = await requirePermission("candidates", "read");
  if (denied) return denied;
  const stages = await fetchStages();
  return NextResponse.json({ stages });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const body = await req.json() as { key?: string; labelAr?: string; labelEn?: string; color?: string };
  if (!body.labelAr?.trim() || !body.labelEn?.trim()) {
    return NextResponse.json({ error: "labelAr and labelEn are required" }, { status: 400 });
  }

  const stage = await createStage({ key: body.key, labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim(), color: body.color });
  if (!stage) return NextResponse.json({ error: "failed to create stage — key may already exist or be invalid" }, { status: 400 });
  return NextResponse.json({ stage }, { status: 201 });
}
