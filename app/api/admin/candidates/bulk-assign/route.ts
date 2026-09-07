export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { bulkReassignCandidates } from "@/features/candidates/services/candidates.service";

const MAX_BULK = 500;

export async function POST(req: NextRequest) {
  const denied = await requirePermission("candidates", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { candidateIds?: string[]; assignedTo?: string | null };
  if (!Array.isArray(body.candidateIds) || body.candidateIds.length === 0) {
    return NextResponse.json({ error: "candidateIds is required" }, { status: 400 });
  }
  if (body.candidateIds.length > MAX_BULK) {
    return NextResponse.json({ error: `too many candidates at once (max ${MAX_BULK})` }, { status: 400 });
  }

  const result = await bulkReassignCandidates(body.candidateIds, body.assignedTo ?? null, admin.id);
  return NextResponse.json(result);
}
