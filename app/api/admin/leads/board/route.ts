export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchAllLeadsForBoard } from "@/features/leads/services/leads.service";

// Unpaginated — the board needs every lead's full card at once to fill in
// each stage column, not one page of the newest N. No `stage` param — see
// fetchAllLeadsForBoard's own comment on why.
export async function GET(req: NextRequest) {
  const denied = await requirePermission("leads", "read");
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const channel = sp.get("channel") || undefined;
  const category = sp.get("category") || undefined;
  const assignedTo = sp.get("assignedTo") || undefined;
  const actionDate = sp.get("actionDate") || undefined;
  const actionPersonId = sp.get("actionPersonId") || undefined;

  const leads = await fetchAllLeadsForBoard({ channel, category, assignedTo, actionDate, actionPersonId });
  return NextResponse.json({ leads });
}
