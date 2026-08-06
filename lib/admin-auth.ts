import "server-only";

// ─── Admin authentication for profile-config routes ───────────────────────────
// Scoped deliberately: this helper is used by app/api/admin/profile-config/**
// ONLY. The ~10 pre-existing admin routes keep their inlined requireAdmin()
// copies — refactoring them is out of scope and would touch working code for
// no functional gain.
//
// Behaviour is identical to those copies (app/api/admin/categories/route.ts:19):
//   getUser() → service-role profiles.role === "admin" → else 403 "Forbidden".

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export interface AdminUser {
  id:    string;
  email: string | null;
}

/**
 * Resolves the calling admin, or null.
 * Always uses getUser() — it revalidates the JWT against Supabase, unlike
 * getSession().
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * Guard for route handlers.
 *
 * Usage:
 *   const admin = await requireAdmin();
 *   if (admin instanceof NextResponse) return admin;
 *   // admin is AdminUser from here on
 */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return admin;
}
