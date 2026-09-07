export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { reassignCandidate } from "@/features/candidates/services/candidates.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { assignedTo?: string | null };

  const ok = await reassignCandidate(id, body.assignedTo ?? null, admin.id);
  if (!ok) return NextResponse.json({ error: "failed to assign candidate" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
