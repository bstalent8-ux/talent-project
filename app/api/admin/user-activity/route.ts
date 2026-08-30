export const runtime = 'edge';

// Polled by UserActivityView.tsx so /admin/user-activity updates without a
// manual refresh — the page/section server components stay as they are for
// the first paint (fast, no client-side loading flash), this route is only
// for the client-side interval after that.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  fetchAdminUserActivityStats,
  fetchAdminUserActivityPage,
  fetchAdminUserActivityVisitors,
  fetchAdminTrafficSources,
  type UserEventName,
} from "@/features/admin/services/admin.service";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const page     = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
  const from     = sp.get("from") ?? undefined;
  const to       = sp.get("to") ?? undefined;
  const eventName = (sp.get("event") ?? undefined) as UserEventName | undefined;

  const [stats, { events, total }, visitors, trafficSources] = await Promise.all([
    fetchAdminUserActivityStats({ from, to }),
    fetchAdminUserActivityPage({ page, pageSize, from, to, eventName }),
    fetchAdminUserActivityVisitors({ from, to }),
    fetchAdminTrafficSources({ from, to }),
  ]);

  return NextResponse.json({ stats, events, total, visitors, trafficSources });
}
