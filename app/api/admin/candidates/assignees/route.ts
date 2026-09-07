export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { searchAdmins } from "@/features/admin-roles/services/admin-roles.service";

// Same reasoning as /api/admin/leads/assignees — requirePermission("candidates",
// "update"), not requireSuperAdmin(), so a restricted-but-granted admin can
// hand a candidate to a teammate.
export async function GET(req: NextRequest) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const admins = await searchAdmins(q);
  return NextResponse.json({ admins });
}
