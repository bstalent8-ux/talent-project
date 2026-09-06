export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/permissions";
import { assignRole } from "@/features/admin-roles/services/admin-roles.service";

// Body: { userId, roleId } — roleId: null reverts that admin to full access.
export async function PATCH(req: NextRequest) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { userId?: string; roleId?: string | null };
  if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const ok = await assignRole(body.userId, body.roleId ?? null, admin.id);
  if (!ok) return NextResponse.json({ error: "failed to assign role" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
