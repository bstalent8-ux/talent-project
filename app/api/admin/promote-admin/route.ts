export const runtime = 'edge';

// TEMPORARY — added so the one remaining admin (after the test-data
// cleanup) can create a backup admin without a human touching the DB
// directly. Remove this route (and the UI card in
// app/(admin)/admin/settings/page.tsx) once you don't need it anymore.

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/permissions";

export async function POST(req: NextRequest) {
  // This mints a brand-new, UNRESTRICTED admin (no admin_role_id is set
  // below, so the promoted account defaults to full access) — a plain
  // "is this caller an admin" check let ANY admin, including one on a
  // restricted RBAC role with zero tabs granted, promote an arbitrary
  // handle to full-access admin and route straight around the whole
  // permissions system. Only an unrestricted admin may do this, same gate
  // as /admin/roles itself.
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const handle = typeof body?.handle === "string" ? body.handle.trim().toLowerCase() : "";
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const { data: target } = await adminClient
    .from("profiles")
    .select("id, handle, role")
    .eq("handle", handle)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (target.role === "admin") {
    return NextResponse.json({ data: { handle: target.handle, alreadyAdmin: true } });
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", target.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { handle: target.handle, alreadyAdmin: false } });
}
