export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// GET /api/jobs?status=open&category=&limit=50
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status   = url.searchParams.get("status") ?? "open";
  const category = url.searchParams.get("category");
  const limit    = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  let query = adminClient
    .from("jobs")
    .select("id, brand_id, title, description, category, budget_min, budget_max, currency, start_date, end_date, slots, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category && category !== "all") query = query.eq("category", category);

  const { data: jobs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch brand profiles in one go
  const brandIds = [...new Set((jobs ?? []).map((j) => j.brand_id))];
  const { data: profiles } = brandIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url, city").in("id", brandIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const enriched = (jobs ?? []).map((j) => ({ ...j, brand: profileMap[j.brand_id] ?? null }));

  return NextResponse.json({ jobs: enriched });
}

// POST /api/jobs — brand creates a job
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Verify brand role
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "brand") return NextResponse.json({ error: "brands only" }, { status: 403 });

  const body = await req.json();
  const { title, description, category, budget_min, budget_max, currency = "EGP", start_date, end_date, slots = 1 } = body;

  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const { data: job, error } = await adminClient
    .from("jobs")
    .insert({
      brand_id: user.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      category: category ?? null,
      budget_min: budget_min ? Number(budget_min) : null,
      budget_max: budget_max ? Number(budget_max) : null,
      currency,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      slots: Number(slots) || 1,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job }, { status: 201 });
}