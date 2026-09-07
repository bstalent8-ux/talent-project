export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { deleteCategory, updateCategory } from "@/features/candidates/services/candidate-taxonomy.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { labelAr?: string; labelEn?: string };

  const ok = await updateCategory(id, body);
  if (!ok) return NextResponse.json({ error: "failed to update category" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "delete");
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteCategory(id);
  if (!ok) return NextResponse.json({ error: "failed to delete category" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
