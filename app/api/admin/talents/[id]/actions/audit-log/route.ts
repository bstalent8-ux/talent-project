export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchTalentActionAuditLog } from "@/features/admin/services/admin.service";

// Change history for this talent's CRM actions (edits + deletes) — read-only,
// "talents" read permission is enough (same gate as the actions list itself).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("talents", "read");
  if (denied) return denied;

  const { id } = await params;
  const entries = await fetchTalentActionAuditLog(id);
  return NextResponse.json({ entries });
}
