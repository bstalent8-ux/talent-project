export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { countAudience } from "@/lib/notifications/service";
import { parseAudience } from "@/lib/notifications/validate";
import { requirePermission } from "@/lib/auth/permissions";

// POST /api/admin/notifications/preview — dry run: how many people would this
// reach? Writes nothing. Gated same as the composer page (notifications:read
// — this is a preview, not a send).
export async function POST(req: NextRequest) {
  const denied = await requirePermission("notifications", "read");
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid json body" }, { status: 400 });

  const audience = parseAudience(body);
  if (audience.ok === false) return NextResponse.json({ error: audience.error }, { status: 400 });

  const count = await countAudience(audience.value);
  return NextResponse.json({ recipient_count: count });
}
