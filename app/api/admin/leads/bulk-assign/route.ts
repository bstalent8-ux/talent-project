export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { bulkReassignLeads } from "@/features/leads/services/leads.service";

const MAX_BULK = 500;

// POST — assigns every lead in leadIds to the same owner in one go. Backs
// the leads table's checkbox selection ("pick one lead, or a whole group,
// and assign them all at once").
export async function POST(req: NextRequest) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { leadIds?: string[]; assignedTo?: string | null };
  if (!Array.isArray(body.leadIds) || body.leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds is required" }, { status: 400 });
  }
  if (body.leadIds.length > MAX_BULK) {
    return NextResponse.json({ error: `too many leads at once (max ${MAX_BULK})` }, { status: 400 });
  }

  const result = await bulkReassignLeads(body.leadIds, body.assignedTo ?? null, admin.id);
  return NextResponse.json(result);
}
