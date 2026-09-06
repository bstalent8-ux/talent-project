export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";

// GET /api/admin/notifications/recipients?q=ahmed
// Feeds the composer's user picker (single / multiple modes) and its role +
// category dropdowns. Returns at most 20 users — the picker is a search box,
// not a full directory dump. Gated the same as the composer page itself
// (notifications:read) — this was previously reachable by any admin
// regardless of role, a minor info-disclosure gap (names/handles/avatars)
// for a restricted admin with no notifications access at all.
export async function GET(req: NextRequest) {
  const denied = await requirePermission("notifications", "read");
  if (denied) return denied;

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();

  let usersQuery = adminClient
    .from("profiles")
    .select("id, full_name, handle, role, avatar_url")
    .eq("account_status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  if (q) {
    // Escape PostgREST's `or` delimiters so a comma or paren in the query
    // cannot break out of the filter expression.
    const safe = q.replace(/[(),]/g, " ").trim();
    if (safe) usersQuery = usersQuery.or(`full_name.ilike.%${safe}%,handle.ilike.%${safe}%`);
  }

  const [{ data: users }, { data: categories }] = await Promise.all([
    usersQuery,
    adminClient
      .from("categories")
      .select("id, label_ar, label_en, role_type")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return NextResponse.json({
    users:      users ?? [],
    categories: categories ?? [],
    roles:      ["talent", "brand", "admin"],
  });
}
