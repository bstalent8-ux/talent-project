export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { createLead, fetchLeadsPage } from "@/features/leads/services/leads.service";
import type { LeadIdentityInput } from "@/features/leads/types";

export async function GET(req: NextRequest) {
  const denied = await requirePermission("leads", "read");
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));
  const stage = sp.get("stage") ?? "all";
  const channel = sp.get("channel") || undefined;
  const category = sp.get("category") || undefined;
  const assignedTo = sp.get("assignedTo") || undefined;

  const { leads, total } = await fetchLeadsPage({ page, pageSize, stage, channel, category, assignedTo });
  return NextResponse.json({ leads, total });
}

// Manual "add one lead" entry point — Excel/Sheet bulk import goes through
// /api/admin/leads/import instead, which calls the same createLead()
// underneath.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("leads", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as LeadIdentityInput & { channelId?: string | null; categoryId?: string | null };
  if (!body.fullName && !body.phone && !body.email && !body.socialHandle) {
    return NextResponse.json({ error: "at least one field is required" }, { status: 400 });
  }

  const result = await createLead(body, admin.id, "manual", { channelId: body.channelId, categoryId: body.categoryId });
  return NextResponse.json(result, { status: 201 });
}
