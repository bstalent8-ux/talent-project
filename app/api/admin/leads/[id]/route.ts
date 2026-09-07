export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import {
  deleteLead,
  fetchLeadById,
  resolveDuplicate,
  updateLeadIdentity,
  updateLeadTaxonomy,
} from "@/features/leads/services/leads.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "read");
  if (denied) return denied;

  const { id } = await params;
  const lead = await fetchLeadById(id);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

// Handles two distinct edits: resolving a possible-duplicate flag (merge
// into the earlier lead, or dismiss it), and correcting identity fields.
// Moving a lead to a different stage is a separate endpoint —
// /api/admin/leads/[id]/stage — since a move always produces a
// stage_change history entry and validates that stage's own questions,
// unlike a plain field edit.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as {
    duplicateDecision?: "merge" | "dismiss";
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    socialHandle?: string | null;
    channelId?: string | null;
    categoryId?: string | null;
  };

  if (body.duplicateDecision) {
    const ok = await resolveDuplicate(id, body.duplicateDecision);
    if (!ok) return NextResponse.json({ error: "failed to resolve duplicate" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const identityKeys = ["fullName", "phone", "email", "socialHandle"] as const;
  const taxonomyKeys = ["channelId", "categoryId"] as const;
  const hasIdentity = identityKeys.some((k) => k in body);
  const hasTaxonomy = taxonomyKeys.some((k) => k in body);

  if (hasIdentity || hasTaxonomy) {
    if (hasIdentity) {
      const patch: Record<string, string | null> = {};
      for (const k of identityKeys) if (k in body) patch[k] = body[k] ?? null;
      const ok = await updateLeadIdentity(id, patch);
      if (!ok) return NextResponse.json({ error: "failed to update lead" }, { status: 400 });
    }
    if (hasTaxonomy) {
      const patch: Record<string, string | null> = {};
      for (const k of taxonomyKeys) if (k in body) patch[k] = body[k] ?? null;
      const ok = await updateLeadTaxonomy(id, patch);
      if (!ok) return NextResponse.json({ error: "failed to update lead" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "nothing to update" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("leads", "delete");
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteLead(id);
  if (!ok) return NextResponse.json({ error: "failed to delete lead" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
