export const runtime = "edge";

// GET  /api/admin/profile-config/types/[id]/sections  — includes disabled
// POST /api/admin/profile-config/types/[id]/sections  — create (always kind="dynamic")

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { sectionCreateSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const sections = await profileConfigService.listSections(id);
    return NextResponse.json({ sections }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/sections GET");
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const input   = sectionCreateSchema.parse(await req.json());
    const section = await profileConfigService.createSection(admin.id, id, input);
    return NextResponse.json({ section }, { status: 201, headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/sections POST");
  }
}
