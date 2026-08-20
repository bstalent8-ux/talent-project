export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { ProfileError, profileService } from "@/features/profiles";

function isNoRows(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // bookings has no budget_type/budget_amount/start_date/duration/deadline/
  // negotiation_message/negotiation_requested_at/updated_at columns (see
  // app/api/bookings/direct's note — confirmed against the live schema).
  // deadline comes from the joined booking_briefs row below instead.
  const { data: booking, error } = await adminClient
    .from("bookings")
    .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, talent_id, job_id, job_application_id, paid_at, completed_at, notes")
    .eq("id", id)
    .single();

  if (error) {
    const status = isNoRows(error) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : error.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Authorization: brand or talent of this booking
  const isBrand  = booking.brand_id === user.id;
  const isTalent = booking.talent_user_id === user.id;
  if (!isBrand && !isTalent) {
    // Fallback check via the talent provider row. Authorization rule unchanged:
    // the caller must own the talent_profiles row this booking points at.
    let tp: { id: string } | null = null;
    try {
      const ref = await profileService.resolveProviderRef(user.id, "talent");
      tp = ref ? { id: ref.providerProfileId } : null;
    } catch (e) {
      const err = ProfileError.from(e);
      console.error("[bookings/:id] provider ref lookup failed", err.code, err.internal);
      return NextResponse.json(err.toBody(), { status: err.status });
    }
    if (!tp || tp.id !== booking.talent_id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const myRole = isBrand ? "brand" : "talent";

  // Parallel enrichment
  const [brandRes, talentRes, jobRes, briefRes, delivRes, payRes, reviewRes, convRes] = await Promise.all([
    adminClient.from("profiles").select("id,full_name,handle,avatar_url,is_verified").eq("id", booking.brand_id).single(),
    booking.talent_user_id
      ? adminClient.from("profiles").select("id,full_name,handle,avatar_url,is_verified").eq("id", booking.talent_user_id).single()
      : Promise.resolve({ data: null, error: null }),
    booking.job_id
      ? adminClient.from("jobs").select("id,title,description,category,budget_min,budget_max,currency").eq("id", booking.job_id).single()
      : Promise.resolve({ data: null, error: null }),
    adminClient.from("booking_briefs").select("*").eq("booking_id", id).maybeSingle(),
    // deliverables doesn't exist on this DB yet (schema drift — see
    // supabase/migrations/20260727_fix_schema_drift.sql, never run here).
    // Degrade to an empty list instead of 500ing the whole booking detail
    // page over one missing table.
    adminClient.from("deliverables").select("*").eq("booking_id", id).order("created_at", { ascending: false })
      .then((res) => (res.error?.code === "PGRST205" ? { data: [], error: null } : res)),
    adminClient.from("payments").select("*").eq("booking_id", id).maybeSingle(),
    adminClient.from("reviews").select("id,rating,comment,status").eq("booking_id", id).maybeSingle(),
    adminClient.from("conversations").select("id").eq("brand_id", booking.brand_id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle(),
  ]);

  const enrichError = [brandRes, talentRes, jobRes, briefRes, delivRes, payRes, reviewRes, convRes]
    .find((result) => result.error && !isNoRows(result.error))?.error;
  if (enrichError) return NextResponse.json({ error: enrichError.message }, { status: 500 });

  return NextResponse.json({
    booking: {
      ...booking,
      brand:        brandRes.data,
      talent:       talentRes.data,
      job:          jobRes.data,
      brief:        briefRes.data,
      deliverables: delivRes.data ?? [],
      payment:      payRes.data,
      review:       reviewRes.data,
      conversation_id: convRes.data?.id ?? null,
    },
    myRole,
  });
}
