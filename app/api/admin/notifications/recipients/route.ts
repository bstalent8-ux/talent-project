export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// GET /api/admin/notifications/recipients?q=ahmed
// Feeds the composer's user picker (single / multiple modes) and its role +
// category dropdowns. Returns at most 20 users — the picker is a search box,
// not a full directory dump.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
