export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { createCategory, fetchCategories } from "@/features/candidates/services/candidate-taxonomy.service";

export async function GET() {
  const denied = await requirePermission("candidates", "read");
  if (denied) return denied;
  const categories = await fetchCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { key?: string; labelAr?: string; labelEn?: string };
  if (!body.labelAr?.trim() || !body.labelEn?.trim()) {
    return NextResponse.json({ error: "labelAr and labelEn are required" }, { status: 400 });
  }

  const category = await createCategory({ key: body.key, labelAr: body.labelAr.trim(), labelEn: body.labelEn.trim() }, admin.id);
  if (!category) return NextResponse.json({ error: "failed to create category — key may already exist or be invalid" }, { status: 400 });
  return NextResponse.json({ category }, { status: 201 });
}
