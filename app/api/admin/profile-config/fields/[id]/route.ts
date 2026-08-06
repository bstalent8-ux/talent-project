export const runtime = "edge";

// PATCH  /api/admin/profile-config/fields/[id]  — update, or { action: "set_enabled" }
// DELETE /api/admin/profile-config/fields/[id]  — blocked while values exist
//
// `key` is immutable after creation. `field_type` may change only while the
// field holds no stored values — that guard needs a DB read and lives in the
// service.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { fieldUpdateSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

const setEnabledSchema = z.object({
  action:     z.literal("set_enabled"),
  is_enabled: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const body = await req.json();

    const toggle = setEnabledSchema.safeParse(body);
    if (toggle.success) {
      const field = await profileConfigService.setFieldEnabled(admin.id, id, toggle.data.is_enabled);
      return NextResponse.json({ field }, { headers: privateNoStoreHeaders() });
    }

    const input = fieldUpdateSchema.parse(body);
    const field = await profileConfigService.updateField(admin.id, id, input);
    return NextResponse.json({ field }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/fields/[id] PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    await profileConfigService.deleteField(admin.id, id);
    return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/fields/[id] DELETE");
  }
}
