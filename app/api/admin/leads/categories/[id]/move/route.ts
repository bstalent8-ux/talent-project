export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { moveTerm } from "@/features/leads/services/lead-taxonomy.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { direction?: "up" | "down" };
  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json({ error: "direction must be 'up' or 'down'" }, { status: 400 });
  }

  const ok = await moveTerm("lead_categories", id, body.direction);
  if (!ok) return NextResponse.json({ error: "already at that end" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
