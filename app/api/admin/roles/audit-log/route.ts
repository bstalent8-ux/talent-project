export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { fetchAuditLog } from "@/features/admin-roles/services/admin-roles.service";

export async function GET(req: NextRequest) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(sp.get("pageSize")) || 20));

  const { entries, total } = await fetchAuditLog(page, pageSize);
  return NextResponse.json({ entries, total });
}
