export const runtime = 'edge';

// TEMPORARY — added so the one remaining admin (after the test-data
// cleanup) can create a backup admin without a human touching the DB
// directly. Remove this route (and the UI card in
// app/(admin)/admin/settings/page.tsx) once you don't need it anymore.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: requester } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (requester?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const handle = typeof body?.handle === "string" ? body.handle.trim().toLowerCase() : "";
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const { data: target } = await adminClient
    .from("profiles")
    .select("id, handle, role")
    .eq("handle", handle)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (target.role === "admin") {
    return NextResponse.json({ data: { handle: target.handle, alreadyAdmin: true } });
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", target.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { handle: target.handle, alreadyAdmin: false } });
}
