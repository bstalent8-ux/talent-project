export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteLead,
  fetchLeadById,
  resolveDuplicate,
  updateLeadIdentity,
  updateLeadStatus,
} from "@/features/leads/services/leads.service";
import { LEAD_STATUSES } from "@/features/leads/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const lead = await fetchLeadById(id);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

// Handles two distinct edits: changing the pipeline status, and resolving a
// possible-duplicate flag (merge into the earlier lead, or dismiss it).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as {
    status?: string;
    duplicateDecision?: "merge" | "dismiss";
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    socialHandle?: string | null;
  };

  if (body.duplicateDecision) {
    const ok = await resolveDuplicate(id, body.duplicateDecision);
    if (!ok) return NextResponse.json({ error: "failed to resolve duplicate" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.status) {
    if (!LEAD_STATUSES.includes(body.status as (typeof LEAD_STATUSES)[number])) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    const ok = await updateLeadStatus(id, body.status as (typeof LEAD_STATUSES)[number]);
    if (!ok) return NextResponse.json({ error: "failed to update status" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const identityKeys = ["fullName", "phone", "email", "socialHandle"] as const;
  if (identityKeys.some((k) => k in body)) {
    const patch: Record<string, string | null> = {};
    for (const k of identityKeys) if (k in body) patch[k] = body[k] ?? null;
    const ok = await updateLeadIdentity(id, patch);
    if (!ok) return NextResponse.json({ error: "failed to update lead" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "nothing to update" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteLead(id);
  if (!ok) return NextResponse.json({ error: "failed to delete lead" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
