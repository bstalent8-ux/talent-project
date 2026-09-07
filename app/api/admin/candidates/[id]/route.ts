export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import {
  deleteCandidate,
  fetchCandidateById,
  resolveDuplicate,
  updateCandidateFields,
  updateCandidateIdentity,
} from "@/features/candidates/services/candidates.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "read");
  if (denied) return denied;

  const { id } = await params;
  const candidate = await fetchCandidateById(id);
  if (!candidate) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ candidate });
}

// Handles: duplicate resolution, identity edits, and category/job
// title/expected salary edits. Moving to a different stage is a separate
// endpoint — /api/admin/candidates/[id]/stage.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as {
    duplicateDecision?: "merge" | "dismiss";
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    socialHandle?: string | null;
    categoryId?: string | null;
    jobTitle?: string | null;
    expectedSalary?: number | null;
  };

  if (body.duplicateDecision) {
    const ok = await resolveDuplicate(id, body.duplicateDecision);
    if (!ok) return NextResponse.json({ error: "failed to resolve duplicate" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const identityKeys = ["fullName", "phone", "email", "socialHandle"] as const;
  const fieldKeys = ["categoryId", "jobTitle", "expectedSalary"] as const;
  const hasIdentity = identityKeys.some((k) => k in body);
  const hasFields = fieldKeys.some((k) => k in body);

  if (hasIdentity || hasFields) {
    if (hasIdentity) {
      const patch: Record<string, string | null> = {};
      for (const k of identityKeys) if (k in body) patch[k] = body[k] ?? null;
      const ok = await updateCandidateIdentity(id, patch);
      if (!ok) return NextResponse.json({ error: "failed to update candidate" }, { status: 400 });
    }
    if (hasFields) {
      const patch: Record<string, string | number | null> = {};
      for (const k of fieldKeys) if (k in body) patch[k] = body[k] ?? null;
      const ok = await updateCandidateFields(id, patch);
      if (!ok) return NextResponse.json({ error: "failed to update candidate" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "nothing to update" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("candidates", "delete");
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteCandidate(id);
  if (!ok) return NextResponse.json({ error: "failed to delete candidate" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
