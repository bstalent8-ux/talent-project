export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// POST /api/auth/login
// Body: { identifier: string (email OR @handle), password: string }
// Returns: { role } on success, { error: "invalid_credentials" } (401) otherwise.
//
// Replaces the old client-side flow of GET /api/auth/lookup (which returned
// any user's real email address to an unauthenticated caller — see the
// 2026-09 audit) followed by a browser signInWithPassword. Identity is now
// resolved server-side and the email is never sent back. The response is the
// same for "no such user" and "wrong password" so this route can't be used
// to enumerate handles or emails either.

const GENERIC = () =>
  NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

// A syntactically valid address that can never own an account — used so the
// sign-in attempt (and its timing) still happens when a handle doesn't
// resolve, instead of short-circuiting and leaking "this handle exists".
const UNRESOLVABLE_EMAIL = "unresolved.identifier@invalid.talent-s.local";

async function resolveEmail(identifier: string): Promise<string> {
  const id = identifier.trim();
  if (id.includes("@") && !id.startsWith("@")) return id.toLowerCase();

  const handle = id.replace(/^@/, "").toLowerCase();
  if (!handle) return UNRESOLVABLE_EMAIL;

  const { data: profileRow } = await adminClient
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (!profileRow) return UNRESOLVABLE_EMAIL;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${profileRow.id}`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  });
  if (!authRes.ok) return UNRESOLVABLE_EMAIL;

  const authUser = await authRes.json().catch(() => null);
  return typeof authUser?.email === "string" ? authUser.email : UNRESOLVABLE_EMAIL;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = typeof body?.identifier === "string" ? body.identifier : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier.trim() || !password) return GENERIC();

  const email = await resolveEmail(identifier);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return GENERIC();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return NextResponse.json({ role: profile?.role ?? "talent" });
}
