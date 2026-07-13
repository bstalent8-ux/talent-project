import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, handle, full_name, avatar_url, city, bio, is_verified, is_approved")
    .eq("role", "brand")
    .not("handle", "is", null);

  return NextResponse.json({ count: data?.length ?? 0, error: error?.message ?? null, brands: data?.slice(0, 2) });
}
