export const runtime = "edge";

// GET  /api/admin/profile-config/types  — list all types, including inactive
// POST /api/admin/profile-config/types  — create a type (starts inactive)

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { profileTypeCreateSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const types = await profileConfigService.listTypes();
    return NextResponse.json({ types }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/types GET");
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const input = profileTypeCreateSchema.parse(await req.json());
    const type  = await profileConfigService.createType(admin.id, input);
    return NextResponse.json({ type }, { status: 201, headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/types POST");
  }
}
