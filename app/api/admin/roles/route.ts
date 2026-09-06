export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminUser, requireSuperAdmin } from "@/lib/auth/permissions";
import { createRole, fetchRoles } from "@/features/admin-roles/services/admin-roles.service";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;
  const roles = await fetchRoles();
  return NextResponse.json({ roles });
}

const KEY_RE = /^[a-z][a-z0-9_]{2,40}$/;

/** Forgiving toward whatever an admin actually types (spaces, capitals,
 *  Arabic label pasted by mistake, hyphens) — "Leads Manager" becomes
 *  "leads_manager" instead of a silent 400. Only a value that still can't
 *  produce a valid key after slugifying (e.g. all-Arabic, all-symbols)
 *  falls through to the length/shape error below. */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(req: NextRequest) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { key?: string; labelAr?: string; labelEn?: string };
  if (!body.labelAr?.trim() || !body.labelEn?.trim()) {
    return NextResponse.json({ error: "labelAr and labelEn are required" }, { status: 400 });
  }

  const key = slugify(body.key ?? body.labelEn);
  if (!KEY_RE.test(key)) {
    return NextResponse.json(
      { error: "couldn't build a valid role key from that — use English letters/numbers, at least 3 characters" },
      { status: 400 }
    );
  }

  const role = await createRole({ key, labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim() }, admin.id);
  if (!role) return NextResponse.json({ error: "a role with that key already exists" }, { status: 400 });
  return NextResponse.json({ role }, { status: 201 });
}
