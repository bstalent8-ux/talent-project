export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { createStage, fetchStages } from "@/features/leads/services/lead-stages.service";

export async function GET() {
  const denied = await requirePermission("leads", "read");
  if (denied) return denied;
  const stages = await fetchStages();
  return NextResponse.json({ stages });
}

// Stage management is scoped under the leads resource's "update" action —
// there's no separate resourceKey for "manage the leads pipeline structure"
// and adding one would be a distinction without a difference for a
// single-tab CRM.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { key?: string; labelAr?: string; labelEn?: string; color?: string };
  if (!body.labelAr?.trim() || !body.labelEn?.trim()) {
    return NextResponse.json({ error: "labelAr and labelEn are required" }, { status: 400 });
  }

  const stage = await createStage({ key: body.key, labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim(), color: body.color }, admin.id);
  if (!stage) return NextResponse.json({ error: "failed to create stage — key may already exist or be invalid" }, { status: 400 });
  return NextResponse.json({ stage }, { status: 201 });
}
