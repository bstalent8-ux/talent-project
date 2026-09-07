export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { reassignLead } from "@/features/leads/services/leads.service";

// PATCH — changes who owns this lead (leads.assigned_to). Always logs a
// lead_assigned history entry (see reassignLead) — separate from
// PATCH /api/admin/leads/[id], which only edits identity/duplicate fields.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { assignedTo?: string | null };

  const ok = await reassignLead(id, body.assignedTo ?? null, admin.id);
  if (!ok) return NextResponse.json({ error: "failed to assign lead" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
