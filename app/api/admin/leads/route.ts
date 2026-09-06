export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminUser } from "@/lib/auth/require-admin";
import { createLead, fetchLeadsPage } from "@/features/leads/services/leads.service";
import type { LeadIdentityInput } from "@/features/leads/types";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));
  const status = sp.get("status") ?? "all";

  const { leads, total } = await fetchLeadsPage({ page, pageSize, status });
  return NextResponse.json({ leads, total });
}

// Manual "add one lead" entry point — Excel/Sheet bulk import goes through
// /api/admin/leads/import instead, which calls the same createLead()
// underneath.
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as LeadIdentityInput;
  if (!body.fullName && !body.phone && !body.email && !body.socialHandle) {
    return NextResponse.json({ error: "at least one field is required" }, { status: 400 });
  }

  const result = await createLead(body, admin.id, "manual");
  return NextResponse.json(result, { status: 201 });
}
