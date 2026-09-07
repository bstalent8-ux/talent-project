export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { createCandidate, fetchCandidatesPage } from "@/features/candidates/services/candidates.service";
import type { CandidateIdentityInput } from "@/features/candidates/types";

export async function GET(req: NextRequest) {
  const denied = await requirePermission("candidates", "read");
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));
  const stage = sp.get("stage") ?? "all";
  const category = sp.get("category") || undefined;
  const assignedTo = sp.get("assignedTo") || undefined;

  const { candidates, total } = await fetchCandidatesPage({ page, pageSize, stage, category, assignedTo });
  return NextResponse.json({ candidates, total });
}

// Manual "add one candidate" entry point — Excel/Sheet bulk import goes
// through /api/admin/candidates/import, same createCandidate() underneath.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("candidates", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as CandidateIdentityInput & { categoryId?: string | null; jobTitle?: string | null; expectedSalary?: number | null };
  if (!body.fullName && !body.phone && !body.email && !body.socialHandle) {
    return NextResponse.json({ error: "at least one field is required" }, { status: 400 });
  }

  const result = await createCandidate(body, admin.id, "manual", {
    categoryId: body.categoryId, jobTitle: body.jobTitle, expectedSalary: body.expectedSalary,
  });
  return NextResponse.json(result, { status: 201 });
}
