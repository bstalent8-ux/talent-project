export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const urlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? "missing";
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) ?? "missing";

  let dbResult = null;
  let dbError = null;
  try {
    const { data, error } = await adminClient
      .from("profiles")
      .select("id, role")
      .limit(3);
    dbResult = data;
    dbError = error?.message ?? null;
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    env: { hasUrl, hasKey, urlPrefix, keyPrefix },
    db: { result: dbResult, error: dbError },
  });
}
