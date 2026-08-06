export const runtime = "edge";

// PATCH  /api/admin/profile-config/sections/[id]  — update, or { action: "set_enabled" }
// DELETE /api/admin/profile-config/sections/[id]  — blocked while values exist
//
// `key` and `kind` are immutable after creation and are absent from the update
// schema: core sections are matched by key inside provider.getCompletion(), so
// renaming one would silently zero a completion section.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { sectionUpdateSchema } from "@/features/profiles/validation/config-schemas";
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
      const section = await profileConfigService.setSectionEnabled(admin.id, id, toggle.data.is_enabled);
      return NextResponse.json({ section }, { headers: privateNoStoreHeaders() });
    }

    const input   = sectionUpdateSchema.parse(body);
    const section = await profileConfigService.updateSection(admin.id, id, input);
    return NextResponse.json({ section }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/sections/[id] PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    await profileConfigService.deleteSection(admin.id, id);
    return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/sections/[id] DELETE");
  }
}
