export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { createTerm, fetchTerms } from "@/features/leads/services/lead-taxonomy.service";

export async function GET() {
  const denied = await requirePermission("leads", "read");
  if (denied) return denied;
  const channels = await fetchTerms("lead_channels");
  return NextResponse.json({ channels });
}

// Same "scoped under leads.update" reasoning as the stage-manager routes —
// no separate resourceKey for managing this pipeline's own taxonomies.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { key?: string; labelAr?: string; labelEn?: string };
  if (!body.labelAr?.trim() || !body.labelEn?.trim()) {
    return NextResponse.json({ error: "labelAr and labelEn are required" }, { status: 400 });
  }

  const channel = await createTerm("lead_channels", { key: body.key, labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim() }, admin.id);
  if (!channel) return NextResponse.json({ error: "failed to create channel — key may already exist or be invalid" }, { status: 400 });
  return NextResponse.json({ channel }, { status: 201 });
}
