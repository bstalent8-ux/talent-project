export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchTalentBrands, addTalentBrand } from "@/features/admin/services/admin.service";

// GET — this talent's brand-collaboration rows (id = talent_profiles.id).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("talents", "read");
  if (denied) return denied;

  const { id } = await params;
  const brands = await fetchTalentBrands(id);
  return NextResponse.json({ brands });
}

// POST — add a brand row by name. Logo/verified are set afterwards via the
// PATCH route on the created row (an admin's own manual entry, distinct from
// the talent's own name-only sync in lib/talent-brands-sync.ts).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("talents", "create");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { brandName?: string };
  const brandName = body.brandName?.trim();
  if (!brandName) return NextResponse.json({ error: "brandName required" }, { status: 400 });

  const { data: tp } = await adminClient.from("talent_profiles").select("id").eq("id", id).maybeSingle();
  if (!tp) return NextResponse.json({ error: "talent not found" }, { status: 404 });

  const brand = await addTalentBrand(id, brandName);
  if (!brand) return NextResponse.json({ error: "failed to add brand" }, { status: 500 });
  return NextResponse.json({ brand }, { status: 201 });
}
