export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/permissions";
import { ADMIN_RESOURCE_KEYS, type AdminResourceKey } from "@/lib/auth/permissions";
import { deleteRole, updateRolePermission } from "@/features/admin-roles/services/admin-roles.service";

// Body: { resourceKey, canRead, canCreate, canUpdate, canDelete } — updates
// exactly one cell of the role's permission matrix. The UI sends one call
// per checkbox toggle rather than the whole matrix at once, so a partial
// failure never loses more than the one cell being edited.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    resourceKey?: string; canRead?: boolean; canCreate?: boolean; canUpdate?: boolean; canDelete?: boolean;
  };

  if (!body.resourceKey || !(ADMIN_RESOURCE_KEYS as readonly string[]).includes(body.resourceKey)) {
    return NextResponse.json({ error: "invalid resourceKey" }, { status: 400 });
  }

  const ok = await updateRolePermission(id, body.resourceKey as AdminResourceKey, {
    canRead: !!body.canRead, canCreate: !!body.canCreate, canUpdate: !!body.canUpdate, canDelete: !!body.canDelete,
  }, admin.id);

  if (!ok) return NextResponse.json({ error: "failed to update permission" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const ok = await deleteRole(id, admin.id);
  if (!ok) return NextResponse.json({ error: "failed to delete role" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
