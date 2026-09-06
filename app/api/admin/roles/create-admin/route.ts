export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/permissions";
import { createAdmin } from "@/features/admin-roles/services/admin-roles.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a real, login-capable admin account (not just a role assignment
// on an existing profile) — super-admin only, same gate as the rest of
// /admin/roles.
export async function POST(req: NextRequest) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { email?: string; password?: string; fullName?: string; roleId?: string | null };

  if (!body.email || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (!body.password || body.password.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }
  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: "fullName required" }, { status: 400 });
  }

  const result = await createAdmin(
    { email: body.email, password: body.password, fullName: body.fullName.trim(), roleId: body.roleId ?? null },
    admin.id
  );

  if (!result.ok) return NextResponse.json({ error: result.error ?? "failed" }, { status: 400 });
  return NextResponse.json({ userId: result.userId }, { status: 201 });
}
