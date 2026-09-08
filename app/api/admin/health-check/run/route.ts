export const runtime = 'edge';

// POST-only — triggered by the "Run Checkup" button on /admin/health-check.
// Not polled/scheduled: each run makes live outbound calls (Cloudinary,
// Anthropic, and several requests against the site's own origin), so it
// only runs when an admin actually asks for it.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { runHealthCheck } from "@/features/health-check/service";

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const denied = await requirePermission("healthCheck", "create");
  if (denied) return denied;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await runHealthCheck(req.nextUrl.origin, user?.id ?? null);
  return NextResponse.json(result);
}
