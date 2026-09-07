export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { addLeadAction } from "@/features/leads/services/leads.service";
import { LEAD_ACTION_TYPES } from "@/features/leads/types";

// Logs one action against a lead (call/message/email/meeting/note). Sets
// follow_up_at to +2 days by default (see addLeadAction) — the caller can
// override it in the same request. A logged action is a "create" on the
// leads resource — a leads_moderator (no delete) can still do this.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { actionType?: string; note?: string; followUpAt?: string | null; assignedTo?: string | null };

  if (!body.actionType || !LEAD_ACTION_TYPES.includes(body.actionType as (typeof LEAD_ACTION_TYPES)[number])) {
    return NextResponse.json({ error: "invalid actionType" }, { status: 400 });
  }

  const action = await addLeadAction(id, {
    actionType: body.actionType,
    note: body.note ?? null,
    performedBy: admin.id,
    followUpAt: body.followUpAt,
    assignedTo: body.assignedTo ?? null,
  });

  if (!action) return NextResponse.json({ error: "failed to log action" }, { status: 500 });
  return NextResponse.json({ action }, { status: 201 });
}
