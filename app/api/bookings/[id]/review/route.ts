import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// GET — check if review exists
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await adminClient
    .from("reviews").select("id,rating,comment,status,created_at").eq("booking_id", id).maybeSingle();
  return NextResponse.json({ review: data });
}

// POST — brand submits review after booking is paid
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings")
    .select("brand_id,talent_id,status")
    .eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (booking.status !== "paid")
    return NextResponse.json({ error: "Booking must be completed (paid) to review" }, { status: 400 });

  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });

  const { data: review, error: revErr } = await adminClient
    .from("reviews")
    .upsert({
      booking_id: id,
      talent_id:  booking.talent_id,
      brand_id:   user.id,
      rating:     Number(rating),
      comment:    comment ?? null,
      status:     "approved",
    }, { onConflict: "booking_id" })
    .select("*")
    .single();

  if (revErr) return NextResponse.json({ error: revErr.message }, { status: 500 });

  // Recalculate talent avg rating
  const { data: allReviews } = await adminClient
    .from("reviews")
    .select("rating")
    .eq("talent_id", booking.talent_id)
    .eq("status", "approved");

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await adminClient.from("talent_profiles")
      .update({ avg_rating: Math.round(avg * 10) / 10, total_reviews: allReviews.length })
      .eq("id", booking.talent_id);
  }

  return NextResponse.json({ review });
}
