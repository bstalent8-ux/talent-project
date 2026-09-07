export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { searchAdmins } from "@/features/admin-roles/services/admin-roles.service";

// GET /api/admin/leads/assignees?q=nada — feeds the lead "assign to" picker
// (single + bulk). Deliberately separate from /api/admin/roles/admins:
// that route is requireSuperAdmin()-gated (it feeds role assignment), but
// any admin with leads:update — a leads_moderator included — needs to be
// able to hand a lead to a teammate.
export async function GET(req: NextRequest) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const admins = await searchAdmins(q);
  return NextResponse.json({ admins });
}
