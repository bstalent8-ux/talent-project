export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();

  let bookings: Record<string, unknown>[] = [];
  let err: { message: string } | null = null;

  if (profile?.role === "brand") {
    const { data, error } = await adminClient
      .from("bookings")
      .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, job_id, talent_id")
      .eq("brand_id", user.id)
      .order("created_at", { ascending: false });
    bookings = (data ?? []) as Record<string, unknown>[];
    err = error;
  } else {
    const { data: tp } = await adminClient
      .from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!tp) return NextResponse.json({ bookings: [] });
    const { data, error } = await adminClient
      .from("bookings")
      .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, job_id, talent_id")
      .eq("talent_id", tp.id)
      .order("created_at", { ascending: false });
    bookings = (data ?? []) as Record<string, unknown>[];
    err = error;
  }

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  if (!bookings.length) return NextResponse.json({ bookings: [] });

  // Enrich with related data
  const jobIds   = [...new Set(bookings.map((b) => b.job_id).filter(Boolean))] as string[];
  const brandIds = [...new Set(bookings.map((b) => b.brand_id))] as string[];
  const talentUserIds = [...new Set(bookings.map((b) => b.talent_user_id).filter(Boolean))] as string[];
  const bookingIds = bookings.map((b) => b.id) as string[];

  const [jobsRes, brandsRes, talentsRes, briefsRes] = await Promise.all([
    jobIds.length   ? adminClient.from("jobs").select("id,title").in("id", jobIds) : { data: [] },
    brandIds.length ? adminClient.from("profiles").select("id,full_name,handle,avatar_url").in("id", brandIds) : { data: [] },
    talentUserIds.length ? adminClient.from("profiles").select("id,full_name,handle,avatar_url").in("id", talentUserIds) : { data: [] },
    bookingIds.length ? adminClient.from("booking_briefs").select("booking_id,id,title,status,deadline").in("booking_id", bookingIds) : { data: [] },
  ]);

  const jobMap    = Object.fromEntries((jobsRes.data ?? []).map((j) => [j.id, j]));
  const brandMap  = Object.fromEntries((brandsRes.data ?? []).map((p) => [p.id, p]));
  const talentMap = Object.fromEntries((talentsRes.data ?? []).map((p) => [p.id, p]));
  const briefMap  = Object.fromEntries((briefsRes.data ?? []).map((b) => [b.booking_id, b]));

  const enriched = bookings.map((b) => ({
    ...b,
    job:    b.job_id   ? jobMap[b.job_id as string]            : null,
    brand:  brandMap[b.brand_id as string]                     ?? null,
    talent: b.talent_user_id ? talentMap[b.talent_user_id as string] : null,
    brief:  briefMap[b.id as string]                           ?? null,
  }));

  return NextResponse.json({ bookings: enriched });
}