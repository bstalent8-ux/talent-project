export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { deleteTerm, updateTerm } from "@/features/leads/services/lead-taxonomy.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { labelAr?: string; labelEn?: string };

  const ok = await updateTerm("lead_channels", id, body);
  if (!ok) return NextResponse.json({ error: "failed to update channel" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// `leads.channel_id` is ON DELETE SET NULL — any lead tagged with this
// channel just goes back to "unset", no reassignment needed.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "delete");
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteTerm("lead_channels", id);
  if (!ok) return NextResponse.json({ error: "failed to delete channel" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
