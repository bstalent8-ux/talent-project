export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import type { AdminResourceKey } from "@/lib/auth/admin-resources";

const MAX_BULK = 500;

// One endpoint for "tick some rows in an admin table, delete them all at
// once". Deliberately scoped to list-management tables where a batch delete
// is routine cleanup (junk imports, spam, stale rows) and every child row
// cascades. Entity tables with a real lifecycle — bookings (payment
// history), talents / brands (public profiles + a moderation trail),
// reviews, verifications — are intentionally absent: a bulk delete there is
// a footgun, not a convenience. Add a resource here only after checking its
// FKs cascade and that losing a batch of rows is actually recoverable.
const DELETABLE: Record<string, { table: string; permission: AdminResourceKey }> = {
  candidates: { table: "candidates", permission: "candidates" }, // candidate_actions cascades
  leads:      { table: "leads",      permission: "leads" },       // lead_actions cascades
  blog:       { table: "blog_posts", permission: "blog" },        // standalone
};

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { resource?: string; ids?: string[] };
  const entry = body.resource ? DELETABLE[body.resource] : undefined;
  if (!entry) return NextResponse.json({ error: "unknown or non-deletable resource" }, { status: 400 });

  const denied = await requirePermission(entry.permission, "delete");
  if (denied) return denied;

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids is required" }, { status: 400 });
  }
  if (body.ids.length > MAX_BULK) {
    return NextResponse.json({ error: `too many at once (max ${MAX_BULK})` }, { status: 400 });
  }

  const { error, count } = await adminClient
    .from(entry.table)
    .delete({ count: "exact" })
    .in("id", body.ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: count ?? body.ids.length });
}
