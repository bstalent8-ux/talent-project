export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyPaymentSuccess } from "@/lib/notifications/events";

function isNoRows(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

// POST — brand confirms payment → moves booking to in_progress
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("brand_id,talent_user_id,amount,status")
    .eq("id", id).single();
  if (bookingError) {
    const status = isNoRows(bookingError) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : bookingError.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (booking.status !== "accepted")
    return NextResponse.json({ error: "Booking must be in accepted state" }, { status: 400 });

  const now = new Date().toISOString();

  // Create payment record
  const { error: payErr } = await adminClient.from("payments").insert({
    booking_id: id,
    amount:     booking.amount ?? 0,
    status:     "paid",
    paid_at:    now,
  });
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // Update booking
  const { error: bookingUpdateError } = await adminClient.from("bookings").update({ status: "in_progress", paid_at: now }).eq("id", id);
  if (bookingUpdateError) return NextResponse.json({ error: bookingUpdateError.message }, { status: 500 });

  // Notify via chat
  const { data: conv, error: convError } = await adminClient
    .from("conversations").select("id").eq("brand_id", user.id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle();
  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });
  if (conv) {
    const { error: messageError } = await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `💳 تم تأكيد الدفع. يمكنك البدء في العمل الآن!\n💳 Payment confirmed. You can start working now!`,
      message_type: "text",
    });
    if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  // Notify talent that payment was confirmed
  if (booking.talent_user_id) {
    await notifyPaymentSuccess({
      bookingId:   id,
      recipientId: booking.talent_user_id,
      senderId:    user.id,
      amount:      booking.amount ?? null,
    });
  }

  return NextResponse.json({ success: true, status: "in_progress" });
}
