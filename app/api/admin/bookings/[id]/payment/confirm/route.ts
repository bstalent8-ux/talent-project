export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { notifyPaymentSuccess } from "@/lib/notifications/events";

// POST — admin confirms the brand's off-platform payment actually landed in
// the platform's own account (bank transfer / InstaPay). Brands pay the
// PLATFORM, not the talent directly — the platform later pays the talent out
// once the work is approved (see app/api/bookings/[id]/deliverables's
// "release" step). Only an admin can confirm this: the talent has no way to
// verify money that was never sent to them, so this does NOT live on the
// public /bookings/[id] page — see app/api/bookings/[id]/payment for the
// brand's upload side of this flow, and CLAUDE.md's "Manual Payment Proof
// Flow" section for the full picture.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePermission("bookings", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings").select("brand_id,talent_user_id,amount,status").eq("id", id).single();
  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: bookingError.code === "PGRST116" ? 404 : 500 });
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.status !== "accepted")
    return NextResponse.json({ error: "Booking must be in accepted state" }, { status: 400 });

  const { data: payment, error: paymentError } = await adminClient
    .from("payments").select("id,status").eq("booking_id", id).maybeSingle();
  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 500 });
  if (!payment || payment.status !== "pending")
    return NextResponse.json({ error: "No pending payment proof to confirm" }, { status: 400 });

  const now = new Date().toISOString();

  const { error: payUpdateError } = await adminClient
    .from("payments").update({ status: "held", held_at: now }).eq("id", payment.id);
  if (payUpdateError) return NextResponse.json({ error: payUpdateError.message }, { status: 500 });

  const { error: bookingUpdateError } = await adminClient
    .from("bookings").update({ status: "in_progress", paid_at: now }).eq("id", id);
  if (bookingUpdateError) return NextResponse.json({ error: bookingUpdateError.message }, { status: 500 });

  const { data: conv, error: convError } = await adminClient
    .from("conversations").select("id").eq("brand_id", booking.brand_id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle();
  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });
  if (conv) {
    const { error: messageError } = await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: admin.id,
      content: `✅ فريق المنصة أكّد استلام الدفع. العمل بدأ الآن!\n✅ The platform confirmed the payment was received. Work has started!`,
      message_type: "text",
    });
    if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  // Both sides get a heads-up — the brand that their payment cleared, the
  // talent that work can start.
  await notifyPaymentSuccess({ bookingId: id, recipientId: booking.brand_id, senderId: admin.id, amount: booking.amount ?? null });
  if (booking.talent_user_id) {
    await notifyPaymentSuccess({ bookingId: id, recipientId: booking.talent_user_id, senderId: admin.id, amount: booking.amount ?? null });
  }

  return NextResponse.json({ success: true, status: "in_progress" });
}
