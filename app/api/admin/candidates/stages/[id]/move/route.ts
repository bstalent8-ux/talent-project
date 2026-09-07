export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { moveStage } from "@/features/candidates/services/candidate-stages.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { direction?: "up" | "down" };
  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json({ error: "direction must be 'up' or 'down'" }, { status: 400 });
  }

  const ok = await moveStage(id, body.direction);
  if (!ok) return NextResponse.json({ error: "already at that end" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
