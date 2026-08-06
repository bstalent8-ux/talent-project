export const runtime = "edge";

// GET /api/admin/profile-config/types/[id]/layout?variant=public
// PUT /api/admin/profile-config/types/[id]/layout   — replaces one variant
//
// The layout stores ordering only: arrays of profile_sections.key. No markup,
// no component definitions. Unknown or disabled keys are rejected.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { layoutSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const variant = req.nextUrl.searchParams.get("variant") ?? "public";
    const layout = await profileConfigService.getLayout(id, variant);
    return NextResponse.json({ layout }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/layout GET");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const input  = layoutSchema.parse(await req.json());
    const layout = await profileConfigService.saveLayout(admin.id, id, input);
    return NextResponse.json({ layout }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/layout PUT");
  }
}
