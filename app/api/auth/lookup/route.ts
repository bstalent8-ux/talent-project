export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

// POST /api/auth/lookup
// Body: { identifier: string }  — handle OR email
// Returns: { email: string } or 404
export async function POST(req: NextRequest) {
  const { identifier } = await req.json();
  if (!identifier) return NextResponse.json({ error: "identifier required" }, { status: 400 });

  const isEmail = identifier.includes("@") && !identifier.startsWith("@");

  if (isEmail) {
    return NextResponse.json({ email: identifier.trim().toLowerCase() });
  }

  // Strip leading @ if present
  const handle = identifier.replace(/^@/, "").trim().toLowerCase();

  // Look up user id by handle
  const { data: profileRow } = await adminClient
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (!profileRow) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // Fetch email via Supabase Auth Admin REST API
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${profileRow.id}`, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });

  if (!authRes.ok) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const authUser = await authRes.json();
  if (!authUser?.email) return NextResponse.json({ error: "user not found" }, { status: 404 });

  return NextResponse.json({ email: authUser.email });
}
