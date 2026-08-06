export const runtime = "edge";

// GET  /api/admin/profile-config/sections/[id]/fields  — includes disabled
// POST /api/admin/profile-config/sections/[id]/fields  — create

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { fieldCreateSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const fields = await profileConfigService.listFields(id);
    return NextResponse.json({ fields }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/fields GET");
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const input = fieldCreateSchema.parse(await req.json());
    const field = await profileConfigService.createField(admin.id, id, input);
    return NextResponse.json({ field }, { status: 201, headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/fields POST");
  }
}
