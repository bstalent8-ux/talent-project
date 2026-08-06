export const runtime = "edge";

// PATCH /api/admin/profile-config/fields/reorder
// body: { section_id, items: [{ id, display_order }] }
//
// Batch, and scoped: the service rejects any id that does not belong to the
// given section.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { reorderSchema } from "@/features/profiles/validation/config-schemas";
import { toErrorResponse } from "@/features/profiles/errors/http";
import { privateNoStoreHeaders } from "@/lib/cache";

const scopedReorderSchema = reorderSchema.extend({
  section_id: z.string().uuid(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const input = scopedReorderSchema.parse(await req.json());
    await profileConfigService.reorderFields(admin.id, input.section_id, { items: input.items });
    return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return toErrorResponse(error, "profile-config/fields/reorder PATCH");
  }
}
