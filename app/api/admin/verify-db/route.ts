export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  // What roles actually exist in the DB?
  const { data: allProfiles } = await adminClient
    .from("profiles")
    .select("role, id, handle")
    .limit(100);

  const roleCounts: Record<string, number> = {};
  for (const p of allProfiles ?? []) {
    const r = String(p.role);
    roleCounts[r] = (roleCounts[r] ?? 0) + 1;
  }

  // Sample one profile of each role
  const samples: Record<string, unknown> = {};
  for (const p of allProfiles ?? []) {
    const r = String(p.role);
    if (!samples[r]) samples[r] = { handle: p.handle, id: p.id };
  }

  // Check talent_verifications count
  const { data: verifications, error: vErr } = await adminClient
    .from("talent_verifications")
    .select("id, status, talent_id");

  // Check is_verified sync: approved verifications vs profiles.is_verified
  const approvedTalentIds = (verifications ?? [])
    .filter(v => v.status === "approved")
    .map(v => v.talent_id);

  const { data: verifiedProfiles, error: vpErr } = approvedTalentIds.length
    ? await adminClient
        .from("profiles")
        .select("id, handle, is_verified")
        .in("id", approvedTalentIds)
    : { data: [], error: null };

  // Reviews check
  const { data: reviews, error: revErr } = await adminClient
    .from("reviews")
    .select("id, rating, comment, status, review_type, brand_id, talent_id, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fallback without new columns
  const { data: reviewsBasic, error: revErrBasic } = revErr
    ? await adminClient
        .from("reviews")
        .select("id, rating, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null, error: null };

  const finalReviews = reviews ?? reviewsBasic ?? [];

  // Bookings status distribution
  const { data: allBookings } = await adminClient
    .from("bookings")
    .select("status");

  const bookingStatusCounts: Record<string, number> = {};
  for (const b of allBookings ?? []) {
    const s = String(b.status);
    bookingStatusCounts[s] = (bookingStatusCounts[s] ?? 0) + 1;
  }

  // talent_brands check
  const { data: talentBrands, error: tbErr } = await adminClient
    .from("talent_brands")
    .select("id, talent_profile_id, brand_name")
    .limit(20);

  return NextResponse.json({
    talent_brands_count: talentBrands?.length ?? 0,
    talent_brands_error: tbErr?.message ?? null,
    talent_brands_sample: (talentBrands ?? []).slice(0, 5),
    role_counts:         roleCounts,
    role_samples:        samples,
    total_profiles:      allProfiles?.length ?? 0,
    total_verifications: verifications?.length ?? 0,
    verifications_error: vErr?.message ?? null,
    approved_verifications: approvedTalentIds.length,
    profiles_is_verified_true: (verifiedProfiles ?? []).filter(p => p.is_verified).length,
    profiles_is_verified_false: (verifiedProfiles ?? []).filter(p => !p.is_verified).length,
    // Reviews
    total_reviews: finalReviews.length,
    reviews_error: revErr?.message ?? null,
    reviews_columns_available: !revErr,
    reviews_sample: finalReviews.slice(0, 5),
    booking_total: allBookings?.length ?? 0,
    booking_status_counts: bookingStatusCounts,
  });
}