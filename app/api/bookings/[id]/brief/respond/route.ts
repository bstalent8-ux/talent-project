export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";

// PATCH — talent accepts, rejects, or requests changes on a booking request.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings")
    .select("brand_id,talent_user_id,talent_id,status")
    .eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Must be the talent
  const isTalent = booking.talent_user_id === user.id;
  if (!isTalent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!["pending", "brief_sent", "changes_requested"].includes(booking.status))
    return NextResponse.json({ error: "no pending booking request" }, { status: 400 });

  const { action, reject_reason, message } = await req.json();
  if (!["accept", "reject", "request_changes"].includes(action))
    return NextResponse.json({ error: "action must be accept, reject, or request_changes" }, { status: 400 });
  if (action === "request_changes" && !message?.trim())
    return NextResponse.json({ error: "message required" }, { status: 400 });

  const now = new Date().toISOString();

  const briefUpdate: Record<string, unknown> = {
    status:       action === "accept" ? "accepted" : action === "reject" ? "rejected" : "changes_requested",
    responded_at: now,
  };
  if (action === "reject" && reject_reason) briefUpdate.reject_reason = reject_reason;
  if (action === "request_changes") briefUpdate.reject_reason = message.trim();

  const { error: briefErr } = await adminClient
    .from("booking_briefs")
    .update(briefUpdate)
    .eq("booking_id", id);
  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  // Update booking status
  const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "changes_requested";
  const bookingUpdate: Record<string, unknown> = {
    status:     newStatus,
    updated_at: now,
  };
  if (action === "request_changes") {
    bookingUpdate.negotiation_message = message.trim();
    bookingUpdate.negotiation_requested_at = now;
  }
  const { error: bookingErr } = await adminClient.from("bookings").update(bookingUpdate).eq("id", id);
  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 });

  // Send system message in chat
  const { data: conv } = await adminClient
    .from("conversations")
    .select("id")
    .eq("brand_id", booking.brand_id)
    .eq("talent_id", user.id)
    .maybeSingle();
  if (conv) {
    const msg = action === "accept"
      ? "قبلت الموهبة طلب الحجز. المرحلة التالية: الدفع.\nTalent accepted the booking request. Next: payment."
      : action === "reject"
        ? `رفضت الموهبة طلب الحجز${reject_reason ? `: ${reject_reason}` : ""}.\nTalent rejected the booking request${reject_reason ? `: ${reject_reason}` : ""}.`
        : `طلبت الموهبة تعديلات: ${message.trim()}\nTalent requested changes: ${message.trim()}`;
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: msg,
      message_type: "text",
    });
  }

  // Notify brand of talent's response
  const notifTitle = action === "accept"
    ? "تم قبول طلب الحجز"
    : action === "reject"
      ? "تم رفض طلب الحجز"
      : "طلبت الموهبة تعديلات";
  const notifMsg = action === "accept"
    ? "Talent accepted the booking request. You can continue to payment."
    : action === "reject"
      ? `Talent rejected the booking request${reject_reason ? `: ${reject_reason}` : ""}.`
      : message.trim();
  await createNotification({
    userId:        booking.brand_id,
    type:          "booking_request",
    title:         notifTitle,
    message:       notifMsg,
    referenceId:   id,
    referenceType: "booking",
  });

  return NextResponse.json({ success: true, status: newStatus });
}
