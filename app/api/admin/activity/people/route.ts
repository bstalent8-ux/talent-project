export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { getAdminPermissions, permissionFor } from "@/lib/auth/permissions";
import { searchAdmins } from "@/features/admin-roles/services/admin-roles.service";

// Feeds the activity log's "person" filter — same gate as
// /api/admin/activity itself (must be able to read at least one of leads/
// candidates), separate route only because it needs `q` search semantics
// instead of a date range.
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const permissions = await getAdminPermissions(admin.id);
  const canSeeAny = permissionFor(permissions, "leads").canRead || permissionFor(permissions, "candidates").canRead;
  if (!canSeeAny) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const admins = await searchAdmins(q);
  return NextResponse.json({ admins });
}
