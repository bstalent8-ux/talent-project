export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";

// POST — brand confirms payment → moves booking to in_progress
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings")
    .select("brand_id,talent_user_id,amount,status")
    .eq("id", id).single();
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
  await adminClient.from("bookings").update({ status: "in_progress", paid_at: now }).eq("id", id);

  // Notify via chat
  const { data: conv } = await adminClient
    .from("conversations").select("id").eq("brand_id", user.id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `💳 تم تأكيد الدفع. يمكنك البدء في العمل الآن!\n💳 Payment confirmed. You can start working now!`,
      message_type: "text",
    });
  }

  // Notify talent that payment was confirmed
  if (booking.talent_user_id) {
    await createNotification({
      userId:        booking.talent_user_id,
      type:          "payment",
      title:         "تم تأكيد الدفع 💳",
      message:       "تم استلام الدفع. يمكنك البدء في العمل الآن!",
      referenceId:   id,
      referenceType: "booking",
    });
  }

  return NextResponse.json({ success: true, status: "in_progress" });
}