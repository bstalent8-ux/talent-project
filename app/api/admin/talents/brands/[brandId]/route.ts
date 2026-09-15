export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { updateTalentBrand, deleteTalentBrand } from "@/features/admin/services/admin.service";

// PATCH — edit a brand collaboration row: logo (uploaded client-side to
// Cloudinary first, this just saves the resulting URL), verified toggle,
// year, or name.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
  const denied = await requirePermission("talents", "update");
  if (denied) return denied;

  const { brandId } = await params;
  const body = await req.json() as {
    brandName?: string;
    logoUrl?: string | null;
    yearCollaborated?: string | null;
    verified?: boolean;
  };

  const ok = await updateTalentBrand(brandId, body);
  if (!ok) return NextResponse.json({ error: "failed to update brand" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
  const denied = await requirePermission("talents", "delete");
  if (denied) return denied;

  const { brandId } = await params;
  const ok = await deleteTalentBrand(brandId);
  if (!ok) return NextResponse.json({ error: "failed to delete brand" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
