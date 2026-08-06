export const runtime = "edge";

// GET    /api/admin/profile-config/types/[id]
// PATCH  /api/admin/profile-config/types/[id]   — full update, or { action: "set_active" }
// DELETE /api/admin/profile-config/types/[id]   — blocked while profiles reference it

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { profileTypeUpdateSchema, setActiveSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const type = await profileConfigService.getType(id);
    return NextResponse.json({ type }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/types/[id] GET");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const body = await req.json();

    // Toggle idiom, matching app/api/admin/categories/[id]/route.ts:49.
    const toggle = setActiveSchema.safeParse(body);
    if (toggle.success) {
      const type = await profileConfigService.setTypeActive(admin.id, id, toggle.data.is_active);
      return NextResponse.json({ type }, { headers: privateNoStoreHeaders() });
    }

    const input = profileTypeUpdateSchema.parse(body);
    const type  = await profileConfigService.updateType(admin.id, id, input);
    return NextResponse.json({ type }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/types/[id] PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    await profileConfigService.deleteType(admin.id, id);
    return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/types/[id] DELETE");
  }
}
