export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { searchAdmins } from "@/features/admin-roles/services/admin-roles.service";

// GET /api/admin/roles/admins?q=nada — feeds the "assign role to" picker,
// same debounced-search pattern as /api/admin/notifications/recipients.
export async function GET(req: NextRequest) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const admins = await searchAdmins(q);
  return NextResponse.json({ admins });
}
