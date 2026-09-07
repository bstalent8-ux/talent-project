export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { deleteStage, updateStage } from "@/features/candidates/services/candidate-stages.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { labelAr?: string; labelEn?: string; color?: string };

  const ok = await updateStage(id, body);
  if (!ok) return NextResponse.json({ error: "failed to update stage" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "delete");
  if (denied) return denied;

  const { id } = await params;
  const result = await deleteStage(id);
  if (!result.ok) return NextResponse.json({ error: result.error ?? "failed to delete stage" }, { status: 400 });
  return NextResponse.json({ ok: true, reassignedCount: result.reassignedCount });
}
