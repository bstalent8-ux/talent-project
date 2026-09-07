export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { getAdminPermissions, permissionFor } from "@/lib/auth/permissions";
import { fetchActivity } from "@/features/activity/service";
import type { ActivityModule } from "@/features/activity/types";

// GET /api/admin/activity?date=YYYY-MM-DD&personId=... — combined leads +
// candidates action feed. No dedicated RBAC resource: each module is
// included only if the caller can read that tab (leads:read / candidates:
// read) — a restricted admin sees exactly the module(s) they're granted,
// same posture as the sidebar, never a new permission surface for something
// that's just a read-only view over two already-gated tables.
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const permissions = await getAdminPermissions(admin.id);
  const modules: ActivityModule[] = [];
  if (permissionFor(permissions, "leads").canRead) modules.push("lead");
  if (permissionFor(permissions, "candidates").canRead) modules.push("candidate");
  if (modules.length === 0) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const date = sp.get("date") || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const personId = sp.get("personId") || undefined;

  const result = await fetchActivity({ date, personId, modules });
  return NextResponse.json(result);
}
