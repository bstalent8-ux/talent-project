export const runtime = "edge";

// PATCH /api/admin/profile-config/sections/reorder
// body: { profile_type_id, items: [{ id, display_order }] }
//
// Batch by design: moving one section shifts several rows, and N edge round
// trips is the wrong shape. The service rejects any id that does not belong to
// the given profile type, so one request cannot reorder another type's sections.
//
// Static segment — Next resolves /sections/reorder before /sections/[id].

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { reorderSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

const scopedReorderSchema = reorderSchema.extend({
  profile_type_id: z.string().uuid(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const input = scopedReorderSchema.parse(await req.json());
    await profileConfigService.reorderSections(admin.id, input.profile_type_id, { items: input.items });
    return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/sections/reorder PATCH");
  }
}
