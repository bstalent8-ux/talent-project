export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await adminClient
    .from("profiles")
    .select("id, handle, full_name, avatar_url, city, bio, is_verified, is_approved")
    .eq("role", "brand")
    .not("handle", "is", null);

  return NextResponse.json({ count: data?.length ?? 0, error: error?.message ?? null, brands: data?.slice(0, 2) });
}