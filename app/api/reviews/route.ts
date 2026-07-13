export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recalcRating } from "@/lib/recalcRating";

// GET /api/reviews?talent_id=xxx
export async function GET(req: NextRequest) {
  const talent_id = req.nextUrl.searchParams.get("talent_id");
  if (!talent_id) return NextResponse.json({ error: "talent_id required" }, { status: 400 });

  const { data, error } = await adminClient
    .from("reviews")
    .select("id, booking_id, talent_id, brand_id, rating, comment, created_at, profiles(full_name)")
    .eq("talent_id", talent_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

// POST /api/reviews
// body: { booking_id, rating, comment? }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { booking_id, rating, comment } = await req.json();

    if (!booking_id) return NextResponse.json({ error: "booking_id required" }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    // Fetch the booking
    const { data: booking, error: bookingErr } = await adminClient
      .from("bookings")
      .select("id, talent_id, brand_id, status")
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "booking not found" }, { status: 404 });
    }

    // Only the brand that made the booking can review
    if (booking.brand_id !== user.id) {
      return NextResponse.json({ error: "not authorized to review this booking" }, { status: 403 });
    }

    // Booking must be completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "can only review a completed booking" },
        { status: 422 }
      );
    }

    // Prevent duplicate review
    const { data: existing } = await adminClient
      .from("reviews")
      .select("id")
      .eq("booking_id", booking_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "review already submitted for this booking" }, { status: 409 });
    }

    // Create review
    const { data: review, error: insertErr } = await adminClient
      .from("reviews")
      .insert({
        booking_id,
        talent_id: booking.talent_id,
        brand_id: user.id,
        rating: Number(rating),
        comment: comment?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Recalculate avg_rating + total_reviews and bust Next.js cache.
    await recalcRating(booking.talent_id);

    return NextResponse.json({ review }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}