export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchAllCandidatesForBoard } from "@/features/candidates/services/candidates.service";

export async function GET(req: NextRequest) {
  const denied = await requirePermission("candidates", "read");
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const category = sp.get("category") || undefined;
  const assignedTo = sp.get("assignedTo") || undefined;
  const actionDate = sp.get("actionDate") || undefined;
  const actionPersonId = sp.get("actionPersonId") || undefined;

  const candidates = await fetchAllCandidatesForBoard({ category, assignedTo, actionDate, actionPersonId });
  return NextResponse.json({ candidates });
}
