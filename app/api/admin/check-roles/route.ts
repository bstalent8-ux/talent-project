export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Check if role column exists by fetching all profiles with their role
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, handle, role")
    .order("role", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = {
    total: data?.length ?? 0,
    byRole: {} as Record<string, number>,
    profiles: data?.map(p => ({ id: p.id, handle: p.handle, full_name: p.full_name, role: p.role })),
  };

  for (const p of data ?? []) {
    const r = p.role ?? "NULL";
    summary.byRole[r] = (summary.byRole[r] ?? 0) + 1;
  }

  return NextResponse.json(summary);
}